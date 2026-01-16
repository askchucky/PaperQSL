import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { qrzLogin, qrzLookup } from '@/lib/qrz'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { call: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callsign = decodeURIComponent(params.call).toUpperCase()

    // Reuse QRZ session key for a short window to avoid logging in on every lookup
    const SESSION_REUSE_WINDOW_MS = 1000 * 60 * 30 // 30 minutes

    const isSessionError = (msg: string) => {
      const m = msg.toLowerCase()
      return (
        m.includes('session') ||
        m.includes('timeout') ||
        m.includes('expired') ||
        m.includes('invalid')
      )
    }

    // Get user's QRZ credentials
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        qrzUsername: true,
        qrzPassword: true,
        qrzSessionKey: true,
        qrzSessionKeyUpdatedAt: true,
      },
    })

    if (!dbUser?.qrzUsername || !dbUser?.qrzPassword) {
      return NextResponse.json(
        { error: 'QRZ credentials not configured' },
        { status: 400 }
      )
    }

    // Decrypt password
    const password = decrypt(dbUser.qrzPassword)

    // Get (or refresh) QRZ session key
    let sessionKey: string

    const canReuseCachedKey =
      Boolean(dbUser.qrzSessionKey) &&
      Boolean(dbUser.qrzSessionKeyUpdatedAt) &&
      Date.now() - new Date(dbUser.qrzSessionKeyUpdatedAt as any).getTime() <
        SESSION_REUSE_WINDOW_MS

    if (canReuseCachedKey) {
      sessionKey = dbUser.qrzSessionKey as string
    } else {
      try {
        sessionKey = await qrzLogin(dbUser.qrzUsername, password)

        // Cache for subsequent lookups
        await prisma.user.update({
          where: { id: user.id },
          data: {
            qrzSessionKey: sessionKey,
            qrzSessionKeyUpdatedAt: new Date(),
          },
        })
      } catch (error) {
        // Surface QRZ error messages (e.g., subscription required, invalid login)
        const errorMessage =
          error instanceof Error ? error.message : 'QRZ login failed'
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }
    }

    // Lookup callsign
    let data
    try {
      data = await qrzLookup(sessionKey, callsign)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'QRZ lookup failed'

      // If the session is invalid/expired, clear cached key and retry once
      if (isSessionError(errorMessage)) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { qrzSessionKey: null, qrzSessionKeyUpdatedAt: null },
          })

          const freshSessionKey = await qrzLogin(dbUser.qrzUsername, password)

          await prisma.user.update({
            where: { id: user.id },
            data: { qrzSessionKey: freshSessionKey, qrzSessionKeyUpdatedAt: new Date() },
          })

          data = await qrzLookup(freshSessionKey, callsign)
        } catch (retryError) {
          const retryMsg = retryError instanceof Error ? retryError.message : 'QRZ lookup failed'
          return NextResponse.json({ error: retryMsg }, { status: 400 })
        }
      } else {
        // Check if it's a "not found" type error
        if (
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('no callsign')
        ) {
          return NextResponse.json({ error: errorMessage }, { status: 404 })
        }
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Callsign not found in QRZ' },
        { status: 404 }
      )
    }

    // Persist looked-up data onto the Station record (so Fill from QRZ saves it)
    try {
      await prisma.station.upsert({
        where: {
          userId_callsign: {
            userId: user.id,
            callsign,
          },
        },
        create: {
          userId: user.id,
          callsign,
          qsoCount: 0,
          eligibility: 'Unknown',
          eligibilityOverride: false,
          addressLine1: data.addr1 || null,
          addressLine2: data.addr2 || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.zip || null,
          country: data.country || null,
          addressSource: 'QRZ',
          lastVerifiedAt: new Date(),
          qslManager: (data as any).qslmgr || null,
        },
        update: {
          addressLine1: data.addr1 || null,
          addressLine2: data.addr2 || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.zip || null,
          country: data.country || null,
          addressSource: 'QRZ',
          lastVerifiedAt: new Date(),
          qslManager: (data as any).qslmgr || null,
        },
      })
    } catch (e) {
      console.error('Failed to persist QRZ lookup to Station:', e)
      // Do not fail the lookup response if persistence fails
    }

    // Return formatted address data
    return NextResponse.json({
      addressLine1: data.addr1 || null,
      addressLine2: data.addr2 || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.zip || null,
      country: data.country || null,
      name: data.name || data.fname || null,
      qslManager: (data as any).qslmgr || null,
    })
  } catch (error) {
    // Only catch unexpected errors (not QRZ API errors which are handled above)
    console.error('Unexpected error looking up QRZ:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while looking up callsign',
      },
      { status: 500 }
    )
  }
}

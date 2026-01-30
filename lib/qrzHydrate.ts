// Reusable helper to hydrate Station from QRZ lookup
// Extracted from app/api/qrz/lookup/[call]/route.ts

import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { qrzLogin, qrzLookup } from '@/lib/qrz'

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

export interface HydrateResult {
  updatedStation?: {
    id: string
    callsign: string
  }
  error?: string
}

export async function hydrateStationFromQRZ({
  userId,
  callsign,
}: {
  userId: string
  callsign: string
}): Promise<HydrateResult> {
  try {
    // Get user's QRZ credentials
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        qrzUsername: true,
        qrzPassword: true,
        qrzSessionKey: true,
        qrzSessionKeyUpdatedAt: true,
      },
    })

    if (!dbUser?.qrzUsername || !dbUser?.qrzPassword) {
      return { error: 'QRZ credentials not configured' }
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
          where: { id: userId },
          data: {
            qrzSessionKey: sessionKey,
            qrzSessionKeyUpdatedAt: new Date(),
          },
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'QRZ login failed'
        return { error: errorMessage }
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
            where: { id: userId },
            data: { qrzSessionKey: null, qrzSessionKeyUpdatedAt: null },
          })

          const freshSessionKey = await qrzLogin(dbUser.qrzUsername, password)

          await prisma.user.update({
            where: { id: userId },
            data: { qrzSessionKey: freshSessionKey, qrzSessionKeyUpdatedAt: new Date() },
          })

          data = await qrzLookup(freshSessionKey, callsign)
        } catch (retryError) {
          const retryMsg = retryError instanceof Error ? retryError.message : 'QRZ lookup failed'
          return { error: retryMsg }
        }
      } else {
        // Check if it's a "not found" type error
        if (
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('no callsign')
        ) {
          return { error: errorMessage }
        }
        return { error: errorMessage }
      }
    }

    if (!data) {
      return { error: 'Callsign not found in QRZ' }
    }

    // Parse name fields from QRZ data
    const fname = (data as any).fname || ''
    const nameRaw = (data as any).name || ''
    
    let firstName: string | null = null
    let lastName: string | null = null
    
    if (fname) {
      // If fname is provided, use it as firstName
      firstName = fname.trim() || null
    }
    
    if (nameRaw) {
      const nameParts = nameRaw.trim().split(/\s+/).filter(Boolean)
      if (nameParts.length > 0) {
        // If we don't have firstName from fname, use first part of name
        if (!firstName && nameParts.length > 0) {
          firstName = nameParts[0] || null
        }
        // Last part is always lastName
        if (nameParts.length > 1) {
          lastName = nameParts[nameParts.length - 1] || null
        } else if (nameParts.length === 1 && !fname) {
          // If only one part and no fname, treat as lastName
          lastName = nameParts[0] || null
          firstName = null
        }
      }
    }

    // Persist looked-up data onto the Station record
    try {
      const updatedStation = await prisma.station.upsert({
        where: {
          userId_callsign: {
            userId,
            callsign,
          },
        },
        create: {
          userId,
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
          qrzFirstName: firstName,
          qrzLastName: lastName,
          qrzNameRaw: nameRaw || null,
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
          qrzFirstName: firstName,
          qrzLastName: lastName,
          qrzNameRaw: nameRaw || null,
        },
      })

      return { updatedStation: { id: updatedStation.id, callsign: updatedStation.callsign } }
    } catch (e) {
      console.error('Failed to persist QRZ lookup to Station:', e)
      return { error: 'Failed to persist QRZ data to station' }
    }
  } catch (error) {
    console.error('Unexpected error in hydrateStationFromQRZ:', error)
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

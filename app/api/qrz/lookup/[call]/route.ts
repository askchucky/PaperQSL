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

    // Get user's QRZ API key
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { qrzApiKey: true },
    })

    if (!dbUser?.qrzApiKey) {
      return NextResponse.json(
        { error: 'QRZ API key not configured' },
        { status: 400 }
      )
    }

    // Decrypt API key
    const apiKey = decrypt(dbUser.qrzApiKey)

    // Login to QRZ and get session key
    const sessionKey = await qrzLogin(apiKey)

    // Lookup callsign
    const data = await qrzLookup(sessionKey, callsign)

    if (!data) {
      return NextResponse.json(
        { error: 'Callsign not found in QRZ' },
        { status: 404 }
      )
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
    })
  } catch (error) {
    console.error('Error looking up QRZ:', error)
    return NextResponse.json(
      {
        error: 'Failed to lookup callsign',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

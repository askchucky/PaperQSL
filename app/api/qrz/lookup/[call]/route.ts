import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hydrateStationFromQRZ } from '@/lib/qrzHydrate'
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

    // Use shared helper to hydrate station from QRZ
    const result = await hydrateStationFromQRZ({
      userId: user.id,
      callsign,
    })

    if (result.error) {
      // Check if it's a "not found" type error
      const errorLower = result.error.toLowerCase()
      if (errorLower.includes('not found') || errorLower.includes('no callsign')) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Fetch the updated station to return address data
    const station = await prisma.station.findUnique({
      where: {
        userId_callsign: {
          userId: user.id,
          callsign,
        },
      },
    })

    if (!station) {
      return NextResponse.json(
        { error: 'Station not found after QRZ lookup' },
        { status: 404 }
      )
    }

    // Return formatted address data
    return NextResponse.json({
      addressLine1: station.addressLine1,
      addressLine2: station.addressLine2,
      city: station.city,
      state: station.state,
      postalCode: station.postalCode,
      country: station.country,
      qslManager: station.qslManager,
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

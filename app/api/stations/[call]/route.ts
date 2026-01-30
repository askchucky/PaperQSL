import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

    const station = await prisma.station.findUnique({
      where: {
        userId_callsign: {
          userId: user.id,
          callsign,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 })
    }

    // Get QSOs for this station
    const qsos = await prisma.qSO.findMany({
      where: {
        userId: user.id,
        callsign: station.callsign,
      },
      orderBy: { date: 'desc' },
      take: 100, // Limit to recent 100
    })

    // Get distinct source files
    const sourceFiles = await prisma.qSO.findMany({
      where: {
        userId: user.id,
        callsign: station.callsign,
        sourceFile: { not: null },
      },
      select: {
        sourceFile: true,
      },
      distinct: ['sourceFile'],
    })

    // Get most recent POTA activation (myPotaRef)
    const latestPotaQso = await prisma.qSO.findFirst({
      where: {
        userId: user.id,
        callsign: station.callsign,
        myPotaRef: { not: null },
      },
      orderBy: { date: 'desc' },
      select: {
        myPotaRef: true,
      },
    })

    // Lookup POTA park name if reference exists
    let potaParkName: string | null = null
    if (latestPotaQso?.myPotaRef) {
      const potaPark = await prisma.potaList.findUnique({
        where: { reference: latestPotaQso.myPotaRef },
        select: { park_name: true },
      })
      potaParkName = potaPark?.park_name || null
    }

    return NextResponse.json({
      station,
      qsos,
      sourceFiles: sourceFiles.map((sf) => sf.sourceFile).filter(Boolean) as string[],
      myPotaRef: latestPotaQso?.myPotaRef || null,
      potaParkName,
    })
  } catch (error) {
    console.error('Error fetching station:', error)
    return NextResponse.json(
      { error: 'Failed to fetch station' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { call: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callsign = decodeURIComponent(params.call).toUpperCase()
    const body = await request.json()

    // Validate and update station
    const updateData: any = {}

    if (body.eligibility !== undefined) {
      updateData.eligibility = body.eligibility
      updateData.eligibilityOverride = true
    }

    if (body.addressLine1 !== undefined) updateData.addressLine1 = body.addressLine1
    if (body.addressLine2 !== undefined) updateData.addressLine2 = body.addressLine2
    if (body.city !== undefined) updateData.city = body.city
    if (body.state !== undefined) updateData.state = body.state
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode
    if (body.country !== undefined) updateData.country = body.country
    if (body.addressSource !== undefined) updateData.addressSource = body.addressSource
    if (body.qslManager !== undefined) updateData.qslManager = body.qslManager

    if (body.lastVerifiedAt !== undefined) {
      updateData.lastVerifiedAt = body.lastVerifiedAt ? new Date(body.lastVerifiedAt) : null
    }

    if (body.sentAt !== undefined) {
      updateData.sentAt = body.sentAt ? new Date(body.sentAt) : null
    }
    if (body.sentMethod !== undefined) updateData.sentMethod = body.sentMethod
    if (body.receivedAt !== undefined) {
      updateData.receivedAt = body.receivedAt ? new Date(body.receivedAt) : null
    }
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.status !== undefined) updateData.status = body.status

    const station = await prisma.station.update({
      where: {
        userId_callsign: {
          userId: user.id,
          callsign,
        },
      },
      data: updateData,
    })

    return NextResponse.json({ station })
  } catch (error) {
    console.error('Error updating station:', error)
    return NextResponse.json(
      { error: 'Failed to update station' },
      { status: 500 }
    )
  }
}

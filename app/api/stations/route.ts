import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const eligibility = searchParams.get('eligibility')
    const status = searchParams.get('status')
    const missingAddress = searchParams.get('missingAddress') === 'true'
    const notSent = searchParams.get('notSent') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: user.id,
    }

    if (search) {
      where.callsign = {
        contains: search.toUpperCase(),
        mode: 'insensitive',
      }
    }

    if (eligibility && eligibility !== 'all') {
      where.eligibility = eligibility
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (missingAddress) {
      where.OR = [
        { addressLine1: null },
        { addressLine1: '' },
      ]
    }

    if (notSent) {
      where.OR = [
        ...(where.OR || []),
        { sentAt: null },
        { status: { not: 'sent' } },
      ]
    }

    const [stations, total] = await Promise.all([
      prisma.station.findMany({
        where,
        skip,
        take: limit,
        orderBy: { callsign: 'asc' },
      }),
      prisma.station.count({ where }),
    ])

    // Fetch latest QSO per station and source file info
    const stationCallsigns = stations.map((s) => s.callsign)
    const latestQsos = await prisma.qSO.findMany({
      where: {
        userId: user.id,
        callsign: { in: stationCallsigns },
      },
      select: {
        callsign: true,
        date: true,
        time: true,
        sourceFile: true,
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    })

    // Group by callsign to get latest per station
    const latestQsoMap = new Map<string, { date: Date; time: string | null; sourceFile: string | null }>()
    const sourceFileMap = new Map<string, Set<string>>()

    for (const qso of latestQsos) {
      if (!latestQsoMap.has(qso.callsign)) {
        latestQsoMap.set(qso.callsign, {
          date: qso.date,
          time: qso.time,
          sourceFile: qso.sourceFile,
        })
      }

      // Collect all source files per callsign
      if (qso.sourceFile) {
        if (!sourceFileMap.has(qso.callsign)) {
          sourceFileMap.set(qso.callsign, new Set())
        }
        sourceFileMap.get(qso.callsign)!.add(qso.sourceFile)
      }
    }

    // Enrich stations with latest QSO data and source file info
    const enrichedStations = stations.map((station) => {
      const latestQso = latestQsoMap.get(station.callsign)
      const sourceFiles = sourceFileMap.get(station.callsign)
      
      let sourceFileDisplay: string | null = null
      if (sourceFiles && sourceFiles.size > 0) {
        if (sourceFiles.size === 1) {
          sourceFileDisplay = Array.from(sourceFiles)[0]
        } else {
          sourceFileDisplay = 'Multiple'
        }
      }

      return {
        ...station,
        latestQsoDate: latestQso?.date || null,
        latestQsoTime: latestQso?.time || null,
        sourceFile: sourceFileDisplay,
      }
    })

    return NextResponse.json({
      stations: enrichedStations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching stations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    )
  }
}

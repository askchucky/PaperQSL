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
    const sortBy = searchParams.get('sortBy') || 'latestQsoDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

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

    // Get all stations first (we'll sort after enriching with QSO data)
    const [allStations, total] = await Promise.all([
      prisma.station.findMany({
        where,
      }),
      prisma.station.count({ where }),
    ])

    const stationCallsigns = allStations.map((s) => s.callsign)

    // Fetch latest QSO per station and source file info
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

    // Fetch POTA activation data
    const potaQsos = await prisma.qSO.findMany({
      where: {
        userId: user.id,
        callsign: { in: stationCallsigns },
        myPotaRef: { not: null },
      },
      select: {
        callsign: true,
        myPotaRef: true,
      },
      orderBy: { date: 'desc' },
    })

    // Group by callsign to get latest per station
    const latestQsoMap = new Map<string, { date: Date; time: string | null; sourceFile: string | null }>()
    const sourceFileMap = new Map<string, Set<string>>()
    const potaMap = new Map<string, string>()

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

    // Group POTA activations by callsign (get most recent)
    for (const qso of potaQsos) {
      if (!potaMap.has(qso.callsign) && qso.myPotaRef) {
        potaMap.set(qso.callsign, qso.myPotaRef)
      }
    }

    // Enrich stations with latest QSO data, source file info, and POTA activation
    const enrichedStations = allStations.map((station) => {
      const latestQso = latestQsoMap.get(station.callsign)
      const sourceFiles = sourceFileMap.get(station.callsign)
      const potaRef = potaMap.get(station.callsign)
      
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
        potaActivation: potaRef || null,
        lastExportedAt: station.lastExportedAt,
        lastExportedLabel: station.lastExportedLabel,
        exportCount: station.exportCount,
      }
    })

    // Sort enriched stations
    const toUtcTimestamp = (d: Date | null, t: string | null) => {
      if (!d) return null

      // If the stored Date already includes time, this will already be correct.
      // If older records stored only a date (midnight) and have a separate HHmm time,
      // combine them into a UTC timestamp for accurate sorting.
      const base = new Date(d)
      const hasMidnightTime =
        base.getUTCHours() === 0 &&
        base.getUTCMinutes() === 0 &&
        base.getUTCSeconds() === 0 &&
        base.getUTCMilliseconds() === 0

      if (hasMidnightTime && t) {
        const digits = t.replace(/[^0-9]/g, '')
        const padded = digits.padStart(4, '0').slice(0, 4)
        const hh = Number(padded.slice(0, 2))
        const mm = Number(padded.slice(2, 4))
        if (Number.isFinite(hh) && Number.isFinite(mm)) {
          return Date.UTC(
            base.getUTCFullYear(),
            base.getUTCMonth(),
            base.getUTCDate(),
            hh,
            mm,
            0,
            0
          )
        }
      }

      return base.getTime()
    }

    const compareNullable = (aVal: any, bVal: any) => {
      const aNull = aVal === null || aVal === undefined || aVal === ''
      const bNull = bVal === null || bVal === undefined || bVal === ''
      if (aNull && bNull) return 0
      if (aNull) return 1 // null/empty last
      if (bNull) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal
      }

      return String(aVal).localeCompare(String(bVal))
    }

    const sortedStations = [...enrichedStations].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'latestQsoDate':
          aValue = toUtcTimestamp(a.latestQsoDate, a.latestQsoTime)
          bValue = toUtcTimestamp(b.latestQsoDate, b.latestQsoTime)
          break
        case 'callsign':
          aValue = a.callsign?.toUpperCase() || ''
          bValue = b.callsign?.toUpperCase() || ''
          break
        case 'qsoCount':
          aValue = a.qsoCount
          bValue = b.qsoCount
          break
        case 'sourceFile':
          aValue = a.sourceFile || ''
          bValue = b.sourceFile || ''
          break
        case 'sentAt':
          aValue = a.sentAt ? new Date(a.sentAt).getTime() : null
          bValue = b.sentAt ? new Date(b.sentAt).getTime() : null
          break
        case 'receivedAt':
          aValue = a.receivedAt ? new Date(a.receivedAt).getTime() : null
          bValue = b.receivedAt ? new Date(b.receivedAt).getTime() : null
          break
        case 'potaActivation':
          aValue = a.potaActivation || ''
          bValue = b.potaActivation || ''
          break
        default:
          aValue = toUtcTimestamp(a.latestQsoDate, a.latestQsoTime)
          bValue = toUtcTimestamp(b.latestQsoDate, b.latestQsoTime)
      }

      const cmp = compareNullable(aValue, bValue)
      return sortOrder === 'asc' ? cmp : -cmp
    })

    // Apply pagination after sorting
    const paginatedStations = limit >= total ? sortedStations : sortedStations.slice(skip, skip + limit)

    return NextResponse.json({
      stations: paginatedStations,
      total,
      page,
      limit,
      totalPages: limit >= total ? 1 : Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching stations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    )
  }
}

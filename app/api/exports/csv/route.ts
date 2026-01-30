import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      search,
      eligibility,
      status,
      missingAddress,
      notSent,
      sourceFile,
    } = body

    // Build where clause (same as stations API)
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

    // Filter by sourceFile if provided
    let stationCallsigns: string[] | undefined
    if (sourceFile) {
      const qsosWithSourceFile = await prisma.qSO.findMany({
        where: {
          userId: user.id,
          sourceFile: sourceFile,
        },
        select: {
          callsign: true,
        },
        distinct: ['callsign'],
      })
      stationCallsigns = qsosWithSourceFile.map((q) => q.callsign)
      if (stationCallsigns.length === 0) {
        // No stations match the sourceFile filter
        return NextResponse.json({
          csv: 'Callsign,QSO Count,Eligibility,Address Line 1,Address Line 2,City,State,Postal Code,Country,Address Source,Last Verified,Sent Date,Sent Method,Received Date,Status,Notes\n',
          exportId: '',
          recordCount: 0,
        })
      }
      where.callsign = { in: stationCallsigns }
    }

    // Fetch all matching stations
    const stations = await prisma.station.findMany({
      where,
      orderBy: { callsign: 'asc' },
    })

    // Generate CSV
    const headers = [
      'Callsign',
      'QSO Count',
      'Eligibility',
      'Address Line 1',
      'Address Line 2',
      'City',
      'State',
      'Postal Code',
      'Country',
      'Address Source',
      'Last Verified',
      'Sent Date',
      'Sent Method',
      'Received Date',
      'Status',
      'Notes',
    ]

    const rows = stations.map((station) => [
      station.callsign,
      station.qsoCount.toString(),
      station.eligibility,
      station.addressLine1 || '',
      station.addressLine2 || '',
      station.city || '',
      station.state || '',
      station.postalCode || '',
      station.country || '',
      station.addressSource || '',
      station.lastVerifiedAt
        ? new Date(station.lastVerifiedAt).toISOString().split('T')[0]
        : '',
      station.sentAt
        ? new Date(station.sentAt).toISOString().split('T')[0]
        : '',
      station.sentMethod || '',
      station.receivedAt
        ? new Date(station.receivedAt).toISOString().split('T')[0]
        : '',
      station.status || '',
      (station.notes || '').replace(/"/g, '""'), // Escape quotes
    ])

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value}"`
      }
      return value
    }

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ]

    const csvContent = csvLines.join('\n')

    // Create export record
    const exportLabel = `CSV Export - ${new Date().toISOString().split('T')[0]}`
    const exportRecord = await prisma.export.create({
      data: {
        userId: user.id,
        type: 'CSV',
        filename: `stations-${new Date().toISOString().split('T')[0]}.csv`,
        blobUrl: '', // CSV is returned directly, not stored
        filters: {
          search,
          eligibility,
          status,
          missingAddress,
          notSent,
          sourceFile,
        },
        recordCount: stations.length,
      },
    })

    // Update export tracking on stations
    const stationIds = stations.map((s) => s.id)
    await prisma.station.updateMany({
      where: {
        id: { in: stationIds },
      },
      data: {
        lastExportedAt: new Date(),
        lastExportedLabel: exportLabel,
        exportCount: { increment: 1 },
      },
    })

    return NextResponse.json({
      csv: csvContent,
      exportId: exportRecord.id,
      recordCount: stations.length,
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV' },
      { status: 500 }
    )
  }
}

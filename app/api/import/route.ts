import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseADIF, normalizeCallsign, parseADIFDate, parseADIFTime } from '@/lib/adif-parser'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const content = await file.text()

    // Parse ADIF
    const records = parseADIF(content)

    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid ADIF records found' }, { status: 400 })
    }

    // Process records and deduplicate callsigns
    const callsignMap = new Map<string, number>()
    const qsosToCreate: Array<{
      userId: string
      callsign: string
      date: Date
      time: string | null
      band: string | null
      mode: string | null
      freq: string | null
      rstSent: string | null
      rstRcvd: string | null
      qth: string | null
      comment: string | null
      adifData: any
    }> = []

    for (const record of records) {
      const callsign = normalizeCallsign(record.CALL || record.STATION_CALLSIGN || '')
      if (!callsign) continue

      // Count QSOs per callsign
      callsignMap.set(callsign, (callsignMap.get(callsign) || 0) + 1)

      // Parse date
      const dateStr = record.QSO_DATE || record.DATE_ON || ''
      const date = parseADIFDate(dateStr) || new Date()

      // Parse time
      const timeStr = record.TIME_ON || record.TIME || ''
      const time = parseADIFTime(timeStr)

      // Create QSO record
      qsosToCreate.push({
        userId: user.id,
        callsign,
        date,
        time,
        band: record.BAND || null,
        mode: record.MODE || null,
        freq: record.FREQ || record.FREQUENCY || null,
        rstSent: record.RST_SENT || null,
        rstRcvd: record.RST_RCVD || null,
        qth: record.QTH || null,
        comment: record.COMMENT || record.NOTES || null,
        adifData: record,
      })
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Insert QSOs
      const qsoResults = await Promise.all(
        qsosToCreate.map((qso) =>
          tx.qSO.create({
            data: qso,
          })
        )
      )

      // Upsert stations with QSO counts
      const stationUpdates = Array.from(callsignMap.entries()).map(
        async ([callsign, count]) => {
          const existing = await tx.station.findUnique({
            where: {
              userId_callsign: {
                userId: user.id,
                callsign,
              },
            },
          })

          if (existing) {
            // Update QSO count
            return tx.station.update({
              where: {
                id: existing.id,
              },
              data: {
                qsoCount: existing.qsoCount + count,
              },
            })
          } else {
            // Create new station
            return tx.station.create({
              data: {
                userId: user.id,
                callsign,
                qsoCount: count,
                eligibility: 'Unknown',
              },
            })
          }
        }
      )

      const stations = await Promise.all(stationUpdates)

      return {
        qsosCreated: qsoResults.length,
        stationsUpdated: stations.length,
      }
    })

    return NextResponse.json({
      success: true,
      ...result,
      totalRecords: records.length,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import ADIF file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

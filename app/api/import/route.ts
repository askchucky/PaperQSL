import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseADIF, normalizeCallsign, parseADIFDate, parseADIFTime } from '@/lib/adif-parser'
import { hydrateStationFromQRZ } from '@/lib/qrzHydrate'
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
    const sourceFileName = file.name

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
      sourceFile: string | null
      myPotaRef: string | null
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
        sourceFile: sourceFileName || null,
        myPotaRef: record.MY_POTA_REF || null,
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
        distinctCallsigns: Array.from(callsignMap.keys()),
      }
    })

    // Auto-load QRZ data for distinct callsigns with concurrency limit
    const distinctCallsigns = result.distinctCallsigns
    const qrzWarnings: string[] = []
    const CONCURRENCY_LIMIT = 3

    // Process callsigns in batches
    for (let i = 0; i < distinctCallsigns.length; i += CONCURRENCY_LIMIT) {
      const batch = distinctCallsigns.slice(i, i + CONCURRENCY_LIMIT)
      const results = await Promise.all(
        batch.map(async (callsign) => {
          const result = await hydrateStationFromQRZ({
            userId: user.id,
            callsign,
          })
          if (result.error) {
            return { callsign, error: result.error }
          }
          return { callsign, success: true }
        })
      )

      // Collect warnings
      results.forEach((r) => {
        if ('error' in r) {
          qrzWarnings.push(`${r.callsign}: ${r.error}`)
        }
      })
    }

    return NextResponse.json({
      success: true,
      ...result,
      totalRecords: records.length,
      qrzWarnings: qrzWarnings.length > 0 ? qrzWarnings : undefined,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import ADIF file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

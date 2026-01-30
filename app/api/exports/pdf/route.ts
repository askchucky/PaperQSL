import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAvery5160Labels } from '@/lib/pdf-labels'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { Buffer } from 'buffer'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Blob storage not configured' },
        { status: 500 }
      )
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
        return NextResponse.json(
          { error: 'No stations found matching source file filter' },
          { status: 400 }
        )
      }
      where.callsign = { in: stationCallsigns }
    }

    // Build OR conditions (ignore missingAddress filter for PDF since we need addresses)
    const orConditions: any[] = []

    if (notSent) {
      orConditions.push(
        { sentAt: null },
        { status: { not: 'sent' } }
      )
    }

    if (orConditions.length > 0) {
      where.OR = orConditions
    }

    // Always require address for PDF labels (not null and not empty)
    where.AND = [
      ...(where.AND || []),
      { addressLine1: { not: null } },
      { addressLine1: { not: '' } },
    ]

    // Fetch all matching stations with addresses
    const stations = await prisma.station.findMany({
      where,
      orderBy: { callsign: 'asc' },
      select: {
        id: true,
        callsign: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })

    if (stations.length === 0) {
      return NextResponse.json(
        { error: 'No stations with addresses found matching filters' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBytes = await generateAvery5160Labels(stations)

    // Upload to Vercel Blob
    const filename = `labels-${new Date().toISOString().split('T')[0]}-${Date.now()}.pdf`
    
    // pdf-lib returns Uint8Array; Vercel Blob expects PutBody (Buffer/Blob/etc.)
    const pdfBody = Buffer.from(pdfBytes)
    
    const blob = await put(filename, pdfBody, {
      access: 'public',
      contentType: 'application/pdf',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Create export record
    const exportLabel = `PDF Labels - ${new Date().toISOString().split('T')[0]}`
    const exportRecord = await prisma.export.create({
      data: {
        userId: user.id,
        type: 'PDF',
        filename,
        blobUrl: blob.url,
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
      exportId: exportRecord.id,
      blobUrl: blob.url,
      filename,
      recordCount: stations.length,
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

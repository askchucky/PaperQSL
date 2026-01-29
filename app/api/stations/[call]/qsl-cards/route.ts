import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { call: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callsign = decodeURIComponent(params.call).toUpperCase()

    // Verify station exists and belongs to user
    const station = await prisma.station.findUnique({
      where: {
        userId_callsign: {
          userId: user.id,
          callsign,
        },
      },
    })

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 })
    }

    // Check for required env vars
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN not configured' },
        { status: 500 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const side = formData.get('side') as string
    const file = formData.get('file') as File

    if (!side || (side !== 'front' && side !== 'back')) {
      return NextResponse.json(
        { error: 'Invalid side. Must be "front" or "back"' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be JPEG or PNG' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const filename = `qsl-${callsign}-${side}-${Date.now()}.${file.type.split('/')[1]}`
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Update station record
    const updateData: any = {}
    if (side === 'front') {
      updateData.qslCardFrontUrl = blob.url
      updateData.qslCardFrontUploadedAt = new Date()
    } else {
      updateData.qslCardBackUrl = blob.url
      updateData.qslCardBackUploadedAt = new Date()
    }

    const updatedStation = await prisma.station.update({
      where: {
        userId_callsign: {
          userId: user.id,
          callsign,
        },
      },
      data: updateData,
    })

    return NextResponse.json({ station: updatedStation })
  } catch (error) {
    console.error('Error uploading QSL card:', error)
    return NextResponse.json(
      { error: 'Failed to upload QSL card', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

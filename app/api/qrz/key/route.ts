import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { qrzApiKey: true },
    })

    if (!dbUser?.qrzApiKey) {
      return NextResponse.json({ hasKey: false })
    }

    // Return that key exists but don't expose it
    return NextResponse.json({ hasKey: true })
  } catch (error) {
    console.error('Error fetching QRZ key:', error)
    return NextResponse.json(
      { error: 'Failed to fetch QRZ key status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 })
    }

    // Encrypt and store
    const encrypted = encrypt(apiKey)

    await prisma.user.update({
      where: { id: user.id },
      data: { qrzApiKey: encrypted },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving QRZ key:', error)
    return NextResponse.json(
      { error: 'Failed to save QRZ key' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { qrzApiKey: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting QRZ key:', error)
    return NextResponse.json(
      { error: 'Failed to delete QRZ key' },
      { status: 500 }
    )
  }
}

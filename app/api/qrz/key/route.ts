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
      select: { qrzUsername: true, qrzPassword: true },
    })

    const configured = !!(dbUser?.qrzUsername && dbUser?.qrzPassword)

    // Return that credentials exist and username (but never password)
    return NextResponse.json({ 
      configured,
      username: configured ? dbUser.qrzUsername : null
    })
  } catch (error) {
    console.error('Error fetching QRZ credentials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch QRZ credentials status' },
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
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (!username.trim()) {
      return NextResponse.json(
        { error: 'Username cannot be empty' },
        { status: 400 }
      )
    }

    if (!password.trim()) {
      return NextResponse.json(
        { error: 'Password cannot be empty' },
        { status: 400 }
      )
    }

    // Encrypt password and store
    const encryptedPassword = encrypt(password)

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        qrzUsername: username.trim(),
        qrzPassword: encryptedPassword,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving QRZ credentials:', error)
    return NextResponse.json(
      { error: 'Failed to save QRZ credentials' },
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
      data: { 
        qrzUsername: null,
        qrzPassword: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting QRZ credentials:', error)
    return NextResponse.json(
      { error: 'Failed to delete QRZ credentials' },
      { status: 500 }
    )
  }
}

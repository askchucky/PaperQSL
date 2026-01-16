import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { qrzLogin } from '@/lib/qrz'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stored credentials
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { qrzUsername: true, qrzPassword: true },
    })

    if (!dbUser?.qrzUsername || !dbUser?.qrzPassword) {
      return NextResponse.json(
        { 
          success: false,
          message: 'QRZ credentials not configured. Please save your credentials first.' 
        },
        { status: 400 }
      )
    }

    // Decrypt password
    const password = decrypt(dbUser.qrzPassword)

    // Test the credentials
    try {
      const sessionKey = await qrzLogin(dbUser.qrzUsername, password)
      return NextResponse.json({
        success: true,
        message: 'QRZ login successful',
      })
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'QRZ login failed',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error testing QRZ login:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test QRZ login' 
      },
      { status: 500 }
    )
  }
}

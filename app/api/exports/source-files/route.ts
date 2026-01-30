import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sourceFiles = await prisma.qSO.findMany({
      where: {
        userId: user.id,
        sourceFile: { not: null },
      },
      select: {
        sourceFile: true,
      },
      distinct: ['sourceFile'],
      orderBy: { sourceFile: 'asc' },
    })

    return NextResponse.json({
      sourceFiles: sourceFiles.map((sf) => sf.sourceFile).filter(Boolean) as string[],
    })
  } catch (error) {
    console.error('Error fetching source files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch source files' },
      { status: 500 }
    )
  }
}

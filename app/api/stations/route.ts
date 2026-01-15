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

    const [stations, total] = await Promise.all([
      prisma.station.findMany({
        where,
        skip,
        take: limit,
        orderBy: { callsign: 'asc' },
      }),
      prisma.station.count({ where }),
    ])

    return NextResponse.json({
      stations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching stations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    )
  }
}

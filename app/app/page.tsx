import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    return null
  }

  // Get or create user in database
  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
    },
  })

  // Get statistics
  const [qsoCount, stationCount, eligibleCount, sentCount] = await Promise.all([
    prisma.qSO.count({ where: { userId: dbUser.id } }),
    prisma.station.count({ where: { userId: dbUser.id } }),
    prisma.station.count({
      where: { userId: dbUser.id, eligibility: 'Eligible' },
    }),
    prisma.station.count({
      where: {
        userId: dbUser.id,
        status: 'sent',
      },
    }),
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-bold">{qsoCount}</h2>
          <p className="text-gray-600">Total QSOs</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-bold">{stationCount}</h2>
          <p className="text-gray-600">Unique Stations</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-bold">{eligibleCount}</h2>
          <p className="text-gray-600">Eligible for QSL</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-bold">{sentCount}</h2>
          <p className="text-gray-600">QSLs Sent</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/app/import"
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Import ADIF File
            </Link>
            <Link
              href="/app/stations"
              className="block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              View Stations
            </Link>
            <Link
              href="/app/exports"
              className="block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              View Exports
            </Link>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-600">Activity feed coming soon...</p>
        </div>
      </div>
    </div>
  )
}

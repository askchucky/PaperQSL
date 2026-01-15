import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/app" className="text-2xl font-bold">
              PaperQSL Manager
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/app"
                className="text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/app/import"
                className="text-gray-700 hover:text-gray-900"
              >
                Import
              </Link>
              <Link
                href="/app/stations"
                className="text-gray-700 hover:text-gray-900"
              >
                Stations
              </Link>
              <Link
                href="/app/exports"
                className="text-gray-700 hover:text-gray-900"
              >
                Exports
              </Link>
              <Link
                href="/app/settings/integrations"
                className="text-gray-700 hover:text-gray-900"
              >
                Settings
              </Link>
              <Link
                href="/app/settings/support"
                className="text-gray-700 hover:text-gray-900"
              >
                Support
              </Link>
              <UserButton />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

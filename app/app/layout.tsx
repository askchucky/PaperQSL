import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'

const navItems = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/import', label: 'Import' },
  { href: '/app/stations', label: 'Stations' },
  { href: '/app/exports', label: 'Exports' },
  { href: '/app/settings/integrations', label: 'Settings' },
  { href: '/app/settings/support', label: 'Support' },
]

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  if (!user) redirect('/')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/app" className="flex items-center gap-3">
            <Image
              src="/img/paperqsl_logo.png"
              alt="PaperQSL"
              width={36}
              height={36}
              className="rounded"
              priority
            />
            <div className="leading-tight">
              <div className="text-base font-semibold text-gray-900">PaperQSL</div>
              <div className="text-xs text-gray-500">Manager</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Simple mobile nav via <details> (no client JS needed) */}
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Menu
              </summary>
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-white shadow-lg">
                <div className="p-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </details>

            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block">
          <div className="sticky top-[72px] rounded-2xl border bg-white p-3 shadow-sm">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.href} href={item.href}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <div className="text-xs font-medium text-gray-600">Signed in as</div>
              <div className="mt-1 truncate text-sm text-gray-900">
                {user.emailAddresses?.[0]?.emailAddress ?? 'User'}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          <div className="rounded-2xl border bg-white shadow-sm min-w-0">
            <div className="p-6 overflow-x-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * Server component safe "active" styling:
 * We can't use usePathname() here unless we make the layout client-side.
 * So: keep it simple visually; if you want true active state, I’ll show a clean client wrapper next.
 */
function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    >
      {children}
    </Link>
  )
}
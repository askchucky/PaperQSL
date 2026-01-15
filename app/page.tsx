import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">PaperQSL Manager</h1>
          <div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-4">
                <Link
                  href="/app"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Go to App
                </Link>
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Manage Your Paper QSL Cards
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Upload ADIF files, track QSL status, generate mailing labels, and
            more.
          </p>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/app"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </SignedIn>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Upload ADIF</h3>
            <p className="text-gray-600">
              Import your QSOs from ADIF files and automatically deduplicate
              callsigns.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Track QSL Status</h3>
            <p className="text-gray-600">
              Monitor the full QSL lifecycle: sent, received, and pending.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Generate Labels</h3>
            <p className="text-gray-600">
              Create PDF mailing labels for Avery 5160 format.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

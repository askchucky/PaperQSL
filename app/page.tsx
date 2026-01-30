import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function Home() {
  const user = await currentUser()
  if (user) {
    redirect('/app')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <header className="border-b bg-white sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/img/paperqsl_logo.png"
                alt="PaperQSL Logo"
                width={48}
                height={48}
                className="w-12 h-12"
                priority
              />
              <span className="text-2xl font-bold text-gray-900">PaperQSL</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-700 hover:text-gray-900 transition">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition">
                How it works
              </a>
              <a href="#faq" className="text-gray-700 hover:text-gray-900 transition">
                FAQ
              </a>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Get Started
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/app"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Open Dashboard
                </Link>
                <UserButton />
              </SignedIn>
            </div>
            <div className="md:hidden">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <Image
                src="/img/paperqsl_logo.png"
                alt="PaperQSL Logo"
                width={120}
                height={120}
                className="w-30 h-30"
                priority
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Manage Your Paper QSL Cards
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Import ADIF files, track QSL status, generate mailing labels, and streamline your
              amateur radio QSL workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                    Import ADIF
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50 transition">
                    View Stations
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/app/import"
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl text-center"
                >
                  Import ADIF
                </Link>
                <Link
                  href="/app/stations"
                  className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50 transition text-center"
                >
                  View Stations
                </Link>
              </SignedIn>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              Everything You Need to Manage QSL Cards
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">ADIF Import & Station Grouping</h3>
                <p className="text-gray-600">
                  Upload your ADIF files and automatically deduplicate callsigns into unique
                  stations. Track QSO counts and organize by source file.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">QRZ Address Updates</h3>
                <p className="text-gray-600">
                  Automatically fetch mailing addresses from QRZ.com. One-click "Fill from QRZ"
                  button to populate station details including name, address, and QSL manager.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">POTA Activation Enrichment</h3>
                <p className="text-gray-600">
                  Automatically link POTA activations with park names. View "US-8361 - Park Name"
                  with direct links to pota.app for easy reference.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Export Labels & Tracking</h3>
                <p className="text-gray-600">
                  Generate PDF mailing labels in Avery 5160 format or export to CSV. Filter by log
                  file, eligibility, and status. Track which stations have been exported.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">QSL Card Uploads</h3>
                <p className="text-gray-600">
                  Upload front and back images of received QSL cards. Store them securely and view
                  them in a lightbox for easy reference.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Complete QSL Lifecycle</h3>
                <p className="text-gray-600">
                  Track eligibility, sent dates, received dates, and status. Add notes and manage
                  the entire QSL workflow from one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              How It Works
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Import Your ADIF Files</h3>
                  <p className="text-gray-600">
                    Upload your ADIF log files. PaperQSL automatically extracts QSOs, groups them
                    by callsign, and creates station records.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Enrich with QRZ Data</h3>
                  <p className="text-gray-600">
                    Connect your QRZ.com account and automatically fetch mailing addresses, names,
                    and QSL manager information for each station.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Export & Track</h3>
                  <p className="text-gray-600">
                    Generate mailing labels or CSV exports. Track which stations you've sent QSLs
                    to and manage your entire QSL workflow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">Is PaperQSL free to use?</h3>
                <p className="text-gray-600">
                  Yes! PaperQSL is completely free. Import unlimited ADIF files, track unlimited
                  stations, and export as many labels as you need.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">
                  Do I need a QRZ.com account to use PaperQSL?
                </h3>
                <p className="text-gray-600">
                  No, QRZ integration is optional. You can manually enter addresses or use the "Fill
                  from QRZ" button when you have a QRZ.com account configured.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">
                  What ADIF file formats are supported?
                </h3>
                <p className="text-gray-600">
                  PaperQSL supports standard ADIF format files. Most logging software can export in
                  ADIF format, including WSJT-X, Log4OM, DXKeeper, and many others.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">
                  Can I filter exports by log file?
                </h3>
                <p className="text-gray-600">
                  Yes! You can filter exports by source log file, eligibility status, QSL status,
                  and more. This makes it easy to export labels for specific activations or
                  contests.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">How are QSL cards stored?</h3>
                <p className="text-gray-600">
                  QSL card images are securely stored and can be uploaded for both front and back
                  sides. You can view them in a lightbox on the station detail page.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/img/paperqsl_logo.png"
                  alt="PaperQSL Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
                <span className="text-xl font-bold">PaperQSL</span>
              </div>
              <p className="text-gray-400 text-sm">
                Streamline your amateur radio QSL card management workflow.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition">
                    How it works
                  </a>
                </li>
                <SignedIn>
                  <li>
                    <Link href="/app" className="hover:text-white transition">
                      Dashboard
                    </Link>
                  </li>
                </SignedIn>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#faq" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
                <SignedIn>
                  <li>
                    <Link href="/app/settings/support" className="hover:text-white transition">
                      Support
                    </Link>
                  </li>
                </SignedIn>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Get Started</h4>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                    Sign Up Free
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/app"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Open Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} PaperQSL. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

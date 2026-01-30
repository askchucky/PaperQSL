import Link from 'next/link'

export const metadata = {
  title: 'Changelog • PaperQSL',
  description: 'What’s new in PaperQSL',
}

type ChangelogEntry = {
  date: string
  title: string
  bullets: string[]
}

const entries: ChangelogEntry[] = [
  {
    date: '2026-01-30',
    title: 'POTA lookup, export tracking, and QRZ name capture',
    bullets: [
      'Stations list supports paging and row-size selection (50/75/100/All).',
      'Station details show POTA activation as a link with park name from the POTA list (when available).',
      'QRZ hydration now stores first/last name when available.',
      'Exports can be filtered by log file name, and stations track last exported time and count.',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Changelog</h1>
          <p className="mt-2 text-sm text-gray-600">
            What’s new in PaperQSL. Updates are listed newest first.
          </p>
        </div>

        <Link
          href="/app"
          className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-base font-semibold">Recommended workflow</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>Import an ADIF log.</li>
          <li>Review stations and fill any missing address info.</li>
          <li>Verify eligibility (and fix any edge cases).</li>
          <li>Export PDF labels or CSV.</li>
        </ol>
      </div>

      <div className="space-y-6">
        {entries.map((e) => (
          <article key={e.date} className="rounded-2xl border bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{e.title}</h2>
              <span className="text-sm text-gray-500">{e.date}</span>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
              {e.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-base font-semibold">Questions?</h2>
        <p className="mt-2 text-sm text-gray-700">
          If you run into an issue after an update, check{' '}
          <Link href="/app/settings/support" className="text-blue-600 hover:underline">
            Support
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
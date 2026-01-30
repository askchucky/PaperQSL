import Link from 'next/link'

export const metadata = {
  title: 'Changelog | PaperQSL',
  description: 'What’s new in PaperQSL.',
}

type ChangelogEntry = {
  date: string
  title: string
  items: string[]
}

const entries: ChangelogEntry[] = [
  {
    date: '2026-01-30',
    title: 'POTA enrichment, exports tracking, and UI improvements',
    items: [
      'Stations: sortable table with paging + page-size selector (50/75/100/All).',
      'POTA: “From POTA Activation” now shows park reference + park name and links to pota.app.',
      'QRZ: store and display first/last name from QRZ lookups.',
      'Exports: filter by source log file; track last export date and export count per station.',
      'Import: QSO_DATE + TIME_ON are combined into a single UTC datetime for consistent sorting.',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Changelog</h1>
          <p className="mt-2 text-sm text-gray-600">
            What’s new in PaperQSL. Newer updates appear first.
          </p>
        </div>

        <Link
          href="/app"
          className="shrink-0 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="space-y-6">
        {entries.map((e) => (
          <article key={e.date} className="rounded-2xl border bg-white p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{e.title}</h2>
              <span className="text-sm text-gray-500">{e.date}</span>
            </div>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
              {e.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border bg-gray-50 p-6">
        <h3 className="text-sm font-semibold text-gray-900">Want something added here?</h3>
        <p className="mt-2 text-sm text-gray-700">
          This page is user-facing. Keep notes short and focused on what changed and what users should do.
        </p>
      </div>
    </div>
  )
}
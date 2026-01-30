

import Link from 'next/link'

const changelog = [
  {
    version: '1.4.0',
    date: '2026-01-30',
    title: 'POTA enrichment, export tracking, and UI upgrades',
    items: [
      'Stations list: pagination + page size selector (50/75/100/All).',
      'Stations list: sortable columns (Last QSO, Callsign, QSOs, Log File, Sent/Received).',
      'Station detail: “From POTA Activation” now shows park name and links to pota.app.',
      'Export page: filter eligible exports by source log filename.',
      'Export tracking: store last export date/label and export count per station.',
      'QRZ hydration: store first/last name on Station and display in station details.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-01-29',
    title: 'QSL card uploads + QRZ auto-hydration on import',
    items: [
      'ADIF import: automatically hydrate station address + QSL manager from QRZ for new calls.',
      'QSOs: track the source log filename for each imported QSO.',
      'Station detail: show distinct source filenames for QSOs.',
      'QSL cards: upload and store front/back images per station (thumbnail + enlarge).',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-01-16',
    title: 'QSL Manager field',
    items: [
      'QRZ lookup: parse qslmgr from QRZ XML.',
      'Station: persist QSL Manager and display it above the mailing address.',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Changelog</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            What’s new in PaperQSL. This page is a human-friendly summary of product
            updates. (If something looks off, please let us know via{' '}
            <Link href="/app/settings/support" className="text-blue-600 hover:underline">
              Support
            </Link>
            .)
          </p>
        </div>

        <Link
          href="/app"
          className="shrink-0 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="rounded-2xl border bg-gray-50 p-4">
        <div className="text-sm font-semibold text-gray-900">Recommended workflow</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
          <li>Import your ADIF logs.</li>
          <li>Review stations and fill any missing addresses (QRZ can help).</li>
          <li>Export PDF labels (or CSV) for stations marked Eligible.</li>
          <li>Track what you’ve exported so you don’t duplicate work.</li>
        </ol>
      </div>

      <div className="space-y-6">
        {changelog.map((entry) => (
          <section key={entry.version} className="rounded-2xl border bg-white p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                    v{entry.version}
                  </span>
                  <h2 className="text-lg font-semibold text-gray-900">{entry.title}</h2>
                </div>
                <div className="mt-1 text-sm text-gray-500">Released {entry.date}</div>
              </div>
            </div>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">FAQ</h2>
        <div className="mt-3 space-y-4 text-sm text-gray-700">
          <div>
            <div className="font-medium text-gray-900">Why did my PDF export produce 0 labels?</div>
            <p className="mt-1 text-gray-700">
              Usually it means there are no stations marked <span className="font-medium">Eligible</span>
              {' '}with a mailing address filled in (or your filters, like “Log File”, narrowed the
              results to zero). Check the Stations list filters and verify addresses.
            </p>
          </div>
          <div>
            <div className="font-medium text-gray-900">Where do the addresses come from?</div>
            <p className="mt-1">
              Addresses can be filled manually or hydrated from QRZ (if you configured QRZ credentials).
              You can still use the “Fill from QRZ” button in station details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function ChangelogPage() {
  const changelog = [
    {
      version: 'v1.4.0',
      date: 'Jan 30, 2026',
      changes: [
        'Added POTA park name lookup and direct links to pota.app',
        'Introduced export tracking (last exported date & count)',
        'Improved Stations table performance and sorting',
        'Added page size selector (50 / 75 / 100 / All)',
        'New sidebar layout and refreshed app design',
      ],
    },
    {
      version: 'v1.3.0',
      date: 'Jan 27, 2026',
      changes: [
        'QRZ import now saves first and last name',
        'Export filtering by log file name',
        'Improved ADIF import date/time handling (UTC)',
      ],
    },
    {
      version: 'v1.2.0',
      date: 'Jan 20, 2026',
      changes: [
        'Initial public release',
        'ADIF import and station grouping',
        'QRZ address hydration',
        'PDF and CSV export support',
      ],
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Changelog</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          This page highlights recent updates, improvements, and fixes to PaperQSL.
          New features are added regularly—check back often!
        </p>
      </div>

      <div className="space-y-6">
        {changelog.map((entry) => (
          <div
            key={entry.version}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {entry.version}
              </h2>
              <span className="text-sm text-gray-500">{entry.date}</span>
            </div>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
              {entry.changes.map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

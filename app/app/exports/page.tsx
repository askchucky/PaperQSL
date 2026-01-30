'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Export {
  id: string
  type: string
  filename: string
  blobUrl: string
  recordCount: number
  createdAt: Date
  filters: any
}

export default function ExportsPage() {
  const [exports, setExports] = useState<Export[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  // Export filters (same as stations page)
  const [search, setSearch] = useState('')
  const [eligibilityFilter, setEligibilityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [missingAddress, setMissingAddress] = useState(false)
  const [notSent, setNotSent] = useState(false)
  const [sourceFileFilter, setSourceFileFilter] = useState('all')
  const [sourceFiles, setSourceFiles] = useState<string[]>([])

  useEffect(() => {
    fetchExports()
    fetchSourceFiles()
  }, [])

  const fetchSourceFiles = async () => {
    try {
      const response = await fetch('/api/exports/source-files')
      const data = await response.json()
      if (response.ok) {
        setSourceFiles(data.sourceFiles || [])
      }
    } catch (error) {
      console.error('Error fetching source files:', error)
    }
  }

  const fetchExports = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/exports')
      const data = await response.json()

      if (response.ok) {
        setExports(data.exports)
      }
    } catch (error) {
      console.error('Error fetching exports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCSVExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/exports/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: search || undefined,
          eligibility: eligibilityFilter !== 'all' ? eligibilityFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          missingAddress,
          notSent,
          sourceFile: sourceFileFilter !== 'all' ? sourceFileFilter : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Download CSV
        const blob = new Blob([data.csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename || `stations-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        // Refresh exports list
        await fetchExports()
        alert(`Exported ${data.recordCount} stations to CSV`)
      } else {
        alert(`Error: ${data.error || 'Export failed'}`)
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const handlePDFExport = async () => {
    setExportingPDF(true)
    try {
      const response = await fetch('/api/exports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: search || undefined,
          eligibility: eligibilityFilter !== 'all' ? eligibilityFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          missingAddress,
          notSent,
          sourceFile: sourceFileFilter !== 'all' ? sourceFileFilter : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Open PDF in new tab
        window.open(data.blobUrl, '_blank')

        // Refresh exports list
        await fetchExports()
        alert(`Generated PDF with ${data.recordCount} labels (Avery 5160 format)`)
      } else {
        alert(`Error: ${data.error || 'Export failed'}`)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF')
    } finally {
      setExportingPDF(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Exports</h1>

      {/* Export Options */}
      <div className="mb-8 border rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Export Stations</h2>

        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
            <h3 className="text-sm font-semibold text-blue-900">How exports work</h3>
            <p className="mt-1 text-sm text-blue-900/80">
              Exports always start from your Stations list and apply the same filters shown below.
              Use this page to generate either a CSV (for spreadsheets/label tools) or a PDF of Avery 5160 labels.
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-blue-900">What’s eligible?</div>
                <ul className="mt-1 list-disc list-inside text-sm text-blue-900/80 space-y-1">
                  <li>
                    <span className="font-medium">CSV:</span> includes stations that match your filters (even if an address is missing).
                  </li>
                  <li>
                    <span className="font-medium">PDF Labels:</span> includes stations that match your filters <span className="font-medium">and</span> have a complete mailing address.
                  </li>
                  <li>
                    If you enable <span className="font-medium">Missing Address</span>, the PDF will typically produce fewer (or zero) labels because labels require an address.
                  </li>
                </ul>
              </div>

              <div>
                <div className="text-xs font-semibold text-blue-900">Tips</div>
                <ul className="mt-1 list-disc list-inside text-sm text-blue-900/80 space-y-1">
                  <li>Use <span className="font-medium">Not Sent</span> to focus on stations that still need a card.</li>
                  <li>Use <span className="font-medium">All Logs</span> / a specific log file to export only stations from that import.</li>
                  <li>After exporting, stations are marked as exported so you can track what you’ve already printed/sent.</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-blue-900">Recommended workflow</div>
                <ol className="mt-1 list-decimal list-inside text-sm text-blue-900/80 space-y-1">
                  <li><span className="font-medium">Import</span> your ADIF log.</li>
                  <li><span className="font-medium">Review Stations</span> and filter to what you plan to send.</li>
                  <li><span className="font-medium">Fill missing addresses</span> (use “Fill from QRZ” on Station details).</li>
                  <li><span className="font-medium">Export PDF labels</span> (Avery 5160) or <span className="font-medium">Export CSV</span> for spreadsheets.</li>
                </ol>
              </div>

              <div>
                <div className="text-xs font-semibold text-blue-900">Why would a PDF produce 0 labels?</div>
                <ul className="mt-1 list-disc list-inside text-sm text-blue-900/80 space-y-1">
                  <li>The selected filters match stations, but <span className="font-medium">none have a complete mailing address</span>.</li>
                  <li><span className="font-medium">Missing Address</span> is enabled (PDF labels require an address).</li>
                  <li>The <span className="font-medium">Status</span> or <span className="font-medium">Not Sent</span> filters exclude everything.</li>
                  <li>You selected a specific <span className="font-medium">Log File</span> that doesn’t include eligible stations.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Search callsign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded flex-1 min-w-[200px]"
            />

            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              <option value="all">All Eligibility</option>
              <option value="Eligible">Eligible</option>
              <option value="Not Eligible">Not Eligible</option>
              <option value="Unknown">Unknown</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              <option value="n/a">N/A</option>
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={missingAddress}
                onChange={(e) => setMissingAddress(e.target.checked)}
              />
              <span className="text-sm">Missing Address</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notSent}
                onChange={(e) => setNotSent(e.target.checked)}
              />
              <span className="text-sm">Not Sent</span>
            </label>

            <select
              value={sourceFileFilter}
              onChange={(e) => setSourceFileFilter(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              <option value="all">All Logs</option>
              {sourceFiles.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCSVExport}
              disabled={exporting || exportingPDF}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={handlePDFExport}
              disabled={exporting || exportingPDF}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {exportingPDF ? 'Generating...' : 'Generate PDF Labels (Avery 5160)'}
            </button>
            <Link
              href="/app/stations"
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              View Stations
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            PDF labels are formatted for Avery 5160 (30 labels per sheet, 8.5&quot; x 11&quot;).
            PDF exports include only stations with complete mailing addresses.
            CSV exports include all stations that match your filters.
          </p>
        </div>
      </div>

      {/* Export History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Export History</h2>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : exports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No exports yet. Create your first export above.
          </div>
        ) : (
          <div className="border rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Filename
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Records
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exports.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {exp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {exp.filename}
                    </td>
                    <td className="px-4 py-3">{exp.recordCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(exp.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      {exp.blobUrl ? (
                        <a
                          href={exp.blobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

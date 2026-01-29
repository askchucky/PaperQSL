'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Station {
  id: string
  callsign: string
  qsoCount: number
  eligibility: string
  addressLine1: string | null
  sentAt: Date | null
  receivedAt: Date | null
  status: string | null
  latestQsoDate: Date | null
  latestQsoTime: string | null
  sourceFile: string | null
  potaActivation: string | null
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [eligibilityFilter, setEligibilityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [missingAddress, setMissingAddress] = useState(false)
  const [notSent, setNotSent] = useState(false)

  // Sorting
  const [sortBy, setSortBy] = useState('latestQsoDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchStations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy: sortBy,
        sortOrder: sortOrder,
      })

      if (search) params.append('search', search)
      if (eligibilityFilter !== 'all') params.append('eligibility', eligibilityFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (missingAddress) params.append('missingAddress', 'true')
      if (notSent) params.append('notSent', 'true')

      const response = await fetch(`/api/stations?${params}`)
      const data = await response.json()

      if (response.ok) {
        setStations(data.stations)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching stations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStations()
  }, [page, eligibilityFilter, statusFilter, missingAddress, notSent, sortBy, sortOrder])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchStations()
      } else {
        setPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const getEligibilityBadge = (eligibility: string) => {
    const colors: Record<string, string> = {
      Eligible: 'bg-green-100 text-green-800',
      'Not Eligible': 'bg-red-100 text-red-800',
      Unknown: 'bg-gray-100 text-gray-800',
    }
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${
          colors[eligibility] || colors.Unknown
        }`}
      >
        {eligibility}
      </span>
    )
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    const colors: Record<string, string> = {
      sent: 'bg-blue-100 text-blue-800',
      received: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      'n/a': 'bg-gray-100 text-gray-800',
    }
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${
          colors[status] || colors['n/a']
        }`}
      >
        {status}
      </span>
    )
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortBy(column)
      setSortOrder('asc')
    }
    setPage(1) // Reset to first page when sorting changes
  }

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => {
    const isActive = sortBy === column
    return (
      <th
        className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-100 select-none"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive && (
            <span className="text-gray-500">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </th>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Stations</h1>
        <div className="text-sm text-gray-600">
          Total: {total} stations
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
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
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : stations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No stations found. Import an ADIF file to get started.
        </div>
      ) : (
        <>
          <div className="border rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader column="latestQsoDate">Last QSO</SortableHeader>
                  <SortableHeader column="callsign">Callsign</SortableHeader>
                  <SortableHeader column="qsoCount">QSOs</SortableHeader>
                  <SortableHeader column="sourceFile">Source File</SortableHeader>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Eligibility</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Address</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <SortableHeader column="sentAt">Sent</SortableHeader>
                  <SortableHeader column="receivedAt">Received</SortableHeader>
                  <SortableHeader column="potaActivation">POTA Activation</SortableHeader>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stations.map((station) => {
                  const formatUtcTime = (time: string | null): string => {
                    if (!time) return ''
                    const digits = time.replace(/[^0-9]/g, '')
                    if (digits.length === 0) return ''
                    const padded = digits.padStart(4, '0').slice(0, 4)
                    return `${padded}UTC`
                  }

                  return (
                    <tr key={station.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {station.latestQsoDate ? (
                          <div>
                            <div>{format(new Date(station.latestQsoDate), 'MMM d, yyyy')}</div>
                            {station.latestQsoTime && (
                              <div className="text-xs text-gray-500">
                                {formatUtcTime(station.latestQsoTime)}
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        <a
                          href={`https://www.qrz.com/db/${encodeURIComponent(station.callsign)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {station.callsign}
                        </a>
                      </td>
                      <td className="px-4 py-3">{station.qsoCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {station.sourceFile || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {getEligibilityBadge(station.eligibility)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {station.addressLine1 ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(station.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {station.sentAt
                          ? format(new Date(station.sentAt), 'MMM d, yyyy')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {station.receivedAt
                          ? format(new Date(station.receivedAt), 'MMM d, yyyy')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {station.potaActivation || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/stations/${encodeURIComponent(station.callsign)}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

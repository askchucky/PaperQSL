'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Station {
  id: string
  callsign: string
  qsoCount: number
  eligibility: string
  eligibilityOverride: boolean
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  addressSource: string | null
  lastVerifiedAt: Date | null
  sentAt: Date | null
  sentMethod: string | null
  receivedAt: Date | null
  notes: string | null
  status: string | null
  qslManager: string | null
}

interface QSO {
  id: string
  date: Date
  time: string | null
  band: string | null
  mode: string | null
  freq: string | null
  rstSent: string | null
  rstRcvd: string | null
}

export default function StationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const callsign = decodeURIComponent(params.call as string)

  const [station, setStation] = useState<Station | null>(null)
  const [qsos, setQsos] = useState<QSO[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lookingUpQRZ, setLookingUpQRZ] = useState(false)

  // Form state
  const [eligibility, setEligibility] = useState('Unknown')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [addressSource, setAddressSource] = useState('')
  const [sentAt, setSentAt] = useState('')
  const [sentMethod, setSentMethod] = useState('')
  const [receivedAt, setReceivedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [qslManager, setQslManager] = useState('')

  useEffect(() => {
    void fetchStation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callsign])

  const fetchStation = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/stations/${encodeURIComponent(callsign)}`)
      const data = await response.json()

      if (response.ok) {
        setStation(data.station)
        setQsos(data.qsos || [])

        // Populate form
        const s = data.station
        setEligibility(s.eligibility)
        setAddressLine1(s.addressLine1 || '')
        setAddressLine2(s.addressLine2 || '')
        setCity(s.city || '')
        setState(s.state || '')
        setPostalCode(s.postalCode || '')
        setCountry(s.country || '')
        setAddressSource(s.addressSource || '')
        setSentAt(s.sentAt ? format(new Date(s.sentAt), 'yyyy-MM-dd') : '')
        setSentMethod(s.sentMethod || '')
        setReceivedAt(s.receivedAt ? format(new Date(s.receivedAt), 'yyyy-MM-dd') : '')
        setNotes(s.notes || '')
        setStatus(s.status || '')
        setQslManager(s.qslManager || '')
      } else {
        console.error('Failed to fetch station:', data?.error)
      }
    } catch (error) {
      console.error('Error fetching station:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/stations/${encodeURIComponent(callsign)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eligibility,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
          addressSource: addressSource || null,
          lastVerifiedAt: addressLine1 ? new Date().toISOString() : null,
          sentAt: sentAt || null,
          sentMethod: sentMethod || null,
          receivedAt: receivedAt || null,
          notes,
          status: status || null,
          qslManager: qslManager || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchStation()
        router.refresh()
        alert('Station updated successfully!')
      } else {
        alert(`Error: ${data?.error || 'Failed to update'}`)
      }
    } catch (error) {
      console.error('Error saving station:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleQRZLookup = async () => {
    setLookingUpQRZ(true)
    try {
      const response = await fetch(`/api/qrz/lookup/${encodeURIComponent(callsign)}`)
      const data = await response.json()

      if (response.ok) {
        // Populate address fields from QRZ (and qslManager)
        if (data.addressLine1) setAddressLine1(data.addressLine1)
        if (data.addressLine2) setAddressLine2(data.addressLine2)
        if (data.city) setCity(data.city)
        if (data.state) setState(data.state)
        if (data.postalCode) setPostalCode(data.postalCode)
        if (data.country) setCountry(data.country)
        if (data.qslManager) setQslManager(data.qslManager)
        setAddressSource('QRZ')
        alert('Address filled from QRZ!')
      } else {
        alert(`Error: ${data?.error || 'Failed to lookup callsign'}`)
      }
    } catch (error) {
      console.error('Error looking up QRZ:', error)
      alert('Failed to lookup callsign in QRZ')
    } finally {
      setLookingUpQRZ(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!station) {
    return <div className="text-center py-12">Station not found</div>
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 mb-4">
          ← Back to Stations
        </button>
        <h1 className="text-3xl font-bold font-mono">{station.callsign}</h1>
        <p className="text-gray-600 mt-2">
          {station.qsoCount} QSO{station.qsoCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: QSL Lifecycle */}
        <div className="space-y-6">
          <div className="border rounded p-6">
            <h2 className="text-xl font-semibold mb-4">QSL Lifecycle</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Eligibility</label>
                <select
                  value={eligibility}
                  onChange={(e) => setEligibility(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="Eligible">Eligible</option>
                  <option value="Not Eligible">Not Eligible</option>
                </select>
                {station.eligibilityOverride && (
                  <p className="text-xs text-gray-500 mt-1">Manually set by user</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">None</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                  <option value="n/a">N/A</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sent Date</label>
                <input
                  type="date"
                  value={sentAt}
                  onChange={(e) => setSentAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sent Method</label>
                <select
                  value={sentMethod}
                  onChange={(e) => setSentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">None</option>
                  <option value="Direct">Direct</option>
                  <option value="SASE">SASE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Received Date</label>
                <input
                  type="date"
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Add notes about this QSL..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Address */}
        <div className="space-y-6">
          <div className="border rounded p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Mailing Address</h2>
              <button
                onClick={handleQRZLookup}
                disabled={lookingUpQRZ}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                {lookingUpQRZ ? 'Looking up...' : 'Fill from QRZ'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">QSL Manager</label>
                <input
                  type="text"
                  value={qslManager}
                  onChange={(e) => setQslManager(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g. W3XYZ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address Source</label>
                <select
                  value={addressSource}
                  onChange={(e) => setAddressSource(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">None</option>
                  <option value="QRZ">QRZ</option>
                  <option value="HamQTH">HamQTH</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              {station.lastVerifiedAt && (
                <p className="text-xs text-gray-500">
                  Last verified: {format(new Date(station.lastVerifiedAt), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* Recent QSOs */}
          <div className="border rounded p-6">
            <h2 className="text-xl font-semibold mb-4">Recent QSOs</h2>
            {qsos.length === 0 ? (
              <p className="text-gray-500 text-sm">No QSOs found</p>
            ) : (
              <div className="space-y-2">
                {qsos.slice(0, 5).map((qso) => (
                  <div key={qso.id} className="text-sm border-b pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span>
                        {format(new Date(qso.date), 'MMM d, yyyy')}
                        {qso.time && ` ${qso.time}`}
                      </span>
                      <span className="text-gray-600">
                        {qso.band} {qso.mode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

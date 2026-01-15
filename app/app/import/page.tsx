'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    qsosCreated?: number
    stationsUpdated?: number
    totalRecords?: number
    error?: string
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          ...data,
        })
        // Refresh router to update dashboard stats
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setResult({
          success: false,
          error: data.error || 'Upload failed',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Import ADIF File</h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select ADIF File (.adi)
            </label>
            <input
              type="file"
              id="file"
              name="file"
              accept=".adi,.adif"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload and Import'}
          </button>
        </form>

        {result && (
          <div
            className={`mt-6 p-4 rounded ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {result.success ? (
              <div>
                <h3 className="font-semibold text-green-800 mb-2">
                  Import Successful!
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>Total records processed: {result.totalRecords}</li>
                  <li>QSOs created: {result.qsosCreated}</li>
                  <li>Stations updated: {result.stationsUpdated}</li>
                </ul>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-red-800 mb-2">
                  Import Failed
                </h3>
                <p className="text-sm text-red-700">{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">About ADIF Import</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Upload ADIF files exported from your logging software</li>
            <li>QSOs are automatically parsed and deduplicated by callsign</li>
            <li>Stations are created or updated with QSO counts</li>
            <li>All ADIF data is preserved for reference</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

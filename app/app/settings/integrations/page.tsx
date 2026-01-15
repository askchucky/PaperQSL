'use client'

import { useState, useEffect } from 'react'

export default function IntegrationsPage() {
  const [apiKey, setApiKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    checkKeyStatus()
  }, [])

  const checkKeyStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/qrz/key')
      const data = await response.json()

      if (response.ok) {
        setHasKey(data.hasKey)
      }
    } catch (error) {
      console.error('Error checking key status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/qrz/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      setTestResult({
        success: response.ok,
        message: data.message || data.error || 'Test completed',
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test API key',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key')
      return
    }

    setSaving(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/qrz/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      if (response.ok) {
        await checkKeyStatus()
        setApiKey('')
        alert('QRZ API key saved successfully!')
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || 'Failed to save key'}`)
      }
    } catch (error) {
      console.error('Error saving key:', error)
      alert('Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your QRZ API key?')) {
      return
    }

    try {
      const response = await fetch('/api/qrz/key', {
        method: 'DELETE',
      })

      if (response.ok) {
        await checkKeyStatus()
        setApiKey('')
        alert('QRZ API key deleted')
      } else {
        alert('Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting key:', error)
      alert('Failed to delete API key')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">QRZ Integration</h1>

      <div className="max-w-2xl space-y-6">
        <div className="border rounded p-6">
          <h2 className="text-xl font-semibold mb-4">API Key Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                QRZ API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasKey ? 'Enter new key to replace existing' : 'Enter your QRZ API key'}
                className="w-full px-4 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your API key is encrypted at rest. You need a QRZ.com paid
                subscription to use the API.
              </p>
            </div>

            {hasKey && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  ✓ QRZ API key is configured
                </p>
              </div>
            )}

            {testResult && (
              <div
                className={`p-3 rounded ${
                  testResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p
                  className={`text-sm ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {testResult.message}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleTest}
                disabled={!apiKey.trim() || testing}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test API Key'}
              </button>
              <button
                onClick={handleSave}
                disabled={!apiKey.trim() || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save API Key'}
              </button>
              {hasKey && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Key
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border rounded p-6">
          <h2 className="text-xl font-semibold mb-4">About QRZ Integration</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              The QRZ integration allows you to automatically fill in mailing
              addresses for stations by looking them up in the QRZ.com database.
            </p>
            <p>
              <strong>Requirements:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>QRZ.com paid subscription</li>
              <li>Valid QRZ API key (found in your QRZ account settings)</li>
            </ul>
            <p>
              <strong>Privacy:</strong> Your API key is encrypted at rest and
              only used for lookups you initiate. We do not scrape QRZ HTML or
              make automatic lookups.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

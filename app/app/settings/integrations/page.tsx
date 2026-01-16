'use client'

import { useState, useEffect } from 'react'

export default function IntegrationsPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [hasCredentials, setHasCredentials] = useState(false)
  const [storedUsername, setStoredUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    checkCredentialsStatus()
  }, [])

  const checkCredentialsStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/qrz/key')
      const data = await response.json()

      if (response.ok) {
        setHasCredentials(data.configured || false)
        setStoredUsername(data.username || null)
      }
    } catch (error) {
      console.error('Error checking credentials status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/qrz/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      setTestResult({
        success: response.ok && data.success,
        message: data.message || data.error || 'Test completed',
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test QRZ login',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!username.trim()) {
      alert('Please enter a username')
      return
    }

    if (!password.trim()) {
      alert('Please enter a password')
      return
    }

    setSaving(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/qrz/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        await checkCredentialsStatus()
        setUsername('')
        setPassword('')
        alert('QRZ credentials saved successfully!')
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || 'Failed to save credentials'}`)
      }
    } catch (error) {
      console.error('Error saving credentials:', error)
      alert('Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your QRZ credentials?')) {
      return
    }

    try {
      const response = await fetch('/api/qrz/key', {
        method: 'DELETE',
      })

      if (response.ok) {
        await checkCredentialsStatus()
        setUsername('')
        setPassword('')
        alert('QRZ credentials deleted')
      } else {
        alert('Failed to delete credentials')
      }
    } catch (error) {
      console.error('Error deleting credentials:', error)
      alert('Failed to delete credentials')
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
          <h2 className="text-xl font-semibold mb-4">QRZ Credentials Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                QRZ Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={hasCredentials ? 'Enter new username to replace existing' : 'Enter your QRZ username'}
                className="w-full px-4 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                QRZ Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={hasCredentials ? 'Enter new password to replace existing' : 'Enter your QRZ password'}
                className="w-full px-4 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Requires a paid QRZ XML subscription. Your password is encrypted at rest.
              </p>
            </div>

            {hasCredentials && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  ✓ QRZ credentials are configured{storedUsername ? ` (${storedUsername})` : ''}
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
                {!testResult.success && (
                  <p className="text-xs text-red-700 mt-2">
                    QRZ XML login failed. Verify your QRZ credentials and that your QRZ XML subscription is active.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test QRZ Login'}
              </button>
              <button
                onClick={handleSave}
                disabled={!username.trim() || !password.trim() || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save QRZ Credentials'}
              </button>
              {hasCredentials && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Credentials
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
              <li>QRZ.com paid XML subscription</li>
              <li>Valid QRZ username and password</li>
            </ul>
            <p>
              <strong>Privacy:</strong> Your password is encrypted at rest and
              only used for lookups you initiate. We do not scrape QRZ HTML or
              make automatic lookups.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

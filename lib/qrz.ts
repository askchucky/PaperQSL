// QRZ API integration
// Documentation: https://www.qrz.com/api

interface QRZResponse {
  Session?: {
    Key?: string
    Error?: string
  }
  Callsign?: {
    call?: string
    fname?: string
    name?: string
    addr1?: string
    addr2?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    email?: string
    u_views?: string
    bio?: string
    image?: string
    moddate?: string
    [key: string]: any
  }
  Error?: string
}

export async function qrzLogin(username: string, password: string): Promise<string> {
  // Build URL safely (handles special characters in username/password)
  const url = new URL('https://xmldata.qrz.com/xml/current/')
  url.searchParams.set('username', username)
  url.searchParams.set('password', password)
  url.searchParams.set('agent', 'PaperQSL')

  const response = await fetch(url.toString(), { cache: 'no-store' })

  const text = await response.text()
  
  // Parse XML response (simple parsing)
  const keyMatch = text.match(/<Key>([^<]+)<\/Key>/)
  const errorMatch = text.match(/<Error>([^<]+)<\/Error>/)

  if (errorMatch) {
    throw new Error(errorMatch[1])
  }

  if (!keyMatch) {
    throw new Error('Failed to get QRZ session key')
  }

  return keyMatch[1]
}

export async function qrzLookup(sessionKey: string, callsign: string): Promise<QRZResponse['Callsign'] | null> {
  // Build URL safely
  const lookupUrl = new URL('https://xmldata.qrz.com/xml/current/')
  lookupUrl.searchParams.set('s', sessionKey)
  lookupUrl.searchParams.set('callsign', callsign.toUpperCase())

  const response = await fetch(lookupUrl.toString(), { cache: 'no-store' })

  const text = await response.text()

  // Parse XML response
  const errorMatch = text.match(/<Error>([^<]+)<\/Error>/)
  if (errorMatch) {
    throw new Error(errorMatch[1])
  }

  // Extract callsign data
  const callMatch = text.match(/<Callsign[^>]*>([\s\S]*?)<\/Callsign>/)
  if (!callMatch) {
    return null
  }

  const callsignData: any = {}
  const fields = ['call', 'fname', 'name', 'addr1', 'addr2', 'city', 'state', 'zip', 'country', 'email']

  for (const field of fields) {
    const regex = new RegExp(`<${field}>([^<]+)<\/${field}>`)
    const match = text.match(regex)
    if (match) {
      callsignData[field] = match[1]
    }
  }

  return callsignData.call ? callsignData : null
}

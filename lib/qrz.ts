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

export async function qrzLogin(apiKey: string): Promise<string> {
  // QRZ login endpoint
  const response = await fetch(
    `https://xmldata.qrz.com/xml/1.34/?username=${encodeURIComponent(apiKey)}&password=${encodeURIComponent(apiKey)}&agent=PaperQSL`
  )

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
  const response = await fetch(
    `https://xmldata.qrz.com/xml/1.34/?s=${encodeURIComponent(sessionKey)}&callsign=${encodeURIComponent(callsign.toUpperCase())}`
  )

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

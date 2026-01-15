// Simple ADIF parser
// ADIF format: <FIELD:length>value<FIELD:length>value...

export interface ADIFRecord {
  [key: string]: string
}

export function parseADIF(content: string): ADIFRecord[] {
  const records: ADIFRecord[] = []
  
  // Remove header if present (everything before first <)
  let startIndex = content.indexOf('<')
  if (startIndex === -1) {
    return records
  }

  // Remove header comments
  const headerEnd = content.indexOf('<EOH>')
  if (headerEnd !== -1) {
    startIndex = headerEnd + 5
  }

  let currentRecord: ADIFRecord = {}
  let i = startIndex

  while (i < content.length) {
    // Find next field start
    const fieldStart = content.indexOf('<', i)
    if (fieldStart === -1) break

    // Check for end of record
    if (content.substring(fieldStart, fieldStart + 4) === '<EOR') {
      if (Object.keys(currentRecord).length > 0) {
        records.push(currentRecord)
        currentRecord = {}
      }
      i = fieldStart + 4
      continue
    }

    // Parse field: <FIELD:length>
    const fieldEnd = content.indexOf('>', fieldStart)
    if (fieldEnd === -1) break

    const fieldTag = content.substring(fieldStart + 1, fieldEnd)
    const colonIndex = fieldTag.indexOf(':')
    
    if (colonIndex === -1) {
      i = fieldEnd + 1
      continue
    }

    const fieldName = fieldTag.substring(0, colonIndex).toUpperCase()
    const fieldLength = parseInt(fieldTag.substring(colonIndex + 1), 10)

    if (isNaN(fieldLength) || fieldLength < 0) {
      i = fieldEnd + 1
      continue
    }

    // Extract field value
    const valueStart = fieldEnd + 1
    const valueEnd = valueStart + fieldLength
    const fieldValue = content.substring(valueStart, valueEnd)

    currentRecord[fieldName] = fieldValue

    i = valueEnd
  }

  // Add last record if exists
  if (Object.keys(currentRecord).length > 0) {
    records.push(currentRecord)
  }

  return records
}

export function normalizeCallsign(callsign: string): string {
  return callsign.trim().toUpperCase()
}

export function parseADIFDate(dateStr: string): Date | null {
  // ADIF date format: YYYYMMDD
  if (!dateStr || dateStr.length !== 8) {
    return null
  }

  const year = parseInt(dateStr.substring(0, 4), 10)
  const month = parseInt(dateStr.substring(4, 6), 10) - 1 // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8), 10)

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null
  }

  return new Date(year, month, day)
}

export function parseADIFTime(timeStr: string): string | null {
  // ADIF time format: HHMM or HHMMSS
  if (!timeStr || (timeStr.length !== 4 && timeStr.length !== 6)) {
    return null
  }

  return timeStr
}

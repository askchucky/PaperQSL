import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Avery 5160 specifications
// 30 labels per sheet (3 columns x 10 rows)
// Label size: 1" x 2-5/8" (1" x 2.625")
// Page size: 8.5" x 11"
const LABEL_WIDTH = 2.625 // inches
const LABEL_HEIGHT = 1.0 // inches
const PAGE_WIDTH = 8.5 // inches
const PAGE_HEIGHT = 11.0 // inches
const LABELS_PER_ROW = 3
const LABELS_PER_COLUMN = 10
const LABELS_PER_PAGE = LABELS_PER_ROW * LABELS_PER_COLUMN

// Margins (calculated to center labels on page)
const LEFT_MARGIN = (PAGE_WIDTH - LABELS_PER_ROW * LABEL_WIDTH) / 2
const TOP_MARGIN = (PAGE_HEIGHT - LABELS_PER_COLUMN * LABEL_HEIGHT) / 2

// Convert inches to points (72 points per inch)
const inchesToPoints = (inches: number) => inches * 72

interface Station {
  callsign: string
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
}

export async function generateAvery5160Labels(
  stations: Station[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Filter stations with addresses
  const stationsWithAddresses = stations.filter(
    (s) => s.addressLine1 && s.addressLine1.trim()
  )

  if (stationsWithAddresses.length === 0) {
    throw new Error('No stations with addresses found')
  }

  // Calculate number of pages needed
  const totalPages = Math.ceil(stationsWithAddresses.length / LABELS_PER_PAGE)

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.addPage([inchesToPoints(PAGE_WIDTH), inchesToPoints(PAGE_HEIGHT)])

    const startIndex = pageIndex * LABELS_PER_PAGE
    const endIndex = Math.min(
      startIndex + LABELS_PER_PAGE,
      stationsWithAddresses.length
    )

    for (let i = startIndex; i < endIndex; i++) {
      const station = stationsWithAddresses[i]
      const labelIndex = i - startIndex

      // Calculate position (row and column)
      const row = Math.floor(labelIndex / LABELS_PER_ROW)
      const col = labelIndex % LABELS_PER_ROW

      // Calculate label position (top-left corner)
      const x = inchesToPoints(LEFT_MARGIN + col * LABEL_WIDTH)
      const y =
        inchesToPoints(PAGE_HEIGHT) -
        inchesToPoints(TOP_MARGIN) -
        (row + 1) * inchesToPoints(LABEL_HEIGHT)

      // Draw label border (optional, for debugging)
      // page.drawRectangle({
      //   x,
      //   y,
      //   width: inchesToPoints(LABEL_WIDTH),
      //   height: inchesToPoints(LABEL_HEIGHT),
      //   borderColor: rgb(0.8, 0.8, 0.8),
      //   borderWidth: 0.5,
      // })

      // Build address lines
      const addressLines: string[] = []

      // Callsign (bold, larger)
      addressLines.push(station.callsign)

      // Address line 1
      if (station.addressLine1) {
        addressLines.push(station.addressLine1.trim())
      }

      // Address line 2
      if (station.addressLine2) {
        addressLines.push(station.addressLine2.trim())
      }

      // City, State, Postal Code
      const cityStateZip: string[] = []
      if (station.city) cityStateZip.push(station.city.trim())
      if (station.state) cityStateZip.push(station.state.trim())
      if (station.postalCode) cityStateZip.push(station.postalCode.trim())
      if (cityStateZip.length > 0) {
        addressLines.push(cityStateZip.join(' '))
      }

      // Country (if not US)
      if (station.country && station.country.toUpperCase() !== 'US' && station.country.toUpperCase() !== 'USA') {
        addressLines.push(station.country.trim())
      }

      // Draw text
      const fontSize = 10
      const lineHeight = 12
      const padding = 4
      let currentY = y + inchesToPoints(LABEL_HEIGHT) - padding - fontSize

      addressLines.forEach((line, lineIndex) => {
        if (lineIndex === 0) {
          // Callsign - bold and slightly larger
          page.drawText(line, {
            x: x + padding,
            y: currentY,
            size: fontSize + 2,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
          })
          currentY -= lineHeight + 2
        } else {
          // Address lines
          page.drawText(line, {
            x: x + padding,
            y: currentY,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          })
          currentY -= lineHeight
        }
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

export async function getSheetCsv(sheetName) {
  const spreadsheetId =
    '1GjtGC98fOQjmg_C28xz2GH4nptW4XOkSnTX0Sq72Ovg'

 const url =
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(sheetName)}`
    
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('スプレッドシートの読み込みに失敗しました')
  }

  return await response.text()
}
export function parseSheetCsv(csv) {
  const rows = []
  let row = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]
    const nextChar = csv[i + 1]

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      insideQuotes = !insideQuotes
    } else if (char === ',' && !insideQuotes) {
      row.push(current)
      current = ''
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }

      row.push(current)
      current = ''

      if (row.length > 0 && row.some((value) => value.trim() !== '')) {
        rows.push(row)
      }

      row = []
    } else {
      current += char
    }
  }

  row.push(current)

  if (row.length > 0 && row.some((value) => value.trim() !== '')) {
    rows.push(row)
  }

  return rows.map((columns) => ({
    artist: columns[0]?.trim() ?? '',
    title: columns[1]?.trim() ?? '',
  }))
}
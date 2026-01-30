export type ChangelogEntry = {
    date: string // YYYY-MM-DD
    version?: string
    title: string
    items: string[]
  }
  
  export const CHANGELOG: ChangelogEntry[] = [
    {
      date: '2026-01-30',
      version: '1.4.0',
      title: 'Stations + Exports improvements',
      items: [
        'Added POTA park name lookup and linkouts',
        'Export filtering by log file name',
        'Track export history per station',
      ],
    },
  ]
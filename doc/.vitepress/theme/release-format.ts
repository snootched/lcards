/**
 * '2026-09-07' -> 'September 7, 2026'. VitePress parses frontmatter dates and hands
 * them to the page as a Date or its ISO string ('2026-09-07T00:00:00.000Z').
 */
export function formatReleaseDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  const iso = (value instanceof Date ? value.toISOString() : String(value)).slice(0, 10)
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

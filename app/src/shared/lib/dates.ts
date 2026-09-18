function parseDate(value?: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/)
  if (isoMatch) {
    const date = new Date(`${trimmed}T00:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    const date = new Date(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}T00:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateBR(value?: string | null) {
  const date = parseDate(value)
  if (!date) return '—'
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function formatDateTimeBR(value?: string | null) {
  const date = parseDate(value)
  if (!date) return '—'
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' })
}

export function dateBRToISO(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value
}

export function isoToDateBR(value?: string | null) {
  if (!value) return ''
  const parts = value.slice(0, 10).split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value
}
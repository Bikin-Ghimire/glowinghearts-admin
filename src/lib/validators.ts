// app/lib/validators.ts
export const isValidImageUrl = (url: string) => {
  try {
    const u = new URL(url)
    return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(u.pathname)
  } catch {
    return false
  }
}

export const toServerDT = (isoLocal: string) => {
  // from 'YYYY-MM-DDTHH:mm' to 'YYYY-MM-DD HH:mm:00'
  if (!isoLocal) return ''
  return isoLocal.replace('T', ' ') + ':00'
}

export const toLocalISO = (dt?: string) => {
  // from 'YYYY-MM-DD HH:mm:ss' to 'YYYY-MM-DDTHH:mm'
  if (!dt || dt === '0000-00-00 00:00:00') return ''
  const d = new Date(dt.replace(' ', 'T'))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(value: number | undefined | null): string {
  if (value === undefined || value === null) return '$0.00'
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(num)) return '$0.00'
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  return sign + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function pct(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null) return '0.0%'
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(num)) return '0.0%'
  return (num * 100).toFixed(decimals) + '%'
}

export function dateStr(date?: Date | string): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

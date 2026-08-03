import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number | string) {
  return `$${Number(amount).toFixed(0)} USD`
}

export function generateReservationCode(id: number) {
  const year = new Date().getFullYear()
  return `DT-${year}-${String(id).padStart(4, '0')}`
}

export function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

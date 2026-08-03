import { describe, it, expect } from 'vitest'
import { cn, formatPrice, generateReservationCode, slugify } from './utils'

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes (clsx behavior)', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('merges tailwind conflicting classes (tailwind-merge behavior)', () => {
    // tailwind-merge resolves conflicts: last padding wins
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('handles object notation from clsx', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo')
    expect(cn({ foo: true, bar: true })).toBe('foo bar')
  })

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })
})

describe('formatPrice()', () => {
  it('formats a number as USD', () => {
    expect(formatPrice(100)).toBe('$100 USD')
    expect(formatPrice(99.9)).toBe('$100 USD')
    expect(formatPrice(0)).toBe('$0 USD')
  })

  it('accepts a string number', () => {
    expect(formatPrice('250')).toBe('$250 USD')
  })
})

describe('generateReservationCode()', () => {
  it('pads id to 4 digits', () => {
    const year = new Date().getFullYear()
    expect(generateReservationCode(1)).toBe(`DT-${year}-0001`)
    expect(generateReservationCode(42)).toBe(`DT-${year}-0042`)
    expect(generateReservationCode(1000)).toBe(`DT-${year}-1000`)
  })
})

describe('slugify()', () => {
  it('lowercases and replaces spaces', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips accents/diacritics', () => {
    expect(slugify('Punta Cána')).toBe('punta-cana')
    expect(slugify('Excursión al Río')).toBe('excursion-al-rio')
  })

  it('removes leading/trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })
})

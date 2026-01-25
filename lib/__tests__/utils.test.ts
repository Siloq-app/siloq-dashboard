import { cn, formatRelativeTime, getHealthScoreColor } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('merges Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('handles empty inputs', () => {
      expect(cn()).toBe('')
    })
  })

  describe('formatRelativeTime', () => {
    it('formats recent dates correctly', () => {
      const date = new Date()
      date.setMinutes(date.getMinutes() - 5)
      const result = formatRelativeTime(date)
      expect(result).toContain('5 minutes')
    })

    it('returns "Never" for null', () => {
      expect(formatRelativeTime(null)).toBe('Never')
    })

    it('returns "Never" for undefined', () => {
      expect(formatRelativeTime(undefined)).toBe('Never')
    })

    it('handles date strings', () => {
      const date = new Date()
      date.setHours(date.getHours() - 2)
      const result = formatRelativeTime(date.toISOString())
      expect(result).toContain('2 hours')
    })

    it('returns "Never" for invalid date strings', () => {
      expect(formatRelativeTime('invalid-date')).toBe('Never')
    })

    it('respects addSuffix option', () => {
      const date = new Date()
      date.setMinutes(date.getMinutes() - 10)
      const result = formatRelativeTime(date, { addSuffix: false })
      expect(result).not.toContain('ago')
    })
  })

  describe('getHealthScoreColor', () => {
    it('returns green for scores >= 80', () => {
      expect(getHealthScoreColor(80)).toBe('text-green-600')
      expect(getHealthScoreColor(100)).toBe('text-green-600')
      expect(getHealthScoreColor(90)).toBe('text-green-600')
    })

    it('returns yellow for scores >= 60 and < 80', () => {
      expect(getHealthScoreColor(60)).toBe('text-yellow-600')
      expect(getHealthScoreColor(70)).toBe('text-yellow-600')
      expect(getHealthScoreColor(79)).toBe('text-yellow-600')
    })

    it('returns red for scores < 60', () => {
      expect(getHealthScoreColor(59)).toBe('text-red-600')
      expect(getHealthScoreColor(0)).toBe('text-red-600')
      expect(getHealthScoreColor(30)).toBe('text-red-600')
    })
  })
})

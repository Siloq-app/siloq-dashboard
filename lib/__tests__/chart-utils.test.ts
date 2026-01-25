import { groupByCount, countToChartData, groupByTime } from '../chart-utils'

describe('chart-utils', () => {
  describe('groupByCount', () => {
    it('groups items by key and counts occurrences', () => {
      const items = [
        { status: 'active' },
        { status: 'active' },
        { status: 'inactive' },
        { status: 'active' },
      ]
      const result = groupByCount(items, (item) => item.status)
      expect(result).toEqual({
        active: 3,
        inactive: 1,
      })
    })

    it('handles empty array', () => {
      const result = groupByCount([], (item) => item.status)
      expect(result).toEqual({})
    })

    it('handles items with different keys', () => {
      const items = [
        { type: 'A' },
        { type: 'B' },
        { type: 'A' },
        { type: 'C' },
      ]
      const result = groupByCount(items, (item) => item.type)
      expect(result).toEqual({
        A: 2,
        B: 1,
        C: 1,
      })
    })
  })

  describe('countToChartData', () => {
    it('converts count object to chart data format', () => {
      const counts = {
        active: 5,
        inactive: 2,
      }
      const result = countToChartData(counts)
      expect(result).toEqual([
        { name: 'active', value: 5 },
        { name: 'inactive', value: 2 },
      ])
    })

    it('applies formatLabel when provided', () => {
      const counts = {
        active: 5,
        inactive: 2,
      }
      const formatLabel = (key: string) => key.toUpperCase()
      const result = countToChartData(counts, formatLabel)
      expect(result).toEqual([
        { name: 'ACTIVE', value: 5 },
        { name: 'INACTIVE', value: 2 },
      ])
    })

    it('handles empty counts', () => {
      const result = countToChartData({})
      expect(result).toEqual([])
    })
  })

  describe('groupByTime', () => {
    it('groups items by hour', () => {
      const now = new Date()
      const items = [
        { timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        { timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
        { timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
      ]
      const result = groupByTime(items, (item) => item.timestamp, 'hour')
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('value')
    })

    it('groups items by day', () => {
      const now = new Date()
      const items = [
        { timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
        { timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
        { timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      ]
      const result = groupByTime(items, (item) => item.timestamp, 'day')
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('value')
    })

    it('handles string timestamps', () => {
      const now = new Date()
      const items = [
        { timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() },
        { timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
      ]
      const result = groupByTime(items, (item) => item.timestamp, 'hour')
      expect(result.length).toBeGreaterThan(0)
    })

    it('respects limit parameter', () => {
      const now = new Date()
      const items = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(now.getTime() - i * 60 * 60 * 1000),
      }))
      const result = groupByTime(items, (item) => item.timestamp, 'hour', 5)
      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('handles empty array', () => {
      const result = groupByTime([], (item) => item.timestamp, 'hour')
      expect(result).toEqual([])
    })
  })
})

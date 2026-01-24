/**
 * Utility functions for preparing data for Tremor charts
 */

/**
 * Groups items by a key and counts occurrences
 */
export function groupByCount<T>(
  items: T[],
  getKey: (item: T) => string
): Record<string, number> {
  return items.reduce((acc, item) => {
    const key = getKey(item)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

/**
 * Converts grouped count data to chart format
 */
export function countToChartData(
  counts: Record<string, number>,
  formatLabel?: (key: string) => string
): Array<{ name: string; value: number }> {
  return Object.entries(counts).map(([name, value]) => ({
    name: formatLabel ? formatLabel(name) : name,
    value,
  }))
}

/**
 * Groups items by time period (hour, day, etc.)
 */
export function groupByTime<T>(
  items: T[],
  getTimestamp: (item: T) => string | Date,
  period: 'hour' | 'day' = 'hour',
  limit?: number
): Array<{ name: string; value: number }> {
  const grouped = items.reduce((acc, item) => {
    const date = new Date(getTimestamp(item))
    let key: string

    if (period === 'hour') {
      key = date.toISOString().slice(0, 13) + ':00'
    } else {
      key = date.toISOString().slice(0, 10)
    }

    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  const limited = limit ? entries.slice(-limit) : entries

  return limited.map(([key, value]) => ({
    name: new Date(key).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    value,
  }))
}

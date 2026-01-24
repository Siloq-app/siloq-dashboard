import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date as a relative time string (e.g., "2 hours ago")
 * @param date - Date string or Date object
 * @param options - Options for formatDistanceToNow
 * @returns Formatted date string or "Never" if date is invalid
 */
export function formatRelativeTime(
  date: string | Date | null | undefined,
  options?: { addSuffix?: boolean }
): string {
  if (!date) return 'Never'
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, ...options })
  } catch {
    return 'Never'
  }
}

/**
 * Gets color class based on health score
 * @param score - Health score (0-100)
 * @returns Tailwind color class
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

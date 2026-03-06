/**
 * Gameweek Utilities
 * Handles gameweek lock/unlock logic and countdown
 */

export interface Gameweek {
  id: string
  week_number: number
  start_date: string
  end_date: string
  lock_deadline: string
  is_active: boolean
}

/**
 * Check if squads are currently locked
 * Locked: Friday 14:00 UTC to Monday 22:00 UTC
 */
export function isSquadLocked(gameweek?: Gameweek | null): boolean {
  if (!gameweek) return false

  const now = new Date()
  const lockTime = new Date(gameweek.lock_deadline)
  const unlockTime = new Date(gameweek.end_date)

  // Locked if current time is between lock_deadline and end_date
  return now >= lockTime && now <= unlockTime
}

/**
 * Get time remaining until lock or unlock
 */
export function getTimeUntilChange(gameweek?: Gameweek | null): {
  isLocked: boolean
  timeRemaining: number // milliseconds
  targetDate: Date
  label: string
} {
  if (!gameweek) {
    return {
      isLocked: false,
      timeRemaining: 0,
      targetDate: new Date(),
      label: 'No active gameweek'
    }
  }

  const now = new Date()
  const lockTime = new Date(gameweek.lock_deadline)
  const unlockTime = new Date(gameweek.end_date)

  const locked = now >= lockTime && now <= unlockTime

  if (locked) {
    // Currently locked, countdown to unlock
    return {
      isLocked: true,
      timeRemaining: unlockTime.getTime() - now.getTime(),
      targetDate: unlockTime,
      label: 'Unlocks in'
    }
  } else if (now < lockTime) {
    // Before lock, countdown to lock
    return {
      isLocked: false,
      timeRemaining: lockTime.getTime() - now.getTime(),
      targetDate: lockTime,
      label: 'Locks in'
    }
  } else {
    // After unlock, waiting for next gameweek
    return {
      isLocked: false,
      timeRemaining: 0,
      targetDate: unlockTime,
      label: 'Gameweek ended'
    }
  }
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)

  const hours = totalHours % 24
  const minutes = totalMinutes % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return 'Less than 1 minute'
  }
}

/**
 * Get current active gameweek from API
 */
export async function getCurrentGameweek(): Promise<Gameweek | null> {
  try {
    const response = await fetch('/api/gameweek/current')
    if (!response.ok) return null

    const data = await response.json()
    return data.gameweek || null
  } catch (error) {
    console.error('Failed to fetch current gameweek:', error)
    return null
  }
}

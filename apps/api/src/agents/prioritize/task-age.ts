const DAY_MS = 24 * 60 * 60 * 1000

const daysSince = (isoTimestamp: string, now: Date): number =>
  Math.max(0, Math.floor((now.getTime() - Date.parse(isoTimestamp)) / DAY_MS))

export { daysSince }

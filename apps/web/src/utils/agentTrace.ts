import { MS_PER_SECOND } from './elapsed'

const JSON_INDENT = 2

const formatToolInput = (input: unknown): string =>
  JSON.stringify(input, null, JSON_INDENT) ?? String(input)

const formatDuration = (durationMs: number): string =>
  `${(durationMs / MS_PER_SECOND).toFixed(1)} s`

export { formatDuration, formatToolInput }

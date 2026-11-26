import { rmSync } from 'node:fs'

const pgliteDataDir = new URL('../.data/pglite', import.meta.url)

rmSync(pgliteDataDir, { recursive: true, force: true })
console.log(
  'Deleted apps/api/.data/pglite. The next API start migrates and seeds a fresh database.',
)

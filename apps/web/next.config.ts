import { existsSync } from 'node:fs'
import path from 'node:path'

import type { NextConfig } from 'next'

const ROOT_ENV_FILE_PATH = path.resolve(import.meta.dirname, '../../.env')
const STYLES_DIR = path.resolve(import.meta.dirname, 'src/styles')

// Next reads .env only from apps/web; the repo keeps one .env at the root.
if (existsSync(ROOT_ENV_FILE_PATH)) process.loadEnvFile(ROOT_ENV_FILE_PATH)

const nextConfig: NextConfig = {
  sassOptions: {
    loadPaths: [STYLES_DIR],
  },
}

export default nextConfig

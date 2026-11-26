import { readFileSync } from 'node:fs'

import semver from 'semver'

const readRequiredNodeRange = () =>
  JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).engines.node

const isNodeVersionSupported = (nodeVersion, requiredNodeRange) =>
  semver.satisfies(nodeVersion, requiredNodeRange)

const describeUnsupportedNode = (nodeVersion, requiredNodeRange) =>
  `DevLog needs Node ${requiredNodeRange}, but this is Node ${nodeVersion}. ` +
  'Install Node 24 LTS (see .nvmrc) and run the command again.'

export { describeUnsupportedNode, isNodeVersionSupported, readRequiredNodeRange }

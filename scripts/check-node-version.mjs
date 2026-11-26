import {
  describeUnsupportedNode,
  isNodeVersionSupported,
  readRequiredNodeRange,
} from './node-version.mjs'

const requiredNodeRange = readRequiredNodeRange()

if (!isNodeVersionSupported(process.version, requiredNodeRange)) {
  console.error(describeUnsupportedNode(process.version, requiredNodeRange))
  process.exit(1)
}

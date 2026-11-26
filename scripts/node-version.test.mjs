import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  describeUnsupportedNode,
  isNodeVersionSupported,
  readRequiredNodeRange,
} from './node-version.mjs'

const requiredNodeRange = readRequiredNodeRange()

describe('isNodeVersionSupported', () => {
  it('rejects Node 20 and Node 22.12 under the engines range', () => {
    assert.equal(isNodeVersionSupported('v20.20.2', requiredNodeRange), false)
    assert.equal(isNodeVersionSupported('v22.12.0', requiredNodeRange), false)
  })

  it('accepts Node 22.22.3, Node 24 LTS and Node 26', () => {
    assert.equal(isNodeVersionSupported('v22.22.3', requiredNodeRange), true)
    assert.equal(isNodeVersionSupported('v24.22.1', requiredNodeRange), true)
    assert.equal(isNodeVersionSupported('v26.0.0', requiredNodeRange), true)
  })
})

describe('describeUnsupportedNode', () => {
  it('names the required range and the current version', () => {
    const message = describeUnsupportedNode('v20.20.2', requiredNodeRange)

    assert.match(message, /\^22\.22\.3 \|\| \^24\.15\.0 \|\| >=26\.0\.0/)
    assert.match(message, /v20\.20\.2/)
  })
})

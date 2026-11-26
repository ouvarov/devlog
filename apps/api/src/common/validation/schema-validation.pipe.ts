import {
  StandardSchemaValidationPipe,
  type StandardSchemaValidationPipeOptions,
} from '@nestjs/common'

import type { ApiIssue } from '@devlog/shared'

import { ValidationFailedException } from './validation-failed.exception.js'

type SchemaIssue = Parameters<
  NonNullable<StandardSchemaValidationPipeOptions['exceptionFactory']>
>[0][number]
type SchemaPathSegment = NonNullable<SchemaIssue['path']>[number]
type IssuePathSegment = ApiIssue['path'][number]

const toPathSegment = (segment: SchemaPathSegment): IssuePathSegment => {
  const key = typeof segment === 'object' ? segment.key : segment
  return typeof key === 'number' ? key : String(key)
}

const unrecognizedKeysOf = (issue: SchemaIssue): string[] => {
  if (!('keys' in issue) || !Array.isArray(issue.keys)) return []
  return issue.keys.filter((key): key is string => typeof key === 'string')
}

// zod reports an unknown key on its parent object, so each key is moved into the path.
const toApiIssues = (issue: SchemaIssue): ApiIssue[] => {
  const path = (issue.path ?? []).map(toPathSegment)
  const unrecognizedKeys = unrecognizedKeysOf(issue)
  if (unrecognizedKeys.length === 0) return [{ path, message: issue.message }]

  return unrecognizedKeys.map((key) => ({ path: [...path, key], message: 'Unrecognized field' }))
}

const createSchemaValidationPipe = (): StandardSchemaValidationPipe =>
  new StandardSchemaValidationPipe({
    exceptionFactory: (issues) => new ValidationFailedException(issues.flatMap(toApiIssues)),
  })

export { createSchemaValidationPipe }

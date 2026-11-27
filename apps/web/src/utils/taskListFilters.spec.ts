import { describe, expect, it } from 'vitest'

import {
  DEFAULT_TASK_LIST_FILTERS,
  parseTaskListFilters,
  toTaskListSearch,
} from './taskListFilters'

const parseSearch = (search: string) => parseTaskListFilters(new URLSearchParams(search))

describe('parseTaskListFilters', () => {
  it('returns the defaults for an empty query', () => {
    expect(parseSearch('')).toEqual(DEFAULT_TASK_LIST_FILTERS)
  })

  it('reads a known status and sort', () => {
    expect(parseSearch('?status=in-progress&sort=priority')).toEqual({
      status: 'in-progress',
      sort: 'priority',
    })
  })

  it('falls back to the default for unknown values', () => {
    expect(parseSearch('?status=blocked&sort=title')).toEqual(DEFAULT_TASK_LIST_FILTERS)
  })

  it('keeps a valid field when the other one is unknown', () => {
    expect(parseSearch('?status=done&sort=random')).toEqual({ status: 'done', sort: 'createdAt' })
  })
})

describe('toTaskListSearch', () => {
  it('returns an empty string for the defaults', () => {
    expect(toTaskListSearch(DEFAULT_TASK_LIST_FILTERS)).toBe('')
  })

  it('writes only the values that differ from the defaults', () => {
    expect(toTaskListSearch({ status: 'todo', sort: 'createdAt' })).toBe('?status=todo')
    expect(toTaskListSearch({ status: null, sort: 'priority' })).toBe('?sort=priority')
  })

  it('round-trips through the parser', () => {
    const filters = { status: 'done', sort: 'priority' } as const

    expect(parseSearch(toTaskListSearch(filters))).toEqual(filters)
  })
})

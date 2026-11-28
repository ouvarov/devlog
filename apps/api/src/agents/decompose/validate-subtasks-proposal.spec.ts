import { describe, expect, it } from 'vitest'

import { TASK_TITLE_MAX_LENGTH } from '@devlog/shared'

import {
  type ProposalContext,
  type SubtasksProposalInput,
  validateSubtasksProposal,
} from './validate-subtasks-proposal.js'

const CONTEXT: ProposalContext = {
  taskPriority: 'high',
  existingSubtaskTitles: ['Profile the slow pages'],
  mode: 'may-ask',
}

const proposalWith = (titles: string[], assumptions: string[] = []): SubtasksProposalInput => ({
  items: titles.map((title) => ({ title })),
  assumptions,
})

describe('validateSubtasksProposal', () => {
  it('accepts 3 unique items and fills priority from the task and status todo', () => {
    const result = validateSubtasksProposal(
      proposalWith(['Add an index', 'Cache the list', 'Measure again']),
      CONTEXT,
    )

    expect(result).toEqual({
      accepted: true,
      value: {
        items: [
          { title: 'Add an index', priority: 'high', status: 'todo' },
          { title: 'Cache the list', priority: 'high', status: 'todo' },
          { title: 'Measure again', priority: 'high', status: 'todo' },
        ],
        assumptions: [],
      },
    })
  })

  it('keeps a status and priority the model set', () => {
    const result = validateSubtasksProposal(
      {
        items: [
          { title: 'Add an index', priority: 'low', status: 'in-progress' },
          { title: 'Cache the list' },
          { title: 'Measure again' },
        ],
        assumptions: [],
      },
      CONTEXT,
    )

    expect(result.accepted && result.value.items[0]).toMatchObject({
      priority: 'low',
      status: 'in-progress',
    })
  })

  it('rejects titles that differ only in case and spaces', () => {
    const result = validateSubtasksProposal(
      proposalWith(['Add an index', '  add  AN index ', 'Measure again']),
      CONTEXT,
    )

    expect(result).toEqual({
      accepted: false,
      errors: ['Title "add  AN index" is used more than once'],
    })
  })

  it('rejects a title equal to an existing subtask', () => {
    const result = validateSubtasksProposal(
      proposalWith(['profile the SLOW pages', 'Cache the list', 'Measure again']),
      CONTEXT,
    )

    expect(result).toEqual({
      accepted: false,
      errors: ['Title "profile the SLOW pages" is already a subtask of this task'],
    })
  })

  it('rejects fewer than 3 items and a title over the task limit', () => {
    const result = validateSubtasksProposal(
      proposalWith(['x'.repeat(TASK_TITLE_MAX_LENGTH + 1), 'Cache the list']),
      CONTEXT,
    )

    expect(result.accepted).toBe(false)
    expect(result.accepted ? [] : result.errors).toEqual([
      expect.stringMatching(/^items\.0\.title: /),
      expect.stringMatching(/^items: /),
    ])
  })

  it('needs an assumption when the user asked for no questions', () => {
    const titles = ['Add an index', 'Cache the list', 'Measure again']

    const withoutAssumption = validateSubtasksProposal(proposalWith(titles), {
      ...CONTEXT,
      mode: 'skip-questions',
    })
    const withAssumption = validateSubtasksProposal(
      proposalWith(titles, ['Postgres is the bottleneck']),
      {
        ...CONTEXT,
        mode: 'skip-questions',
      },
    )

    expect(withoutAssumption).toEqual({
      accepted: false,
      errors: ['The user asked for no questions: list at least one assumption you made'],
    })
    expect(withAssumption.accepted).toBe(true)
  })
})

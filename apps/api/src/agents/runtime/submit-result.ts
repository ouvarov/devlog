type AcceptedSubmit<T> = { accepted: true; value: T }
type RejectedSubmit = { accepted: false; errors: string[] }
type SubmitResult<T> = AcceptedSubmit<T> | RejectedSubmit

const isAcceptedSubmit = (output: unknown): output is AcceptedSubmit<unknown> =>
  typeof output === 'object' && output !== null && 'accepted' in output && output.accepted === true

export { isAcceptedSubmit }
export type { AcceptedSubmit, RejectedSubmit, SubmitResult }

const pickOption = <T extends string>(options: readonly T[], value: unknown): T | undefined =>
  options.find((option) => option === value)

export { pickOption }

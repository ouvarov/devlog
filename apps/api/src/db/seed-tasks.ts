import type { TaskPriority, TaskStatus } from '@devlog/shared'

type SeedSubtask = {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  createdDaysAgo: number
  completedDaysAgo?: number
}

type SeedTask = SeedSubtask & {
  subtasks?: SeedSubtask[]
}

const SEED_TASKS: SeedTask[] = [
  {
    title: 'Set up CI pipeline for the monorepo',
    description: 'Run lint, typecheck and tests for every workspace on each pull request.',
    status: 'in-progress',
    priority: 'high',
    createdDaysAgo: 6,
  },
  {
    title: 'Fix flaky login e2e test',
    description:
      'The login spec fails about once in five runs on CI with a timeout on the redirect.',
    status: 'todo',
    priority: 'high',
    createdDaysAgo: 2,
  },
  {
    title: 'Improve performance',
    status: 'todo',
    priority: 'medium',
    createdDaysAgo: 9,
  },
  {
    title: 'Make onboarding better',
    description: 'People say it is confusing.',
    status: 'todo',
    priority: 'low',
    createdDaysAgo: 4,
  },
  {
    title: 'Add rate limiting to the public API',
    description: 'Limit anonymous clients per IP; return 429 with a Retry-After header.',
    status: 'todo',
    priority: 'medium',
    createdDaysAgo: 15,
  },
  {
    title: 'Write API docs for the tasks endpoints',
    description: 'Request and response examples for every route.',
    status: 'done',
    priority: 'low',
    createdDaysAgo: 20,
    completedDaysAgo: 3,
  },
  {
    title: 'Migrate user avatars to object storage',
    description: 'Avatars live on the app server disk; move them to a bucket behind the CDN.',
    status: 'in-progress',
    priority: 'medium',
    createdDaysAgo: 12,
    subtasks: [
      {
        title: 'Copy existing avatars to the bucket',
        status: 'done',
        priority: 'medium',
        createdDaysAgo: 11,
        completedDaysAgo: 1,
      },
      {
        title: 'Switch the upload endpoint to signed URLs',
        status: 'todo',
        priority: 'medium',
        createdDaysAgo: 11,
      },
    ],
  },
  {
    title: 'Dark mode toggle in settings',
    description: 'Let users switch between the light and dark theme.',
    status: 'todo',
    priority: 'low',
    createdDaysAgo: 0,
  },
  {
    title: 'Add a dark theme to the settings page',
    status: 'todo',
    priority: 'low',
    createdDaysAgo: 1,
  },
  {
    title: 'Upgrade Node to 24 on staging',
    status: 'done',
    priority: 'medium',
    createdDaysAgo: 8,
    completedDaysAgo: 5,
  },
  {
    title: 'Оновити README з інструкцією запуску',
    description: 'Описати змінні середовища і як отримати безкоштовний ключ Gemini.',
    status: 'todo',
    priority: 'medium',
    createdDaysAgo: 3,
  },
  {
    title: 'Розібратися з повільними запитами в дашборді',
    status: 'in-progress',
    priority: 'high',
    createdDaysAgo: 7,
  },
]

export { SEED_TASKS }
export type { SeedSubtask, SeedTask }

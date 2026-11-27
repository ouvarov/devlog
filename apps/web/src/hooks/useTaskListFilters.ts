import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { TaskListFilters } from '@/types/taskListFilters'
import { parseTaskListFilters, toTaskListSearch } from '@/utils/taskListFilters'

const useTaskListFilters = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters = parseTaskListFilters(searchParams)

  const setFilters = (nextFilters: TaskListFilters) =>
    router.push(`${pathname}${toTaskListSearch(nextFilters)}`, { scroll: false })

  return { filters, setFilters }
}

export { useTaskListFilters }

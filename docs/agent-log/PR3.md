# PR3 — add tasks ui

Сирий матеріал для `AGENT_LOG.md`.

## Хто що робив

PR: https://github.com/ouvarov/devlog/pull/3

| Роль | Агент | Що зробив |
|---|---|---|
| Тех-лід | основна сесія у ролі тех-ліда за процесом `harness-build` | Задача і 11 критеріїв у `task.md`, перевірка, рішення по зауваженнях, цей лог |
| Розробник | `frontend-developer` (Opus) | UI, тести, перевірка критеріїв у headless Chrome, 12 комітів |
| Рев'ювер | `frontend-pr-reviewer` | Два раунди рев'ю з чистого контексту |

Олександр: «змержив, давай PR2», потім після merge PR2: «дон делай».

Перший коміт гілки `d35b341` виправляє лог PR2 (знахідка ORC-5 з другого раунду рев'ю PR2).

## Перший вивід агента збережено

За результатами adversarial review плану перший скаффолд UI має лишитися в історії до ручних правок. Тому розробник отримав правило: перший коміт — UI таким, як агент його написав, ще до lint, typecheck і запуску. Кожне виправлення окремим комітом.

- Перший вивід: `73fa40d add tasks ui, first draft before any check`.
- Після нього 5 фіксів розробника і 6 фіксів після рев'ю, кожен окремим комітом.

## Промпти тех-ліда розробнику (дослівно, локальні шляхи скорочено)

Задача:

```
Task: PR3 of DevLog, "add tasks ui".

Repo: ...\devlog (ouvarov/devlog), branch `tasks-ui` is checked out, based on main with PR2 merged. Commit locally, do not push.

Read first:
1. ...\tasks-ui\task.md — scope and acceptance criteria. This is the contract.
2. ...\holywater-devlog\DESIGN.md — sections "API" (including the "As built in PR2" note: never assume `issues` is present), "Frontend", "Decisions by Oleksandr" and "Changes after adversarial review". The last two override "Frontend": no Next proxy (browser calls `NEXT_PUBLIC_API_URL`, CORS is already on), UI in English.
3. The existing code: apps/web (ApiStatus, useApiHealth, config/api.ts, tokens), packages/shared/src (task.ts, api-error.ts — use these schemas and types, do not redefine them), apps/api/src/tasks (controller and e2e spec show the real responses), eslint and prettier config.
4. apps/web/AGENTS.md: this is Next 16. Read the relevant guides in node_modules/next/dist/docs/ before writing pages (search params, client components, Suspense). Trust installed packages over memory; check the installed version of anything you add.

Load the skills `code-style-frontend` and `react-solid-review`; follow the first and avoid what the second would flag.

Evidence of the AI process (the task asks for it): make your first commit the UI as you first wrote it, before you run lint, typecheck or the app, even if it is broken. Every fix after that goes in its own commit. Say the sha of that first commit in your report.

Notes:
- Run the API and web yourself to check the criteria (npm run dev from the repo root, or the two workspaces). PGlite data is in apps/api/.data; `npm run db:reset` restores the 14 seed tasks. Stop every dev server before you finish.
- Criterion 9: start the API with PORT=4001 and web with NEXT_PUBLIC_API_URL=http://localhost:4001 once, and confirm the browser calls 4001.
- The laptop has little RAM (under 3 GB free): one heavy command at a time, no servers left running.
- Commits: short, lowercase, verb first, no prefix, no Co-Authored-By or any Claude attribution.
- Do not touch docs/agent-log (the tech lead writes it).

In your report: commits, checks run and their result, how you checked each acceptance criterion (by hand or by test), and every place where your first attempt was wrong (API that did not exist, Next 16 difference, failing check, wrong assumption) and what fixed it. These go into the project's AGENT_LOG, so be specific and honest.
```

Фікси після рев'ю:

```
PR3 review came back REQUEST CHANGES: one MAJOR and five MINORs. Please fix them, one commit each, and do not push.

1. MAJOR: `invalidateQueries({ queryKey: ['tasks'] })` only refetches active queries. After a delete on /tasks/[id], `router.push` lands on a list that still shows the deleted parent and its subtasks from the cache until a background refetch. After "Add subtask", going back shows the old counter. Fix: pass `refetchType: 'all'` in useCreateTask, useUpdateTask and useDeleteTask. Keep `removeQueries` before the invalidation in delete. Check it in the browser: delete a parent from its page, and the list must not show it, not even for one frame.
2. EditTaskButton: `initialValues` is rebuilt from props on every render, while the inputs are uncontrolled. A refetch while the dialog is open then makes untouched fields count as changed. Snapshot the values when the dialog opens. Also compare the trimmed title and description, so a whitespace-only change sends no PATCH. If nothing changed, close the dialog without a request.
3. Tests that would stay green if the code broke. Add cases for:
   - the `status` param in `toListQuery` (api/tasks.ts);
   - both directions of `needsDoneConfirmation`;
   - the request URL being built from `API_URL`;
   - the `too_big` message;
   - the `issues: []` fallback in `getSubmitErrors`;
   - one small test with a real `QueryClient` showing that an inactive `['tasks', filters]` query is refetched after a mutation.
4. TaskStatusControl: `disabled={isPending}` drops focus to `<body>`. Keep the select focusable, for example with `aria-busy`, and ignore changes while pending.
5. Hide "Add subtask" on a parent with status `done`. The API rejects it anyway.
6. Clear `mutation.error` in TaskStatusControl and DeleteTaskButton when the user acts again, for example by calling `reset()` before `mutate` or when the confirm dialog opens.

Do not touch docs/agent-log. Run lint, typecheck, `npm test` and `format:check` afterwards. Stop every dev server before you finish. No attribution. In your report, list the commits, the checks and anything that went wrong on the first try.
```

## Де агент помилився з першої спроби

Lint і typecheck пройшли з першого запуску. Усі помилки нижче знайшли Prettier, браузер або рев'ю.

| Що сталося | Як помітили | Що виправили |
|---|---|---|
| 5 файлів не відформатовані Prettier: порядок імпортів з `type` і перенос рядків | `npm run format:check` | `cf7a1bc` |
| `<label>` фільтра обгортав `<select>`, тому доступне ім'я поля було «Status All …» замість «Status». Скрінрідер отримав би те саме | Браузерний скрипт агента: `getByLabel('Status')` не знайшов поле | `76428b7`: label поруч, через `htmlFor` |
| `retry: 1` для всіх запитів повторював і відповіді 4xx: `/tasks/999999` давав дві відповіді 404 | Мережевий лог у браузерному скрипті | `1fec91c`: повтор лише при мережевій помилці і 5xx |
| `autoFocus` на кнопці підтвердження і полі назви не працював: `showModal()` у native `<dialog>` переводить фокус на перший елемент після монтування | Скріншот діалогу, потім `document.activeElement` | `d5d52e6`: проп прибрано. Фокус на Title у формі і на Cancel у підтвердженні, що безпечніше для видалення |
| Розгорнуті підзадачі стояли на 4px лівіше назви батька й не виглядали вкладеними | Скріншот | `6f5d5e6` |
| Після видалення батька зі сторінки задачі список показував видалену задачу з кешу до фонового оновлення. Після «Add subtask» лічильник у списку був старий. `invalidateQueries` за замовчуванням оновлює лише активні запити, а списку на сторінці задачі немає | Рев'ю, раунд 1 (MAJOR). Тех-лід перевірив у коді хуків | `089d4a4`: спільний `invalidateTasks` з `refetchType: 'all'` і тест зі справжнім `QueryClient` |
| Форма редагування порівнювала значення з props, які оновлюються під час refetch. Тоді незмінені поля могли піти в PATCH зі старими значеннями. Зміна з самих пробілів давала зайвий запит | Рев'ю, раунд 1 | `c39ba77`: знімок значень при відкритті, порівняння після trim, без запиту, якщо нічого не змінилось |
| 5 рядків коду можна було зламати, і тести лишились би зеленими (параметр `status` у URL, `needsDoneConfirmation`, `API_URL`, повідомлення `too_big`, `issues: []`) | Рев'ю, раунд 1 | `f6b9dd3`: агент зламав усі 5 рядків, кожен новий тест упав рівно один раз, потім повернув |
| `disabled` на select статусу під час збереження скидав фокус на `<body>` | Рев'ю, раунд 1 | `0cee7b0`: `aria-busy` |
| «Add subtask» показувався на задачі в статусі done, хоча API таке відхиляє | Рев'ю, раунд 1 | `6ee8ce8` |
| Помилка зміни статусу або видалення лишалась на екрані після нової спроби | Рев'ю, раунд 1 | `fd6b05b`: `reset()` перед новою дією |

Помилки в браузерному скрипті самого агента, не в продукті:
- Next має власний `role="alert"` (route announcer), і скрипт брав його за повідомлення про помилку.
- Лічильник рахував запити замість відповідей. У dev React StrictMode монтує двічі, і перший запит скасовується.
- Подію `visibilitychange` скрипт надсилав на `document`, а TanStack Query v5 слухає `window`.
- `selectOption` у Playwright не ставить фокус на елемент.

Агент також перевірив, що браузерна перевірка ловить головну помилку. Він тимчасово прибрав `refetchType: 'all'`, і обидві перевірки впали з тим самим симптомом, що описало рев'ю.

## Що знайшло рев'ю

| Рев'ю | Head | Вердикт | Знахідка | Що зробили |
|---|---|---|---|---|
| `frontend-pr-reviewer` | 6f5d5e6 | REQUEST CHANGES, 1 MAJOR, 5 MINOR | Застарілий список після видалення і додавання підзадачі | Виправлено |
| | | | Форма редагування порівнює з props, що змінюються | Виправлено |
| | | | Тести, які не впадуть | Додано |
| | | | Фокус після зміни статусу | Виправлено |
| | | | «Add subtask» на done | Сховано |
| | | | Помилки не очищаються | Виправлено |
| `frontend-pr-reviewer` | fd6b05b | APPROVE, 3 MINOR | Після видалення батька закешовані деталі підзадач перезапитуються і дають 404 | Прийнято: користувач цього не бачить, зайвий запит на кожну закешовану задачу |
| | | | Поки триває оновлення, другий вибір статусу ігнорується | Прийнято: так і задумано |
| | | | Тест перевіряє лише `invalidateTasks`, а не самі хуки | Прийнято: хук на один рядок, головну помилку ловить браузерна перевірка |

## Перевірка тех-лідом

- Після кожного раунду локально прогнав `lint`, `typecheck` і `test`: спершу 3 + 58 + 24 тести, потім 3 + 58 + 34. Усе зелене.
- Прочитав `client.ts`, `taskForm.ts`, `taskListFilters.ts` і `invalidateTasks.ts`.
- MAJOR з першого раунду перевірив у коді хуків, перш ніж віддати розробнику.

## Не перевірено

- `next build` і браузери, крім Chrome. Скрінрідер не запускали.
- 400 з `issues` наскрізь: клієнтська валідація блокує все, що сервер відхилив би з `issues`. Тому це перевірено на підставленій відповіді і юніт-тестах.

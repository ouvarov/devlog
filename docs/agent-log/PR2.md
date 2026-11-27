# PR2 — add tasks api with batch endpoint

Сирий матеріал для `AGENT_LOG.md`.

## Перед PR2: тех-лід неточно записав лог PR0 і PR1

Олександр попросив тех-ліда самому звірити `PR0-research.md` і `PR1.md` з тим, що він писав у чаті.

| Що сталося | Що виправили |
|---|---|
| Тех-лід записав у «що не делегував» формулу fallback агента A, хоча її запропонував архітектор, а Олександр лише затвердив | Розділено: «поставив сам», «вирішив сам», «затвердив пропозицію агента» |
| У логу не було внеску Олександра в постановку: стек з причинами, запуск сабагентів, ідея з BMAD, правило «агент завжди питає, куди ставити задачу» | Додано |
| Промпт тех-ліда, позначений «дослівно», був обрізаний трикрапками | Промпти наведено повністю, скорочено лише локальні шляхи, з позначкою |
| Написано «використав скіл `harness-build`», а насправді тех-лід працював за його процесом без виклику скіла | Переформульовано |
| Застарілі факти: «4 коміти» замість 6; не записано, що тех-лід зупинився при 0.85 ГБ RAM; не було раундів рев'ю | Виправлено, додано таблицю рев'ю |

Виправлення окремим комітом `81375c7` у PR1, історію не переписували. Промпти Олександра не змінювались, вони були дослівними з самого початку.

## Хто що робив

PR: https://github.com/ouvarov/devlog/pull/2

| Роль | Агент | Що зробив |
|---|---|---|
| Тех-лід | основна сесія у ролі тех-ліда за процесом `harness-build` | Задача і 9 критеріїв у `task.md`, перевірка, рішення по зауваженнях |
| Розробник | `backend-developer` (Opus) | Схеми, 6 ендпоінтів, фільтр помилок, e2e-тести, 7 комітів |
| Рев'ювер | `nest-pr-reviewer` | Рев'ю з чистого контексту |

Олександр: «змержив, давай PR2».

## Промпти тех-ліда розробнику (дослівно, локальні шляхи скорочено)

Задача:

```
Task: PR2 of DevLog, "add tasks api with batch endpoint".

Repo: C:\MyProject\devlog (ouvarov/devlog), branch `tasks-api` is checked out, based on main with PR1 merged. Commit locally, do not push.

Read first:
1. ...\tasks-api\task.md — scope, rules and acceptance criteria. This is the contract.
2. ...\holywater-devlog\DESIGN.md — sections "API" and "Data model". "Decisions by Oleksandr" and "Changes after adversarial review" override earlier text.
3. The existing code from PR1: apps/api/src (DbModule, schema, env, health), packages/shared/src, eslint and prettier config. Follow its patterns.
4. ...\holywater-devlog\research\tech-research.md where you need versions. Trust it and the installed packages over your memory (NestJS 12 ESM, drizzle-orm 0.45.x, zod 4, Vitest).

Load the skills `code-style-backend` and `nest-architecture-review`, and follow the first and avoid what the second would flag. Also load `nest-data-perf-review` for the list query, the subtask counts (no N+1) and the batch transaction.

Notes:
- Check the installed Nest 12 for a built-in standard-schema / zod validation pipe before writing your own; use it only if it returns field paths in the 400.
- Criterion 7: PGlite has one connection. Write the parallel-batch test first and see what really happens; if transactions interleave badly, serialize batch in the repository and say how.
- Do not add agent-only repository methods (search, listOpenForAgent); they come with the agents.
- The laptop has little RAM: one heavy command at a time, no dev servers left running.
- Commits: short, lowercase, verb first, no prefix, no Co-Authored-By or any Claude attribution.

In your report list every place where your first attempt was wrong (API that did not exist, failing test, wrong assumption) and what fixed it. They go into the project's AGENT_LOG, so be specific and honest.
```

Фікси після рев'ю:

```
PR2 review came back APPROVE with MINORs. Please fix four, one commit each, no push.

1. ORC-1: the largest batch the schema allows (20 creates × 5000-char descriptions, and Cyrillic is 2 bytes per char) is over Express's default 100kb JSON limit, so it gets 413 before validation. Set the JSON body limit to 256kb with `app.useBodyParser('json', { limit: '256kb' })` in main.ts and in the e2e app setup (one shared place if you can). Add an e2e test: a max-size batch with Cyrillic descriptions succeeds.
2. COR-1: `api-exception.filter.ts` maps every 4xx except 404/409 to `VALIDATION_FAILED`, so 413/415 look like validation errors. Add a `BAD_REQUEST` code to `API_ERROR_CODES` for 4xx that are not our validation failures, keep `VALIDATION_FAILED` only for the validation pipe. Cover it in the filter spec.
3. TST-1: removing `.limit(MAX_LIST_SIZE)` fails no test. Add one (insert 501 top-level rows directly, expect 500).
4. ORC-3: the 500 log line has the stack but no method and URL. Add them.

Do not touch docs/agent-log (I write it). Run lint, typecheck, test after. Same rules: no attribution, no dev servers left running. Report commits, checks and anything wrong on the first try.
```

## Де агент помилився з першої спроби

| Що сталося | Як помітили | Що виправили |
|---|---|---|
| Агент припустив, що zod кладе невідоме поле в `issue.path`. Насправді `{ code: 'unrecognized_keys', keys: ['extra'], path: [] }`, і помилка 400 не називала поле, тобто критерій 3 не виконувався | Агент перевірив швидким запуском | Exception factory розгортає `keys` у шлях: `['update', 0, 'changes', 'extra']` |
| Pipe імпортував типи з `@standard-schema/spec`, якого немає в залежностях api | Агент | Тип виведено з опцій вбудованого pipe Nest |
| Репозиторій з імпортами `@/db/...`, а в api alias не налаштований | Агент | Відносні імпорти, як у коді PR1 |
| Typecheck упав на невикористаному імпорті | `tsc` | Прибрано |
| `PATCH { parentId }` повертав зайву помилку «At least one field must be changed»: zod 4 запускає `.refine` навіть після помилки невідомого поля | Тест | `when: (payload) => payload.issues.length === 0` в обох refine |
| Порівняння статусу з enum ламало правило lint `no-unsafe-enum-comparison` | ESLint | Параметр типізовано як `HttpStatus` |
| Команда sed, яка мала зробити `tx` обов'язковим, перейменувала ще й змінну в іншому методі | Агент побачив у виводі grep до запуску | Виправлено руками |
| Тип e2e-застосунку `NestExpressApplication<App>` з типом supertest не підходив | `tsc` | Тип за замовчуванням |

Агент також навмисно ламав код, щоб переконатися, що тести справжні: прибирав транзакцію (тест відкату падає), звертався до бази повз транзакцію (запит зависає до таймауту) і знімав фільтр верхнього рівня (падають 5 тестів). Усе повернув.

Виявилось, що ризик з PGlite протилежний очікуваному. Паралельні batch PGlite і так виконує по черзі, а от запит до бази повз відкриту транзакцію чекає вічно. Тому методи репозиторію всередині транзакції обов'язково отримують `tx`, інакше код не компілюється.

## Що знайшло рев'ю

| Рев'ю | Head | Вердикт | Знахідка | Що зробили |
|---|---|---|---|---|
| `nest-pr-reviewer` | 93f8cd6 | APPROVE, 7 MINOR | Найбільший batch, який дозволяє схема (20 задач по 5000 символів, кирилиця 2 байти на символ), більший за ліміт Express 100 КБ: 413 ще до валідації. Агенти писатимуть мовою користувача | Ліміт 256 КБ в одному місці для main і e2e, тест з кирилицею |
| | | | Усі 4xx, крім 404/409, мали код `VALIDATION_FAILED` | Новий код `BAD_REQUEST`; `VALIDATION_FAILED` лише від валідації |
| | | | Якщо прибрати ліміт списку 500, жоден тест не впаде | Тест на 501 рядок |
| | | | У лозі помилки 500 немає методу і URL | Додано |
| | | | Лог PR2 описує тільки виправлення попередніх логів | Цей розділ |
| | | | `TasksService` кидає HTTP-винятки, а tools агентів викликатимуть його напряму | Відкладено до PR4 |
| | | | Batch виконує спочатку створення, потім оновлення | Відкладено до PR4: задокументувати в дизайні агентів |

Розробник додав одне рішення від себе: окремий pipe для `:id`, щоб нечислове значення (`abc`) давало `VALIDATION_FAILED` зі шляхом `id`. Тех-лід прийняв.

Виправлення в PR3: тут спочатку було написано, що й число поза діапазоном отримує шлях `id`. Рев'ю другого раунду (ORC-5) помітило, що це не так: таке число проходить pipe, і помилку дає Postgres (22003), тобто `VALIDATION_FAILED` без `issues`. Виправили текст, а не код, бо для UI різниці немає.

## Перевірка тех-лідом

- Після кожного раунду локально прогнав `lint`, `typecheck` і `test` (53, потім 58 тестів), усе зелене.
- Прочитав `tasks.service.ts` проти правил з `task.md` і фільтр помилок після фіксів.

# PR1 — scaffold monorepo with shared, api and web

Сирий матеріал для `AGENT_LOG.md`.

## Хто що робив

| Роль | Агент | Що зробив |
|---|---|---|
| Тех-лід | основна сесія, `harness-build` | Задача і критерії в `task.md`, перевірка результату, рішення по відкритих питаннях |
| Розробник | `backend-developer` (Opus) | Код, тести, ручні перевірки, 4 коміти |

Олександр дав команду: «так давай, починай». Далі на «закрив, перевір пам'ять і запускай» тех-лід перевірив вільну RAM (3.7 ГБ) і запустив розробника.

## Промпт тех-ліда розробнику (дослівно)

```
Task: PR1 of DevLog, "scaffold monorepo with shared, api and web".

Repo: C:\MyProject\devlog (ouvarov/devlog), branch `scaffold-monorepo` is checked out. Commit locally, do not push.

Read first:
1. ...\scaffold-monorepo\task.md — scope and acceptance criteria for this PR. This is the contract.
2. ...\holywater-devlog\DESIGN.md — the whole design. The sections "Decisions by Oleksandr" and "Changes after adversarial review" override earlier sections (PGlite only, no DATABASE_URL switch; no Next rewrites, the browser calls the API at NEXT_PUBLIC_API_URL with CORS; the API starts without an LLM key; Prettier config).
3. ...\holywater-devlog\research\tech-research.md — verified versions and setup sketches (sections 3, 4, 5). Trust its versions over your memory: NestJS 12 is ESM-only, drizzle-orm 0.45.x + drizzle-kit 0.31.x (not the 1.0 RC the Drizzle docs now show), Vitest + unplugin-swc rather than Jest, Next 16, zod 4.

Load the skills `code-style-backend` and `code-style-frontend` and follow them (this is an ouvarov/* repo). For the Nest layout also load `nest-architecture-review` and avoid what it would flag.

Notes:
- The laptop has little RAM. Run one heavy command at a time, do not leave dev servers running when you finish, and no parallel installs.
- Check acceptance criterion 1 for real: start `npm run dev`, hit `/health`, check the web page, then stop it. Criterion 3: do the 5 restarts. Criterion 2: if you cannot switch Node versions, unit-test the version check function and say so.
- If something in the design does not work with the real packages (for example a Drizzle type, a Nest 12 API, PGlite close), pick the smallest fix and report it as a deviation.
- Commits: short, lowercase, verb first, no prefix, no Co-Authored-By or any Claude attribution.

In your report, besides the usual, list every place where your first attempt was wrong (wrong API version, failing command, config that did not work) and what fixed it. Those go into the project's AGENT_LOG, so be specific and honest.
```

Повторний промпт з однією правкою:

```
One fix for PR1 before the draft PR: move ESLint to 10.
- ESLint: the "ESLint 9" in task.md was my spec, not the task's. Move `eslint` and `@eslint/js` to the latest 10.x (check the registry). typescript-eslint 8.74.0 and eslint-plugin-react-hooks 7.1.1 both accept ^10, I checked. ...
- Keep `apps/web/AGENTS.md`.
- Criterion 2 by unit test is accepted. Do not try to get another Node binary.
```

## Де агент помилився з першої спроби

| Що сталося | Як помітили | Що виправили |
|---|---|---|
| API падав на першому `npm run dev`: `ENOENT ... mkdir '...\apps\api\.data\pglite'` (PGlite не створює батьківську папку) | Сам агент під час реального запуску | `mkdir(..., { recursive: true })` перед `PGlite.create` |
| Плагін сортування імпортів переніс `import 'reflect-metadata'` нижче імпортів Nest | Агент на `format` | Імпорт прибрано: `@nestjs/common` підтягує його сам, тести це підтвердили |
| `prettier --check` падав на вже наявних `README.md` і `PR0-research.md` | Агент на перевірці | `*.md` у `.prettierignore`, щоб не переформатовувати текст Олександра |
| Дві версії пакетів записані з пам'яті неправильно (`@types/node`, `@types/react-dom`) | Агент звірився з npm перед установкою | Виправлено на реальні версії |
| Застарілий хелпер `tseslint.config(...)` | Агент до першого запуску | `defineConfig` з `eslint/config` |
| Найновіший TypeScript 7 несумісний з typescript-eslint (`<6.1.0`) | Агент на установці | TS зафіксовано на 6.0.3 |
| ESLint 9 уже не підтримується, npm попереджає при кожній установці. Версію 9 у задачу вписав сам тех-лід | Агент повідомив, рішення ухвалив тех-лід | Перехід на ESLint 10.15.0 окремим комітом |
| Перший тест 5 перезапусків рахував рядки між циклами, і чисте закриття могло приховати пошкодження даних після жорсткого kill | Агент сам | Додано варіант з 5 kill поспіль і одним підрахунком у кінці |
| Перевірки lint запускались не з тієї папки (`npx --prefix` з домашньої), двічі | Агент побачив помилку ESLint | Запуск через `npm --prefix ... run lint` |

## Що не вдалося і чому

- Агентові не дали права доступу завантажити Node 20 через `npx -p node@20`. Тех-лід це не обходив. Відмову на старій версії Node покрито unit-тестами, а реальний запуск на Node 20 і 22.12 лишився неперевіреним.

## Перевірка тех-лідом

Звіту розробника тех-лід на слово не вірив і перевірив сам:
- локально прогнав `lint`, `typecheck` і `test`, усе зелене;
- прочитав `db.module.ts`, `env.schema.ts`, `.env.example`, `.gitignore` проти критеріїв;
- перед тим як просити перехід на ESLint 10, звірив peer-залежності плагінів через npm.

## Рішення людини

- Репозиторій публічний, назва `ouvarov/devlog`.
- Розробника запускали тільки після того, як Олександр звільнив пам'ять.

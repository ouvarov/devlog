# PR5 — add prioritization panel and agent trace

Сирий матеріал для `AGENT_LOG.md`.

## Хто що робив

PR: https://github.com/ouvarov/devlog/pull/5

| Роль | Агент | Що зробив |
|---|---|---|
| Тех-лід | основна сесія у ролі тех-ліда за процесом `harness-build` | Задача і 11 критеріїв у `task.md`, перевірка, прогін на справжньому Gemini через UI, цей лог |
| Розробник | `frontend-developer` (Opus) | Панель пріоритизації, бейдж провайдера, trace, тести, 12 комітів |
| Рев'ювер | `frontend-pr-reviewer` | Рев'ю з чистого контексту |

Олександр: «змержив, давай PR5».

## Перший вивід агента збережено

- Перший вивід: `7ae3e63 add prioritization panel and agent trace, first draft before checks`.
- Після нього 5 фіксів розробника і 6 фіксів після рев'ю, кожен окремим комітом.

## Промпти тех-ліда розробнику (дослівно, локальні шляхи скорочено)

Задача:

```
Task: PR5 of DevLog, "add prioritization panel and agent trace".

Repo: ...\devlog (ouvarov/devlog), branch `agents-ui` is checked out, based on main with PR4 merged. Commit locally, do not push.

Read first:
1. ...\agents-ui\task.md — scope and acceptance criteria. This is the contract.
2. ...\holywater-devlog\DESIGN.md — sections "API", "Frontend" (with its PR5 note on `skipped` and `meta.steps`), "Decisions by Oleksandr" and "Changes after adversarial review". The last two override "Frontend": no Next proxy, UI in English, 503 banner without a key, running indicator with elapsed time.
3. The existing code: apps/web (api client, query keys, hooks, components and tokens from PR3), packages/shared/src/agent.ts and api-error.ts (use these schemas and types, do not redefine them), apps/api/src/agents and apps/api/src/llm (controller, e2e spec and mock show the real responses). Do not change apps/api.
4. apps/web/AGENTS.md: this is Next 16. Check the guides in node_modules/next/dist/docs/ for anything you are not sure of. Trust installed packages over memory.

Load the skills `code-style-frontend` and `react-solid-review`; follow the first and avoid what the second would flag.

Evidence of the AI process: make your first commit the UI as you first wrote it, before you run lint, typecheck or the app, even if it is broken. Every fix after that goes in its own commit. Say the sha of that first commit in your report.

Notes:
- Run the API with `LLM_PROVIDER=mock` and the web to check the criteria by hand (npm run dev from the repo root, or the two workspaces). `npm run db:reset` restores the 14 seed tasks. For criterion 3 mark tasks done through the API or the UI, then reset. For criterion 2 restart the API with `LLM_PROVIDER=google` and an obviously invalid key (never a real one; there is a real key in .env — do not print it, do not change .env, pass the variables on the command line). Stop every dev server before you finish.
- No real Gemini calls from you: the tech lead runs criterion 11.
- The laptop has little RAM (under 3 GB free): one heavy command at a time, no servers left running.
- Commits: short, lowercase, verb first, no prefix, no Co-Authored-By or any Claude attribution.
- Do not touch docs/agent-log (the tech lead writes it).

In your report: commits, checks run and their result, how you checked each acceptance criterion (by hand or by test), anything the API lacks for the panel, and every place where your first attempt was wrong (API that did not exist, Next 16 or React 19 difference, failing check, wrong assumption) and what fixed it. These go into the project's AGENT_LOG, so be specific and honest.
```

Фікси після рев'ю:

```
PR5 review came back APPROVE with 6 MINORs; please fix these, one commit per item, and do not push. Branch agents-ui (already pushed by the tech lead at e124afe, so commit on top).

1. F1 (usePlanTasks.ts): `#id` also means "not loaded yet". If GET /tasks errors or is still pending, `unlistedIds` is [] and every row shows an unlinked `#id`, permanently if the list errored; ids missing from the list show `#14` until the detail fetch returns. Fix: when the list errored, fetch the plan ids by id; while the list or a detail fetch is pending, render a loading placeholder instead of `#id`. `#id` without link only for a task that is really gone (404). Choose the shape (e.g. a `loading` state in the resolved item) and say why.
2. F2 tests that go red when the line breaks, no new dependency: extract `getUnlistedIds` and `getElapsedSeconds` as pure helpers and test them; export the mutation error handler taking a QueryClient and assert 503 LLM_NOT_CONFIGURED invalidates ['agents'] and 429 does not (see invalidateTasks.spec.ts for a bare QueryClient); add a renderToStaticMarkup case for PrioritizePlanView with the skipped banner and one with the fallback banner. Check by mutation that each new test fails when its line is broken.
3. F3 (usePrioritize.ts, PrioritizePanel.tsx): `onError` awaits the invalidation, so the spinner keeps counting until /agents settles. Use `void queryClient.invalidateQueries(...)`. Hide LoadError's Retry when the agents info says not configured (Retry would resend a request known to fail).
4. F4 accessibility, part: make the running status an always-rendered live region (a wrapper with role="status" that exists before the text goes in); set `aria-controls` only when the trace body is rendered. Leave the disabled Run button as is.
5. F5 (AgentTraceSteps.tsx): no empty `<ul>` for a step without tool calls; add a text-only step to the fixture and a test.
6. F6 SCSS: replace the magic values (2px borders, max-height 200px, 0.8s spin) with tokens or named variables following the existing _tokens.scss pattern; use the font-weight the existing code uses instead of repeated 600; add a prefers-reduced-motion rule for the spinner.

Run lint, typecheck, test and format:check. No dev servers needed unless you change behaviour you want to see; stop any you start. No attribution. In the report: commits, checks, mutation results, and anything that went wrong on the first try.
```

## Рішення тех-ліда до старту

- **Сценарії збою моку.** У запущеному застосунку мок має лише успішний сценарій, сценарії збою є тільки в тестах API. Тому fallback перевіряли вручну з навмисно неправильним ключем Google: модель відповідає помилкою, план рахує формула. Відхилений submit у trace перевіряли тестом на заготовленій відповіді.
- **Тести рендеру.** У web немає testing-library і jsdom. Рендер перевіряли через `renderToStaticMarkup` з `react-dom/server`, без нових залежностей.

## Де агент помилився з першої спроби

| Що сталося | Як помітили | Що виправили |
|---|---|---|
| Фікстура з `as const` дала `readonly []`, і її не можна було передати як `string[]` | typecheck | `676b053` |
| 3 файли не відформатовані | Prettier | `dc2beaa` |
| Сторінку відкрили, коли ключ був, потім API перезапустили без ключа. Кнопка Run лишалась активною, бейдж показував Gemini | Агент сам, у браузері | `86aed37`: після 503 `LLM_NOT_CONFIGURED` інформація про агентів перезавантажується |
| У вузькій колонці кнопка Retry вилазила за рамку: `GOOGLE_GENERATIVE_AI_API_KEY` — одне довге слово без переносу | Агент сам, на скриншоті | `614e1b7` |
| «3–5» було захардкоджене в тексті панелі | Агент сам | `e124afe`: константи зі shared |
| План перевірки критерію 4: зняти `disabled` у DOM і клікнути. React блокує клік за пропсом, а не за атрибутом DOM, тож запит не пішов би | Агент сам, до перевірки | Перевірив реальний шлях: застаріла інформація про агентів (рядок вище) |

Ще кілька помилок агента були в його скрипті перевірки, не в застосунку:
- подію `visibilitychange` відправив на `document`, а TanStack слухає її на `window`;
- підробна відповідь для `/agents` без CORS-заголовка не пройшла.

## Що знайшло рев'ю

| Рев'ю | Head | Вердикт | Знахідка | Що зробили |
|---|---|---|---|---|
| `frontend-pr-reviewer` | e124afe | APPROVE, 6 MINOR | F1: `#id` без посилання показувався і для задачі, що ще вантажиться, а при помилці списку назавжди | `c559f47`: стан «завантаження», `#id` лише після 404 |
| | | | F2: найризикованіші рядки без тестів, які б почервоніли | `59d2503`: тести для вибору id, лічильника секунд, оновлення після 503 і банерів |
| | | | F3: після 503 лічильник ішов, поки не відповість `/agents`; Retry дозволяв повторити запит, що точно впаде | `e2a9e17` |
| | | | F4: доступність. Статус запуску не оголошувався; `aria-controls` вказував на відсутній id | `0989719`. Порада зробити Run не `disabled` під час запиту не прийнята |
| | | | F5: порожній `<ul>` для кроку без викликів tool | `38d6080` |
| | | | F6: магічні числа в SCSS, анімація без `prefers-reduced-motion` | `3459f24` |

Рішення тех-ліда, які рев'ювер перевірив і не оскаржив:
- `GET /tasks` повертає лише задачі верхнього рівня, тому кожну підзадачу з плану панель запитує окремо. Ендпоінт для набору id потребує зміни API, а це не входить у PR5.
- Результат запуску живе в компоненті і зникає після переходу на іншу сторінку. Це знімок, зберігати його не треба.

## Прогін на справжньому Gemini через UI

Модель `gemini-3.5-flash-lite`, free tier, сид-дані, кнопка Run у headless Chromium.

200 за 3.0 с, 3 кроки `list_tasks` → `get_task(7)` → `submit_plan`, план прийнято з першої спроби, 4034 / 252 токенів. У фокусі знову підзадача 14, а не батько 7.

Причини й підсумок знову **українською**, хоча після правки промпту в PR4 другий прогін був англійською, а 12 з 14 назв задач англійські. Перший рядок у `list_tasks` — українська задача 12 (в роботі, high). Тобто правило про мову на flash-lite ненадійне: один і той самий промпт дав англійську й українську. Як із цим бути, вирішує Олександр.

## Перевірка тех-лідом

- Після кожного раунду локально `lint`, `typecheck`, `test`, `format:check`: спершу 3 + 107 + 54, потім web 75. Усе зелене.
- Прочитав хуки `usePrioritize`, `usePlanTasks`, хелпери плану і панель; переглянув скриншоти розробника (мок, fallback).
- Розробник завис після останнього фіксу і не надіслав звіт, тому перевірки після рев'ю і мутацію прогнав тех-лід: інвертований фільтр у `getUnlistedIds` → тест червоний, файл відновлено.

## Не перевірено

- Як панель читає скринрідер (перевірено лише клавіатурою).
- Багато підзадач в одному плані: кожна — окремий `GET /tasks/:id`.

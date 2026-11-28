# PR6 — add decomposition agent with clarify and confirm

Сирий матеріал для `AGENT_LOG.md`.

## Хто що робив

PR: https://github.com/ouvarov/devlog/pull/6

| Роль | Агент | Що зробив |
|---|---|---|
| Тех-лід | основна сесія у ролі тех-ліда за процесом `harness-build` | Задача і 11 критеріїв у `task.md`, план на двох розробників, перевірка, прогони на справжньому Gemini через API і через UI, цей лог |
| Розробник API | `backend-developer` (Opus) | Агент декомпозиції, зміна рантайму, пошук, мок, тести, 9 комітів |
| Розробник web | `frontend-developer` (Opus) | Діалог декомпозиції, тести, 15 комітів |
| Рев'ювер API | `nest-pr-reviewer` | Рев'ю apps/api і packages/shared |
| Рев'ювер web | `frontend-pr-reviewer` | Рев'ю apps/web |

Олександр: «змержив, давай PR6». Тех-лід показав план (один PR, два розробники по черзі через малу пам'ять), Олександр: «все ок».

## Перший вивід агентів збережено

- API: `aa95d1e add decomposition agent with clarify and confirm, first draft before checks`.
- Web: `cc6006f add decompose dialog with clarify and confirm, first draft before checks`.
- Після них кожен фікс окремим комітом: 4 + 7 фіксів розробників, 4 + 7 фіксів після рев'ю.

## Промпти тех-ліда розробникам (дослівно, локальні шляхи скорочено)

Розробник API:

```
Task: PR6 of DevLog, part 1 of 2 (API): "add decomposition agent with clarify and confirm".

Repo: ...\devlog (ouvarov/devlog), branch `decompose-agent` is checked out, based on main with PR5 merged. Commit locally, do not push. Part 2 (web) is done by another developer after you, on the same branch.

Read first:
1. ...\decompose-agent\task.md — "Part 1 — API" and the acceptance criteria (yours: 1, 3–9, 11 on the API side). This is the contract.
2. ...\holywater-devlog\DESIGN.md — "API", "Agents" (B Decompose, DOM-1 note), "Decisions by Oleksandr" and "Changes after adversarial review" (they override earlier text: contract #3, B context #14, status in items #6, no fallback for B).
3. The PR4 code you extend: apps/api/src/agents (runtime, prioritize), apps/api/src/llm (mock), apps/api/src/tasks (TasksReader), packages/shared/src/agent.ts and api-error.ts, and docs/agent-log/PR4.md for what went wrong last time. Follow its patterns. AI SDK is v7 (ai@7): check every name against the installed type definitions, not memory.

Load the skills `code-style-backend` and `nest-architecture-review`; follow the first and avoid what the second would flag. Also load `nest-correctness-review` for the runtime change and `nest-security-review` for the ILIKE search.

Evidence of the AI process: the first commit is the code as you first wrote it, before lint, typecheck or tests, even if it is broken. Every fix after that goes in its own commit. Say the sha of that first commit in your report. The agent instructions (system prompt) are a draft that Oleksandr may edit: keep them in their own file.

Notes:
- The runtime change from one submit tool to several terminal tools must keep every PR4 test green; run them before and after.
- No real Gemini calls: the tech lead runs criterion 10. Tests run on the mock. If you start the API by hand, use LLM_PROVIDER=mock and stop it before you finish; never print or change .env.
- The laptop has little RAM (under 3 GB free): one heavy command at a time, no servers left running.
- Commits: short, lowercase, verb first, no prefix, no Co-Authored-By or any Claude attribution.
- Do not touch apps/web or docs/agent-log.

In your report: commits, checks and their result, how each of your criteria is covered, the design choices (terminal tools in the runtime, how the mock picks a script, the search escaping), anything part 2 must know about the API shape, and every place where your first attempt was wrong and what fixed it. These go into the project's AGENT_LOG, so be specific and honest.
```

Розробник web:

```
Task: PR6 of DevLog, part 2 of 2 (web): "add decomposition agent with clarify and confirm".

Repo: ...\devlog (ouvarov/devlog), branch `decompose-agent` is checked out. Part 1 (API) is committed on it (aa95d1e..caabad0). Commit locally on top, do not push.

Read first:
1. ...\decompose-agent\task.md — "Part 2 — Web", the acceptance criteria (yours: 1–4 in the browser, 11) and the decisions at the end. This is the contract.
2. The API as built in part 1: packages/shared/src/decompose.ts (use DecomposeRequestSchema / DecomposeResponseSchema and the exported limits, do not redefine them), apps/api/src/agents/decompose, apps/api/src/agents/decompose/decompose.e2e.spec.ts for real responses. API facts from the part 1 developer:
   - Never send `skipClarification` together with `clarification`, not even as false: leave the key out. Send the questions back exactly as received, one trimmed non-empty answer each (≤ CLARIFY_ANSWER_MAX_LENGTH).
   - Errors: 400 VALIDATION_FAILED with issues (bad body), 400 BAD_REQUEST without issues (subtask or done task), 404, 422 AGENT_FAILED with `trace` and the reason in `message`, 503 LLM_NOT_CONFIGURED.
   - Create with POST /tasks/batch `{ create: items.map(i => ({ ...i, parentId: taskId })), update: [] }`; the item shape fits CreateTaskSchema.
   - The demo mock (LLM_PROVIDER=mock) answers without clarification with 2 questions, and with answers or skip with a proposal of "Mock part N: <title>" items plus one assumption.
3. DESIGN.md (...\holywater-devlog\DESIGN.md) — "Frontend" (DecomposeDialog), "Decisions by Oleksandr" (every new item shows a status and priority picker before anything is created) and "Changes after adversarial review".
4. The web code from PR3 and PR5: api client (ApiRequestError), Dialog, TaskForm, task page, invalidateTasks, AgentRunning, AgentRunMeta, AgentTrace, useElapsedSeconds, ProviderBadge. Reuse them. docs/agent-log/PR5.md shows what the review found last time (loading vs missing, tests that go red, live region, Retry after 503) — avoid repeating it.
5. apps/web/AGENTS.md: Next 16. Trust installed packages over memory.

Load the skills `code-style-frontend` and `react-solid-review`; follow the first and avoid what the second would flag.

Evidence of the AI process: the first commit is the UI as you first wrote it, before lint, typecheck or the app, even if it is broken. Every fix after that goes in its own commit. Say the sha of that first commit in your report.

Notes:
- Do not change apps/api or packages/shared unless the web cannot work without it; if so, say why in the report and keep it to one separate commit.
- Check by hand with the API on LLM_PROVIDER=mock and the web (npm run dev from the root). For criterion 4 by hand use LLM_PROVIDER=google with an obviously invalid key on the command line (never print or change .env, which holds a real key). `npm run db:reset` restores the seed after you create subtasks. Stop every dev server before you finish.
- Tests without new dependencies: pure helpers (state machine reducer, building the batch from ticked and edited items, error to view mapping) and renderToStaticMarkup for the dialog states; each test should go red if its line breaks — check a few by mutation.
- No real Gemini calls from you; the tech lead runs them through the UI afterwards.
- The laptop has little RAM: one heavy command at a time, no servers left running.
- Commits: short, lowercase, verb first, no prefix, no Co-Authored-By or any Claude attribution.
- Do not touch docs/agent-log.

In your report: commits, checks and their result, how you checked each criterion (by hand or by test), and every place where your first attempt was wrong and what fixed it. These go into the project's AGENT_LOG, so be specific and honest. Finish the report even if a check fails.
```

Фікси після рев'ю API:

```
PR6 API review came back APPROVE with 3 MINORs and a test gap; please fix all four, one commit each, on top of the current head of `decompose-agent` (1dec5f8, pushed; the web part is committed on top of yours — do not touch apps/web). Do not push.

1. COR-1 (run-tool-agent.ts ~50): if one step has two accepted terminal calls (ask_clarification and submit_subtasks in parallel), the result order decides clarify vs proposal. Pick deterministically by the order of `terminalToolNames` (decompose passes submit_subtasks first? decide the priority and say why), and add one line to the decompose instructions: call exactly one of ask_clarification or submit_subtasks, alone in its step. Test with a mock step that makes both calls.
2. ARC-1 (decompose-tools.ts ~72-79): `createDecomposeTools` returns `ToolSet`, so the terminal names can drift from the tools without a type error. Return `{ tools, terminalToolNames }` from one function (names taken from what it adds), or restore a concrete return type so `keyof TOOLS` checks again.
3. TST-1: add an e2e case without a key and with an unknown taskId that expects 503 (pins 503 before 404). Check by moving requireConfiguredLlm after the task lookup that it goes red.
4. TST-2: a decompose test for the timeout failure (422 with the timeout message).

Run lint, typecheck, test and format:check. No servers left running. No attribution. Report: commits, checks, mutation results, anything that went wrong on the first try. Finish the report even if a check fails.
```

Фікси після рев'ю web:

```
PR6 web review came back APPROVE after W1; please fix the items below, one commit each, on top of the current head of `decompose-agent` (API review fixes are committed after your work, up to 1740c31 — do not touch apps/api or packages/shared). Do not push.

1. W1 MAJOR (DecomposeClarify.tsx ~36-39, 52-62, 72-76): an empty answer + Continue gives per-field errors only linked by aria-describedby, no role=alert, and focus stays on Continue, so assistive tech hears nothing. Move focus to the first aria-invalid field and/or add a summary alert like MARKED_ITEMS_MESSAGE in the proposal. Render test.
2. W2 + W3, one mechanism: autoFocus works only because the idle phase has none (PR3 broke because the content mounted before showModal). Replace the per-phase autoFocus with one effect in DecomposeView keyed on state.phase that focuses a tabIndex=-1 phase heading or container (screen readers read it), keeping a specific control focus for done (Close) and error (Try again, or Close when not retryable). It must also fix W3: after a failed batch (`<fieldset disabled={isCreating}>` in DecomposeProposal.tsx ~41) focus drops to body — focus the alert or the first marked item on create-failed. Do not focus anything on the first phase at open (showModal does it). Check by keyboard in the browser that focus lands where you say in every phase.
3. W4 (Dialog.tsx 17-20, DecomposeDialog.tsx 24-27, useDecompose.ts 88-92): Esc during `creating` resets while the batch still writes; reopening and running again can create a second set. Ignore close while phase === 'creating' (Esc and the close path). Test on the pure logic.
4. W5: no test goes red if the hook's abort / `signal.aborted` guard is removed, or if useCreateTasksBatch's onSuccess invalidation is removed. Extract the session logic (start, abort on close, ignore late answer) into a pure or plain-TS unit and test it with a deferred promise; test the batch mutation options' onSuccess invalidates tasks with a bare QueryClient (see invalidateTasks.spec.ts / invalidateAgents.spec.ts). Check both by mutation.
5. W6 (DecomposeProposalItem.module.scss 10-14): `.excluded { opacity: .7 }` drops the muted text below 4.5:1. Mark the excluded state without opacity (e.g. border/background and a text label), keep contrast.
6. W8 (DecomposeDialog.tsx:10): move `getMaxSteps` from utils/prioritizePlan to a neutral util (e.g. utils/agents.ts) and update both imports and its test.
W7 (SCSS duplication) is accepted as is; do not change it.

Run lint, typecheck, test and format:check, and the browser check on LLM_PROVIDER=mock for the focus changes (stop servers, db:reset after). No attribution. Report: commits, checks, mutation results, what went wrong on the first try. Finish the report even if a check fails.
```

## Рішення розробників

- **Кілька завершальних tool.** Рантайм приймає список `terminalToolNames` замість одного submit. Зупинка — на першому прийнятому виклику з цього списку; на останньому кроці модель бачить усі завершальні tool. Пріоритизація передає свій один submit і поводиться як раніше.
- **`ask_clarification` поза набором.** Коли користувач уже відповів або попросив без питань, цього tool немає в наборі взагалі, а не «є, але відхиляється».
- **Мок для двох агентів.** Сценарій обирається за назвами tool, які бачить модель, тож `LLM_PROVIDER=mock` обслуговує обидва агенти.
- **Пошук.** `%`, `_` і `\` екрануються, значення йде параметром через drizzle `ilike`. Порожній список слів дає `[]`, бо `or()` без умов матчить усе.
- **Без fallback.** Будь-що, крім прийнятого завершального виклику, дає 422 `AGENT_FAILED` з trace; клієнт бачить лише категорію причини, сира помилка провайдера йде в лог сервера.
- **Діалог.** Чистий reducer зі станами, `AbortController` на кожну сесію: закриття скасовує запит до агента. Запит на створення не скасовується, бо він уже може записати дані.

## Рішення тех-ліда

- `skipClarification: false` разом з `clarification` → 400. Надійніше, web просто не надсилає цей ключ.
- Пошук повертає і виконані задачі, і саму задачу: модель бачить усе, щоб не створити дубль.
- Коли перший виклик моделі падає, API віддає `trace: []`, а UI пише «агент упав, не записавши жодного кроку». API не міняли.

## Де агенти помилилися з першої спроби

API:

| Що сталося | Як помітили | Що виправили |
|---|---|---|
| Два очікування в тестах валідатора були хибні: помилка називає назву вже після trim, а zod спершу дає помилку елемента, потім розміру масиву | Vitest | `6fe1c8c` |
| 7 файлів не відформатовані | Prettier | `27f3cef` |
| `toResponse` вийшов довгим, з двома гілками `submitted` | Агент сам, на самоперевірці | `e18dbc5` |
| Не було тестів на збирання промпту і на те, що справжній мок обирає сценарій за набором tool | Агент сам | `caabad0` |

Typecheck і lint пройшли з першого чернетку: агент звірив імена AI SDK v7 і drizzle з `.d.ts` до написання коду.

Web:

| Що сталося | Як помітили | Що виправили |
|---|---|---|
| 3 файли не відформатовані | Prettier | `5a75297` |
| Мапа заголовків помилок індексувалась через `as` | Агент сам, за правилом стилю | `4bef939` |
| Під питаннями декомпозиції було «Stopped by: Plan submitted»: підпис із PR5 писали лише під пріоритизацію | Скриншот | `ce0bfd2` |
| Помилка сервера на пункті 3 не мала підказки біля кнопки Create; пункти високі, список прокручується | Скриншоти | `fcc3dc9` |
| Після кожної зміни кроку фокус падав на сторінку | Скриншоти, перевірка клавіатурою | `1ca5d6a`: `autoFocus` (пізніше замінено, див. рев'ю) |
| Тест чекав `checked` перед `autofocus`, а React пише навпаки | Тест упав | у `65d0d06` |
| З неправильним ключем діалог показував помилку без trace і з хибним заголовком: API віддає `trace: []`, а `AgentTrace` нічого не малює для порожнього списку | Браузер | `1dec5f8` |
| Після переходу на один механізм фокусу на відкритті фокус падав на контейнер, а не на перший елемент: `showModal` фокусує перший фокусований елемент, і `tabIndex=-1` теж рахується | Браузер, перевірка клавіатурою | `81a4c81` |

## Що знайшло рев'ю

| Рев'ю | Head | Вердикт | Знахідка | Що зробили |
|---|---|---|---|---|
| `nest-pr-reviewer` (API) | 1dec5f8 | APPROVE, 3 MINOR + прогалина в тестах | COR-1: два прийняті завершальні виклики в одному кроці, порядок вирішує питання чи план | `f4b9191`: перемагає план; рядок у промпті «виклич лише один» |
| | | | ARC-1: назви завершальних tool можуть розійтися з набором без помилки типів | `1a2ea5d` |
| | | | TST-1: ніщо не фіксує 503 раніше за 404 | `7983276` |
| | | | TST-2: немає тесту на таймаут | `1740c31` |
| `frontend-pr-reviewer` (web) | 1dec5f8 | APPROVE після W1 | W1 MAJOR: порожня відповідь — скринрідер нічого не чує | `888b5a4` |
| | | | W2: `autoFocus` працює лише тому, що на першому кроці його немає (у PR3 зламався саме так) | `3d78ac4`: один ефект фокусу на кожну зміну кроку |
| | | | W3: після помилки створення фокус губиться | `3d78ac4` |
| | | | W4: Esc під час створення — результат не видно, можна створити другий набір | `cf9255c` |
| | | | W5: скасування запиту й оновлення списку без тестів | `acb9221` |
| | | | W6: прозорість знижує контраст нижче 4.5:1 | `d5d5de0` |
| | | | W7: дублювання SCSS | Прийнято як є: питання смаку |
| | | | W8: `getMaxSteps` не в тому файлі | `96263f4` |

Чому план перемагає питання (COR-1, розробник API): план уже пройшов перевірку, а користувач однаково підтверджує кожен пункт. Вибір питань викинув би цю роботу і коштував би ще один раунд моделі на ліміті free tier.

## Прогони на справжньому Gemini

Модель `gemini-3.5-flash-lite`, free tier, сид-дані.

Через API (curl):

| Задача | Що повернув Gemini | Час |
|---|---|---|
| #4 «Make onboarding better» | 2 питання, `search_tasks` → `ask_clarification` | 1.7 с |
| #4 з відповідями | 4 підзадачі, 2 припущення | 2.0 с |
| #3 без питань | 4 підзадачі, 2 припущення | 2.5 с |
| #11 (українська) | 3 підзадачі і припущення українською | 2.8 с |

Через UI (headless Chromium): #4 → 2 питання → відповіді → 5 підзадач створено, на сторінці без перезавантаження; #3 «Don't ask questions» → план із припущеннями.

Усі прогони — 2 кроки, відповідь прийнято з першої спроби. Мова відповіді збігається з мовою задачі; з однією задачею правило працює надійно, на відміну від пріоритизації, де мови в списку змішані. Підзадачі беруть пріоритет задачі (#4 low → усі low). Рядок промпту з COR-1 додано вже після цих прогонів, на Gemini не перевірено.

## Перевірка тех-лідом

- Після кожного етапу локально `lint`, `typecheck`, `test`, `format:check`: 3 + 151 + 75 після API, 3 + 151 + 118 після web, 3 + 155 + 134 після фіксів рев'ю. Усе зелене.
- Прочитав `decompose.agent.ts` і промпт; переглянув скриншоти розробника.
- Мутація після фіксів: зламав `isClosable` → тест червоний, файл відновлено.
- Розробники разом перевірили мутаціями 4 + 13 рядків до рев'ю і 5 + 10 після; кожна мутація давала червоний тест або typecheck.

## Не перевірено

- Скринрідер (фокус перевірено лише через `activeElement`).
- Закриття діалогу, поки запит на створення в дорозі (лише код і тести reducer; Esc у цей момент тепер ігнорується).
- Як Gemini реагує на новий рядок промпту з COR-1.

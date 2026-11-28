# PR4 — add llm module, agent runtime and prioritization agent

Сирий матеріал для `AGENT_LOG.md`.

## Хто що робив

PR: https://github.com/ouvarov/devlog/pull/4

| Роль | Агент | Що зробив |
|---|---|---|
| Тех-лід | основна сесія у ролі тех-ліда за процесом `harness-build` | Задача і 10 критеріїв у `task.md`, перевірка, прогони на справжньому Gemini, правка промпту на прохання Олександра, цей лог |
| Розробник | `backend-developer` (Opus) | LLM-модуль, рантайм агента, агент пріоритизації, тести, 9 комітів |
| Рев'ювер | `nest-pr-reviewer` | Рев'ю з чистого контексту, AI SDK звіряв з установленим пакетом |

Олександр: «змержив, давай PR4». Ключ Gemini Олександр створив сам в AI Studio і поклав у `.env`; тех-лід перевірив його одним запитом до моделі, не виводячи значення.

## Перший вивід агента збережено

- Перший вивід: `c0da3bc add llm module, agent runtime and prioritization agent, first draft before checks`.
- Після нього 5 фіксів розробника, 3 фікси після рев'ю і одна правка промпту, кожне окремим комітом.

## Промпти тех-ліда розробнику (дослівно, локальні шляхи скорочено)

Задача:

```
Task: PR4 of DevLog, "add llm module, agent runtime and prioritization agent".

Repo: ...\devlog (ouvarov/devlog), branch `prioritize-agent` is checked out, based on main with PR3 merged. Commit locally, do not push.

Read first:
1. ...\prioritize-agent\task.md — scope, rules and acceptance criteria. This is the contract.
2. ...\holywater-devlog\DESIGN.md — sections "API", "LLM module", "Agents" (A only), "Tests", "Risks". "Decisions by Oleksandr" and "Changes after adversarial review" override earlier text: google + mock only, no Groq; 503 LLM_NOT_CONFIGURED without a key; pre-recorded mock; stoppedBy = submitted | step-limit | error | skipped.
3. ...\holywater-devlog\research\tech-research.md §1–3: AI SDK v7 (ai@7, ESM, Node 22+). Your memory is probably about v4/v5. v7 names: isStepCount (not stepCountIs, not maxSteps), instructions (not system), inputSchema (not parameters), onStepEnd, result.finalStep, MockLanguageModelV4 from ai/test, createGoogle from @ai-sdk/google. generateObject is deprecated. Default stopWhen of generateText is one step. Check every name against the installed type definitions in node_modules after you install, not against memory or the research.
4. The existing code from PR1–PR2: apps/api/src (config/env.schema.ts, tasks module, error filter, validation pipe, e2e setup), packages/shared/src. Follow its patterns.

Load the skills `code-style-backend` and `nest-architecture-review`; follow the first and avoid what the second would flag. Also load `nest-correctness-review` for the async agent loop, timeouts and error mapping.

Evidence of the AI process: the first commit is the code as you first wrote it, before lint, typecheck or tests, even if it is broken. Every fix after that goes in its own commit. Say the sha of that first commit in your report. The agent instructions (system prompt) are a draft that Oleksandr will edit: keep them in their own file and commit your draft as is.

Notes:
- Install with exact versions (the repo pins them), and check the installed versions of ai and @ai-sdk/google against the research.
- No real Gemini calls: there is no key on this machine. The tech lead runs criterion 9 later. Every test runs on the mock.
- ARC-1 and the submit-validates-in-execute design are in task.md; if the installed SDK makes one of them awkward, say so and what you did instead, do not silently change the design.
- The laptop has little RAM (under 3 GB free): one heavy command at a time, no dev servers left running.
- Commits: short, lowercase, verb first, no prefix, no Co-Authored-By or any Claude attribution.
- Do not touch docs/agent-log (the tech lead writes it).

In your report: commits, checks and their result, how each acceptance criterion is covered, the design choices you made (ARC-1 shape, how the stop condition knows a submit was accepted, mock design), and every place where your first attempt was wrong (an SDK API that did not exist or was renamed, a failing test, a wrong assumption) and what fixed it. These go into the project's AGENT_LOG, so be specific and honest.
```

Фікси після рев'ю:

```
PR4 review came back APPROVE with 7 MINORs. Please fix three of them, one commit each, and do not push.

1. COR-1 (classify-llm-error.ts): if the 25 s budget runs out during the retry back-off, `delay()` rejects with a DOMException named `AbortError` instead of `TimeoutError`, so the run is labelled `llm-error`. The runtime passes no outside signal, so treat `AbortError` as a timeout as well. Add a test.
2. COR-2 (run-tool-agent.ts): on the forced last step (`toolChoice: 'required'`), a reply with text or with no tool call makes v7 throw `ToolChoiceViolationError` (ai/dist/index.js around 2092). The run is then reported as `error` + `llm-error`. Map that error to `step-limit` + `invalid-output`, and keep the trace. Add a test that uses a mock last step which answers with text only. Check the error class name and its export in the installed package.
3. TST-1 (to-trace.ts:50): no test covers a submit whose input fails the tool's inputSchema, for example a string `taskId`, which is the most likely real Gemini failure. Add a test where removing `outcome.isError ||` turns it red: the rejected attempt must be in the trace with `isRejectedSubmit: true`, and the run goes on.

Do not touch prioritize.instructions.ts: Oleksandr edits the prompt himself (ORC-1 and ORC-2 go to him). Do not touch docs/agent-log. Run lint, typecheck, test and format:check. No attribution, no servers left running. In your report, list the commits, the checks and anything that went wrong on the first try.
```

## Рішення розробника

- **ARC-1 з рев'ю PR2.** Агенти читають через `TasksReader`, експортований з `TasksModule`, і не мають доступу до жодного методу запису. Тобто правило «агенти лише читають» тримає граф DI. Відсутній id — звичайний результат tool (`{ error: 'Task 42 not found' }`), а не 404.
- **Перевірка в submit.** `submit_plan.execute` перевіряє план схемою і правилами (id існують, не done, без дублів) і повертає `{ accepted: true }` або `{ accepted: false, errors }`. Цикл зупиняється лише на прийнятому плані, а ознаку прийняття дає наш код, не модель.
- **Мок.** Відповіді записані заздалегідь, крок визначається кількістю відповідей асистента в prompt. Останній крок бере id з результату `list_tasks`, тому мок працює на будь-яких даних.

## Де агент помилився з першої спроби

API AI SDK v7 агент звірив з установленими `.d.ts` до написання коду, тому typecheck пройшов з першого разу, а перейменованих чи вигаданих функцій не було. Усі 43 нові тести теж пройшли з першого запуску. Агент вирішив, що це підозріло, і навмисно ламав код:
- `isStepCount(1)` — падає 12 тестів;
- без умови прийнятого submit — 2;
- без `prepareStep` — 1;
- `maxRetries: 0` — 1.

| Що сталося | Як помітили | Що виправили |
|---|---|---|
| Невикористана змінна в rest-omit | ESLint | `bf1dd63` |
| `reject` не з Error у тесті таймауту | ESLint | `502ce9a` |
| Невикористаний параметр body, потрібний лише щоб pipe відхиляв зайві поля | ESLint | `6c344d9`: `argsIgnorePattern: '^_'`. Тех-лід прийняв |
| 12 файлів не відформатовані | Prettier | `e62b38e` |
| id моделі мока задано двічі | Агент сам | `3318068` |
| Таймаут під час паузи перед повтором позначався як `llm-error`, бо SDK кидає `AbortError`, а не `TimeoutError` | Рев'ю | `165f70d` |
| Якщо на останньому кроці модель відповідає текстом, SDK кидає `ToolChoiceViolationError`, і запуск позначався як помилка LLM, а не як ліміт кроків | Рев'ю | `be5f008` |

## Де помилився тех-лід

| Що сталося | Як помітили | Що виправили |
|---|---|---|
| Тех-лід попросив тест на submit з рядковим `taskId` і сказав, що без `outcome.isError \|\|` він почервоніє. Насправді лишився зеленим: для такого виклику SDK кладе в результат рядок помилки, і він і так «не прийнятий» | Розробник перевірив мутацією | Розробник лишив цей тест і додав ще один, з `execute`, що кидає помилку. Цей на мутації червоніє (`16fd200`) |
| Тех-лід пообіцяв не лізти в промпт, бо його редагує Олександр. Олександр відповів: «а сам поправить файл що не можеш» | Олександр | Правку промпту зробив тех-лід, див. нижче |

## Промпт агента: чернетка і правка

Чернетку написав розробник (`c0da3bc`). Рев'ю знайшло дві проблеми, тех-лід виправив обидві на прохання Олександра (`fc113b7`):

```diff
-- When you are ready, call submit_plan exactly once with:
+- When you are ready, call submit_plan with:
```

«Exactly once» суперечило рядку нижче («якщо відхилили, виправ і виклич знову»), а на цьому тримається самовиправлення.

```diff
-Write the reasons and the summary in the language the tasks are written in.
+Write the reasons and the summary in the language most task titles use. If no language clearly dominates, write in English.
```

На змішаному списку правило було двозначним. Перший прогон на Gemini написав усе українською, хоча 12 з 14 сид-задач англійською, найімовірніше тому, що перша задача в списку українська.

## Прогони на справжньому Gemini

Модель `gemini-3.5-flash-lite`, free tier, сид-дані, `POST /agents/prioritize`.

| Прогін | Промпт | Результат |
|---|---|---|
| 1 | чернетка | 200 за 2.9 с, 3 кроки `list_tasks` → `get_task(7)` → `submit_plan`, план прийнято з першої спроби, 4013 / 218 токенів. Причини й підсумок українською |
| 2 | після правки | 200 за 2.8 с, ті самі 3 кроки, план прийнято з першої спроби. Причини й підсумок англійською |

В обох прогонах модель викликала `get_task` для батьківської задачі 7 з відкритою підзадачею і поставила в фокус підзадачу 14, а не батька. Саме цього вимагає правило в промпті.

Фокус у прогоні 2: 12 і 1 (в роботі, high), 14 (відкрита підзадача задачі в роботі), 2 (свіжа high), 5 (medium, що чекає 15 днів).

## Що знайшло рев'ю

| Рев'ю | Head | Вердикт | Знахідка | Що зробили |
|---|---|---|---|---|
| `nest-pr-reviewer` | 3318068 | APPROVE, 7 MINOR | COR-1: таймаут під час паузи → `llm-error` | Виправлено |
| | | | COR-2: текст на останньому кроці → `llm-error` | Виправлено |
| | | | TST-1: немає тесту на submit з неправильними типами | Додано |
| | | | ORC-1: мова для змішаного списку | Правка промпту |
| | | | ORC-2: «exactly once» проти «call again» | Правка промпту |
| | | | COR-3: мок зберігає історію викликів | Прийнято: лише для демо |
| | | | ORC-3: перевірка бачить до 500 відкритих задач | Прийнято: холодний шлях |

Відповіді на відкриті питання розробника (тех-лід, рев'ювер погодився):
- `argsIgnorePattern` залишаємо;
- текст без submit дає `error` + `invalid-output`;
- `parentId` у рядках залишаємо, бо Gemini ним скористався;
- пропущений запуск (`skipped`) має `source: 'fallback'` без причини, тому панель у PR5 перевіряє `skipped` першою. Записано в дизайн.

## Перевірка тех-лідом

- Після кожного раунду локально прогнав `lint`, `typecheck` і `test`: спершу 3 + 101 + 34, потім 3 + 107 + 34. Усе зелене.
- Прочитав `run-tool-agent.ts`, `prioritize.agent.ts` і чернетку промпту.
- Два прогони на справжньому Gemini, описані вище.

## Не перевірено

- Режим `nest start --watch` з агентами.
- Справжній 429 від Gemini: перевірено лише на моку.

# PR7 — add readme skeleton and run notes

Сирий матеріал для `AGENT_LOG.md`.

## Хто що робив

| Роль | Агент | Що зробив |
|---|---|---|
| Тех-лід | основна сесія у ролі тех-ліда за процесом `harness-build` | Задача з 12 розділами README і 6 критеріями, перевірка фактів, випадок (b), цей лог |
| Розробник | `developer` (Opus) | README і коментарі в `.env.example`, 8 комітів |
| Рев'ювер | `generic-pr-reviewer` | Рев'ю з чистого контексту |

Олександр: «дон» (PR6 змержено). Розділ «Рішення і компроміси» і `AGENT_LOG.md` пише Олександр без AI: у README лише заголовок і коментар.

Мова README — українська (рішення тех-ліда: завдання, обов'язковий розділ і логи українською). Команди, шляхи й імена змінних — як у коді.

## Перший вивід агента збережено

- Перший вивід: `7028ed7 add readme skeleton and run notes, first draft before checks`.
- Після нього 7 комітів розробника: 5 виправлень, коментарі в `.env.example` і випадок (b).

## Промпт тех-ліда розробнику (дослівно, локальні шляхи скорочено)

```
Task: PR7 of DevLog, "add readme skeleton and run notes". Docs only.

Repo: ...\devlog (ouvarov/devlog), branch `readme` is checked out, based on main with PR6 merged. Commit locally, do not push.

Read first:
1. ...\readme\task.md — the sections README must have and the acceptance criteria. This is the contract.
2. ...\holywater-devlog\BRIEF.md ("Task in short": what the graders want in README) and DESIGN.md ("Risks", "Decisions by Oleksandr", "Changes after adversarial review", PR7 criterion).
3. The code you describe: root package.json and scripts/, .env.example, apps/api/src (config/env.schema.ts, db module, llm, agents/runtime, agents/prioritize, agents/decompose, tasks/tasks.reader.ts), apps/web/src/config/api.ts, packages/shared/src. Every number in README (step limits, timeouts, limits, formula, ports, defaults) comes from the code, not from the design: where they differ, the code wins, and tell me.
4. docs/agent-log/PR1.md … PR6.md: the real wrong results of the model and the run notes.

README is in Ukrainian; code identifiers, commands, env names and paths stay as they are. Plain, short sentences, no marketing. Facts only: if you cannot confirm something from the code or the logs, leave it out and list it in the report.

The section "Рішення і компроміси" is written by Oleksandr without AI: add only the heading and the comment line from task.md, nothing else. Do not create AGENT_LOG.md.

Evidence of the AI process: the first commit is README as you first wrote it, before you check it against the code. Every correction after that goes in its own commit. Say the sha of that first commit in your report.

Notes:
- Check the commands you document: run `npm run lint`, `npm run format:check`, and start `npm run dev` once only if you need to confirm ports or first-start behaviour (stop it after; never print or change .env, it holds a real key). Low RAM: one heavy command at a time.
- Do not change code. If README needs a code change to be true, say so in the report instead.
- Commits: short, lowercase, verb first, no prefix, no Co-Authored-By or any Claude attribution.
- Do not touch docs/agent-log.

In your report: commits, what you checked and how, every place where the design and the code disagree, every fact you left out because you could not confirm it, and every place where your first draft was wrong and what fixed it. These go into the project's AGENT_LOG, so be specific and honest.
```

Друге повідомлення тех-ліда (про випадок b):

```
Case (b) is real; it was a reviewer note, not written into the PR logs. Source: the tech lead's saved response of Gemini run 2 in PR4 (after the prompt fix), `POST /agents/prioritize` on the seed data. Focus item for task 14 ("Switch the upload endpoint to signed URLs", a todo subtask of task 7 "Migrate user avatars to object storage", which is in-progress with one open subtask) had the reason, verbatim: "In-progress task with an open subtask (task 14). Prefer concrete subtasks over parents." The choice of 14 was right (the prompt's rule), but the reason describes the parent 7, not 14: 14 is not in progress and has no subtasks. It passed validation because reasons are free text (only length is checked). Add it to section 8 as case (b), naming PR4 run 2 as the source, with what the product does about it (reasons are advice shown next to a link to the real task with its real status and priority badges, so the user sees the mismatch; nothing is written). One commit, do not push. Then reply with the sha.
```

## Де агент помилився з першої спроби

Розробник прочитав код і логи до чернетки, тож перший коміт уже спирався на них. Окремий прохід звірив кожне твердження з кодом і знайшов:

| Що сталося | Як помітили | Що виправили |
|---|---|---|
| Написав, що всі мок-відповіді починаються з «Mock» і що бейдж мока жовтий. Питання декомпозиції в моку без «Mock», а колір у коді не задано, лише `tone="warning"` | Звірка з `decompose-mock-script.ts` і компонентом | `f29f345` |
| «Інший провайдер — один файл». Насправді пакет, гілка в `llm-connection.ts`, значення в `LLM_PROVIDERS` і змінна ключа | Звірка з кодом | `ffe4ff3` |
| Додав крок в інструкції AI Studio, який не міг перевірити | Сам | `ffe4ff3`: лишив лише Get API key |
| «Кнопки агентів неактивні» (насправді лише Run і Break down), «SDK повторює 1 раз» (насправді не більше одного разу); бракувало кнопок «Skip questions» і «Create N subtasks» | Звірка з компонентами | `e308d07` |
| Написав, що обидва агенти позначають текст задач як дані і в інструкціях, і в промпті. Пріоритизація — лише в інструкціях | Звірка з кодом | `1159fc0` |
| Шляхи до логів простим текстом | Сам | `a151fe3`: посилання |

Ще один коміт — коментарі до `WEB_ORIGIN` і `NEXT_PUBLIC_API_URL` у `.env.example` (`843860f`).

## Що не вигадав

Випадку (b) — «причина для підзадачі 14 описує батька» — у логах PR не було: це була примітка рев'ювера PR4, яка в лог не потрапила. Розробник не став його вигадувати, лишив поза README і запитав. Тех-лід перевірив за збереженою відповіддю Gemini з прогону 2 у PR4 і надіслав дослівну причину. Додано в `7990ada`.

Також розробник прямо позначив як неперевірене: чи `nest start --watch` перезапускає API після перезбирання `packages/shared`; справжній 429 від Gemini; точний інтерфейс AI Studio.

## Де дизайн розійшовся з кодом (README описує код)

- Після циклу повторно перевіряється лише zod-схема; перевірки по базі — тільки всередині `execute` завершального tool. У дизайні — «safeParse і перевірки по базі ще раз».
- Інший провайдер — не «один файл», а щонайменше три файли й пакет.
- Health — `http://localhost:4000/health`, не `/api/health`: проксі через Next прибрали.
- У B немає `get_task`: задача йде в промпт (рішення після адверсаріального рев'ю).
- `list_tasks` в A повертає і відкриті підзадачі; fallback кладе решту в `later` і при рівності балів сортує за віком, потім за id; пошук обмежено 8 словами.

## Що знайшло рев'ю

| Рев'ю | Head | Вердикт | Знахідка | Що зробили |
|---|---|---|---|---|
| `generic-pr-reviewer` | 6920349 | APPROVE, 5 MINOR | Серед причин зупинки бракує «модель відповіла текстом без tool» | Додано (тех-лід) |
| | | | Випадок (b) не простежити до джерела з репозиторію | Посилання на цей лог із README (тех-лід) |
| | | | Тут було «7 комітів-виправлень», насправді 5 виправлень і 2 доповнення | Виправлено (тех-лід) |
| | | | Заголовок «Справжнє розгалуження» звучить як реклама | «Розгалуження: питати чи пропонувати» (тех-лід) |
| | | | `format:check` не дивиться на `.md`: `*.md` у `.prettierignore` | Прийнято як є: `.md` виключені з Prettier налаштуваннями репозиторію з PR1, і жоден лог теж не форматований. Тех-лід прогнав Prettier без ignore-файлу: він переформатував би всі `.md`, не лише README, тому README окремо не чіпали |

Усі факти README рев'ювер звірив з кодом і не знайшов жодного хибного; цитата у випадку (b) збігається зі збереженою відповіддю дослівно. П'ять дрібних правок зробив тех-лід сам, без розробника: це правки тексту на рядок.

## Перевірка тех-лідом

- Прочитав увесь README.
- Перевірив, що файли, на які він посилається, існують (`docs/agent-log/PR0-research.md` … `PR6.md`, `.nvmrc`).
- `npm run lint` зелений; змінено лише `README.md` і `.env.example`.
- Посилання на `AGENT_LOG.md` поки веде в нікуди: файл пише Олександр.

## Не перевірено

- Чи `nest start --watch` бачить перезбирання `packages/shared`.
- Справжній 429 від Gemini.
- `npm run dev` розробник не запускав: порти й перший старт узято з коду. Тех-лід запускав `npm run dev` у PR5 і PR6, порти 3000 і 4000 і 14 сид-задач після `db:reset` збігаються.

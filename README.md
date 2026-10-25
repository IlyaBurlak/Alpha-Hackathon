# Alpha Hackathon

Монорепо: `client` (React + TS + Vite), `server` (Express + TS), `ml` (Python, FastAPI), `externalSystemsMock` (мок внешних систем: банк, кредитное бюро, единый реестр). БД — SQLite внутри `server`, файл хранится в томе `server-data`.

## Запуск

```bash
cp .env.example .env
docker compose up -d --build --wait
```

| Адрес | Что |
| --- | --- |
| http://localhost:8080 | Клиент (nginx): кабинет предпринимателя `/cabinet`, вход `/login` |
| http://localhost:8080/staff | Кабинет сотрудника, вход `/staff/login` (операторы `alfaOperator1` / `alfaOperator1!`, демо `ivanova` / `demo2026`) |
| http://localhost:8080/api/health | Сервер через прокси |
| http://localhost:8080/admin | Панель внешних систем: переключатели доступности банка, бюро и реестра |
| http://localhost:8080/external-api/ | Прокси к `external-systems` (используется панелью) |

Остановить: `docker compose down` (`-v` — вместе с данными БД; только БД: `docker volume rm alpha-hackathon_server-data`).

## Локальная разработка

```bash
cd client && npm install && npm run dev
```

`npm run dev` сам поднимает в Docker бэк, ML и external-systems (server :3001, ml :8000, external-systems :5006, порты открывает `docker-compose.dev.yml`) и запускает Vite на :5173 с hot reload; `/api` проксируется на :3001.

Команды из `client/`:

| Команда | Что делает |
| --- | --- |
| `npm run dev` | бэк и ML в Docker + фронт с hot reload |
| `npm run backend:down` | остановить бэк и ML (данные БД сохраняются) |
| `npm run rebuild` | пересобрать и перезапустить всё приложение целиком (ml, server, client) на :8080 |
| `npm run rebuild:clean` | то же без кэша Docker (дольше, для чистой проверки) |

После правок в `server/` или `ml/` повторите `npm run backend:up`.

Без Docker: `cd server && cp .env.example .env && npm install && npm run dev` (задайте `JWT_SECRET` в `server/.env`), ML: `cd ml && pip install -r requirements-dev.txt && uvicorn app.main:app --reload`.

## Документация

- `CLAUDE.md` — правила монорепо и описание продукта (экраны, роли).
- `client/README.md` — архитектура клиента (FSD), экраны и маршруты.
- `docs/backend-requirements.md` — что нужно доделать бэкенду под дизайн кабинета.
- `docs/backend-data-contract.md` — полный список данных, которые должны отдать бэкенд и ML, чтобы убрать все моки.
- `docs/frontend-mocks.md` — что замокано на фронте, пока бэк этого не отдаёт (в том числе весь кабинет сотрудника, кроме входа).

## Проверки

```bash
cd client && npm run lint && npm run build   # lint включает проверку границ FSD (steiger)
cd server && npm run typecheck && npm run build
cd ml && ruff check . && pytest
```

Образ из `aio/Dockerfile` запускается так: `docker run -e JWT_SECRET=<секрет> -p 8080:8080 <образ>`. В образ входят клиент, сервер, ML и мок внешних систем, поэтому `/admin` работает и в нём.

CI (`.github/workflows/ci.yml`) запускает те же проверки, затем собирает единый образ `aio/Dockerfile` и делает smoke-тест (`/` и `/api/health`). Ветки: `develop` — разработка, `main` — релизы. CI идёт на пуши и PR в обе ветки; образы в ghcr.io публикуются только по git-тегу `vX.Y.Z` на коммите из `main`.

Релиз: `git checkout main && git tag v0.0.0 && git push origin v0.0.0`.

## Интеграционные тесты бэкенда

При изменениях в `server/` (или `docker-compose.test.yml`) CI дополнительно поднимает `server` + `ml`-мок + `external-systems` и прогоняет интеграционные тесты (джоб `server-integration`, см. `server/tests/integration/README.md`).

Результат каждого прогона — отчёт Allure со статусами, шагами и описаниями тестов:

- **На любом PR/коммите** — скачиваемый артефакт `allure-report` на странице конкретного workflow-run в Actions (внизу страницы, раздел Artifacts). Открывать через `npx allure open <распакованная-папка>`, не просто кликом по `index.html` (SPA, `file://` не сработает).
- **На постоянной странице с историей трендов** — https://ilyaburlak.github.io/Alpha-Hackathon/ — обновляется **только после пуша в `develop` или `main`** (то есть после мерджа PR), не на каждом открытом PR, чтобы параллельные PR не затирали друг другу историю.


# Alpha Hackathon

Монорепо: `client` (React + TS + Vite), `server` (Express + TS), `ml` (Python, FastAPI). БД — SQLite внутри `server`, файл хранится в томе `server-data`.

## Запуск

```bash
cp .env.example .env
docker compose up -d --build --wait
```

| Адрес | Что |
| --- | --- |
| http://localhost:8080 | Клиент (nginx) |
| http://localhost:8080/api/health | Сервер через прокси |

Остановить: `docker compose down` (`-v` — вместе с данными БД; только БД: `docker volume rm alpha-hackathon_server-data`).

## Локальная разработка

```bash
cd server && cp .env.example .env && npm install && npm run dev   # :3001 (задайте JWT_SECRET в server/.env)
cd client && npm install && npm run dev   # :5173
```

ML: `cd ml && pip install -r requirements-dev.txt && uvicorn app.main:app --reload`

## Проверки

```bash
cd client && npm run lint && npm run build
cd server && npm run typecheck && npm run build
cd ml && ruff check . && pytest
```

Образ из `aio/Dockerfile` запускается так: `docker run -e JWT_SECRET=<секрет> -p 8080:8080 <образ>`.

CI (`.github/workflows/ci.yml`) запускает те же проверки, затем собирает единый образ `aio/Dockerfile` и делает smoke-тест (`/` и `/api/health`). Ветки: `develop` — разработка, `main` — релизы. CI идёт на пуши и PR в обе ветки; образы в ghcr.io публикуются только по git-тегу `vX.Y.Z` на коммите из `main`.

Релиз: `git checkout main && git tag v0.0.0 && git push origin v0.0.0`.


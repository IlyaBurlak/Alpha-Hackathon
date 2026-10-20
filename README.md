# Alpha Hackathon

Монорепо: `client` (React + TS + Vite), `server` (Express + TS), `ml` (Python, FastAPI), `db` (Postgres).

## Запуск

```bash
cp .env.example .env
docker compose up -d --build --wait
```

| Адрес | Что |
| --- | --- |
| http://localhost:8080 | Клиент (nginx) |
| http://localhost:8080/api/health | Сервер через прокси |

Остановить: `docker compose down` (`-v` — вместе с данными БД).

## Локальная разработка

```bash
npm install
npm run dev          # server :3001 + client :5173
```

ML: `cd ml && pip install -r requirements-dev.txt && uvicorn app.main:app --reload`

## Проверки

```bash
npm run lint -w client
npm run typecheck -w server
npm run build
cd ml && ruff check . && pytest
```

CI (`.github/workflows/ci.yml`) запускает те же проверки, затем собирает демо-образ и делает smoke-тест. Ветки: `develop` — разработка, `main` — релизы. CI идёт на пуши и PR в обе ветки; образы в ghcr.io публикуются только по git-тегу `vX.Y.Z` на коммите из `main`.

Релиз: `git checkout main && git tag v0.0.0 && git push origin v0.0.0`.


## Демо одной командой (для жюри)

Всё приложение в одном образе (nginx + сервер + ML), без исходников и compose:

```bash
docker run --rm -p 8080:8080 ghcr.io/ilyaburlak/alpha-hackathon:0.0.0
```

Открыть http://localhost:8080. В CI собирается и публикуется только он. Образ выходит вместе с релизом (тег `vX.Y.Z`) и должен быть публичным. Сейчас в нём нет базы данных.

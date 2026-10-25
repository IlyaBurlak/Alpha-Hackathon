# CI (`ci.yml`)

## Джобы

| Джоб | Что делает |
| --- | --- |
| `changes` | Определяет, что изменилось (`client/**` и/или `server/**` + `docker-compose.test.yml`) — на этом основаны все гейты ниже |
| `client-lint` / `client-test` / `client-build` | Линт, юнит-тесты (`vitest`), сборка клиента |
| `server` | `typecheck` + `build` сервера |
| `server-unit` | Юнит-тесты сервера (`node:test`, без БД и Docker) |
| `server-integration` | Поднимает `server` + `ml`-мок + `external-systems` в Docker и гоняет интеграционные тесты; публикует Allure-отчёт |
| `external-systems`, `ml` | Проверки соответствующих сервисов — гоняются всегда |
| `smoke` | Собирает единый `aio`-образ, поднимает контейнер, проверяет `/`, `/api/health`, `/external-api/...` |
| `publish` | Публикует образ в ghcr.io — только по тегу `vX.Y.Z` на `main` |

## Логика гейтинга

- Правки только в `client/` → гоняются `client-lint`/`client-test`/`client-build` + `smoke`. `server`/`server-unit`/`server-integration` пропускаются.
- Правки только в `server/` (или `docker-compose.test.yml`) → гоняются `server`/`server-unit`/`server-integration` + `smoke`. Клиентские джобы пропускаются.
- Тесты лежат внутри `client/`/`server/`, поэтому правки только в тестах уже покрыты тем же правилом — прогоняются тесты той стороны, где их поменяли.
- `external-systems` и `ml` гоняются всегда, независимо от диффа.
- `smoke` ждёт все остальные джобы, но не блокируется пропущенными (гейтинг через `success || skipped`), и сам запускается только если менялся `client/` или `server/`.
- **Пуш тега `vX.Y.Z`** (релиз) обходит все гейты — прогоняется всё целиком, чтобы релиз не проскочил проверки из-за того, что в самом коммите тега нет изменений в `client/`/`server/`.

## Allure-отчёт (`server-integration`)

- На любом прогоне — отчёт кладётся как скачиваемый артефакт (`allure-report` в Artifacts страницы run'а).
- История трендов публикуется на GitHub Pages (`gh-pages` ветка) **только** при пуше в `develop`/`main` — не на каждом PR, чтобы параллельные ветки не затирали друг другу историю.

# Интеграционные тесты бэкенда

Чёрный ящик: реальный собранный образ `server` в Docker, реальная SQLite (та же БД и те же сид-данные, что у приложения — отдельных тестовых фикстур нет), реальный `externalSystemsMock`, запросы через глобальный `fetch`. Раннер — `node:test` (`npm run test:integration`), отчёт — Allure.

Тесты завязаны на демо-сид из `src/database/migrations/20261021-startUserData.ts` и `20261025-startApplications.ts`. Если эти миграции поменяются (логины, id, связи пользователь-организация) — тест-кейсы ниже нужно синхронно обновить.

## Сид-данные, на которые ссылается чек-лист

| Логин | userId | Организация | orgId | Тип | Заявки |
| --- | --- | --- | --- | --- | --- |
| `alfaTest` / `alfaTest!` | 1 | ООО «Ромашка» | 1 | OO | нет |
| `alfaAngelika` / `alfaAngelika!` | 2 | ООО «Кот не знает» | 2 | OO | #1, #2 (обе `SIGNED`, со скорингом) |
| `alfaIlia` / `alfaIlia!` | 3 | — | — | — | нет организации вообще |
| `alfaIvan` / `alfaIvan!` | 4 | ИП Сырный Иван + ООО «АмёбаПродакшн» | 5, 4 | IE + OO | нет |
| `alfaSergey` / `alfaSergey!` | 5 | ООО «Таинственный сад» + ИП Динозавриков | 3, 6 | OO + IE | нет |
| `alfaAlex` / `alfaAlex!` | 6 | — | — | — | нет организации |
| `alfaOperator1` / `alfaOperator1!` | оператор 1 | — | — | — | — |

Мок внешних систем даёт переключатели доступности (использует общая переменная `(global as any).*isActive` в процессе мока — переключение влияет на все параллельные тесты, поэтому такие кейсы нельзя гонять параллельно с остальными и нужно возвращать `isActive: true` в конце):
- `POST {EXTERNAL_SYSTEMS_BASE_URL}/api/banks/setActive` `{ isActive: boolean }`
- `POST {EXTERNAL_SYSTEMS_BASE_URL}/api/credit-bureaus/setActive` `{ isActive: boolean }`
- `POST {EXTERNAL_SYSTEMS_BASE_URL}/api/register/setActive` `{ isActive: boolean }`

## Техники тест-дизайна, которыми собран чек-лист

- **Эквивалентное разбиение (EP)** — классы валидных/невалидных входных данных (есть токен / нет токена, принадлежит / не принадлежит пользователю).
- **Анализ граничных значений (BVA)** — сумма и срок кредита на границах `minSum/maxSum`, `minCreditTime/maxCreditTime` банковского продукта.
- **Таблица решений** — для `saveOperatorSolution` (статус решения × наличие продукта) и для матрицы доступа (роль × эндпоинт).
- **Тестирование переходов состояний** — жизненный цикл заявки `DRAFT → SUBMITTED → (SPECIALPRODUCTOFFERED →) APPROVED/REJECTED → SIGNED`.
- **Предугадывание ошибок (error guessing)** — отсутствующие поля, несуществующие id, повторный вызов необратимого действия.

Легенда: ✅ — уже покрыто существующим тестом, ⬜ — предстоит написать.

## 1. Health / boot

- ✅ `GET /health` → 200 `{status: "ok"}` (`health.integration.test.ts`)
- ✅ `GET /api/health` → 200 (через nginx-префикс) (`health.integration.test.ts`)
- ✅ `POST /api/applications/` без токена → 401 (`health.integration.test.ts`)

## 2. Аутентификация — `/api/users/*`

- ✅ `POST /login` валидные `alfaTest`/`alfaTest!` → 200, непустой JWT (`auth.integration.test.ts`)
- ✅ `POST /login` неверный пароль → 500 (EP: невалидный класс пароля) (`auth.integration.test.ts`)
- ✅ `POST /login` несуществующий логин → 500 (`auth.integration.test.ts`)
- ✅ `POST /login` без `password` в теле → 400 (error guessing: отсутствующее обязательное поле) (`auth.integration.test.ts`)
- ✅ `POST /login` пустая строка в `login` → 400 (BVA: граница `.trim().length === 0`) (`auth.integration.test.ts`)
- ✅ `POST /admin-login` валидный оператор → 200, JWT с `isAdmin: true` (`auth.integration.test.ts`)
- ✅ `POST /admin-login` валидный обычный пользователь (не оператор) → 500 (разные таблицы, `login` не находит оператора) (`auth.integration.test.ts`)
- ✅ `GET /info` с валидным токеном пользователя → 200, данные пользователя + его организации (`auth.integration.test.ts`)
- ✅ `GET /info` без токена → 401 (`auth.integration.test.ts`)
- ✅ `GET /info` с токеном пользователя без организаций (`alfaIlia`) → 200, пустой список организаций (`auth.integration.test.ts`)
- ✅ `GET /admin-info` с токеном оператора → 200 (`auth.integration.test.ts`)
- ✅ `GET /admin-info` с токеном обычного пользователя (не оператор) → 403 (матрица доступа) (`auth.integration.test.ts`)
- ✅ `GET /admin-info` без токена → 401 (`auth.integration.test.ts`)

## 3. Создание заявки — `POST /api/applications/`

- ✅ Валидная заявка от владельца организации (`alfaTest`, orgId 1, сумма/срок внутри диапазона хотя бы одного продукта) → 200, в ответе присутствует непустой `products` (`applications.integration.test.ts`)
- ✅ Без токена → 401 (`applications.integration.test.ts`)
- ✅ `organizationId`, не привязанный к текущему пользователю → 500 («Не найдена связь текущего пользователя с организацией») (`applications.integration.test.ts`)
- ✅ Отсутствует обязательное поле `creditTime` в теле → 500 (error guessing — контроллер читает `creditTime.units` без проверки) (`applications.integration.test.ts`)
- ✅ Каждое значение `type` (цель кредита: «Пополнить оборотные средства», «транспорт», «спецтехника», «открыть новую точку», «рефинансировать кредиты», «другое») принимается, в ответе `type` совпадает, `reason` пуст (EP, `applications.integration.test.ts`)
- ✅ `type` сохраняется: `GET /:id` возвращает то же значение (`applications.integration.test.ts`)
- ✅ Отсутствует обязательное поле `type` в теле → 500 (колонка NOT NULL, валидации на входе нет) (`applications.integration.test.ts`)
- ✅ BVA: `sum` равна `minSum` продукта → продукт попадает в доступные (`applications.integration.test.ts`)
- ✅ BVA: `sum` на 1 меньше `minSum` → продукт не попадает в доступные (`applications.integration.test.ts`)
- ✅ BVA: `sum` равна `maxSum` продукта → продукт попадает в доступные (`applications.integration.test.ts`)
- ✅ BVA: `sum` на 1 больше `maxSum` → продукт не попадает в доступные (`applications.integration.test.ts`)
- ✅ BVA: `creditTime` на границе `minCreditTime`/`maxCreditTime` (в пересчёте на дни) → аналогично включается/исключается (`applications.integration.test.ts`)
- ✅ Мок банка выключен (`setActive: false`) на момент создания → заявка создаётся (200), но без поля `products` (`applications.integration.test.ts`)

## 4. Получение заявок

### `GET /api/applications/my`
- ✅ У пользователя есть заявки (`alfaAngelika`) → 200, массив содержит только его заявки (#1, #2) (`applications.integration.test.ts`)
- ✅ У пользователя нет заявок, но есть организация (`alfaIvan`) → 200, пустой массив (`applications.integration.test.ts`)
- ✅ Без токена → 401 (`applications.integration.test.ts`)

### `GET /api/applications/:id`
- ✅ Собственная заявка с уже выбранным продуктом (`alfaAngelika`, id 1) → 200, без повторного запроса к банку (`applications.integration.test.ts`)
- ✅ Заявка другого пользователя → 500 («Нет доступа к заявке») — access control (`applications.integration.test.ts`)
- ✅ Несуществующий id → 500 (error guessing) (`applications.integration.test.ts`)
- ✅ Без токена → 401 (`applications.integration.test.ts`)

### `GET /api/applications/all` (оператор)
- ✅ Токен оператора → 200, список всех заявок независимо от владельца (`applications.integration.test.ts`)
- ✅ Токен обычного пользователя → 403 (`applications.integration.test.ts`)
- ✅ Без токена → 401 (`applications.integration.test.ts`)

### `GET /api/applications/:id/score` (оператор)
- ✅ Токен оператора, существующая заявка со скорингом (id 1) → 200, присутствуют `history`/`registerInfo`/`mlScore` (`applications.integration.test.ts`)
- ✅ Токен обычного пользователя → 403 (`applications.integration.test.ts`)
- ✅ Без токена → 401 (`applications.integration.test.ts`)

## 5. Подтверждение продукта — `PUT /api/applications/?applicationId=&productId=`, тело `{ "reason": string }`

- ✅ Валидное подтверждение (новая заявка без продукта, подходящий `productId`, непустой `reason`) → 200, в ответе `productId` совпадает (`applications.confirm.integration.test.ts`)
- ✅ Без `applicationId` или без `productId` в query → 400 (`applications.confirm.integration.test.ts`)
- ✅ Без `reason` в теле, с пустым (из пробелов) или нестроковым `reason` → 400, заявка остаётся `DRAFT` без продукта (`applications.confirm.integration.test.ts`)
- ✅ `reason` сохраняется: он есть и в ответе подтверждения, и в `GET /:id` (`applications.confirm.integration.test.ts`)
- ✅ Без токена → 401 (`applications.confirm.integration.test.ts`)
- ✅ Заявка принадлежит другому пользователю → 500 («Нет доступа к заявке») (`applications.confirm.integration.test.ts`)
- ✅ Повторное подтверждение уже подтверждённой заявки → 500 («Продукт уже выбран») (`applications.confirm.integration.test.ts`)
- ✅ `productId`, не входящий в список доступных (например, не подходит по сумме) → 500 («Выбранный продукт недоступен») (`applications.confirm.integration.test.ts`)
- ✅ Мок банка выключен в момент подтверждения → 500 («Сервисы банка недоступны») (`applications.confirm.integration.test.ts`)
- ✅ После успешного подтверждения: подождать и проверить через `/score` (токен оператора), что асинхронный скоринг (`handleApplication`) реально выполнился и статус скоринга дошёл до `WAITONGOPERATOR` (`applications.confirm.integration.test.ts`)

## 6. Жизненный цикл решения оператора — таблица решений

### `POST /api/applications/:id/take`
- ✅ Оператор берёт заявку в работу → 200, после этого заявка отображается с назначенным оператором (`applications.operator-flow.integration.test.ts`)
- ✅ Не оператор → 403 (`applications.operator-flow.integration.test.ts`)
- ✅ Без токена → 401 (`applications.operator-flow.integration.test.ts`)

### `POST /api/applications/:id/solution`

| `status` в теле | `product` указан | Ожидаемый результат |
| --- | --- | --- |
| `APPROVED` | — | ✅ 200, решение сохранено (`applications.operator-flow.integration.test.ts`) |
| `REJECTED` | — | ✅ 200, решение сохранено (`applications.operator-flow.integration.test.ts`) |
| `SPECIALPRODUCTOFFERED` | да | ✅ 200, решение сохранено (`applications.operator-flow.integration.test.ts`) |
| `SPECIALPRODUCTOFFERED` | нет | ✅ 500 («Не указан продукт для специального предложения») (`applications.operator-flow.integration.test.ts`) |
| `DRAFT`/`SUBMITTED`/`SIGNED` (невалидный для решения) | — | ✅ 500 («Неверный статус решения оператора») (`applications.operator-flow.integration.test.ts`, кейс с `SIGNED`) |

- ✅ Не оператор → 403 (`applications.operator-flow.integration.test.ts`)
- ✅ Без токена → 401 (`applications.operator-flow.integration.test.ts`)

### `PUT /api/applications/:id/special?status=`

| Статус заявки до вызова | `status` в query | Вызывающий | Ожидаемый результат |
| --- | --- | --- | --- |
| `SPECIALPRODUCTOFFERED` | `SPECIALPRODUCTACCEPTED` | владелец | ✅ 200, статус → `SPECIALPRODUCTACCEPTED` (`applications.operator-flow.integration.test.ts`) |
| `SPECIALPRODUCTOFFERED` | `SPECIALPRODUCTREJECTED` | владелец | ✅ 200, статус → `SPECIALPRODUCTREJECTED` (`applications.operator-flow.integration.test.ts`) |
| `SPECIALPRODUCTOFFERED` | произвольный другой статус | владелец | ✅ 500 («Неверный статус решения пользователя») (`applications.operator-flow.integration.test.ts`) |
| не `SPECIALPRODUCTOFFERED` (например, свежесозданная) | `SPECIALPRODUCTACCEPTED` | владелец | ✅ 500 («Заявка не находится в статусе SPECIALPRODUCTOFFERED») (`applications.operator-flow.integration.test.ts`) |
| любой | любой | не владелец | ✅ 500 («Нет доступа к заявке») (`applications.operator-flow.integration.test.ts`) |
| любой | любой | без токена | ✅ 401 (`applications.operator-flow.integration.test.ts`) |

### `PUT /api/applications/:id/sign`

| Статус заявки до вызова | Вызывающий | Ожидаемый результат |
| --- | --- | --- |
| `APPROVED` | владелец | ✅ 200, статус → `SIGNED` (`applications.operator-flow.integration.test.ts`) |
| `SPECIALPRODUCTACCEPTED` | владелец | ✅ 200, статус → `SIGNED` (`applications.operator-flow.integration.test.ts`) |
| любой другой (например, `SUBMITTED`) | владелец | ✅ 500 (`applications.operator-flow.integration.test.ts`) |
| любой | не владелец | ✅ 500 («Нет доступа к заявке») (`applications.operator-flow.integration.test.ts`) |
| любой | без токена | ✅ 401 (`applications.operator-flow.integration.test.ts`) |

### `POST /api/applications/:id/restart`
- ✅ Заявка в статусе `SUBMITTED`, вызывает оператор → 200, перезапускает `handleApplication` (`applications.operator-flow.integration.test.ts`)
- ✅ Не оператор → 403 (`applications.operator-flow.integration.test.ts`)
- ✅ Без токена → 401 (`applications.operator-flow.integration.test.ts`)

## 7. Деградация внешних систем (переключатели мока)

Каждый кейс: выключить нужный сервис мока → выполнить сценарий → **обязательно вернуть `isActive: true`** в `after`/`finally`, иначе испортит остальные тесты (общее состояние процесса мока).

- ✅ Банк выключен во время `createApplication` → заявка создаётся без `products` (раздел 3, уже упомянуто — здесь фокус на то, что сервер не падает) (`applications.integration.test.ts`)
- ✅ Банк выключен во время `confirmApplication` → явная ошибка «Сервисы банка недоступны» (раздел 5) (`applications.confirm.integration.test.ts`)
- ✅ Кредитное бюро выключено во время асинхронного скоринга подтверждённой заявки → скоринг доходит до конца (`WAITONGOPERATOR`), но `history` в `applicationScore.info` отсутствует, сервер не падает (`external-degradation.integration.test.ts`)
- ✅ Единый реестр выключен во время скоринга → аналогично, `registerInfo` отсутствует, не падает (`external-degradation.integration.test.ts`)
- ✅ Несколько сервисов выключены одновременно → скоринг всё равно доходит до `WAITONGOPERATOR` без необработанных исключений (`external-degradation.integration.test.ts`)

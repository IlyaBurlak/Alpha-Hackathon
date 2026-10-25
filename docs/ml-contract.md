# ML-контракт скоринга (v2)

## Вход
`POST {ML_SERVICE_URL}/score` принимает **всю сущность заявки целиком** (`application`), как её формирует backend.

Структура (основные поля):
```json
{
  "id": 10,
  "userId": 2,
  "organizationId": 2,
  "sum": 100000000,
  "status": "SUBMITTED",
  "createdAt": "2026-10-24T10:22:22.472Z",
  "creditTime": { "units": "YEAR", "value": 1 },
  "applicationScore": {
    "id": 9,
    "applicationId": 10,
    "scoringDate": null,
    "score": null,
    "status": "WAITONGOPERATOR",
    "history": {
      "creditHistory": [ { "provisionDate": "2022-05-10", "sum": 50000, "status": "PAID", "paymentDeadline": "2023-05-10" } ],
      "bankrupt": false,
      "casesDelayedPayment": 0
    },
    "registerInfo": {
      "isActive": true,
      "registrationDate": "2021-01-15",
      "authCapital": 20000,
      "employeesCount": 24,
      "annualIncome": 400000,
      "annualExpenses": 200000,
      "lastYearBalances": [100000, 100040, 100023, 140022, 200342, 123333],
      "ogrn": "1234567890124",
      "okved": "58.19 Виды издательской деятельности прочие",
      "head": "Василенко Анжелика",
      "kpp": "500101001",
      "bankClientSince": "2023-01-15",
      "address": "г. Санкт-Петербург, ул. Ленина, д. 2",
      "account": "4015****23"
    },
    "mlScore": {}
  },
  "loanIssuanceDate": "2026-10-24T10:22:22.472Z"
}
```

`history` и `registerInfo` могут отсутствовать, быть `null` или пустым объектом `{}`. Поля в `registerInfo` могут отличаться (старый формат без `lastYearBalances`, `ogrn`, `okved` и др.).

Схемы с `extra="ignore"` принимают лишние поля.

## Признаки (v2)
См. `ML_AGENT_PLAN.md` раздел 3.

## Ответ
```json
{
  "pd": 0.071,
  "model_version": "logreg-0.1",
  "factors": [
    { "feature": "avg_revenue_monthly", "label": "Среднемесячная выручка", "impact": -0.01, "hint": null }
  ],
  "risk_zone": "grey",
  "stop_factors": [],
  "comment": "..."
}
```

Обязательные: `pd`, `model_version`, `factors`. `risk_zone`, `stop_factors`, `comment`, `hint` у `factors` — необязательные (сервер их игнорирует).

Элемент `factors` содержит `feature`, `label`, `impact`, необязательный `hint`. Для факторов, повышающих риск (`impact > 0`), при наличии возможности улучшения заполняется `hint` на русском языке.

## Ошибки
- Недостающие обязательные данные для расчёта признаков — HTTP 422 с телом `{"detail": {"code": "MISSING_DATA", "missing": [...]}}`. Оценка не выдумывается.
- Прочие ошибки — 500, без утечки деталей в ответ.

## Допущения
- Число дней просрочки неизвестно — используется `history.casesDelayedPayment`.
- `lastYearBalances` — остатки по счёту, коэффициент вариации по ним используется как замена нестабильности выручки.
- Форма собственности определяется по длине `ogrn` (15 — ИП, 13 — юрлицо). Признак необязательный. Если в `server/` появятся более точные поля — заменить.
- `creditTime.units` может быть строкой (`YEAR`/`MONTH`/`DAY`) или числом (`3`/`2`/`1` из `server` enum).
- Статусы кредитов в истории — строки; активными считаются отличные от `PAID`.

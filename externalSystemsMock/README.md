Мок для внешних систем



## Описание API
### Banks
Модуль отвечает за работу с банковской инфраструктурой.

#### Получение доступных продуктов
> POST /api/banks/products


Пример ответа: 
<pre>
[
    {
        "name": "Кредит для бизнеса с залогом",
        "minSum": 10000,
        "maxSum": 100000000,
        "minCreditTime": {
            "units": "MONTH",
            "value": 6
        },
        "maxCreditTime": {
            "units": "MONTH",
            "value": 60
        },
        "ooAvailable": true,
        "ieAvailable": true,
        "minCollateral": 20000
    },
    {
        "name": "Кредит для бизнеса без залогов",
        "minSum": 10000,
        "maxSum": 5000000,
        "minCreditTime": {
            "units": "MONTH",
            "value": 6
        },
        "maxCreditTime": {
            "units": "MONTH",
            "value": 60
        },
        "ooAvailable": true,
        "ieAvailable": true,
        "minCollateral": 0
    },
    ....
]
</pre>
Пример ответа при недоступности сервиса: 
<pre>
{
    "error": "Service is currently inactive"
}
</pre>

#### Включить/выключить сервис
Метод позволяет промоделировать ситуацию недоступности сервиса
>POST /api/banks/setActive
Пример тела запроса: 

<pre>
{
    "isActive":false
}
</pre>
Можно передать true значение для включения сервиса.
Пример ответа: 

<pre>
{
    "message": "ok"
}
</pre>




### Кредитное бюро
Модуль отвечает за работу с кредитным бюро.

#### Получение истории
> POST api/credit-bureaus/history?inn=7701234568
inn - инн запрашиваемой компании

Пример ответа: 
<pre>
{
    "inn": "7701234568",
    "fullName": "ООО \"Ромашка\"",
    "creditHistory": [
        {
            "provisionDate": "2023-01-15",
            "sum": 100000,
            "status": "PAID",
            "paymentDeadline": "2023-12-15"
        }
    ],
    "bankrupt": false,
    "casesDelayedPayment": 0
}
</pre>
Пример ответа при недоступности сервиса: 
<pre>
{
    "error": "Service is currently inactive"
}
</pre>

#### Включить/выключить сервис
Метод позволяет промоделировать ситуацию недоступности сервиса
>POST /api/credit-bureaus/history
Пример тела запроса: 

<pre>
{
    "isActive":false
}
</pre>
Можно передать true значение для включения сервиса.
Пример ответа: 

<pre>
{
    "message": "ok"
}
</pre>


### Единый государственный реестр
Модуль отвечает за работу с единым государственным реестром.

#### Получение информации о юрлице
> POST api/register/legal?inn=7701234568


Пример ответа: 
<pre>
 {
              inn: "7701234568", 
              ogrn: "1234567890123",
              okved: "46.90 Оптовая торговля неспециализированная",
              fullName: "ООО \"Ромашка\"",
              head: "Подсолнухов Роман Иванович",
              kpp: "770101001",
              address:"г. Москва, ул. Ленина, д. 1",
              account: "4018****23",
              isActive: true,
              registrationDate: "2020-01-15",
              liquidationDate: null,
              authCapital: 10000,
              employeesCount: 10,
              annualIncome: 500000,
              annualExpenses: 200000,
              lastYearBalances: [
                100000, 100040, 100023, 140022, 200342, 123333, 4632222, 200001, 322221, 104000, 100500, 100000, 100023, 140022, 200342, 123333,
              ],
              bankClientSince: "2023-01-15",
}
</pre>
Пример ответа при недоступности сервиса: 
<pre>
{
    "error": "Service is currently inactive"
}
</pre>

#### Получение информации о физлице
> POST api/register/invidual?inn=5401234563

Пример ответа: 
<pre>
 {
              inn: "2301234560", 
              ogrn: "1234567890127",
              okved: "46.90 Оптовая торговля неспециализированная",
              fullName: "ИП Сырный Иван",
              account: "4018****22",
              isActive: true,
              registrationDate: "2023-01-15",
              liquidationDate: null,
              employeesCount: 1,
              annualIncome: 100000,
              annualExpenses: 50000,
              lastYearBalances: [
               1054372, 1876540, 432019, 2003745, 689210, 1542883, 947026, 1230471, 2118604, 356789, 1765320, 804195, 1490638, 2067912, 573046, 1321587
              ],
              bankClientSince: "2023-01-15",
}
</pre>
Пример ответа при недоступности сервиса: 
<pre>
{
    "error": "Service is currently inactive"
}
</pre>

#### Включить/выключить сервис
Метод позволяет промоделировать ситуацию недоступности сервиса
>POST /api/banks/setActive
Пример тела запроса: 

<pre>
{
    "isActive":false
}
</pre>
Можно передать true значение для включения сервиса.
Пример ответа: 

<pre>
{
    "message": "ok"
}
</pre>





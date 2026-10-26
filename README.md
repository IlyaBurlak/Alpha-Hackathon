# Альфа Хакатон

[![CI](https://github.com/IlyaBurlak/Alpha-Hackathon/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/IlyaBurlak/Alpha-Hackathon/actions/workflows/ci.yml)
[![Версия](https://img.shields.io/github/v/tag/IlyaBurlak/Alpha-Hackathon?label=version&sort=semver)](https://github.com/IlyaBurlak/Alpha-Hackathon/tags)
[![Docker-образ](https://img.shields.io/badge/ghcr.io-alpha--hackathon-2496ED?logo=docker&logoColor=white)](https://github.com/IlyaBurlak/Alpha-Hackathon/pkgs/container/alpha-hackathon)
[![Лицензия](https://img.shields.io/github/license/IlyaBurlak/Alpha-Hackathon)](LICENSE)
[![Последний коммит](https://img.shields.io/github/last-commit/IlyaBurlak/Alpha-Hackathon)](https://github.com/IlyaBurlak/Alpha-Hackathon/commits)
[![Размер репозитория](https://img.shields.io/github/repo-size/IlyaBurlak/Alpha-Hackathon)](https://github.com/IlyaBurlak/Alpha-Hackathon)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-ML-009688?logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

Название команды: _укажите_

## Команда

| Участник | Роль | Ссылка |
| --- | --- | --- |
| Илья Бурлак | Frontend-разработчик, DevOps | [IlyaBurlak](https://github.com/IlyaBurlak) |
| Ольга Якубова | PM, QA, Аналитик| [OlgaRhythm](https://github.com/OlgaRhythm) |
| София Васюнина | ML-инженер, | [sofapiano](https://github.com/sofapiano) |
| Ангелика Василенко | Backend-разработчик | [An-Vas](https://github.com/An-Vas) |
| Виктория Кулешова | UX/UI-дизайнер | [@vktorriaa](https://t.me/vktorriaa) |

## Стенд

Демо-стенд развёрнут по адресу **http://185.96.80.227**: кабинет предпринимателя `/login`, кабинет сотрудника `/staff/login`, Swagger `/swagger/`.

## О продукте

**«Бизнес-кредиты»** — веб-сервис сквозной обработки кредитной заявки малого бизнеса: от создания заявки предпринимателем через рассмотрение оператором банка до зачисления средств на счёт. Один клиент, два кабинета по роли: предпринимателя и сотрудника банка.

### Цель

Сократить путь от «нужны деньги» до решения по кредиту: предприниматель сам подбирает продукт и видит статус заявки, а оператор получает всю информацию в одном месте и рекомендацию ML-модели.

### Задачи

- Подобрать предпринимателю подходящие кредитные продукты по сумме и сроку, наглядно сравнить их и показать график платежей.
- Убрать ручной ввод: данные компании подставляются из профиля банка, вручную вводятся только сумма и срок.
- Автоматически запрашивать данные о компании во внешних системах (бюро кредитных историй, ЕГРЮЛ/ЕГРИП) и запускать ML-скоринг сразу после подачи заявки.
- Дать оператору единую карточку заявки (финансы, юридические данные, долги, скоринг) и рекомендованное решение; последнее слово остаётся за оператором.
- Поддержать разные исходы: одобрение, отказ с причинами, другие условия, запрос данных.
- Сохранять работоспособность при недоступности внешних систем.

### Что внутри

| Часть | Технологии | Назначение |
| --- | --- | --- |
| `client` | React, TypeScript, MobX | кабинеты предпринимателя и сотрудника |
| `server` | Express, TypeScript, SQLite | публичный API и бизнес-логика |
| `ml` | FastAPI, scikit-learn | скоринг заявок |
| `externalSystemsMock` | Node.js | мок банка, кредитного бюро и реестра |

Данные о продуктах, компаниях и пользователях сгенерированы и не имеют юридической силы.

Обоснование дизайна — в [docs/design-rationale.md](docs/design-rationale.md).

## Запуск

Запуск из опубликованного образа, в нём клиент, сервер, ML и мок внешних систем. Образ публичный, вход в ghcr не нужен.

```bash
docker run -d --name alpha -e JWT_SECRET=любая-строка -p 8080:8080 ghcr.io/ilyaburlak/alpha-hackathon:latest
```

После запуска всё доступно на **http://localhost:8080**.

| Что | Адрес |
| --- | --- |
| Кабинет предпринимателя | `/login` |
| Кабинет сотрудника | `/staff/login` |
| Панель внешних систем | `/admin` |

Учётные записи: пароль равен логину с `!` на конце.

| Роль | Логин / пароль |
| --- | --- |
| Предприниматель | `alfaAngelika` / `alfaAngelika!` |
| Оператор банка | `alfaOperator1` / `alfaOperator1!` |

Остальные учётные записи — в [сценариях](docs/test-scenarios.md). БД (SQLite) лежит внутри контейнера: `docker stop` и `docker start` её сохраняют, `docker rm` стирает.

Остановить и удалить: `docker rm -f alpha`.

## Документация

- [Описание проекта](docs/project-description.md)
- [Дизайн-решения](docs/design-rationale.md) — почему интерфейс устроен так: подбор, заявки, скоринг, графики
- [Тестовые сценарии](docs/test-scenarios.md) — пошаговая проверка основных потоков
- [Клиент](client/README.md)
- [Сервер](server/README.md)
- [Интеграционные тесты сервера](server/tests/integration/README.md)
- [ML-сервис](ml/README.md) и [контракт ML](docs/ml-contract.md)
- [Мок внешних систем](externalSystemsMock/README.md)
- [Сторонние компоненты](THIRD_PARTY_NOTICES)
- [Лицензия](LICENSE) (MIT)

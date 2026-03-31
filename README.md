# DOU First Job Monitor

Node.js/TypeScript проєкт для моніторингу вакансій на DOU в категорії **"Перша робота"**.

## Що робить

- При першому запуску:
  - збирає всі поточні вакансії з `https://jobs.dou.ua/first-job/`
  - зберігає їх у SQLite як already known
  - НЕ надсилає Telegram-повідомлення

- При наступних запусках:
  - знову зчитує поточні вакансії
  - знаходить лише нові
  - перевіряє релевантність
  - якщо вакансія релевантна і ще не була оброблена — надсилає повідомлення в Telegram
  - повторно ту саму вакансію не відправляє

## Правила релевантності

Вакансія підходить, якщо в `title` або `description` є:

- `intern` + хоча б одне з:
  - `javascript`
  - `python`
  - `node.js`
  - `react`
  - `typescript`

або

- `trainee` + хоча б одне з:
  - `javascript`
  - `python`
  - `node.js`
  - `react`
  - `typescript`

Перевірка:

- без урахування регістру
- по `title` і `description`

## Стек

- Node.js
- TypeScript
- SQLite
- Telegram Bot API
- GitHub Actions

---

## Структура проєкту

```text
src/
  clients/
    dou.client.ts
    telegram.client.ts
  config/
    env.ts
  db/
    database.ts
    vacancies.repository.ts
  models/
    vacancy.ts
  services/
    monitor.service.ts
    relevance.service.ts
  utils/
    logger.ts
  index.ts
```

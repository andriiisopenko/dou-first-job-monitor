# DOU First Job Monitor

Node.js/TypeScript проєкт для моніторингу вакансій на DOU в категорії **"Перша робота"** з автоматичними Telegram-сповіщеннями, SQLite для дедуплікації та GitHub Actions для регулярного запуску.

## Можливості

- збирає вакансії з `https://jobs.dou.ua/first-job/`
- при першому запуску зберігає всі поточні вакансії як already known
- при наступних запусках шукає лише нові вакансії
- не надсилає повторні повідомлення для вже оброблених вакансій
- зберігає стан у SQLite
- надсилає нові релевантні вакансії в Telegram
- надсилає heartbeat-повідомлення, щоб показати, що монітор працює
- надсилає summary після кожної перевірки
- зберігає SQLite між GitHub Actions runs через cache

## Стек

- Node.js
- TypeScript
- SQLite
- Telegram Bot API
- GitHub Actions
- Cheerio

## Логіка релевантності

Вакансія вважається релевантною, якщо:

- містить одне з:
  - `intern`
  - `trainee`
  - `junior`
  - `graduate`
  - `entry level`
  - `entry-level`

і водночас містить хоча б один стековий keyword:

- `javascript`
- `js`
- `python`
- `node.js`
- `nodejs`
- `react`
- `typescript`
- `nestjs`
- `next.js`
- `nextjs`

Додатково враховуються технічні whitelist-слова:

- `frontend`
- `backend`
- `fullstack`
- `full-stack`
- `software engineer`
- `developer`
- `engineer`

І відсікаються вакансії з blacklist-словами:

- `sales`
- `support`
- `manager`
- `seo`
- `hr`
- `recruiter`
- `marketing`

Перевірка:

- без урахування регістру
- по `title`
- по короткому опису
- по повному тексту вакансії зі сторінки вакансії

## Повідомлення в Telegram

### Нова вакансія

Бот надсилає повідомлення такого формату:

```text
Нова вакансія

Назва: Trainee Frontend Developer
Компанія: Company Name
Збіг: trainee + react + typescript
URL: https://jobs.dou.ua/...
```

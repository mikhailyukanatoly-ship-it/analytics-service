# Test task Trementum Analytics

---

# Інструкція для першого запуску

### Попередні вимоги

- Docker та Docker Compose встановлені на вашому комп'ютері

## Кроки для запуску

**1. Налаштування змінних оточення**

Скопіюйте файл `.env.example` в `.env`:

```bash
cp .env.example .env
```

За потреби відредагуйте змінні у файлі `.env`.

**2. Запуск контейнерів**

```bash
docker compose up -d
```

**3. Очікування запуску**

Зачекайте, поки всі контейнери запустяться та виконають свої задачі:

- `postgres` — база даних PostgreSQL
- `migration` — виконання міграцій (зупиниться після завершення)
- `app` — основний додаток
- `data-import` — імпорт CSV-даних (зупиниться після завершення)

Перевірити готовність можна через логи:

```bash
docker compose logs data-import
```

Результат успішного імпорту:

```
✅ Imported 30 accounts
✅ Imported 1021 posts
✅ Imported 30 follower sources
```

**4. Доступ до документації**

```
http://localhost:3001/api/docs
```

---

## Тестові запити

### Leaderboard — рейтинг акаунтів за engagement

```bash
curl -s "http://localhost:3001/api/analytics/leaderboard?limit=5&offset=0"
```

З фільтрами:

```bash
curl -s "http://localhost:3001/api/analytics/leaderboard?limit=5&verified=true&startDate=2023-01-01&endDate=2023-12-31"
```

### Best Posting Time — найкращий час для публікацій

```bash
curl -s "http://localhost:3001/api/analytics/best-posting-time"
```

З фільтром по акаунту:

```bash
curl -s "http://localhost:3001/api/analytics/best-posting-time?profileId=100069390481601"
```

### Consistency Score — регулярність публікацій

```bash
curl -s "http://localhost:3001/api/analytics/consistency-score"
```

З фільтром по акаунту:

```bash
curl -s "http://localhost:3001/api/analytics/consistency-score?accountId=100069390481601"
```

---

## Примітки

- Контейнер `migration` зупиняється автоматично після виконання міграцій
- Дані у CSV покривають період `2022-12` — `2023-04`
- При повторному запуску `docker compose up -d` дані зберігаються у volume `postgres_data`
- Для повного скидання даних: `docker compose down -v`

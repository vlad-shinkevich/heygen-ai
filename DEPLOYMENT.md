# Deployment Guide - HeyGen Video Generator

## Настройка автоматической отправки видео

После завершения генерации видео автоматически отправляются пользователю в Telegram. Есть два способа обработки:

### Способ 1: Webhook (Рекомендуется)

1. **Настройте webhook в HeyGen Dashboard:**
   - Зайдите в HeyGen Dashboard → Settings → Webhooks
   - Добавьте webhook URL: `https://your-app.vercel.app/api/webhook/heygen`
   - Выберите события: `video.completed`, `video.failed`

2. **HeyGen будет автоматически отправлять уведомления** при завершении генерации

### Способ 2: Cron Job / Scheduled Task

Если webhook недоступен, используйте периодическую проверку:

1. **Настройте Vercel Cron Job:**
   - Создайте файл `vercel.json` в корне проекта:

```json
{
  "crons": [
    {
      "path": "/api/video/process-completed",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

   - Это будет проверять завершенные видео каждые 2 минуты

2. **Или используйте внешний сервис:**
   - [cron-job.org](https://cron-job.org) - бесплатный сервис для cron jobs
   - Настройте запрос: `POST https://your-app.vercel.app/api/video/process-completed`
   - Частота: каждые 2-5 минут

## Переменные окружения

Убедитесь, что в Vercel настроены все переменные:

| Variable | Описание | Где взять |
|----------|----------|-----------|
| `HEYGEN_API_KEY` | API ключ HeyGen | HeyGen Dashboard → Settings → API |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | @BotFather → `/token` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase проекта | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key | Supabase Dashboard → Settings → API |

## Настройка базы данных

Выполните SQL из `supabase/schema.sql` в Supabase SQL Editor.

## Проверка работы

1. **Сгенерируйте тестовое видео** через приложение
2. **Проверьте логи Vercel** - должны быть записи о сохранении в историю
3. **Подождите завершения генерации** (обычно 1-3 минуты)
4. **Проверьте, что видео отправлено** в Telegram пользователю

## Ручная проверка завершенных видео

Можно вручную запустить обработку:

```bash
curl -X POST https://your-app.vercel.app/api/video/process-completed
```

## Мониторинг

- **История генераций:** `GET /api/video/history?telegramId=YOUR_ID`
- **Статистика кредитов:** `GET /api/video/credits?telegramId=YOUR_ID`
- **Тест Supabase:** `GET /api/test/supabase`

## Troubleshooting

### Видео не отправляются

1. Проверьте `TELEGRAM_BOT_TOKEN` в Vercel
2. Проверьте логи в Vercel Functions
3. Убедитесь, что пользователь есть в `allowed_users`
4. Проверьте, что `video_generations` таблица создана

### Webhook не работает

1. Проверьте URL webhook в HeyGen Dashboard
2. Проверьте логи в Vercel Functions → `/api/webhook/heygen`
3. Убедитесь, что webhook endpoint доступен публично

### Кредиты не отслеживаются

1. Проверьте функцию `update_credit_tracking` в Supabase
2. Проверьте таблицу `credit_tracking`
3. Убедитесь, что `credits_used` обновляется при завершении видео


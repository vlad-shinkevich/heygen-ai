# HeyGen Video Generator - Telegram Mini App

Веб-приложение для генерации AI видео с аватарами через HeyGen API. Работает как Telegram Mini App с контролем доступа через Supabase.

## Функционал

- 🎭 Выбор аватаров с поддержкой групп
- 🎤 Выбор голоса для озвучки
- 📝 Ввод текста для генерации речи (Text-to-Speech)
- 🎵 Загрузка готовой аудиодорожки
- ⚙️ Настройки видео (aspect ratio, стиль аватара, фон)
- 📱 Оптимизировано для Telegram Mini App
- 🔐 Контроль доступа через Supabase (whitelist пользователей)
- 🧪 Тестовый режим для бесплатных превью

## Технологии

- **Next.js 16** - React фреймворк
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **shadcn/ui** - UI компоненты
- **HeyGen API v2** - генерация видео
- **Telegram Mini App SDK** - интеграция с Telegram
- **Supabase** - база данных для whitelist пользователей

---

## Установка

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/heygen-app.git
cd heygen-app

# Установить зависимости
npm install

# Установить Supabase клиент
npm install @supabase/supabase-js
```

---

## Настройка Supabase

### 1. Создайте проект на Supabase

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Скопируйте **Project URL** и **Service Role Key** (в Settings → API)

### 2. Создайте таблицу

Выполните SQL из файла `supabase/schema.sql` в SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS allowed_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allowed_users_telegram_id ON allowed_users(telegram_id);
```

### 3. Добавьте пользователей

```sql
INSERT INTO allowed_users (telegram_id, username, first_name, notes)
VALUES 
    (123456789, 'your_username', 'YourName', 'Admin');
```

> 💡 **Как узнать Telegram ID:** Напишите боту [@userinfobot](https://t.me/userinfobot) или откройте приложение — ID отобразится на экране "Доступ запрещён"

---

## Настройка Telegram Bot

### 1. Создайте бота

1. Напишите [@BotFather](https://t.me/BotFather)
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Скопируйте **Bot Token**

### 2. Создайте Mini App

1. В @BotFather отправьте `/newapp`
2. Выберите вашего бота
3. Укажите название приложения
4. Загрузите иконку (512x512 PNG)
5. Укажите URL: `https://your-app.vercel.app`

### 3. Добавьте кнопку меню (опционально)

```
/setmenubutton
```

---

## Переменные окружения

### Локальная разработка

Создайте файл `.env.local`:

```env
# HeyGen API
HEYGEN_API_KEY=your_heygen_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Vercel

В настройках проекта (Settings → Environment Variables) добавьте:

| Name | Value | Environment |
|------|-------|-------------|
| `HEYGEN_API_KEY` | ваш ключ HeyGen | All |
| `TELEGRAM_BOT_TOKEN` | токен бота | All |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key | All |

---

## Как работает авторизация

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Telegram Mini  │────▶│   Next.js API    │────▶│   Supabase    │
│      App        │     │  /api/auth/tg    │     │ allowed_users │
└─────────────────┘     └──────────────────┘     └───────────────┘
        │                       │                        │
        │ initData              │ 1. Verify signature    │
        │ (user, hash)          │ 2. Check whitelist     │
        │                       │                        │
        ▼                       ▼                        ▼
   User opens app ──────▶ Validate hash ──────▶ Check telegram_id
                              │                        │
                              │                        │
                         ┌────┴────┐              ┌────┴────┐
                         │  Valid  │              │ Allowed │
                         └────┬────┘              └────┬────┘
                              │                        │
                              ▼                        ▼
                         ┌─────────────────────────────────┐
                         │         Access Granted          │
                         └─────────────────────────────────┘
```

1. **Пользователь открывает Mini App** — Telegram передаёт `initData` с данными пользователя и подписью
2. **Сервер проверяет подпись** — Используя `TELEGRAM_BOT_TOKEN`, валидируем что данные от Telegram
3. **Проверка whitelist** — Ищем `telegram_id` в таблице `allowed_users`
4. **Результат** — Если пользователь найден и активен — доступ разрешён

---

## Управление пользователями

### Добавить пользователя

```sql
INSERT INTO allowed_users (telegram_id, username, first_name, notes)
VALUES (123456789, 'username', 'Name', 'Описание');
```

### Деактивировать пользователя

```sql
UPDATE allowed_users SET is_active = false WHERE telegram_id = 123456789;
```

### Посмотреть всех пользователей

```sql
SELECT * FROM allowed_users ORDER BY created_at DESC;
```

### Удалить пользователя

```sql
DELETE FROM allowed_users WHERE telegram_id = 123456789;
```

---

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/telegram` | POST | Проверка авторизации Telegram |
| `/api/avatars` | GET | Список аватаров |
| `/api/avatar-groups` | GET | Группы аватаров |
| `/api/avatar-groups/[groupId]/avatars` | GET | Аватары в группе |
| `/api/voices` | GET | Список голосов |
| `/api/video/generate` | POST | Генерация видео |
| `/api/video/status/[videoId]` | GET | Статус видео |
| `/api/upload` | POST | Загрузка аудио |
| `/api/quota` | GET | Остаток квоты |

---

## Структура проекта

```
heygen-app/
├── app/
│   ├── api/
│   │   ├── auth/telegram/     # Авторизация Telegram
│   │   ├── avatars/           # Аватары
│   │   ├── avatar-groups/     # Группы аватаров
│   │   ├── voices/            # Голоса
│   │   ├── video/             # Генерация видео
│   │   ├── upload/            # Загрузка файлов
│   │   └── quota/             # Квота
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── auth-guard.tsx         # Компонент авторизации
│   ├── avatar-selector.tsx
│   ├── voice-selector.tsx
│   └── ...
├── lib/
│   ├── hooks/
│   │   ├── use-auth.ts        # Hook авторизации
│   │   ├── use-heygen.ts
│   │   └── use-telegram.ts
│   ├── services/
│   │   ├── heygen-api.ts
│   │   ├── supabase.ts        # Supabase клиент
│   │   └── telegram-auth.ts   # Верификация Telegram
│   ├── types/
│   │   ├── heygen.ts
│   │   └── telegram.ts
│   └── ...
├── supabase/
│   └── schema.sql             # SQL схема
└── ...
```

---

## Разработка

```bash
# Dev сервер
npm run dev

# Сборка
npm run build

# Lint
npm run lint
```

> ⚠️ В режиме разработки (вне Telegram) авторизация пропускается для удобства тестирования.

---

## Лицензия

MIT

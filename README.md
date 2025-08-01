# Journalist Research Bot

Telegram бот для журналистов-исследователей с функциями поиска, кросс-чека информации и анализа источников.

## Функциональность

- 🔍 Поиск информации по запросу в доверенных источниках
- ✅ Кросс-чек фактов из разных источников
- 💬 Извлечение ключевых цитат со ссылками
- 🌐 Перевод найденной информации
- 📊 Суммаризация по темам
- 🔗 Интеграция с n8n для сложных workflow
- 🔓 Обход пейволлов через RemovePaywall

## ⚠️ ВАЖНО: Безопасность

**НИКОГДА не публикуйте ваш токен бота!** 

- Файл `.env` должен оставаться только на вашем компьютере
- Не коммитьте `.env` в git
- Если токен был скомпрометирован, немедленно отзовите его в @BotFather

## Установка

### Требования

- Node.js 18+ или Bun
- Telegram Bot Token
- (Опционально) Google Translate API Key
- (Опционально) n8n instance

### Шаги установки

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/journalist-research-bot.git
cd journalist-research-bot
```

2. Установите зависимости:
```bash
npm install
# или
bun install
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Заполните обязательные переменные окружения в файле `.env`:
```env
BOT_TOKEN=your_telegram_bot_token_here
```

**Важно**: Получите токен от @BotFather в Telegram и держите его в секрете!

5. Запустите бота:
```bash
npm run start
# или
bun run start
```

## Использование

### Команды бота

- `/start` - Приветственное сообщение
- `/help` - Подробная инструкция
- `/sources` - Список доверенных источников
- Любое текстовое сообщение - запрос на исследование

### Примеры запросов

- "Климатические изменения в 2024 году"
- "Проверь информацию о новой вакцине от COVID"
- "Последние новости о выборах в США"

## Архитектура

```
src/
├── bot/          # Telegram bot handlers
├── services/     # Business logic services
│   ├── scraper.ts    # Web scraping
│   ├── search.ts     # Search engines
│   ├── research.ts   # Cross-checking
│   ├── n8n.ts        # n8n integration
│   └── translation.ts # Translation service
├── config/       # Configuration
├── types/        # TypeScript types
└── utils/        # Utilities
```

## Доверенные источники

Бот приоритизирует информацию из доверенных источников:

- Международные новостные агентства (BBC, Reuters, AP)
- Факт-чекинговые организации (Snopes, FactCheck.org)
- Академические публикации
- Официальные правительственные сайты

## n8n Интеграция

Для расширенной функциональности можно настроить интеграцию с n8n:

1. Создайте webhook в n8n
2. Добавьте URL и API ключ в `.env`
3. Создайте workflow для обработки запросов

### Поддерживаемые workflow

- `start_research` - Начало исследования
- `enhance_search` - Улучшение результатов поиска
- `cross_check` - Кросс-проверка фактов
- `generate_summary` - Генерация суммаризации

## Разработка

### Запуск в режиме разработки

```bash
npm run dev
# или
bun run dev
```

### Сборка

```bash
npm run build
# или
bun run build
```

## Лицензия

MIT
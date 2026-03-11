# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Скрипты автоматизации

### notion-sync.js
**Функция:** Двусторонняя синхронизация MD файлов с Notion
**Использование:**
```bash
node scripts/notion-sync.js
```
**Клавиатура:** Интерактивное подтверждение изменений
**Что делает:**
- Сравнивает локальные MD файлы с Notion
- Генерирует саммари изменений (NEW, MODIFIED, DELETED)
- Интерактивно спрашивает подтверждение `да/нет`
- Применяет изменения по выбранному направлению

**Файлы:** MEMORY.md, AGENTS.md, IDENTITY.md, SOUL.md, TOOLS.md

---

### rclone-auto.js
**Функция:** Автоматическое копирование файлов с мониторингом
**Использование:**
```bash
node scripts/rclone-auto.js
```
**Конфигурация:** Source/Target/Transfers из Notion Status block
**Правила:**
- Статус → Notion (каждые 30 секунд)
- Скорость < 2 MiB/s → ↑ до 12 потоков
- Ошибки сети (408, timeout) → ↓ до 4 потоков
- CPU/RAM > 80% → пауза 2 минуты, затем ↓ до 4 потоков

**Копирование:**
1. **Grand Theft Auto V by xatab** (завершено, 17/17 файлов)
   - Источник: Яндекс.Диск → Mail.ru/apps
   - Размер: 57.95 GiB
   - Время: ~2 часа

2. **Документы** (в процессе)
   - Источник: Яндекс.Диск → Mail.ru/Documents
   - Папка: /disk/Документы → /Documents

---

### rclone-monitor.js
**Функция:** Публикация статуса копирования в Notion
**Использование:**
```bash
node scripts/rclone-monitor.js
```
**Блок:** Status block в Notion (31a1c652eef7813e98dce20254be80a3)
**Частота:** Каждые 30 секунд
**Данные:** Прогресс, скорость, ETA, активные файлы

---

## Интеграция Supabase

### Хуки Supabase
**Функция:** Получение композиторов и произведений из базы
**Использование:**
```typescript
import { useComposers, useWorks } from '../hooks/useSupabase';
```
**Таблицы:**
- `composers` (4 композитора: Bach, Vivaldi, Mozart, Beethoven)
- `works` (4 произведения: Toccata, Spring, Sonata, Ode to Joy)
- `listeners` (история прослушиваний)

**Миграция:** Данные мигрированы из локального массива в Supabase (scripts/migrate-to-supabase.ts)

---

## Примеры команд

### rclone
```bash
# Копирование папки
rclone copy source:destination --checksum --update

# Список файлов
rclone ls source: --long

# Мониторинг
watch -n 1 rclone ls source:
```

### Supabase
```bash
# Генерация типов
npx supabase gen types typescript --project-ref jtytuaxjkyswzuqrwweq --schema public

# Миграция
npx ts-node scripts/migrate-to-supabase.ts
```

---
## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

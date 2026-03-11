# music_time_line - Project Summary

**Дата:** 2026-03-11
**Статус:** В разработке (Supabase интеграция завершена)

---

## ✅ Что сделано

### 1. Технологический стек
- React 19.2.4 + TypeScript + Vite
- VexFlow 5.0.0 (нотная запись)
- Supabase SDK + React Query
- Web Audio API (с эпохальной динамикой)

### 2. Фронтенд

**Компоненты:**
- `ScoreCanvas` — интерактивная временная шкала композиторов
- `FullScreenScore` — полноэкранный просмотр нот
- `VexScore` — рендеринг нот через VexFlow
- `StaveRoad` — линии связей между композиторами

**Хуки:**
- `useSupabase` — загрузка composers/works из Supabase
- `useAudioPlayer` — воспроизведение с эпохальной динамикой
- `useScoreLogic` — логика подсчета очков

### 3. Audio Playback

**Особенности:**
- Эпохальная динамика (Baroque, Classical, Romantic, 20th Century, Contemporary)
- Аккорды (treble + bass одновременно)
- ADSR envelope для реалистичного звука
- Play/Pause/Stop управление

### 4. Supabase

**Схема базы данных:**
```sql
- composers (id, name, era, life_dates, image, x, y, predecessors)
- works (id, composer_id, title, tonality, key, tempo, notes)
- listeners (id, user_id, current_work_id, last_played)
```

**Project ID:** `jtytuaxjkyswzuqrwweq`
**Ключи:** Настроены в `.env`

---

## 🎯 План действий

### 1. Применить SQL-схему в Supabase ⏳
```bash
# Через SQL Editor в Supabase Dashboard
# Или через CLI:
npx supabase db push
```

### 2. Создать демо-данные ⏳
Скрипт `scripts/migrate-to-supabase.ts`:
- Композиторы: Bach, Mozart, Beethoven, Debussy, etc.
- Произведения с нотами (notes: string[][])
- Координаты x/y для timeline

### 3. Проверить работу приложения ⏳
```bash
cd /home/ohmo/.openclaw/workspace/music_time_line
npm run dev
```

**Что проверить:**
- Загрузка данных из Supabase
- Воспроизведение аудио
- Навигация по timeline
- Переход в полноэкранный режим

### 4. Коммит в Git ⏳
```bash
git add .
git commit -m "feat: integrate Supabase and enhance audio playback"
```

### 5. Деплой ⏳
- Выбрать хостинг: Vercel, Netlify, Surge
- Настроить environment variables
- Проверить продакшн-билд

---

## 📦 Команды

```bash
cd /home/ohmo/.openclaw/workspace/music_time_line

# Development
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint

# Supabase
npm run migrate    # Миграция данных
npm run typegen    # Генерация TypeScript типов
```

---

## 🔗 Полезные ссылки

- Supabase Dashboard: https://supabase.com/dashboard/project/jtytuaxjkyswzuqrwweq
- VexFlow Docs: https://vexflow.com/
- React Query Docs: https://tanstack.com/query/latest

---

**Следующий шаг:** Применить SQL-схему и создать демо-данные.

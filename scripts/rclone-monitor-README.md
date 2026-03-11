# rclone-monitor.js

Мониторинг и публикация статуса rclone в Notion.

## Использование

```bash
node /home/ohmo/.openclaw/workspace/scripts/rclone-monitor.js
```

## Что делает

1. **Парсит данные прогресса** из `rclone-gta-stdout.log`
2. **Формирует статус:**
   - % прогресса
   - Перенесено GiB / всего GiB
   - Скорость MiB/s
   - ETA
3. **Публикует в Notion** в блок `31a1c652eef7813e98dce20254be80a3`

## Автоматизация

Добавлено в `HEARTBEAT.md` для автоматического запуска каждые 5 минут.

## Конфигурация

- `NOTION_KEY`: токен Notion (по умолчанию: `<your-notion-token>`)
- `STATUS_BLOCK_ID`: ID блока для статуса в Notion
- `RCLONE_STDOUT`: путь к stdout логу rclone
- `RCLONE_LOG`: путь к логу rclone

## Статусы

- **📊 Active:** идёт копирование с прогрессом
- **✅ Completed:** файл скопирован
- **⏳ Starting:** копирование запущено
- **✅ Idle:** копирование завершено или не запущено
- **❌ Error:** ошибка парсинга

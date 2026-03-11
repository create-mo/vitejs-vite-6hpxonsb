# Скрипты синхронизации

## notion-sync.js

Двусторонняя синхронизация MD-файлов с Notion.

### Использование

```bash
cd /home/ohmo/.openclaw/workspace
node scripts/notion-sync.js
```

### Что делает

1. Сравнивает локальные файлы с Notion
2. Показывает саммари изменений
3. Ждёт подтверждения (1/2/3):
   - 1 → Локально → Notion
   - 2 → Notion → Локально
   - 3 → Отмена

### Файлы для синхронизации

- MEMORY.md
- AGENTS.md
- IDENTITY.md
- SOUL.md
- USER.md
- TOOLS.md

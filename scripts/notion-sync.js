#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Конфигурация
const NOTION_KEY = process.env.NOTION_KEY;
const MD_PAGE_ID = '3191c652eef7812e82eeeee5e19b3290';
const WORKSPACE = process.env.WORKSPACE || '/home/ohmo/.openclaw/workspace';

// Файлы для синхронизации (имя файла → Notion block ID)
const SYNC_FILES = {
  'MEMORY.md': '3191c652-eef7-81ac-82cd-fb2a4e5b0b09',
  'AGENTS.md': '3191c652-eef7-81b8-8c0f-e6fbef05ac2a',
  'IDENTITY.md': '3191c652-eef7-81cc-ab07-df1f9eb1c38d',
  'SOUL.md': null,  // нужно получить
  'USER.md': null,
  'TOOLS.md': null
};

// Получить список страниц и найти block ID
async function findBlockIds() {
  console.log('🔍 Поиск block ID для файлов...');
  const blocks = await fetch(`/v1/blocks/${MD_PAGE_ID}/children`);

  for (const result of blocks.results) {
    if (result.type === 'child_page') {
      const title = result.child_page.title;
      const cleanTitle = title.replace(/^[^\w-]+\s*/, ''); // убрать эмодзи
      for (const [file, blockId] of Object.entries(SYNC_FILES)) {
        if (cleanTitle === file && !blockId) {
          SYNC_FILES[file] = result.id;
          console.log(`  ✓ ${file} → ${result.id}`);
        }
      }
    }
  }
}

// Получить хеш файла
function getFileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('md5').update(content).digest('hex');
}

// Получить контент из Notion code block
async function getNotionContent(blockId) {
  const children = await fetch(`/v1/blocks/${blockId}/children`);

  for (const block of children.results) {
    if (block.type === 'code') {
      const text = block.code.rich_text.map(t => t.text.content).join('');
      return text;
    }
  }
  return null;
}

// Сравнить версии
function compareVersions(localContent, notionContent) {
  const localLines = localContent.split('\n');
  const notionLines = notionContent ? notionContent.split('\n') : [];

  let changes = [];
  let maxLen = Math.max(localLines.length, notionLines.length);

  for (let i = 0; i < maxLen; i++) {
    const local = localLines[i] || '';
    const notion = notionLines[i] || '';

    if (local !== notion) {
      changes.push({
        line: i + 1,
        local: local || '(нет)',
        notion: notion || '(нет)',
        type: !notion ? 'NEW' : !local ? 'DELETED' : 'MODIFIED'
      });
    }
  }

  return changes;
}

// Обновить Notion code block
async function updateNotionBlock(blockId, content) {
  await fetch(`/v1/blocks/${blockId}`, 'PATCH', {
    code: {
      rich_text: [{ type: 'text', text: { content } }],
      language: 'markdown'
    }
  });
}

// Обновить локальный файл
function updateLocalFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Получить текущий code block (для обновления)
async function getFirstCodeBlock(blockId) {
  const children = await fetch(`/v1/blocks/${blockId}/children`);

  for (const block of children.results) {
    if (block.type === 'code') {
      return block.id;
    }
  }
  return null;
}

// Обновить code block внутри страницы
async function updateCodeBlock(pageBlockId, content) {
  const children = await fetch(`/v1/blocks/${pageBlockId}/children`);

  for (const block of children.results) {
    if (block.type === 'code') {
      return await fetch(`/v1/blocks/${block.id}`, 'PATCH', {
        code: {
          rich_text: [{ type: 'text', text: { content } }],
          language: 'markdown'
        }
      });
    }
  }

  // Если code block нет, создать
  return await fetch(`/v1/blocks/${pageBlockId}/children`, 'PATCH', {
    children: [{
      object: 'block',
      type: 'code',
      code: {
        rich_text: [{ type: 'text', text: { content } }],
        language: 'markdown'
      }
    }]
  });
}

// Главная функция
async function main() {
  console.log('\n🔄 Синхронизация файлов с Notion\n');

  // Получить block ID
  await findBlockIds();

  const summary = [];
  let hasChanges = false;

  for (const [file, blockId] of Object.entries(SYNC_FILES)) {
    if (!blockId) {
      console.log(`⚠️  ${file}: не найден в Notion`);
      continue;
    }

    const localPath = path.join(WORKSPACE, file);

    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  ${file}: нет локального файла`);
      continue;
    }

    const localContent = fs.readFileSync(localPath, 'utf8');
    const notionContent = await getNotionContent(blockId);

    const changes = compareVersions(localContent, notionContent);

    if (changes.length > 0) {
      hasChanges = true;
      console.log(`\n📝 ${file}: ${changes.length} изменений`);

      // Показать все изменения
      changes.forEach(c => {
        if (c.type === 'NEW') {
          console.log(`  + Стр ${c.line}: ${c.local.substring(0, 50)}...`);
        } else if (c.type === 'DELETED') {
          console.log(`  - Стр ${c.line}: ${c.notion.substring(0, 50)}...`);
        } else {
          console.log(`  ~ Стр ${c.line}:`);
          console.log(`    - ${c.notion.substring(0, 50)}...`);
          console.log(`    + ${c.local.substring(0, 50)}...`);
        }
      });

      summary.push({ file, blockId, localPath, localContent, notionContent, changes });
    } else {
      console.log(`✓ ${file}: без изменений`);
    }
  }

  if (!hasChanges) {
    console.log('\n✅ Всё синхронизировано, изменений нет.');
    return;
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 Итого: файлы с изменениями');
  console.log('='.repeat(50));
  summary.forEach(s => {
    console.log(`  • ${s.file} (${s.changes.length} изменений)`);
  });

  // Интерактивное подтверждение
  console.log('\n⚠️  Выберите действие:');
  console.log('  1. Локально → Notion (переписать Notion)');
  console.log('  2. Notion → Локально (переписать локальные файлы)');
  console.log('  3. Отмена');

  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\nВаш выбор (1/2/3): ', async (answer) => {
    rl.close();

    if (answer === '1') {
      console.log('\n⬆️  Обновление Notion...');
      for (const s of summary) {
        await updateCodeBlock(s.blockId, s.localContent);
        console.log(`  ✓ ${s.file}`);
      }
      console.log('\n✅ Notion обновлён');
    } else if (answer === '2') {
      console.log('\n⬇️  Обновление локальных файлов...');
      for (const s of summary) {
        if (s.notionContent) {
          updateLocalFile(s.localPath, s.notionContent);
          console.log(`  ✓ ${s.file}`);
        } else {
          console.log(`  ⚠️  ${s.file}: нет контента в Notion`);
        }
      }
      console.log('\n✅ Локальные файлы обновлены');
    } else {
      console.log('\n❌ Отменено');
    }
  });
}

// HTTP запрос к Notion API
function fetch(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = `https://api.notion.com${endpoint}`;
    const options = {
      hostname: 'api.notion.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

main().catch(console.error);

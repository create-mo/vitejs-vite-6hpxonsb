#!/usr/bin/env node

// Загрузить .env
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const https = require('https');
const crypto = require('crypto');

// Конфигурация
const NOTION_KEY = process.env.NOTION_KEY;
const MD_PAGE_ID = '3191c652eef7812e82eeeee5e19b3290';
const WORKSPACE = process.env.WORKSPACE || '/home/ohmo/.openclaw/workspace';

// Файлы для синхронизации
const SYNC_FILES = {
  'MEMORY.md': '3191c652-eef7-81ac-82cd-fb2a4e5b0b09',
  'AGENTS.md': '3191c652-eef7-81b8-8c0f-e6fbef05ac2a',
  'IDENTITY.md': '3191c652-eef7-81cc-ab07-df1f9eb1c38d',
  'SOUL.md': null,
  'USER.md': null,
  'TOOLS.md': null
};

// Получить block ID для файлов
async function findBlockIds() {
  const blocks = await fetch(`/v1/blocks/${MD_PAGE_ID}/children`);

  if (!blocks || !blocks.results) {
    console.error('❌ Ошибка получения блоков Notion:', JSON.stringify(blocks));
    return;
  }

  for (const result of blocks.results) {
    if (result.type === 'child_page') {
      const title = result.child_page.title;
      const cleanTitle = title.replace(/^[^\w-]+\s*/, '');
      for (const [file, blockId] of Object.entries(SYNC_FILES)) {
        if (cleanTitle === file && !blockId) {
          SYNC_FILES[file] = result.id;
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

// Получить контент из Notion code blocks (конкатенировать все)
async function getNotionContent(blockId) {
  const children = await fetch(`/v1/blocks/${blockId}/children`);

  let content = '';
  for (const block of children.results) {
    if (block.type === 'code') {
      const text = block.code.rich_text.map(t => t.text.content).join('');
      content += text + '\n';
    }
  }
  return content.trim();
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

// Главная функция
async function main() {
  await findBlockIds();

  const summary = [];
  let hasChanges = false;

  for (const [file, blockId] of Object.entries(SYNC_FILES)) {
    if (!blockId) continue;

    const localPath = path.join(WORKSPACE, file);

    if (!fs.existsSync(localPath)) continue;

    const localContent = fs.readFileSync(localPath, 'utf8');
    const notionContent = await getNotionContent(blockId);

    const changes = compareVersions(localContent, notionContent);

    if (changes.length > 0) {
      hasChanges = true;
      summary.push({ file, changes });
    }
  }

  if (hasChanges) {
    // Сохранить саммари для последующего чтения
    const summaryPath = path.join(WORKSPACE, 'memory', 'sync-summary.md');
    const summaryContent = generateSummary(summary);
    fs.writeFileSync(summaryPath, summaryContent, 'utf8');

    console.log('CHANGES_DETECTED');
  } else {
    console.log('NO_CHANGES');
  }
}

function generateSummary(summary) {
  let content = '# Синхронизация файлов с Notion\n\n';
  content += `**Время проверки:** ${new Date().toLocaleString('ru-RU')}\n\n`;
  content += `## Обнаружено изменений: ${summary.length} файлов\n\n`;

  for (const { file, changes } of summary) {
    content += `### 📝 ${file} (${changes.length} изменений)\n\n`;

    // Показать первые 10 изменений
    const toShow = changes.slice(0, 10);
    for (const c of toShow) {
      if (c.type === 'NEW') {
        content += `+ **Стр ${c.line}:**\n  ${escapeMd(c.local.substring(0, 60))}...\n`;
      } else if (c.type === 'DELETED') {
        content += `- **Стр ${c.line}:**\n  ${escapeMd(c.notion.substring(0, 60))}...\n`;
      } else {
        content += `~ **Стр ${c.line}:**\n`;
        content += `  - ${escapeMd(c.notion.substring(0, 60))}...\n`;
        content += `  + ${escapeMd(c.local.substring(0, 60))}...\n`;
      }
    }

    if (changes.length > 10) {
      content += `\n... и ещё ${changes.length - 10} изменений\n`;
    }
    content += '\n';
  }

  content += '---\n\n';
  content += '## Подтверждение\n\n';
  content += '**Действие:** Notion → Локально\n\n';
  content += 'Подтвердите изменения:\n';
  content += '- `да` — применить изменения (перезаписать локальные файлы из Notion)\n';
  content += '- `нет` — отменить\n';

  return content;
}

function escapeMd(text) {
  return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\*/g, '\\*');
}

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

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

// Конфигурация
const NOTION_KEY = process.env.NOTION_KEY;
const MD_PAGE_ID = '3191c652eef7812e82eeeee5e19b3290';
const WORKSPACE = process.env.WORKSPACE || '/home/ohmo/.openclaw/workspace';
const SYNC_STATE_FILE = path.join(WORKSPACE, 'memory', 'sync-state.json');

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

// Обновить локальный файл
function updateLocalFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Главная функция
async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const direction = args.includes('--to-notion') ? 'to-notion' : 'from-notion';

  console.log(`\n🔄 Применение изменений (${direction})\n`);

  await findBlockIds();

  const summary = [];
  let hasChanges = false;

  for (const [file, blockId] of Object.entries(SYNC_FILES)) {
    if (!blockId) continue;

    const localPath = path.join(WORKSPACE, file);

    if (!fs.existsSync(localPath)) continue;

    const localContent = fs.readFileSync(localPath, 'utf8');
    const notionContent = await getNotionContent(blockId);

    if (localContent !== notionContent) {
      hasChanges = true;
      summary.push({ file, blockId, localPath, localContent, notionContent });
    }
  }

  if (!hasChanges) {
    console.log('✅ Нет изменений для применения');
    return;
  }

  console.log(`📋 Обнаружено изменений: ${summary.length} файлов\n`);

  // Применить изменения
  if (direction === 'from-notion') {
    // Notion → Локально
    console.log('⬇️  Применение: Notion → Локально\n');
    for (const s of summary) {
      if (s.notionContent) {
        updateLocalFile(s.localPath, s.notionContent);
        console.log(`  ✓ ${s.file}`);
      } else {
        console.log(`  ⚠️  ${s.file}: нет контента в Notion`);
      }
    }
  } else {
    // Локально → Notion
    console.log('⬆️  Применение: Локально → Notion\n');
    for (const s of summary) {
      await recreateCodeBlocks(s.blockId, s.localContent);
      console.log(`  ✓ ${s.file}`);
    }
  }

  console.log('\n✅ Изменения применены');

  // Удалить состояние синхронизации
  if (fs.existsSync(SYNC_STATE_FILE)) {
    fs.unlinkSync(SYNC_STATE_FILE);
  }
}

// Пересоздать code blocks в Notion (удалить все старые, создать новые)
async function recreateCodeBlocks(pageBlockId, content) {
  // Получить все дочерние блоки
  const children = await fetch(`/v1/blocks/${pageBlockId}/children`);

  if (children.results && children.results.length > 0) {
    // Удалить все существующие code blocks
    for (const block of children.results) {
      if (block.type === 'code') {
        await fetch(`/v1/blocks/${block.id}`, 'DELETE');
      }
    }
    await sleep(500); // пауза после удаления
  }

  // Разбить контент на чанки и создать code blocks
  const chunks = splitContent(content);
  for (const chunk of chunks) {
    await fetch(`/v1/blocks/${pageBlockId}/children`, 'PATCH', {
      children: [{
        object: 'block',
        type: 'code',
        code: {
          rich_text: [{ type: 'text', text: { content: chunk } }],
          language: 'markdown'
        }
      }]
    });
    await sleep(200);
  }
}

function splitContent(content) {
  const lines = content.split('\n');
  const chunks = [];
  let currentChunk = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeader = line.match(/^#+\s/);
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    const isNextEmpty = nextLine.trim() === '';
    const nextLineIsHeader = nextLine.match(/^#+\s/);

    const testChunk = currentChunk ? currentChunk + '\n' + line : line;

    // Если это заголовок ## или #, начнём новый чанк
    // Но только если есть следующая строка, и она не является заголовком
    if (isHeader && currentChunk.length > 100 && !nextLineIsHeader && !isNextEmpty) {
      chunks.push(currentChunk.replace(/\n+$/, '')); // удаляем только конечные переносы
      currentChunk = line;
    } else if (isHeader && nextLineIsHeader && currentChunk.length > 100) {
      // Если следующая строка тоже заголовок, сохраняем текущий чанк
      chunks.push(currentChunk.replace(/\n+$/, ''));
      currentChunk = line;
    } else if (testChunk.length > 1900) {
      // Если чанк слишком большой, сохраняем и начинаем новый
      if (currentChunk) chunks.push(currentChunk.replace(/\n+$/, ''));
      currentChunk = line;
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.replace(/\n+$/, ''));
  }

  return chunks;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

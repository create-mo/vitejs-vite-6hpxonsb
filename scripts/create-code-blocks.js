#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Загрузить .env
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

const NOTION_KEY = process.env.NOTION_KEY;
const PAGE_ID = process.argv[2];

// Читаем контент из stdin
let content = '';
process.stdin.on('data', chunk => content += chunk);
process.stdin.on('end', async () => {
  try {
    // Разбиваем контент на чанки по заголовкам
    const chunks = splitContent(content);
    console.log(`Creating ${chunks.length} code blocks...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await createCodeBlock(PAGE_ID, chunk);
      console.log(`  ✓ Block ${i + 1}/${chunks.length} created`);
      await sleep(200); // small delay to avoid rate limiting
    }

    console.log('\n✅ All blocks created');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
});

function splitContent(content) {
  const lines = content.split('\n');
  const chunks = [];
  let currentChunk = '';
  let lastLineWasEmpty = false;

  for (const line of lines) {
    const isHeader = line.match(/^#+\s/);
    const isCurrentEmpty = line.trim() === '';

    // Если это заголовок ## или #, и текущий чанк не пустой, начнём новый чанк
    if (isHeader && currentChunk.length > 100 && !lastLineWasEmpty) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
      lastLineWasEmpty = false;
    } else if (isHeader && lastLineWasEmpty && currentChunk.length > 100) {
      // Если перед заголовком была пустая строка, включим её в предыдущий чанк
      chunks.push(currentChunk.trim());
      currentChunk = line;
      lastLineWasEmpty = false;
    } else if ((currentChunk + '\n' + line).length > 1900) {
      // Если чанк слишком большой, сохраняем и начинаем новый
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = line;
      lastLineWasEmpty = isCurrentEmpty;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n' + line : line;
      lastLineWasEmpty = isCurrentEmpty;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function createCodeBlock(pageId, content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      children: [{
        object: 'block',
        type: 'code',
        code: {
          rich_text: [{ type: 'text', text: { content } }],
          language: 'markdown'
        }
      }]
    });

    const options = {
      hostname: 'api.notion.com',
      path: `/v1/blocks/${pageId}/children`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`API error ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

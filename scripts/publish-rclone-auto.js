#!/usr/bin/env node

const https = require('https');

// Конфигурация
const NOTION_KEY = process.env.NOTION_KEY;
const BLOCK_ID = '31f1c652eef7-8028-bbd6-cef9eac85793';

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

// Получить текущие дети блока
async function getChildren() {
  const response = await fetch(`/v1/blocks/${BLOCK_ID}/children`);
  return response.results || [];
}

// Проверить, существует ли заголовок
async function hasHeading(heading) {
  const children = await getChildren();
  return children.some(child =>
    child.type === 'heading_3' &&
    child.heading_3.rich_text[0]?.text.content === heading
  );
}

// Добавить скрипт
async function publishScript(name, description) {
  // Если заголовок уже есть, пропустить
  if (await hasHeading(name)) {
    console.log(`⚠️ ${name} уже существует, пропускаю`);
    return;
  }

  const payload = {
    children: [
      {
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [
            {
              type: 'text',
              text: { content: name }
            }
          ]
        }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: description }
            }
          ]
        }
      }
    ]
  };

  await fetch(`/v1/blocks/${BLOCK_ID}/children`, 'PATCH', payload);
  console.log(`✅ ${name} опубликован`);
}

// Главная функция
async function main() {
  console.log('📤 Публикация скриптов в Notion...\n');

  await publishScript('rclone-auto.js', 'Путь: /home/ohmo/.openclaw/workspace/scripts/rclone-auto.js\nФункционал: Автоматическое копирование с мониторингом и перезапуском по правилам из Notion. Управляет процессом rclone, проверяет системные ресурсы и ошибки сети, применяет оптимизации скорости.');
}

main().catch(console.error);

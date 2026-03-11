#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Конфигурация
const NOTION_KEY = process.env.NOTION_KEY;
const STATUS_BLOCK_ID = '31a1c652eef7813e98dce20254be80a3';
const RCLONE_STDOUT = '/tmp/rclone-gta-stdout.log';
const RCLONE_LOG = '/tmp/rclone-gta.log';

// Проверка статуса rclone
function checkStatus() {
  try {
    // Проверяем, активен ли процесс
    const { execSync } = require('child_process');
    try {
      const pid = execSync('pgrep -f "rclone copy"').toString().trim();
      if (pid) {
        return { status: 'active', timestamp: new Date().toISOString() };
      }
    } catch (e) {
      // Процесс не найден
    }

    // Проверяем Mail.ru на скопированные файлы
    try {
      const files = execSync('rclone ls mailru:/apps/ | grep -i "grand" | wc -l').toString().trim();
      if (files && parseInt(files) > 0) {
        return { status: 'partial', files: parseInt(files), timestamp: new Date().toISOString() };
      }
    } catch (e) {}

    return { status: 'idle', timestamp: new Date().toISOString() };
  } catch (e) {
    return { status: 'error', error: e.message, timestamp: new Date().toISOString() };
  }
}

// Формирование статуса
function formatStatus(data) {
  const time = new Date(data.timestamp).toLocaleString('ru-RU');

  if (data.status === 'error') {
    return `❌ Ошибка: ${data.error}\n\nВремя: ${time}`;
  }

  if (data.status === 'active') {
    return `📊 Копирование активно...\n\nВремя: ${time}`;
  }

  if (data.status === 'partial') {
    return `⚠️ Копирование прервано (частично завершено)\n\n**Скопировано файлов:** ${data.files}\n\nВремя: ${time}`;
  }

  return `✅ Копирование не активно\n\nВремя: ${time}`;
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

// Обновление блока статуса
async function updateStatus(text) {
  await fetch(`/v1/blocks/${STATUS_BLOCK_ID}`, 'PATCH', {
    callout: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: text
          }
        }
      ],
      icon: {
        type: 'emoji',
        emoji: text.includes('❌') ? '🔴' : text.includes('⚠️') ? '🟡' : text.includes('📊') ? '🟠' : '🟢'
      },
      color: 'default'
    }
  });
}

// Главная функция
async function main() {
  const status = checkStatus();
  const text = formatStatus(status);

  console.log('Статус rclone:');
  console.log(text);
  console.log('');

  try {
    await updateStatus(text);
    console.log('✅ Статус обновлён в Notion');
  } catch (e) {
    console.error('❌ Ошибка при обновлении Notion:');
    console.error(e.message);
  }
}

main().catch(console.error);

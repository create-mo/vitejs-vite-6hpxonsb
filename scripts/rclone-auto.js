#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const https = require('https');
const fs = require('fs');

// Конфигурация
const NOTION_KEY = process.env.NOTION_KEY;
const STATUS_BLOCK_ID = '31a1c652eef7813e98dce20254be80a3';
const RCLONE_STDOUT = '/tmp/rclone-gta-stdout.log';
const RCLONE_LOG = '/tmp/rclone-gta.log';

// Параметры копирования из Notion
const SOURCE = 'yandex:/apps/Grand Theft Auto V by xatab';
const DEST = 'mailru:/apps/Grand Theft Auto V by xatab';
const BASE_TRANSFERS = 8;
const BASE_CHECKERS = 16;

// Состояние копирования
let rcloneProcess = null;
let currentTransfers = BASE_TRANSFERS;
let isPaused = false;

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

// Обновление статуса в Notion
async function updateStatus(text, emoji = '📊') {
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
        emoji: emoji
      },
      color: 'default'
    }
  });
}

// Парсинг прогресса rclone
function parseProgress(stdoutContent) {
  const lines = stdoutContent.split('\n').reverse();

  for (const line of lines) {
    if (line.includes('Transferred:') && line.includes('MiB') && line.includes('%,')) {
      const match = line.match(/Transferred:\s+(\d+\.\d+\s+MiB)\s+\/\s+(\d+\.\d+\s+GiB),\s+(\d+)%,\s+([\d.]+)\s+MiB\/s,\s+ETA\s+([^\s]+)/);
      if (match) {
        return {
          transferredMiB: parseFloat(match[1]),
          totalGiB: parseFloat(match[2]),
          percent: parseInt(match[3]),
          speedMiBps: parseFloat(match[4]),
          eta: match[5],
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  return { status: 'active', timestamp: new Date().toISOString() };
}

// Запуск rclone
function startRclone() {
  console.log(`🚀 Запуск rclone с ${currentTransfers} потоками...`);

  rcloneProcess = spawn('rclone', [
    'copy', SOURCE, DEST,
    '--checksum',
    '--update',
    `--transfers`, currentTransfers.toString(),
    '--checkers', BASE_CHECKERS.toString(),
    '--bwlimit', '0',
    '--progress',
    '--stats', '30s',
    '--log-file', RCLONE_LOG,
    '--log-level', 'INFO'
  ], {
    env: { ...process.env, PATH: `${process.env.PATH}:/home/ohmo/.local/bin` }
  });

  rcloneProcess.stdout.on('data', (data) => {
    fs.appendFileSync(RCLONE_STDOUT, data.toString());
  });

  rcloneProcess.stderr.on('data', (data) => {
    fs.appendFileSync(RCLONE_STDOUT, data.toString());
  });

  rcloneProcess.on('close', (code) => {
    console.log(`rclone завершён с кодом: ${code}`);
    rcloneProcess = null;

    if (code === 0) {
      updateStatus('✅ Копирование завершено!', '🟢');
    } else {
      updateStatus(`❌ Копирование завершено с ошибкой (код: ${code})`, '🔴');
    }
  });

  rcloneProcess.on('error', (err) => {
    console.error('Ошибка rclone:', err);
    rcloneProcess = null;
  });
}

// Остановка rclone
function stopRclone() {
  if (rcloneProcess) {
    console.log('⏹️ Остановка rclone...');
    rcloneProcess.kill();
    rcloneProcess = null;
  }
}

// Перезапуск rclone
function restartRclone(newTransfers = currentTransfers) {
  console.log(`🔄 Перезапуск rclone с ${newTransfers} потоками...`);
  stopRclone();
  currentTransfers = newTransfers;
  setTimeout(startRclone, 2000); // Пауза 2 секунды перед перезапуском
}

// Проверка системных ресурсов
async function checkSystemResources() {
  try {
    // CPU
    const cpu = execSync('top -bn1 | grep "Cpu(s)" | awk \'{print $2}\' | cut -d% -f1').toString().trim();
    const cpuUsage = parseFloat(cpu);

    // RAM
    const mem = execSync('free | grep Mem | awk \'{print $3/$2 * 100.0}\'').toString().trim();
    const ramUsage = parseFloat(mem);

    console.log(`📊 Система: CPU: ${cpuUsage}%, RAM: ${ramUsage.toFixed(1)}%`);

    if (cpuUsage > 80 || ramUsage > 80) {
      console.log('⚠️ Превышение ресурсов (> 80%) → пауза + перезапуск с меньшими потоками');
      await updateStatus(`⚠️ Превышение ресурсов (CPU: ${cpuUsage}%, RAM: ${ramUsage.toFixed(1)}%). Пауза...`, '🟡');
      stopRclone();
      isPaused = true;
      setTimeout(() => {
        isPaused = false;
        restartRclone(4); // Перезапуск с 4 потоками
      }, 120000); // Пауза 2 минуты
      return true; // Было превышение
    }
  } catch (e) {
    console.error('Ошибка проверки ресурсов:', e);
  }

  return false; // Не было превышения
}

// Проверка лога на ошибки сети
async function checkNetworkErrors() {
  try {
    const logContent = fs.readFileSync(RCLONE_LOG, 'utf8');
    const recentLines = logContent.split('\n').slice(-50);

    const hasNetworkErrors = recentLines.some(line =>
      line.includes('408') ||
      line.includes('timeout') ||
      line.includes('connection refused') ||
      line.includes('network')
    );

    if (hasNetworkErrors && currentTransfers > 4) {
      console.log('⚠️ Обнаружены ошибки сети → снижение потоков');
      await updateStatus('⚠️ Ошибки сети. Снижение потоков...', '🟡');
      restartRclone(4); // Снизить до 4 потоков
      return true;
    }
  } catch (e) {
    console.error('Ошибка проверки лога:', e);
  }

  return false;
}

// Главная функция мониторинга
async function monitor() {
  // Прочитать stdout
  if (!fs.existsSync(RCLONE_STDOUT)) {
    console.log('Статус: старт...');
    return;
  }

  const stdoutContent = fs.readFileSync(RCLONE_STDOUT, 'utf8');
  const progress = parseProgress(stdoutContent);

  // Сформировать статус
  let statusText = '';
  let statusEmoji = '📊';

  if (progress.status === 'active') {
    const transferredGiB = progress.transferredMiB / 1024;
    const time = new Date(progress.timestamp).toLocaleString('ru-RU');

    statusText = `📊 Статус копирования (${time})\n\n` +
                  `📁 Папка: **Grand Theft Auto V by xatab**\n\n` +
                  `**Прогресс:** ${progress.percent}%\n` +
                  `**Перенесено:** ${transferredGiB.toFixed(2)} GiB / ${progress.totalGiB.toFixed(2)} GiB\n` +
                  `**Скорость:** ${progress.speedMiBps.toFixed(2)} MiB/s\n` +
                  `**ETA:** ${progress.eta}\n` +
                  `**Потоков:** ${currentTransfers}`;
  } else {
    statusText = `⏳ Запуск...`;
  }

  await updateStatus(statusText, statusEmoji);

  // Применить правила
  const systemOverload = await checkSystemResources();
  const networkErrors = await checkNetworkErrors();

  if (!systemOverload && !networkErrors) {
    // Проверить скорость
    if (progress.status === 'active') {
      if (progress.speedMiBps < 2 && currentTransfers < 12) {
        console.log(`📉 Низкая скорость (${progress.speedMiBps.toFixed(2)} MiB/s) → увеличение потоков`);
        restartRclone(12);
      }
    }
  }
}

// Главный цикл
async function main() {
  console.log('🔧 Автоматическое копирование с мониторингом\n');

  // Запуск rclone
  startRclone();

  // Цикл мониторинга (каждые 30 секунд)
  setInterval(async () => {
    if (!rcloneProcess) {
      console.log('🔄 rclone не активен, перезапуск...');
      startRclone();
    } else {
      await monitor();
      await publishToNotion();
    }
  }, 30000);

// Публикация прогресса в Notion
async function publishToNotion() {
  if (!fs.existsSync(RCLONE_STDOUT)) {
    return;
  }

  const stdoutContent = fs.readFileSync(RCLONE_STDOUT, 'utf8');
  const progress = parseProgress(stdoutContent);
  const time = new Date(progress.timestamp).toLocaleString('ru-RU');

  let statusText = '';
  let statusEmoji = '📊';

  if (progress.status === 'active') {
    const transferredGiB = progress.transferredMiB / 1024;
    const etaParts = progress.eta.match(/(\d+h)?(\d+m)?(\d+s)?/);
    const eta = etaParts ? etaParts[0] : progress.eta;

    statusText = `📊 Статус копирования (${time})\n\n` +
                  `📁 Папка: **Grand Theft Auto V by xatab**\n\n` +
                  `**Прогресс:** ${progress.percent}%\n` +
                  `**Перенесено:** ${transferredGiB.toFixed(2)} GiB / ${progress.totalGiB.toFixed(2)} GiB\n` +
                  `**Скорость:** ${progress.speedMiBps.toFixed(2)} MiB/s\n` +
                  `**ETA:** ${eta}\n` +
                  `**Потоков:** ${currentTransfers}`;
  } else if (progress.status === 'completed') {
    statusText = `✅ Файл успешно скопирован!\n\nВремя: ${time}`;
    statusEmoji = '🟢';
  } else if (isPaused) {
    statusText = `⏸️ Копирование на паузе\n\nВремя: ${time}`;
    statusEmoji = '🟡';
  } else {
    statusText = `⏳ Запуск...\n\nВремя: ${time}`;
    statusEmoji = '🟠';
  }

  await updateStatus(statusText, statusEmoji);
}

// Парсинг прогресса
function parseProgress(stdoutContent) {
  const lines = stdoutContent.split('\n').reverse();

  for (const line of lines) {
    if (line.includes('Transferred:') && line.includes('MiB') && line.includes('%,')) {
      const match = line.match(/Transferred:\s+(\d+\.\d+\s+MiB)\s+\/\s+(\d+\.\d+\s+GiB),\s+(\d+)%,\s+([\d.]+)\s+MiB\/s,\s+ETA\s+([^\s]+)/);
      if (match) {
        return {
          transferredMiB: parseFloat(match[1]),
          totalGiB: parseFloat(match[2]),
          percent: parseInt(match[3]),
          speedMiBps: parseFloat(match[4]),
          eta: match[5],
          status: 'active',
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  return { status: 'starting', timestamp: new Date().toISOString() };
}
}

// Вспомогательная функция для синхронного exec
function execSync(command) {
  try {
    return exec(command).stdout.toString();
  } catch (e) {
    return '';
  }
}

// Запуск
main().catch(console.error);

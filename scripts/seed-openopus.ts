/**
 * Скрипт сидирования Supabase из Open Opus API
 * Лимит: ≤70 композиторов, ≤10 произведений каждый
 *
 * Запуск:
 *   npx tsx scripts/seed-openopus.ts
 *
 * Нужно заранее:
 *   1. npm install @supabase/supabase-js tsx
 *   2. Заполнить .env:
 *      VITE_SUPABASE_URL=https://xxxx.supabase.co
 *      VITE_SUPABASE_ANON_KEY=eyJ...
 *      SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← для записи
 */

import { createClient } from '@supabase/supabase-js';

// Для записи нужен service_role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPEN_OPUS = 'https://api.openopus.org';
const MAX_COMPOSERS = 70;
const MAX_WORKS_PER_COMPOSER = 10;

// Соответствие эпох Open Opus → наше приложение
const ERA_MAP: Record<string, string> = {
  'Baroque':       'Baroque',
  'Classical':     'Classical',
  'Early Romantic':'Romantic',
  'Romantic':      'Romantic',
  'Late Romantic': 'Romantic',
  '20th Century':  '20th Century',
  'Post-War':      '20th Century',
  '21st Century':  'Contemporary',
};

// Примерная нормализация года рождения → X на карте (0–15)
function birthYearToX(year: number): number {
  const clamped = Math.max(1600, Math.min(2000, year));
  return Math.round(((clamped - 1600) / 400) * 15 * 10) / 10;
}

interface OOComposer {
  id: number;
  name: string;
  complete_name: string;
  birth: string;  // "1685-03-21"
  death: string | null;
  epoch: string;
  portrait: string;
}

interface OOWork {
  id: number;
  title: string;
  subtitle: string;
  genre: string;
  popular: string; // "1" | "0"
}

async function fetchComposers(): Promise<OOComposer[]> {
  // Берём популярных + по эпохам для разнообразия
  const epochs = ['Baroque', 'Classical', 'Romantic', '20th Century'];
  const seen = new Set<number>();
  const all: OOComposer[] = [];

  for (const epoch of epochs) {
    const res = await fetch(`${OPEN_OPUS}/composer/list/epoch/${encodeURIComponent(epoch)}.json`);
    const data = await res.json();
    if (data.composers) {
      for (const c of data.composers as OOComposer[]) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          all.push(c);
        }
      }
    }
    await delay(400); // уважаем сервер
  }

  // Сортируем по году рождения, берём не более MAX_COMPOSERS
  return all
    .sort((a, b) => parseInt(a.birth) - parseInt(b.birth))
    .slice(0, MAX_COMPOSERS);
}

async function fetchWorks(composerId: number): Promise<OOWork[]> {
  const res = await fetch(`${OPEN_OPUS}/work/list/composer/${composerId}/genre/all.json`);
  const data = await res.json();
  if (!data.works) return [];

  // Предпочитаем популярные, берём не больше MAX_WORKS_PER_COMPOSER
  const sorted = (data.works as OOWork[]).sort((a, b) =>
    (b.popular === '1' ? 1 : 0) - (a.popular === '1' ? 1 : 0)
  );
  return sorted.slice(0, MAX_WORKS_PER_COMPOSER);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function composerSlug(name: string, id: number): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_') + '_' + id;
}

async function main() {
  console.log('Fetching composers from Open Opus...');
  const composers = await fetchComposers();
  console.log(`Got ${composers.length} composers`);

  for (const c of composers) {
    const birthYear = parseInt(c.birth?.slice(0, 4) ?? '1700');
    const era = ERA_MAP[c.epoch] ?? 'Classical';
    const slug = composerSlug(c.name, c.id);

    const deathStr = c.death ? c.death.slice(0, 4) : '';
    const lifeDates = `${birthYear}${deathStr ? '–' + deathStr : '–'}`;

    // Upsert композитора
    const { error: cErr } = await supabase.from('composers').upsert({
      id: slug,
      label: c.name,
      era,
      life_dates: lifeDates,
      image: c.portrait || '',
      x: birthYearToX(birthYear),
      y: 0, // позиция по Y — расставить вручную или автоматом позже
      predecessors: [],
      openopus_id: c.id,
    });
    if (cErr) console.error(`Composer ${c.name}:`, cErr.message);
    else console.log(`  + Composer: ${c.name} (${era})`);

    // Произведения
    const works = await fetchWorks(c.id);
    await delay(300);

    for (const w of works) {
      const pieceId = `${slug}_work_${w.id}`;
      const { error: wErr } = await supabase.from('pieces').upsert({
        id: pieceId,
        composer_id: slug,
        title: w.title + (w.subtitle ? ` — ${w.subtitle}` : ''),
        tempo: 120,  // дефолт; VexFlow-ноты добавляются вручную
        treble: [],
        bass: [],
      });
      if (wErr) console.error(`  Work ${w.title}:`, wErr.message);
    }
    if (works.length) console.log(`    ${works.length} works added`);

    await delay(200);
  }

  console.log('\nDone! Migrate existing database.ts composers separately if needed.');
}

main().catch(console.error);

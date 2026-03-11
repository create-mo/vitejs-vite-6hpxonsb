// scripts/supabase-migrate.ts
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DATABASE } from '../src/data/database';

// Конфигурация Supabase
const supabaseUrl = 'https://jtytuaxjkyswzuqrwweq.supabase.co';
const supabaseAnonKey = 'sb_publishable_qxiIEVAWZA_sXUiDKzuJeQ_C_TlDvrU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Функция для создания композитора
const createComposer = async (composer: any) => {
  console.log(`🎵 Создание композитора: ${composer.label}`);

  const { data, error } = await supabase
    .from('composers')
    .insert({
      name: composer.label,
      era: composer.era,
      life_dates: composer.lifeDates,
      image: composer.image,
      x: composer.x,
      y: composer.y,
      predecessors: composer.predecessors
    })
    .select();

  if (error) {
    console.error(`❌ Ошибка при создании ${composer.label}:`, error);
    throw error;
  }

  console.log(`✅ Композитор ${composer.label} создан (ID: ${data[0].id})`);
  return data[0];
};

// Функция для создания произведения
const createWork = async (composerId: string, piece: any, index: number) => {
  console.log(`🎼 Создание произведения: ${piece.title} (${index + 1}/${composer.pieces.length})`);

  const { data, error } = await supabase
    .from('works')
    .insert({
      composer_id: composerId,
      title: piece.title,
      tonality: 'C', // По умолчанию
      key: 'C major',
      tempo: piece.tempo || 90,
      notes: {
        treble: piece.treble,
        bass: piece.bass
      }
    })
    .select();

  if (error) {
    console.error(`❌ Ошибка при создании ${piece.title}:`, error);
    throw error;
  }

  console.log(`✅ Произведение ${piece.title} создано (ID: ${data[0].id})`);
  return data[0];
};

// Основная функция миграции
const migrate = async () => {
  console.log('🔧 Начинаю миграцию данных в Supabase...\n');

  try {
    // Создаём композиторов
    const composerIds = new Map<string, string>();

    for (const composer of DATABASE) {
      const composerRow = await createComposer(composer);
      composerIds.set(composer.id, composerRow.id);
      console.log(`📋 ${composer.label} → ${composerRow.id}`);
    }

    console.log(`\n✅ Создано ${composerIds.size} композиторов\n`);

    // Создаём произведения
    let workCount = 0;

    for (const composer of DATABASE) {
      const composerId = composerIds.get(composer.id);

      if (!composerId) {
        console.error(`❌ Композитор ${composer.id} не найден в базе`);
        continue;
      }

      for (const piece of composer.pieces) {
        await createWork(composerId, piece, workCount);
        workCount++;
      }
    }

    console.log(`\n✅ Создано ${workCount} произведений\n`);
    console.log('🎉 Миграция завершена!');

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  }
};

migrate();

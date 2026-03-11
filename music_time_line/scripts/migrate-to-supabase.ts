// scripts/migrate-to-supabase.ts
import { createClient } from '@supabase/supabase-js';

// Конфигурация
const supabaseUrl = 'https://jtytuaxjkyswzuqrwweq.supabase.co';
const supabaseAnonKey = 'sb_publishable_qxiIEVAWZA_sXUiDKzuJeQ_C_TlDvrU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Локальные данные для миграции
const LEGACY_COMPOSERS = [
  {
    id: 'bach',
    label: 'J.S. Bach',
    era: 'Baroque',
    lifeDates: '1685–1750',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Johann_Sebastian_Bach.jpg',
    x: 0,
    y: 0,
    predecessors: [],
    pieces: [
      {
        id: 'bach_toccata_full',
        title: 'Toccata in Dm (Full intro)',
        tempo: 90,
        treble: [
          'a/5/16, g/5/16, a/5/16, g/5/16, f/5/16, e/5/16, d/5/16, c#/5/16',
          'd/5/q, r/q, r/h',
          'a/4/16, g/4/16, a/4/16, g/4/16, f/4/16, e/4/16, d/4/16, c#/4/16',
          'd/4/q, r/q, r/h',
          'a/3/16, g/3/16, a/3/16, g/3/16, f/3/16, e/3/16, d/3/16, c#/3/16',
          'd/3/q, r/q, r/q, a/2/8, b/2/8, d/2/w',
          'c#/3/q, d/3/q, e/3/q, f/3/q',
          'g/3/q, f/3/q, e/3/q, d/3/q',
          'c#/3/w',
        ],
        bass: ['d/3/w', 'd/2/w', 'd/2/w', 'a/1/w', 'a/1/w']
      }
    ]
  },
  {
    id: 'vivaldi',
    label: 'A. Vivaldi',
    era: 'Baroque',
    lifeDates: '1678–1741',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Antonio_Vivaldi.jpg',
    x: 0.5,
    y: 1.5,
    predecessors: [],
    pieces: [
      {
        id: 'viv_spring_full',
        title: 'Spring (Allegro)',
        tempo: 110,
        treble: [
          'e/5, g#/4, g#/4',
          'f#/4, e/4, b/3, b/3',
          'e/5, g#/4, g#/4',
          'f#/4, e/4, b/3',
          'g#/4, a/4, b/4, c#/5',
          'b/4, a/4, g#/4, f#/4',
          'e/4, f#/4, g#/4',
          'f#/4, e/4, b/3',
          'e/5, g#/4, g#/4',
          'f#/4, e/4, b/3',
          'b/4, e/5, e/4',
          'e/5, g#/4, g#/4',
          'f#/4, e/4, b/3',
          'g#/4, a/4, b/4, c#/5',
          'b/4, a/4, g#/4, f#/4',
          'e/4, f#/4, g#/4',
          'b/3, b/3, e/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'b/4, a/4, g#/4, f#/4',
          'e/4/h, r/h'
        ],
        bass: [
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'b/3, b/2, b/3, e/3',
          'c#/3, a/2, b/2, b/2',
          'e/3, e/2, e/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'b/2, b/2, b/2',
          'e/3/h, r/h'
        ]
      }
    ]
  },
  {
    id: 'mozart',
    label: 'W.A. Mozart',
    era: 'Classical',
    lifeDates: '1756–1791',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Wolfgang_Amadeus_Mozart_1.jpg',
    x: 3.5,
    y: 0,
    predecessors: ['vivaldi', 'bach'],
    pieces: [
      {
        id: 'mozart_k545_full',
        title: 'Sonata K.545 (Ext.)',
        tempo: 135,
        treble: [
          'c/5, e/5, g/5',
          'b/4, c/5, d/5, c/5',
          'a/4, g/4, c/5, g/4, f/4, g/4',
          'e/4/h',
          'a/4, g/4, f/4, e/4',
          'd/4, c/4, b/3, c/4',
          'd/4, e/4, c/4, d/4',
          'g/3/h',
          'g/4, a/4, b/4, c/5',
          'd/5, e/5, f/5, g/5',
          'a/5, g/5, f/5, e/5',
          'd/5, c/5, b/4, a/4',
          'g/3, r, r, r',
          'g/3, r, r, r',
          'c/3, r, r, r',
          'f/3, r, g/3, r'
        ],
        bass: [
          'c/3, g/3, e/3, g/3',
          'c/3, g/3, e/3, g/3',
          'c/3, f/3, a/3',
          'c/3, g/3, e/3, g/3',
          'f/3, c/4, a/3, c/4',
          'f/3, c/4, a/3, c/4',
          'g/3, b/3, g/3, b/3',
          'g/2, b/2, c/3',
          'g/3, r, r, r',
          'g/3, r, r, r',
          'c/3, r, r, r',
          'f/3, r, g/3, r',
          'g/2, b/2, c/3',
          'g/3, r, r, r',
          'f/3, r, g/3, r'
        ]
      }
    ]
  },
  {
    id: 'beethoven',
    label: 'L.v. Beethoven',
    era: 'Romantic',
    lifeDates: '1770–1827',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Ludwig_van_Beethoven.jpg',
    x: 6,
    y: -0.8,
    predecessors: ['mozart'],
    pieces: [
      {
        id: 'beet_ode_full',
        title: 'Ode to Joy (Full Theme)',
        tempo: 120,
        treble: [
          'e/4, e/4, f/4, g/4',
          'g/4, f/4, e/4, d/4',
          'e/4, d/4, e/4, f/4',
          'g/4',
          'c/4, c/4, d/4, e/4',
          'd/4, c/4, c/4',
          'd/4, e/4, f/4, g/4',
          'c/4, d/4, e/4, c/4',
          'd/4, e/4, f/4/8, e/4/c/4',
          'd/4, e/4, c/4, d/4',
          'c/4, d/4, g/3/h',
          'g/4, a/4, b/4, c/5',
          'd/5, e/5, f/5, g/5',
          'a/5, g/5, f/5, e/5',
          'd/5, c/5, b/4, a/4',
          'f/3, r, r, r',
          'c/3, r, r, r'
        ],
        bass: [
          'c/3, e/3, g/3',
          'c/3, f/3, a/3',
          'c/3, e/3, g/3',
          'g/2, b/2, d/3',
          'c/3, e/3, g/3',
          'f/3, a/3, c/4',
          'f/3, a/3, c/4',
          'g/2, b/2, c/3',
          'g/2, c/3',
          'g/2, b/2, c/3',
          'g/2, b/2, c/3',
          'a/2, f#/2, g/2',
          'g/2, b/2, c/3',
          'g/3, r, r, r',
          'g/3, r, r, r',
          'f/3, r, g/3, r',
          'f/3, a/3, c/4',
          'g/2, b/2, c/3',
          'g/2, b/2, c/3',
          'f/3, r, r, r'
        ]
      }
    ]
  }
];

// Функция для создания композитора
const createComposer = async (composer: any) => {
  console.log(`\n🎵 Композитор: ${composer.label}`);

  const { data, error } = await supabase
    .from('composers')
    .insert({
      name: composer.label,
      era: composer.era,
      life_dates: composer.lifeDates,
      image: composer.image,
      x: composer.x,
      y: composer.y,
      predecessors: [] // Сначала создаем без предшественников
    })
    .select();

  if (error) {
    console.error(`❌ Ошибка при создании ${composer.label}:`, error);
    throw error;
  }

  console.log(`✅ Создан (ID: ${data[0].id})`);
  return data[0];
};

// Функция для создания произведения
const createWork = async (composerId: string, piece: any, index: number) => {
  console.log(`   📼 Произведение ${index + 1}: ${piece.title}`);

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
    console.error(`   ❌ Ошибка при создании ${piece.title}:`, error);
    throw error;
  }

  console.log(`   ✅ Создано (ID: ${data[0].id})`);
  return data[0];
};

// Основная функция миграции
const migrate = async () => {
  console.log('🔧 Миграция локальных данных в Supabase\n');

  try {
    // Создаём композиторов
    console.log('📋 Создание композиторов...\n');
    const composerIds = new Map<string, string>();

    for (const composer of LEGACY_COMPOSERS) {
      const composerRow = await createComposer(composer);
      composerIds.set(composer.id, composerRow.id);
    }

    console.log(`\n✅ Создано ${composerIds.size} композиторов\n`);

    // Обновляем predecessors для композиторов
    console.log('🔗 Обновление связей предшественников...\n');
    for (const composer of LEGACY_COMPOSERS) {
      const composerId = composerIds.get(composer.id);

      if (!composerId) {
        console.error(`❌ Композитор ${composer.id} не найден`);
        continue;
      }

      // Преобразуем строковые ID в UUID
      const predecessorUuids = (composer.predecessors || [])
        .map((p: string) => composerIds.get(p))
        .filter((id): id is string => id !== undefined);

      if (predecessorUuids.length > 0) {
        const { error } = await supabase
          .from('composers')
          .update({ predecessors: predecessorUuids })
          .eq('id', composerId);

        if (error) {
          console.error(`   ❌ Ошибка обновления ${composer.label}:`, error);
        } else {
          console.log(`   ✅ Обновлён ${composer.label}`);
        }
      }
    }

    console.log(`\n✅ Связи обновлены\n`);

    // Создаём произведения
    console.log('📦 Создание произведений...\n');
    let workCount = 0;

    for (const composer of LEGACY_COMPOSERS) {
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

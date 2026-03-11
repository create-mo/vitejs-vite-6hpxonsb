import { supabase } from '../src/lib/supabaseClient';

async function checkData() {
  try {
    console.log('📊 Данные в Supabase:\n');

    // Проверка composers
    const { data: composers, error: composersError } = await supabase
      .from('composers')
      .select('*');

    if (composersError) {
      console.log('❌ Ошибка composers:', composersError.message);
    } else {
      console.log('✅ Composers (' + composers.length + '):');
      composers.forEach((c: any, i: number) => {
        console.log(`   ${i + 1}. ${c.name} (${c.era})`);
      });
    }

    // Проверка works
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*');

    if (worksError) {
      console.log('\n❌ Ошибка works:', worksError.message);
    } else {
      console.log('\n✅ Works (' + works.length + '):');
      works.forEach((w: any, i: number) => {
        console.log(`   ${i + 1}. "${w.title}" (tempo: ${w.tempo})`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

checkData();

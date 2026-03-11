import { supabase } from '../src/lib/supabaseClient';

async function checkTables() {
  try {
    console.log('📊 Проверка таблиц в Supabase...\n');

    // Проверка composers
    const { data: composers, error: composersError } = await supabase
      .from('composers')
      .select('*')
      .limit(1);

    if (composersError) {
      console.log('❌ Таблица composers:', composersError.message);
    } else {
      console.log('✅ Таблица composers существует');
      console.log('   Количество записей:', composers?.length || 0);
    }

    // Проверка works
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .limit(1);

    if (worksError) {
      console.log('❌ Таблица works:', worksError.message);
    } else {
      console.log('✅ Таблица works существует');
      console.log('   Количество записей:', works?.length || 0);
    }

    // Проверка listeners
    const { data: listeners, error: listenersError } = await supabase
      .from('listeners')
      .select('*')
      .limit(1);

    if (listenersError) {
      console.log('❌ Таблица listeners:', listenersError.message);
    } else {
      console.log('✅ Таблица listeners существует');
      console.log('   Количество записей:', listeners?.length || 0);
    }

    console.log('\n📊 Статистика данных:');
    const { count: composersCount } = await supabase.from('composers').select('*', { count: 'exact', head: true });
    const { count: worksCount } = await supabase.from('works').select('*', { count: 'exact', head: true });
    const { count: listenersCount } = await supabase.from('listeners').select('*', { count: 'exact', head: true });

    console.log(`   Composers: ${composersCount || 0}`);
    console.log(`   Works: ${worksCount || 0}`);
    console.log(`   Listeners: ${listenersCount || 0}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

checkTables();

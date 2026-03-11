-- Создание таблиц для Music Timeline

-- Таблица композиторов
create table composers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  era text check (era in ('Baroque', 'Classical', 'Romantic', '20th Century', 'Contemporary')),
  life_dates text,
  image text,
  x float default 0,
  y float default 0,
  predecessors uuid[],
  created_at timestamp with time zone (utc, now()) default now()
);

-- Таблица произведений
create table works (
  id uuid primary key default uuid_generate_v4(),
  composer_id uuid references composers(id) on delete cascade,
  title text not null,
  tonality text,
  key text,
  tempo integer,
  notes jsonb default '[]'::jsonb,
  created_at timestamp with time zone (utc, now()) default now()
);

-- Таблица прослушиваний
create table listeners (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid default uuid_generate_v4(),
  current_work_id uuid references works(id),
  last_played timestamp with time zone (utc, now()) default now(),
  created_at timestamp with time zone (utc, now()) default now()
);

-- Индексы для производительности
create index idx_composers_era on composers(era);
create index idx_works_composer on works(composer_id);
create index idx_listeners_work on listeners(current_work_id);

-- Политика безопасности (RLS)
alter table composers enable row level security;
alter table works enable row level security;
alter table listeners enable row level security;

-- Разрешения для всех (для прототипа)
create policy "Enable access to composers for all users" on composers for select using (true);
create policy "Enable insert to composers for all users" on composers for insert with check (true);
create policy "Enable update to composers for all users" on composers for update using (true);
create policy "Enable delete to composers for all users" on composers for delete using (true);

create policy "Enable access to works for all users" on works for select using (true);
create policy "Enable insert to works for all users" on works for insert with check (true);
create policy "Enable update to works for all users" on works for update using (true);
create policy "Enable delete to works for all users" on works for delete using (true);

create policy "Enable access to listeners for all users" on listeners for select using (true);
create policy "Enable insert to listeners for all users" on listeners for insert with check (true);
create policy "Enable update to listeners for all users" on listeners for update using (true);
create policy "Enable delete to listeners for all users" on listeners for delete using (true);

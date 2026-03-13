-- Добавляем колонку openopus_id в composers (если нет)
alter table composers add column if not exists openopus_id integer;

-- Таблица произведений
create table if not exists pieces (
  id          uuid primary key default gen_random_uuid(),
  composer_id uuid not null references composers(id) on delete cascade,
  title       text not null,
  tempo       integer not null default 120,
  treble      text[] not null default '{}',
  bass        text[] not null default '{}',
  created_at  timestamptz default now()
);

create index if not exists pieces_composer_idx on pieces(composer_id);

alter table pieces enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='pieces' and policyname='public read pieces'
  ) then
    create policy "public read pieces" on pieces for select using (true);
  end if;
end $$;

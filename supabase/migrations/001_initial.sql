-- Таблица композиторов
create table if not exists composers (
  id           text primary key,
  label        text not null,
  era          text not null check (era in ('Baroque','Classical','Romantic','20th Century','Contemporary')),
  life_dates   text not null default '',
  image        text not null default '',
  x            numeric not null default 0,
  y            numeric not null default 0,
  predecessors text[] not null default '{}',
  openopus_id  integer,
  created_at   timestamptz default now()
);

-- Таблица произведений
create table if not exists pieces (
  id          text primary key,
  composer_id text not null references composers(id) on delete cascade,
  title       text not null,
  tempo       integer not null default 120,
  treble      text[] not null default '{}',
  bass        text[] not null default '{}',
  created_at  timestamptz default now()
);

-- Индексы
create index if not exists pieces_composer_idx on pieces(composer_id);
create index if not exists composers_era_idx on composers(era);

-- RLS (читать могут все, писать только с service_role)
alter table composers enable row level security;
alter table pieces    enable row level security;

create policy "public read composers" on composers for select using (true);
create policy "public read pieces"    on pieces    for select using (true);

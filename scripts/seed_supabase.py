#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Сидирование Supabase из Open Opus API.
Реальная схема: composers(id uuid, name, era, life_dates, image, x, y, predecessors, openopus_id)
                pieces(id uuid, composer_id uuid, title, tempo, treble[], bass[])

Запуск:
  python scripts/seed_supabase.py

Требует: сначала запусти supabase/migrations/002_pieces.sql в SQL Editor:
  https://supabase.com/dashboard/project/jtytuaxjkyswzuqrwweq/sql/new
"""
import sys, io, json, time, urllib.request, urllib.error, urllib.parse
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ─── Config ──────────────────────────────────────────────────────────────────
def load_env():
    env = {}
    p = Path(__file__).parent.parent / '.env'
    for line in p.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
    return env

E = load_env()
URL = E['VITE_SUPABASE_URL']
KEY = E['SUPABASE_SERVICE_ROLE_KEY']
HDRS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
}

OPEN_OPUS     = 'https://api.openopus.org'
MAX_COMPOSERS = 70
MAX_WORKS     = 10

ERA_MAP = {
    'Baroque':       'Baroque',
    'Classical':     'Classical',
    'Early Romantic':'Romantic',
    'Romantic':      'Romantic',
    'Late Romantic': 'Romantic',
    '20th Century':  '20th Century',
    'Post-War':      '20th Century',
    '21st Century':  'Contemporary',
}

# ─── HTTP helpers ─────────────────────────────────────────────────────────────
def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'MuseTimeline/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        return {'_error': str(e)}

def sb_get(path):
    req = urllib.request.Request(f'{URL}/rest/v1/{path}', headers=HDRS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def sb_post(table, row):
    url = f'{URL}/rest/v1/{table}'
    h = {**HDRS, 'Prefer': 'return=representation'}
    body = json.dumps(row).encode()
    req = urllib.request.Request(url, data=body, headers=h, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
            return r.status, data[0] if isinstance(data, list) else data
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:150]

# ─── Helpers ──────────────────────────────────────────────────────────────────
def birth_year_to_x(year):
    return round(((max(1600, min(2000, year)) - 1600) / 400) * 15, 1)

def get_year(c):
    try:   return int(str(c.get('birth', '1700'))[:4])
    except: return 1700

def check_table(name):
    status, _ = sb_get(f'{name}?select=id&limit=1')
    return status == 200

def get_existing_openopus_ids():
    status, data = sb_get('composers?select=id,openopus_id&openopus_id=not.is.null&limit=200')
    if status == 200 and isinstance(data, list):
        return {r['openopus_id']: r['id'] for r in data if r.get('openopus_id')}
    return {}

def get_existing_titles(composer_uuid):
    status, data = sb_get(f'pieces?select=title&composer_id=eq.{composer_uuid}&limit=20')
    if status == 200 and isinstance(data, list):
        return {r['title'] for r in data}
    return set()

# ─── Seed ─────────────────────────────────────────────────────────────────────
def run_seed():
    print('Загружаем существующие openopus_id...')
    existing = get_existing_openopus_ids()  # {openopus_id: composer_uuid}
    print(f'Уже есть с openopus_id: {len(existing)}\n')

    print('Загружаем из Open Opus...')
    seen, all_composers = set(), []
    for epoch in ['Baroque', 'Classical', 'Romantic', '20th Century']:
        url = f'{OPEN_OPUS}/composer/list/epoch/{urllib.parse.quote(epoch)}.json'
        d = get_json(url)
        for c in d.get('composers', []):
            if c['id'] not in seen:
                seen.add(c['id'])
                all_composers.append(c)
        time.sleep(0.5)

    all_composers.sort(key=get_year)
    all_composers = all_composers[:MAX_COMPOSERS]
    new_count = len([c for c in all_composers if c['id'] not in existing])
    print(f'Всего: {len(all_composers)}, новых: {new_count}\n')

    for c in all_composers:
        oo_id = c['id']
        yr    = get_year(c)
        era   = ERA_MAP.get(c.get('epoch', ''), 'Classical')
        dy    = str(c.get('death') or '')[:4]
        life  = f"{yr}-{dy}" if dy else f"{yr}-"

        if oo_id in existing:
            composer_uuid = existing[oo_id]
            print(f'  [skip] {c["name"]}')
        else:
            status, resp = sb_post('composers', {
                'name': c['name'],
                'era': era,
                'life_dates': life,
                'image': c.get('portrait') or '',
                'x': birth_year_to_x(yr),
                'y': 0,
                'predecessors': [],
                'openopus_id': oo_id,
            })
            if status in (200, 201) and isinstance(resp, dict):
                composer_uuid = resp['id']
                print(f'  [OK]   {c["name"]} ({era})')
            else:
                print(f'  [ERR]  {c["name"]}: {status} {resp}')
                continue

        # Произведения
        wd = get_json(f'{OPEN_OPUS}/work/list/composer/{oo_id}/genre/all.json')
        time.sleep(0.3)
        works = wd.get('works', [])
        works.sort(key=lambda w: 0 if w.get('popular') == '1' else 1)
        works = works[:MAX_WORKS]

        existing_titles = get_existing_titles(composer_uuid)
        added = 0
        for w in works:
            title = w.get('title', 'Untitled')
            if w.get('subtitle'):
                title = f"{title} - {w['subtitle']}"
            if title in existing_titles:
                continue
            s2, _ = sb_post('pieces', {
                'composer_id': composer_uuid,
                'title': title,
                'tempo': 120,
                'treble': [],
                'bass': [],
            })
            if s2 in (200, 201):
                added += 1

        if added:
            print(f'    +{added} произведений')
        time.sleep(0.25)

    print('\nГотово!')

# ─── Entry ────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print(f'Supabase: {URL}\n')

    if not check_table('composers'):
        print('[!] Таблица composers не найдена.')
        exit(1)

    if not check_table('pieces'):
        print('[!] Таблица pieces не найдена.')
        print('\nЗапусти в SQL Editor:')
        print('  https://supabase.com/dashboard/project/jtytuaxjkyswzuqrwweq/sql/new')
        print('  Файл: supabase/migrations/002_pieces.sql')
        exit(1)

    run_seed()

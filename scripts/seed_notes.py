#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Заполняет treble[] и bass[] для всех pieces в Supabase.
Использует точные ноты для известных композиторов,
для остальных — стилистически подходящие паттерны по эпохе.

Запуск:
  python scripts/seed_notes.py
"""
import sys, io, json, urllib.request, urllib.error
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

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
    'Prefer': 'return=minimal',
}

# ─── Стилистические паттерны по эпохам ────────────────────────────────────────
ERA_PATTERNS = {
    'Baroque': {
        'treble': [
            'd/5/8, c#/5/8, d/5/8, e/5/8, f/5/8, e/5/8, d/5/8, c#/5/8',
            'd/5/q, a/4/8, b/4/8, c#/5/q, d/5/q',
            'e/5/8, d/5/8, c#/5/8, b/4/8, a/4/q, r/q',
            'f#/4/8, g/4/8, a/4/8, b/4/8, c#/5/q, d/5/q',
        ],
        'bass': [
            'd/3/q, a/3/q, f#/3/q, a/3/q',
            'g/3/q, d/3/q, b/2/q, d/3/q',
            'a/2/q, e/3/q, c#/3/q, e/3/q',
            'd/3/h, a/2/h',
        ],
        'tempo': 90,
    },
    'Classical': {
        'treble': [
            'c/5/q, e/5/q, g/5/q, e/5/q',
            'f/5/q, d/5/q, b/4/q, g/4/q',
            'e/5/q, c/5/q, g/4/q, e/4/q',
            'g/5/8, f/5/8, e/5/q, d/5/q, c/5/q',
        ],
        'bass': [
            'c/3/q, g/3/q, e/3/q, g/3/q',
            'f/3/q, c/4/q, a/3/q, c/4/q',
            'g/3/q, d/4/q, b/3/q, d/4/q',
            'c/3/h, g/2/h',
        ],
        'tempo': 120,
    },
    'Romantic': {
        'treble': [
            'e/5/h, d/5/q, c/5/q',
            'b/4/h., a/4/8, g/4/q',
            'a/5/q, g/5/q, f/5/h',
            'e/5/q, f/5/8, e/5/8, d/5/q, c/5/q',
        ],
        'bass': [
            'c/3/q, g/3/q, e/4/q, g/3/q',
            'a/2/q, e/3/q, c/4/q, e/3/q',
            'f/3/q, c/4/q, a/3/q, c/4/q',
            'g/2/q, d/3/q, b/3/q, d/3/q',
        ],
        'tempo': 80,
    },
    '20th Century': {
        'treble': [
            'c/5/q, eb/5/q, f#/5/q, a/5/q',
            'bb/4/q, g/4/q, e/4/q, c#/4/q',
            'f/5/8, e/5/8, eb/5/8, d/5/8, db/5/8, c/5/8, b/4/8, bb/4/8',
            'c/5/q, r/q, ab/4/q, r/q',
        ],
        'bass': [
            'c/3/q, f#/3/q, bb/3/q, e/3/q',
            'ab/2/h, d/3/h',
            'g/2/q, db/3/q, f/3/q, b/3/q',
            'c/3/h., r/q',
        ],
        'tempo': 100,
    },
    'Contemporary': {
        'treble': [
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'b/4/8, f#/4/8, d/5/8, c#/5/8, b/4/8, f#/4/8, e/4/8, b/4/8',
            'a/4/q, b/4/q, c#/5/q, e/5/q',
            'e/5/q, c#/5/q, b/4/q, a/4/q',
        ],
        'bass': [
            'e/3/q, b/3/q, e/3/q, b/3/q',
            'a/2/q, e/3/q, a/2/q, e/3/q',
            'f#/3/q, c#/3/q, f#/3/q, c#/3/q',
            'e/2/h, e/3/h',
        ],
        'tempo': 160,
    },
}

# ─── Точные ноты для известных композиторов ───────────────────────────────────
# Ключи - подстроки имени (lowercase), значения - список pieces с нотами
KNOWN_COMPOSERS = {
    'bach': [
        {
            'title_kw': None,  # None = подходит любому произведению
            'treble': [
                'a/5/16, g/5/16, a/5/16, g/5/16, f/5/16, e/5/16, d/5/16, c#/5/16',
                'd/5/q, r/q, r/h',
                'a/4/16, g/4/16, a/4/16, g/4/16, f/4/16, e/4/16, d/4/16, c#/4/16',
                'd/4/q, r/q, r/h',
                'a/3/16, g/3/16, a/3/16, g/3/16, f/3/16, e/3/16, d/3/16, c#/3/16',
                'c#/3/q, d/3/q, e/3/q, f/3/q',
            ],
            'bass': ['d/3/w', 'd/2/w', 'd/2/w', 'a/1/w', 'a/1/w', 'a/1/w'],
            'tempo': 90,
        },
    ],
    'vivaldi': [
        {
            'title_kw': None,
            'treble': [
                'e/5, g#/4, g#/4, g#/4',
                'f#/4, e/4, b/3, b/3',
                'e/5, g#/4, g#/4, g#/4',
                'f#/4, e/4, b/3',
                'g#/4, a/4, b/4, c#/5',
                'b/4, a/4, g#/4, f#/4',
            ],
            'bass': [
                'e/3, b/3, e/4, b/3',
                'e/3, b/3, e/4, b/3',
                'e/3, b/3, e/4, b/3',
                'e/3, b/3, e/4, b/3',
                'e/3, b/3, e/3, a/3',
                'b/3, b/2, b/3, b/2',
            ],
            'tempo': 110,
        },
    ],
    'handel': [
        {
            'title_kw': None,
            'treble': [
                'g/5/q, f/5/8, e/5/8, d/5/q, c/5/q',
                'b/4/q, a/4/q, g/4/h',
                'c/5/8, d/5/8, e/5/8, f/5/8, g/5/q, a/5/q',
                'g/5/h, f/5/q, e/5/q',
            ],
            'bass': [
                'g/3/q, d/3/q, g/2/q, d/3/q',
                'g/3/q, f/3/q, e/3/q, d/3/q',
                'c/3/q, g/3/q, c/3/q, g/2/q',
                'g/2/h, g/3/h',
            ],
            'tempo': 100,
        },
    ],
    'mozart': [
        {
            'title_kw': None,
            'treble': [
                'c/5, e/5, g/5',
                'b/4, c/5, d/5, c/5',
                'a/4, g/4, c/5, g/4, f/4, g/4',
                'e/4/h',
                'a/4, g/4, f/4, e/4',
                'g/5/8, f/5/8, e/5/q, d/5/q, c/5/q',
            ],
            'bass': [
                'c/3, g/3, e/3, g/3',
                'c/3, g/3, e/3, g/3',
                'c/3, a/3, f/3, a/3',
                'c/3, g/3, e/3, g/3',
                'f/3, c/4, a/3, c/4',
                'g/3, b/3, g/3, b/3',
            ],
            'tempo': 135,
        },
    ],
    'haydn': [
        {
            'title_kw': None,
            'treble': [
                'g/5/q, f#/5/q, e/5/q, d/5/q',
                'c/5/q, b/4/q, a/4/h',
                'd/5/8, e/5/8, f#/5/8, g/5/8, a/5/q, b/5/q',
                'a/5/h, g/5/q, f#/5/q',
            ],
            'bass': [
                'g/3/q, d/3/q, g/2/q, d/3/q',
                'c/3/q, g/3/q, e/3/q, c/3/q',
                'd/3/q, a/3/q, f#/3/q, d/3/q',
                'g/2/h, g/3/h',
            ],
            'tempo': 125,
        },
    ],
    'beethoven': [
        {
            'title_kw': None,
            'treble': [
                'e/4, e/4, f/4, g/4',
                'g/4, f/4, e/4, d/4',
                'c/4, c/4, d/4, e/4',
                'e/4, d/4, d/4',
                'e/4, e/4, f/4, g/4',
                'd/4, c/4, c/4',
            ],
            'bass': [
                'c/3, e/3, g/3',
                'c/3, f/3, a/3',
                'c/3, e/3, g/3',
                'g/2, b/2, d/3',
                'c/3, e/3, g/3',
                'g/2, c/3',
            ],
            'tempo': 120,
        },
    ],
    'schubert': [
        {
            'title_kw': None,
            'treble': [
                'b/4/h, a/4/q, g/4/q',
                'f#/4/h., e/4/8, d/4/q',
                'e/4/q, f#/4/q, g/4/h',
                'a/4/h, g/4/q, f#/4/q',
            ],
            'bass': [
                'b/2, f#/3, b/3, f#/3',
                'b/2, f#/3, b/3, f#/3',
                'e/3, b/3, g/3, b/3',
                'd/3, a/3, f#/3, a/3',
            ],
            'tempo': 76,
        },
    ],
    'chopin': [
        {
            'title_kw': None,
            'treble': [
                'e/5/h., d/5/8, c/5/4',
                'b/4/h, c/5/q, d/5/q',
                'e/5/q, d/5/8, c/5/8, b/4/q, a/4/q',
                'g/4/h., r/4',
            ],
            'bass': [
                'c/3/q, g/3/q, e/4/q, g/3/q',
                'g/2/q, b/3/q, d/4/q, b/3/q',
                'a/2/q, e/3/q, c/4/q, e/3/q',
                'f/3/q, c/4/q, a/3/q, c/4/q',
            ],
            'tempo': 72,
        },
    ],
    'liszt': [
        {
            'title_kw': None,
            'treble': [
                'c#/5/q, d/5/8, c#/5/8, b/4/q, a/4/q',
                'g#/4/h, a/4/q, b/4/q',
                'c#/5/8, d/5/8, e/5/8, f#/5/8, g#/5/q, a/5/q',
                'a/5/h., g#/5/8, f#/5/q',
            ],
            'bass': [
                'a/2/q, e/3/q, a/3/q, e/3/q',
                'a/2/q, c#/3/q, e/3/q, a/3/q',
                'd/3/q, a/3/q, f#/3/q, d/3/q',
                'e/2/q, b/2/q, e/3/q, b/3/q',
            ],
            'tempo': 88,
        },
    ],
    'brahms': [
        {
            'title_kw': None,
            'treble': [
                'f/5/h, e/5/q, d/5/q',
                'c/5/q, b/4/q, a/4/h',
                'bb/4/q, a/4/q, g/4/h',
                'f/4/h., r/q',
            ],
            'bass': [
                'f/3/q, c/4/q, a/3/q, f/3/q',
                'c/3/q, g/3/q, e/3/q, c/3/q',
                'f/2/q, c/3/q, f/3/q, c/3/q',
                'bb/2/h, f/3/h',
            ],
            'tempo': 84,
        },
    ],
    'tchaikovsky': [
        {
            'title_kw': None,
            'treble': [
                'b/4/h, a/4/8, f#/4/8',
                'd/4/8, e/4/8, f#/4/h',
                'b/3/8, d/4/8, f#/4/h',
                'a/4/8, g/4/8, e/4/h',
                'b/4/h, a/4/8, f#/4/8',
                'd/4/8, e/4/8, f#/4/4, d/5/4',
            ],
            'bass': [
                'b/2, f#/3, b/3, f#/3',
                'b/2, d/3, b/3, d/3',
                'b/2, f#/3, b/3, f#/3',
                'e/3, g/3, b/3, g/3',
                'b/2, f#/3, d/3, f#/3',
                'b/2, f#/3, b/3, r',
            ],
            'tempo': 100,
        },
    ],
    'dvořák': [
        {
            'title_kw': None,
            'treble': [
                'e/5/h, d/5/q, c#/5/q',
                'b/4/h., a/4/8, g/4/q',
                'a/4/q, b/4/q, c#/5/h',
                'e/5/h, r/h',
            ],
            'bass': [
                'a/2/q, e/3/q, c#/4/q, e/3/q',
                'a/2/q, e/3/q, a/3/q, e/3/q',
                'd/3/q, a/3/q, f#/3/q, a/3/q',
                'e/3/h, a/2/h',
            ],
            'tempo': 90,
        },
    ],
    'mahler': [
        {
            'title_kw': None,
            'treble': [
                'd/5/h., c/5/8, b/4/q',
                'a/4/h, g/4/q, f/4/q',
                'e/4/h, f/4/q, g/4/q',
                'a/4/w',
            ],
            'bass': [
                'd/3/q, a/3/q, f/3/q, a/3/q',
                'd/3/q, f/3/q, a/3/q, c/4/q',
                'g/2/q, d/3/q, b/3/q, d/3/q',
                'a/2/w',
            ],
            'tempo': 76,
        },
    ],
    'debussy': [
        {
            'title_kw': None,
            'treble': [
                'r, f/5, e/5, d/5',
                'c/5/h, d/5/q',
                'c/5/h, a/4/q',
                'c/5/h, g/4/q',
                'f/4, a/4, g/4, f/4',
                'e/4, d/4, e/4, a/3',
            ],
            'bass': [
                'f/3, a/3, c/4',
                'f/3, a/3, c/4',
                'f/3, a/3, c/4',
                'e/3, g/3, c/4',
                'd/3, f/3, a/3',
                'c/3, e/3, a/3',
            ],
            'tempo': 60,
        },
    ],
    'ravel': [
        {
            'title_kw': None,
            'treble': [
                'c/5/q, e/5/8, g/5/8, e/5/q, c/5/q',
                'f/5/q, d/5/q, b/4/q, g/4/q',
                'a/4/q, c/5/q, e/5/q, g/5/q',
                'f/5/h, e/5/q, d/5/q',
            ],
            'bass': [
                'c/3/q, g/3/q, c/4/q, g/3/q',
                'f/3/q, c/4/q, a/3/q, f/3/q',
                'a/2/q, e/3/q, a/3/q, e/3/q',
                'd/3/q, a/3/q, f/3/q, d/3/q',
            ],
            'tempo': 96,
        },
    ],
    'stravinsky': [
        {
            'title_kw': None,
            'treble': [
                'c/5/8, b/4/8, g/4/8, e/4/8, b/4/4',
                'a/4/8, g/4/8, e/4/4, a/4/4',
                'g/4/8, e/4/8, d/4/4, g/4/4',
                'c/5/4, b/4/8, a/4/8, g/4/4, e/4/4',
                'f/4/8, e/4/8, d/4/4, f/4/4',
                'e/4/4, d/4/4, c/4/h',
            ],
            'bass': ['c/3/w', 'c/3/w', 'c/3/w', 'c/3/w', 'c/3/w', 'c/3/w'],
            'tempo': 70,
        },
    ],
    'prokofiev': [
        {
            'title_kw': None,
            'treble': [
                'c/5/q, d/5/q, eb/5/q, f/5/q',
                'g/5/q, f/5/q, eb/5/q, d/5/q',
                'c/5/8, b/4/8, bb/4/8, a/4/8, ab/4/q, g/4/q',
                'c/5/h, r/h',
            ],
            'bass': [
                'c/3/q, g/3/q, eb/3/q, g/3/q',
                'c/3/q, ab/3/q, f/3/q, ab/3/q',
                'g/2/q, d/3/q, b/3/q, d/3/q',
                'c/3/h, c/2/h',
            ],
            'tempo': 112,
        },
    ],
    'shostakovich': [
        {
            'title_kw': None,
            'treble': [
                'd/5/q, eb/5/q, d/5/q, c#/5/q',
                'c/5/q, b/4/q, bb/4/q, a/4/q',
                'ab/4/q, g/4/q, f#/4/q, f/4/q',
                'e/4/h, r/h',
            ],
            'bass': [
                'd/3/q, a/3/q, d/3/q, a/3/q',
                'g/2/q, d/3/q, g/3/q, d/3/q',
                'c/3/q, g/3/q, c/3/q, g/2/q',
                'd/2/h, d/3/h',
            ],
            'tempo': 92,
        },
    ],
    'bartók': [
        {
            'title_kw': None,
            'treble': [
                'c/5/q, d/5/q, eb/5/q, g/5/q',
                'f#/5/q, e/5/q, d/5/q, c/5/q',
                'bb/4/8, c/5/8, d/5/8, eb/5/8, f/5/q, g/5/q',
                'a/5/h, r/h',
            ],
            'bass': [
                'c/3/q, f#/3/q, c/3/q, f#/3/q',
                'bb/2/q, e/3/q, bb/2/q, e/3/q',
                'g/2/q, db/3/q, g/2/q, db/3/q',
                'c/3/h, r/h',
            ],
            'tempo': 108,
        },
    ],
    'schoenberg': [
        {
            'title_kw': None,
            'treble': [
                'c/5/q, f#/5/q, bb/4/q, e/5/q',
                'ab/4/q, d/5/q, g/4/q, c#/5/q',
                'f/4/8, b/4/8, eb/5/8, a/4/8, d/5/q, g#/4/q',
                'c/5/h, r/h',
            ],
            'bass': [
                'c/3/q, f#/3/q, bb/2/q, e/3/q',
                'ab/2/q, d/3/q, g/2/q, c#/3/q',
                'f/2/q, b/2/q, eb/3/q, a/2/q',
                'c/3/h, r/h',
            ],
            'tempo': 80,
        },
    ],
    'reich': [
        {
            'title_kw': None,
            'treble': [
                'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
                'b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8, c#/5/8',
                'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
                'b/4/8, f#/4/8, d/5/8, c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8',
            ],
            'bass': [
                'e/3/8, r, b/3/8, r, d/4/8, r, e/3/8, r',
                'b/3/8, r, d/4/8, r, e/3/8, r, b/3/8, r',
                'e/3/8, r, b/3/8, r, d/4/8, r, e/3/8, r',
                'b/3/8, r, d/4/8, r, e/3/8, r, b/3/8, r',
            ],
            'tempo': 180,
        },
    ],
    'glass': [
        {
            'title_kw': None,
            'treble': [
                'e/4/8, b/4/8, d/5/8, b/4/8, e/4/8, b/4/8, d/5/8, b/4/8',
                'a/4/8, e/5/8, c#/5/8, e/5/8, a/4/8, e/5/8, c#/5/8, e/5/8',
                'g/4/8, b/4/8, e/5/8, b/4/8, g/4/8, b/4/8, e/5/8, b/4/8',
                'f#/4/8, a/4/8, d/5/8, a/4/8, f#/4/8, a/4/8, d/5/8, a/4/8',
            ],
            'bass': [
                'e/3/h, e/3/h',
                'a/2/h, a/2/h',
                'g/2/h, g/2/h',
                'd/3/h, d/3/h',
            ],
            'tempo': 140,
        },
    ],
    'arvo pärt': [
        {
            'title_kw': None,
            'treble': [
                'a/4/h, b/4/q, c/5/q',
                'b/4/h, a/4/h',
                'g/4/h, a/4/q, b/4/q',
                'a/4/w',
            ],
            'bass': [
                'a/3/w',
                'a/3/w',
                'a/3/w',
                'a/3/w',
            ],
            'tempo': 52,
        },
    ],
}


# ─── HTTP helpers ──────────────────────────────────────────────────────────────
def sb_get(path):
    req = urllib.request.Request(f'{URL}/rest/v1/{path}', headers=HDRS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]


def sb_patch(table, filter_str, body):
    url = f'{URL}/rest/v1/{table}?{filter_str}'
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=HDRS, method='PATCH')
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


# ─── Логика подбора нот ───────────────────────────────────────────────────────
def find_known_pattern(composer_name):
    """Ищет точный паттерн по подстроке имени (case-insensitive)."""
    name_lower = composer_name.lower()
    for key, patterns in KNOWN_COMPOSERS.items():
        if key in name_lower:
            return patterns[0]  # Берём первый (и обычно единственный) паттерн
    return None


def get_era_pattern(era):
    return ERA_PATTERNS.get(era, ERA_PATTERNS['Classical'])


# ─── Основной запуск ──────────────────────────────────────────────────────────
def run():
    print('Загружаем composers...')
    status, composers = sb_get('composers?select=id,name,era&limit=200')
    if status != 200:
        print(f'[ERR] composers: {status} {composers}')
        return
    print(f'Найдено {len(composers)} composers\n')

    comp_map = {c['id']: c for c in composers}

    print('Загружаем pieces...')
    status, pieces = sb_get('pieces?select=id,composer_id,title,treble&limit=1000')
    if status != 200:
        print(f'[ERR] pieces: {status} {pieces}')
        return

    empty = [p for p in pieces if not p.get('treble')]
    print(f'Всего pieces: {len(pieces)}, пустых: {len(empty)}\n')

    if not empty:
        print('Все pieces уже заполнены!')
        return

    updated = skipped = 0

    for piece in empty:
        comp = comp_map.get(piece['composer_id'])
        if not comp:
            skipped += 1
            continue

        name = comp['name']
        era  = comp['era']

        known = find_known_pattern(name)
        if known:
            treble = known['treble']
            bass   = known['bass']
            tempo  = known['tempo']
            src    = 'known'
        else:
            pat    = get_era_pattern(era)
            treble = pat['treble']
            bass   = pat['bass']
            tempo  = pat['tempo']
            src    = f'era:{era}'

        code = sb_patch('pieces', f'id=eq.{piece["id"]}', {
            'treble': treble,
            'bass':   bass,
            'tempo':  tempo,
        })

        if code in (200, 204):
            updated += 1
            print(f'  [OK]   {name[:25]:25} — {piece["title"][:35]:35} ({src})')
        else:
            skipped += 1
            print(f'  [ERR]  {name[:25]:25} — {piece["title"][:35]:35} → HTTP {code}')

    print(f'\nГотово! Обновлено: {updated}, пропущено: {skipped}')


if __name__ == '__main__':
    print(f'Supabase: {URL}\n')
    run()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Заполняет treble[] и bass[] для всех pieces в Supabase.
FORCE-UPDATE: перезаписывает все pieces, включая уже заполненные.

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

# ─── Расширенные эпохальные паттерны (16 тактов) ────────────────────────────
ERA_PATTERNS = {
    'Baroque': {
        'treble': [
            'd/5/8, c#/5/8, d/5/8, e/5/8, f/5/8, e/5/8, d/5/8, c#/5/8',
            'd/5/q, a/4/8, b/4/8, c#/5/q, d/5/q',
            'e/5/8, d/5/8, c#/5/8, b/4/8, a/4/q, r/q',
            'f#/4/8, g/4/8, a/4/8, b/4/8, c#/5/q, d/5/q',
            'a/5/8, g/5/8, f#/5/8, e/5/8, d/5/q, c#/5/q',
            'd/5/q, e/5/q, f#/5/q, g/5/q',
            'a/5/q, g/5/q, f#/5/q, e/5/q',
            'd/5/h, r/h',
            'f#/5/8, e/5/8, d/5/8, c#/5/8, b/4/q, a/4/q',
            'g/4/q, a/4/q, b/4/q, c#/5/q',
            'd/5/8, e/5/8, f#/5/8, g/5/8, a/5/q, b/5/q',
            'a/5/h, f#/5/h',
            'e/5/q, d/5/q, c#/5/q, b/4/q',
            'a/4/q, b/4/q, c#/5/q, d/5/q',
            'e/5/q, c#/5/q, a/4/q, e/4/q',
            'd/4/w',
        ],
        'bass': [
            'd/3/q, a/3/q, f#/3/q, a/3/q',
            'g/3/q, d/3/q, b/2/q, d/3/q',
            'a/2/q, e/3/q, c#/3/q, e/3/q',
            'd/3/h, a/2/h',
            'a/2/q, e/3/q, a/3/q, e/3/q',
            'd/3/q, a/3/q, d/3/q, a/2/q',
            'g/2/q, d/3/q, g/3/q, d/3/q',
            'a/2/h, d/2/h',
            'b/2/q, f#/3/q, b/2/q, f#/3/q',
            'e/3/q, b/3/q, e/3/q, b/2/q',
            'a/2/q, e/3/q, a/3/q, e/3/q',
            'd/3/h, d/2/h',
            'a/2/q, e/3/q, c#/3/q, a/2/q',
            'd/3/q, a/3/q, f#/3/q, d/3/q',
            'a/2/q, e/3/q, a/2/q, e/2/q',
            'd/2/w',
        ],
        'tempo': 90,
    },
    'Classical': {
        'treble': [
            'c/5/q, e/5/q, g/5/q, e/5/q',
            'f/5/q, d/5/q, b/4/q, g/4/q',
            'e/5/q, c/5/q, g/4/q, e/4/q',
            'g/5/8, f/5/8, e/5/q, d/5/q, c/5/q',
            'a/4/q, b/4/q, c/5/q, d/5/q',
            'e/5/q, d/5/q, c/5/q, b/4/q',
            'g/4/q, a/4/q, b/4/q, c/5/q',
            'd/5/h, r/h',
            'g/5/q, f/5/q, e/5/q, d/5/q',
            'c/5/q, b/4/q, a/4/q, g/4/q',
            'f/4/q, g/4/q, a/4/q, b/4/q',
            'c/5/h, e/5/h',
            'g/5/q, e/5/q, c/5/q, e/5/q',
            'f/5/q, d/5/q, g/4/q, b/4/q',
            'e/5/q, c/5/q, d/5/q, b/4/q',
            'c/5/w',
        ],
        'bass': [
            'c/3/q, g/3/q, e/3/q, g/3/q',
            'f/3/q, c/4/q, a/3/q, c/4/q',
            'g/3/q, d/4/q, b/3/q, d/4/q',
            'c/3/h, g/2/h',
            'f/3/q, c/4/q, a/3/q, f/3/q',
            'g/3/q, d/4/q, b/3/q, g/3/q',
            'e/3/q, c/4/q, g/3/q, e/3/q',
            'g/3/h, g/2/h',
            'c/3/q, g/3/q, e/3/q, g/3/q',
            'f/3/q, a/3/q, c/4/q, a/3/q',
            'd/3/q, f/3/q, a/3/q, f/3/q',
            'g/3/h, c/3/h',
            'c/3/q, g/3/q, e/4/q, g/3/q',
            'f/3/q, c/4/q, a/3/q, f/3/q',
            'g/3/q, d/4/q, g/3/q, d/3/q',
            'c/3/w',
        ],
        'tempo': 120,
    },
    'Romantic': {
        'treble': [
            'e/5/h, d/5/q, c/5/q',
            'b/4/h., a/4/8, g/4/q',
            'a/5/q, g/5/q, f/5/h',
            'e/5/q, f/5/8, e/5/8, d/5/q, c/5/q',
            'g/5/q, f/5/q, e/5/h',
            'd/5/q, c/5/q, b/4/h',
            'a/4/q, b/4/q, c/5/q, d/5/q',
            'e/5/w',
            'c/5/h, b/4/q, a/4/q',
            'g/4/h., f/4/8, e/4/q',
            'f/4/q, g/4/q, a/4/h',
            'b/4/h, c/5/h',
            'e/5/q, d/5/q, c/5/q, b/4/q',
            'a/4/q, g/4/q, f/4/h',
            'e/4/q, f/4/q, g/4/q, a/4/q',
            'c/5/w',
        ],
        'bass': [
            'c/3/q, g/3/q, e/4/q, g/3/q',
            'a/2/q, e/3/q, c/4/q, e/3/q',
            'f/3/q, c/4/q, a/3/q, c/4/q',
            'g/2/q, d/3/q, b/3/q, d/3/q',
            'c/3/q, g/3/q, e/4/q, g/3/q',
            'g/2/q, d/3/q, b/3/q, d/3/q',
            'a/2/q, e/3/q, c/4/q, e/3/q',
            'c/3/q, g/3/q, c/3/q, g/2/q',
            'a/2/q, e/3/q, a/3/q, e/3/q',
            'f/2/q, c/3/q, f/3/q, c/3/q',
            'd/3/q, a/3/q, f/3/q, a/3/q',
            'e/3/q, b/3/q, g/3/q, b/3/q',
            'c/3/q, g/3/q, e/3/q, g/3/q',
            'f/2/q, c/3/q, a/2/q, c/3/q',
            'g/2/q, d/3/q, g/3/q, d/3/q',
            'c/3/w',
        ],
        'tempo': 80,
    },
    '20th Century': {
        'treble': [
            'c/5/q, eb/5/q, f#/5/q, a/5/q',
            'bb/4/q, g/4/q, e/4/q, c#/4/q',
            'f/5/8, e/5/8, eb/5/8, d/5/8, db/5/8, c/5/8, b/4/8, bb/4/8',
            'c/5/q, r/q, ab/4/q, r/q',
            'a/4/q, b/4/q, c/5/q, d/5/q',
            'eb/5/q, d/5/q, c/5/q, b/4/q',
            'bb/4/q, a/4/q, ab/4/q, g/4/q',
            'c/5/h, r/h',
            'f#/5/q, e/5/q, d/5/q, c/5/q',
            'b/4/q, bb/4/q, a/4/q, ab/4/q',
            'g/4/q, ab/4/q, a/4/q, bb/4/q',
            'b/4/h, c/5/h',
            'c/5/q, eb/5/q, gb/5/q, a/5/q',
            'bb/5/q, g/5/q, e/5/q, c#/5/q',
            'b/4/q, a/4/q, g/4/q, f/4/q',
            'c/5/w',
        ],
        'bass': [
            'c/3/q, f#/3/q, bb/3/q, e/3/q',
            'ab/2/h, d/3/h',
            'g/2/q, db/3/q, f/3/q, b/3/q',
            'c/3/h., r/q',
            'f#/2/q, c/3/q, g/3/q, db/3/q',
            'bb/2/q, e/3/q, a/3/q, eb/3/q',
            'ab/2/q, d/3/q, g/3/q, db/3/q',
            'c/3/h, r/h',
            'f#/2/q, c/3/q, f#/2/q, c/3/q',
            'g/2/q, db/3/q, g/2/q, db/3/q',
            'ab/2/q, d/3/q, ab/2/q, d/3/q',
            'c/3/h, f#/2/h',
            'c/3/q, f#/3/q, c/3/q, f#/3/q',
            'g/2/q, db/3/q, g/2/q, db/3/q',
            'ab/2/q, eb/3/q, ab/2/q, eb/3/q',
            'c/3/w',
        ],
        'tempo': 100,
    },
    'Contemporary': {
        'treble': [
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'b/4/8, f#/4/8, d/5/8, c#/5/8, b/4/8, f#/4/8, e/4/8, b/4/8',
            'a/4/q, b/4/q, c#/5/q, e/5/q',
            'e/5/q, c#/5/q, b/4/q, a/4/q',
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8, c#/5/8',
            'a/4/q, e/5/q, a/4/q, e/5/q',
            'b/4/q, f#/5/q, b/4/q, f#/5/q',
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'b/4/8, f#/4/8, d/5/8, c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8',
            'c#/5/q, d/5/q, e/5/q, f#/5/q',
            'b/5/q, a/5/q, g/5/q, f#/5/q',
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8, c#/5/8',
            'a/4/q, b/4/q, c#/5/q, b/4/q',
            'e/4/w',
        ],
        'bass': [
            'e/3/q, b/3/q, e/3/q, b/3/q',
            'a/2/q, e/3/q, a/2/q, e/3/q',
            'f#/3/q, c#/3/q, f#/3/q, c#/3/q',
            'e/2/h, e/3/h',
            'e/3/q, b/3/q, e/3/q, b/3/q',
            'a/2/q, e/3/q, a/2/q, e/3/q',
            'e/3/8, r/8, b/3/8, r/8, e/3/8, r/8, b/3/8, r/8',
            'b/2/8, r/8, f#/3/8, r/8, b/2/8, r/8, f#/3/8, r/8',
            'e/3/q, b/3/q, e/3/q, b/3/q',
            'a/2/q, e/3/q, a/2/q, e/3/q',
            'f#/3/q, c#/3/q, f#/3/q, c#/3/q',
            'b/2/q, f#/3/q, b/2/q, f#/3/q',
            'e/3/q, b/3/q, e/3/q, b/3/q',
            'a/2/q, e/3/q, a/2/q, e/3/q',
            'b/2/q, f#/3/q, b/2/q, f#/3/q',
            'e/2/w',
        ],
        'tempo': 160,
    },
}

# ─── Полные произведения для известных композиторов (24+ тактов) ──────────────
KNOWN_COMPOSERS = {
    'bach': [{
        'title_kw': None,
        'treble': [
            # Токката — нисходящий пробег
            'a/5/16, g/5/16, f/5/16, e/5/16, d/5/16, c#/5/16, d/5/8',
            'd/5/q, r/q, r/h',
            'a/4/16, g/4/16, f/4/16, e/4/16, d/4/16, c#/4/16, d/4/8',
            'd/4/q, r/q, r/h',
            'a/3/16, g/3/16, f/3/16, e/3/16, d/3/16, c#/3/16, d/3/8',
            'd/3/q, r/q, r/q, a/2/8, b/2/8',
            # Восходящие хроматические ходы
            'c#/3/q, d/3/q, e/3/q, f/3/q',
            'g/3/q, a/3/q, bb/3/q, c/4/q',
            'd/4/q, e/4/q, f/4/q, g/4/q',
            'a/4/h, d/4/h',
            # Фуга — экспозиция (тема в d-moll)
            'd/4/q, f/4/q, a/4/q, d/5/q',
            'c/5/q, bb/4/q, a/4/q, g/4/q',
            'f/4/q, e/4/q, d/4/q, c#/4/q',
            'd/4/h, r/h',
            # Ответ на доминанте (a-moll)
            'a/4/q, c/5/q, e/5/q, a/5/q',
            'g/5/q, f/5/q, e/5/q, d/5/q',
            'c/5/q, b/4/q, a/4/q, g#/4/q',
            'a/4/h, r/h',
            # Третий голос (F-dur)
            'f/4/q, a/4/q, c/5/q, f/5/q',
            'e/5/q, d/5/q, c/5/q, bb/4/q',
            'a/4/q, g/4/q, f/4/q, e/4/q',
            'd/4/h, f/4/h',
            # Финальная каденция
            'a/4/q, g#/4/q, a/4/q, c#/5/q',
            'd/5/q, c/5/q, bb/4/q, a/4/q',
            'g/4/q, f/4/q, e/4/q, d/4/q',
            'c#/4/q, e/4/q, a/4/q, e/4/q',
            'd/4/w',
        ],
        'bass': [
            'd/3/w', 'd/2/w', 'd/2/w', 'd/2/w', 'a/1/w', 'a/1/w',
            'a/1/q, c/2/q, e/2/q, g/2/q',
            'a/1/q, d/2/q, f/2/q, a/2/q',
            'bb/1/q, f/2/q, d/2/q, bb/1/q',
            'a/1/h, a/2/h',
            'd/2/q, a/2/q, f/2/q, d/2/q',
            'e/2/q, c/3/q, a/2/q, c/3/q',
            'bb/2/q, f/2/q, d/2/q, f/2/q',
            'a/2/h, d/2/h',
            'a/2/q, e/3/q, c/3/q, a/2/q',
            'b/2/q, g/3/q, e/3/q, g/3/q',
            'f/3/q, e/3/q, d/3/q, c/3/q',
            'b/2/h, a/2/h',
            'f/2/q, c/3/q, a/2/q, f/2/q',
            'g/2/q, d/3/q, bb/2/q, g/2/q',
            'c/3/q, g/2/q, e/2/q, c/2/q',
            'f/2/h, c/2/h',
            'a/2/q, e/3/q, a/2/q, a/1/q',
            'a/1/q, e/2/q, a/2/q, e/2/q',
            'a/1/q, c#/2/q, e/2/q, a/2/q',
            'a/1/q, e/2/q, a/2/q, e/2/q',
            'd/2/w',
        ],
        'tempo': 90,
    }],

    'vivaldi': [{
        'title_kw': None,
        'treble': [
            # Весенняя тема — A секция
            'e/5/q, d#/5/q, e/5/q, f#/5/q',
            'g#/5/q, f#/5/q, e/5/q, d#/5/q',
            'e/5/8, f#/5/8, g#/5/8, a/5/8, b/5/q, a/5/q',
            'g#/5/h, e/5/h',
            # Птичьи трели — B секция
            'e/5/8, e/5/8, f#/5/8, e/5/8, d#/5/q, e/5/q',
            'f#/5/8, g#/5/8, a/5/8, g#/5/8, f#/5/q, e/5/q',
            'b/5/8, a/5/8, g#/5/8, f#/5/8, e/5/q, d#/5/q',
            'e/5/h, r/h',
            # Возврат A темы
            'e/5/q, d#/5/q, e/5/q, f#/5/q',
            'g#/5/q, a/5/q, b/5/q, a/5/q',
            'g#/5/8, f#/5/8, e/5/8, d#/5/8, e/5/q, g#/5/q',
            'b/5/h, g#/5/h',
            # Развитие — ручеёк (16th runs)
            'e/5/16, f#/5/16, e/5/16, d#/5/16, e/5/q, b/4/q',
            'c#/5/16, d#/5/16, c#/5/16, b/4/16, c#/5/q, a/4/q',
            'b/4/16, c#/5/16, b/4/16, a/4/16, b/4/q, g#/4/q',
            'a/4/h, e/4/h',
            # Финал
            'e/5/q, g#/5/q, b/5/q, g#/5/q',
            'f#/5/q, a/5/q, c#/6/q, a/5/q',
            'b/5/q, g#/5/q, e/5/q, d#/5/q',
            'e/5/w',
        ],
        'bass': [
            'e/3/q, b/3/q, e/3/q, b/3/q', 'e/3/q, b/3/q, e/3/q, b/3/q',
            'e/3/q, b/3/q, e/3/q, a/3/q', 'b/3/h, e/3/h',
            'e/3/q, b/3/q, e/3/q, b/3/q', 'c#/3/q, g#/3/q, a/3/q, e/3/q',
            'b/2/q, f#/3/q, b/2/q, f#/3/q', 'e/3/h, r/h',
            'e/3/q, b/3/q, e/3/q, b/3/q', 'a/3/q, e/3/q, a/3/q, e/3/q',
            'b/3/q, g#/3/q, e/3/q, b/2/q', 'e/3/h, e/2/h',
            'e/3/q, b/3/q, e/3/q, b/3/q', 'a/2/q, e/3/q, a/2/q, e/3/q',
            'b/2/q, f#/3/q, b/2/q, f#/3/q', 'a/2/h, e/2/h',
            'e/3/q, b/3/q, e/4/q, b/3/q', 'f#/3/q, c#/4/q, f#/3/q, c#/4/q',
            'b/2/q, f#/3/q, b/2/q, f#/3/q', 'e/2/w',
        ],
        'tempo': 112,
    }],

    'handel': [{
        'title_kw': None,
        'treble': [
            'g/5/q, f/5/8, e/5/8, d/5/q, c/5/q',
            'b/4/q, a/4/q, g/4/h',
            'c/5/8, d/5/8, e/5/8, f/5/8, g/5/q, a/5/q',
            'g/5/h, f/5/q, e/5/q',
            'd/5/q, e/5/q, f/5/q, g/5/q',
            'a/5/q, g/5/q, f/5/q, e/5/q',
            'd/5/q, c/5/q, b/4/q, a/4/q',
            'g/4/w',
            'e/5/q, f/5/q, g/5/q, a/5/q',
            'b/5/q, a/5/q, g/5/q, f/5/q',
            'e/5/8, f/5/8, g/5/8, a/5/8, b/5/q, c/6/q',
            'b/5/h, g/5/h',
            'c/6/q, b/5/q, a/5/q, g/5/q',
            'f/5/q, e/5/q, d/5/q, c/5/q',
            'b/4/q, c/5/q, d/5/q, e/5/q',
            'g/5/w',
        ],
        'bass': [
            'g/3/q, d/3/q, g/2/q, d/3/q', 'g/3/q, f/3/q, e/3/q, d/3/q',
            'c/3/q, g/3/q, c/3/q, g/2/q', 'g/2/h, g/3/h',
            'd/3/q, a/3/q, f#/3/q, d/3/q', 'e/3/q, b/3/q, g/3/q, e/3/q',
            'a/2/q, e/3/q, c/3/q, a/2/q', 'g/2/q, d/3/q, g/3/q, d/3/q',
            'c/3/q, g/3/q, e/3/q, g/3/q', 'g/3/q, d/4/q, b/3/q, d/4/q',
            'a/3/q, e/4/q, c/4/q, e/4/q', 'g/2/h, g/3/h',
            'c/3/q, g/3/q, c/3/q, g/2/q', 'f/3/q, c/4/q, a/3/q, f/3/q',
            'g/3/q, d/4/q, b/3/q, d/4/q', 'g/2/w',
        ],
        'tempo': 100,
    }],

    'mozart': [{
        'title_kw': None,
        'treble': [
            # Главная тема K.545
            'c/5/q, e/5/q, g/5/q, e/5/q',
            'g/5/q, a/5/q, g/5/q, f/5/q',
            'e/5/q, c/5/q, g/4/q, e/4/q',
            'f/4/q, g/4/q, a/4/q, g/4/q',
            'c/5/8, d/5/8, e/5/8, f/5/8, e/5/q, d/5/q',
            'c/5/q, b/4/q, a/4/q, b/4/q',
            'c/5/q, e/5/q, g/5/q, e/5/q',
            'g/5/h, r/h',
            # Вторая тема G-dur
            'g/5/q, f#/5/q, e/5/q, d/5/q',
            'c/5/q, b/4/q, a/4/q, g/4/q',
            'b/4/q, c/5/q, d/5/q, e/5/q',
            'f#/5/q, g/5/q, a/5/q, b/5/q',
            'g/5/q, f#/5/q, e/5/q, d/5/q',
            'c/5/q, d/5/q, b/4/q, g/4/q',
            # Заключительная тема
            'g/4/8, a/4/8, b/4/8, c/5/8, d/5/8, e/5/8, f#/5/8, g/5/8',
            'g/5/q, f#/5/q, e/5/q, d/5/q',
            # Разработка
            'a/4/q, c/5/q, e/5/q, c/5/q',
            'f/4/q, a/4/q, c/5/q, a/4/q',
            'g/4/q, b/4/q, d/5/q, b/4/q',
            'e/4/q, g/4/q, b/4/q, g/4/q',
            # Реприза
            'c/5/q, e/5/q, g/5/q, e/5/q',
            'g/5/q, a/5/q, g/5/q, f/5/q',
            'e/5/q, c/5/q, g/4/q, e/4/q',
            'd/4/q, e/4/q, f/4/q, g/4/q',
            'c/5/h, g/4/h', 'c/5/w',
        ],
        'bass': [
            'c/3/q, g/3/q, e/3/q, g/3/q', 'c/3/q, g/3/q, e/3/q, g/3/q',
            'c/3/q, g/3/q, e/3/q, g/3/q', 'f/3/q, c/4/q, a/3/q, c/4/q',
            'g/3/q, d/4/q, b/3/q, d/4/q', 'g/3/q, d/4/q, b/3/q, d/4/q',
            'c/3/q, g/3/q, e/3/q, g/3/q', 'g/2/h, g/3/h',
            'g/3/q, d/4/q, b/3/q, d/4/q', 'g/3/q, d/4/q, b/3/q, d/4/q',
            'g/3/q, d/4/q, b/3/q, d/4/q', 'c/3/q, g/3/q, e/3/q, g/3/q',
            'd/3/q, a/3/q, f#/3/q, a/3/q', 'g/3/q, d/4/q, g/3/q, d/4/q',
            'g/3/q, d/4/q, b/3/q, d/4/q', 'g/3/q, d/4/q, g/2/q, d/3/q',
            'a/3/q, e/4/q, c/4/q, e/4/q', 'f/3/q, c/4/q, a/3/q, c/4/q',
            'g/3/q, d/4/q, b/3/q, d/4/q', 'c/3/q, g/3/q, e/3/q, g/3/q',
            'c/3/q, g/3/q, e/3/q, g/3/q', 'c/3/q, g/3/q, e/3/q, g/3/q',
            'f/3/q, c/4/q, a/3/q, c/4/q', 'g/3/q, d/4/q, b/3/q, d/4/q',
            'c/3/h, g/2/h', 'c/3/w',
        ],
        'tempo': 132,
    }],

    'haydn': [{
        'title_kw': None,
        'treble': [
            'g/5/q, f#/5/q, e/5/q, d/5/q',
            'c/5/q, b/4/q, a/4/h',
            'd/5/8, e/5/8, f#/5/8, g/5/8, a/5/q, b/5/q',
            'a/5/h, g/5/q, f#/5/q',
            'e/5/q, f#/5/q, g/5/q, a/5/q',
            'b/5/q, a/5/q, g/5/q, f#/5/q',
            'e/5/8, d/5/8, c/5/8, b/4/8, a/4/q, g/4/q',
            'g/5/h, r/h',
            'd/5/q, e/5/q, f#/5/q, g/5/q',
            'a/5/q, b/5/q, c/6/q, b/5/q',
            'a/5/q, g/5/q, f#/5/q, e/5/q',
            'd/5/w',
            'c/5/q, d/5/q, e/5/q, f#/5/q',
            'g/5/q, f#/5/q, e/5/q, d/5/q',
            'c/5/q, b/4/q, a/4/q, g/4/q',
            'g/5/w',
        ],
        'bass': [
            'g/3/q, d/3/q, g/2/q, d/3/q', 'c/3/q, g/3/q, e/3/q, c/3/q',
            'd/3/q, a/3/q, f#/3/q, d/3/q', 'g/2/h, g/3/h',
            'e/3/q, b/3/q, g/3/q, e/3/q', 'g/3/q, d/4/q, b/3/q, g/3/q',
            'a/2/q, e/3/q, c/3/q, a/2/q', 'g/3/h, g/2/h',
            'd/3/q, a/3/q, f#/3/q, d/3/q', 'a/3/q, e/4/q, c/4/q, a/3/q',
            'd/3/q, a/3/q, d/3/q, a/2/q', 'g/2/q, d/3/q, g/3/q, d/3/q',
            'c/3/q, g/3/q, e/3/q, c/3/q', 'g/3/q, d/4/q, b/3/q, g/3/q',
            'a/2/q, e/3/q, c/3/q, a/2/q', 'g/2/w',
        ],
        'tempo': 125,
    }],

    'beethoven': [{
        'title_kw': None,
        'treble': [
            # Ода к радости — полная тема
            'e/4/q, e/4/q, f/4/q, g/4/q',
            'g/4/q, f/4/q, e/4/q, d/4/q',
            'c/4/q, c/4/q, d/4/q, e/4/q',
            'e/4/h., d/4/q',
            'e/4/q, e/4/q, f/4/q, g/4/q',
            'g/4/q, f/4/q, e/4/q, d/4/q',
            'c/4/q, c/4/q, d/4/q, e/4/q',
            'd/4/h., c/4/q',
            # Мост
            'd/4/q, d/4/q, e/4/q, c/4/q',
            'd/4/q, e/4/8, f/4/8, e/4/q, c/4/q',
            'd/4/q, e/4/8, f/4/8, e/4/q, d/4/q',
            'c/4/q, d/4/q, g/3/h',
            # Финальное предложение
            'e/4/q, e/4/q, f/4/q, g/4/q',
            'g/4/q, f/4/q, e/4/q, d/4/q',
            'c/4/q, c/4/q, d/4/q, e/4/q',
            'd/4/h., c/4/q',
            # Вариация
            'e/4/8, f/4/8, e/4/8, f/4/8, g/4/q, g/4/q',
            'g/4/8, f/4/8, e/4/8, f/4/8, e/4/q, d/4/q',
            'c/4/8, d/4/8, c/4/8, d/4/8, e/4/q, e/4/q',
            'e/4/q, d/4/q, d/4/h',
            # Coda
            'g/4/q, f/4/q, e/4/q, d/4/q',
            'c/4/q, d/4/q, e/4/q, f/4/q',
            'g/4/q, g/4/q, a/4/q, g/4/q',
            'f/4/q, e/4/q, d/4/q, e/4/q',
            'c/4/w',
        ],
        'bass': [
            'c/3/q, e/3/q, g/3/q, e/3/q', 'c/3/q, f/3/q, a/3/q, f/3/q',
            'c/3/q, e/3/q, g/3/q, e/3/q', 'g/2/q, b/2/q, d/3/q, g/3/q',
            'c/3/q, e/3/q, g/3/q, e/3/q', 'c/3/q, f/3/q, a/3/q, f/3/q',
            'c/3/q, e/3/q, g/3/q, e/3/q', 'g/2/q, b/2/q, d/3/q, g/2/q',
            'g/2/q, b/2/q, d/3/q, b/2/q', 'g/2/q, c/3/q, e/3/q, c/3/q',
            'g/2/q, b/2/q, d/3/q, b/2/q', 'a/2/q, f#/2/q, g/2/h',
            'c/3/q, e/3/q, g/3/q, e/3/q', 'c/3/q, f/3/q, a/3/q, f/3/q',
            'c/3/q, e/3/q, g/3/q, e/3/q', 'g/2/q, b/2/q, d/3/q, g/2/q',
            'c/3/q, e/3/q, g/3/q, e/3/q', 'c/3/q, f/3/q, a/3/q, f/3/q',
            'c/3/q, e/3/q, g/3/q, e/3/q', 'g/2/q, b/2/q, d/3/q, g/2/q',
            'c/3/q, g/3/q, c/4/q, g/3/q', 'f/3/q, a/3/q, c/4/q, a/3/q',
            'g/3/q, b/3/q, d/4/q, b/3/q', 'c/3/q, e/3/q, g/3/q, c/3/q',
            'c/3/w',
        ],
        'tempo': 116,
    }],

    'schubert': [{
        'title_kw': None,
        'treble': [
            'b/4/h, a/4/q, g/4/q',
            'f#/4/h., e/4/8, d/4/q',
            'e/4/q, f#/4/q, g/4/h',
            'a/4/h, g/4/q, f#/4/q',
            'g/4/q, a/4/q, b/4/h',
            'c/5/q, b/4/q, a/4/h',
            'b/4/q, a/4/q, g/4/h',
            'f#/4/w',
            'd/5/q, c/5/q, b/4/h',
            'a/4/q, g/4/q, f#/4/h',
            'g/4/q, a/4/q, b/4/q, c/5/q',
            'b/4/w',
            'b/4/h, a/4/q, g/4/q',
            'f#/4/h., e/4/8, d/4/q',
            'e/4/q, f#/4/q, g/4/h',
            'b/4/w',
        ],
        'bass': [
            'b/2/q, f#/3/q, b/3/q, f#/3/q', 'b/2/q, f#/3/q, b/3/q, f#/3/q',
            'e/3/q, b/3/q, g/3/q, b/3/q', 'd/3/q, a/3/q, f#/3/q, a/3/q',
            'g/3/q, d/3/q, g/3/q, d/3/q', 'a/3/q, e/3/q, a/3/q, e/3/q',
            'd/3/q, a/3/q, d/3/q, a/2/q', 'b/2/q, f#/3/q, b/2/q, f#/3/q',
            'g/3/q, d/3/q, g/3/q, d/3/q', 'd/3/q, a/3/q, f#/3/q, a/3/q',
            'e/3/q, b/3/q, g/3/q, e/3/q', 'b/2/q, f#/3/q, b/2/q, f#/3/q',
            'b/2/q, f#/3/q, b/3/q, f#/3/q', 'b/2/q, f#/3/q, b/3/q, f#/3/q',
            'e/3/q, b/3/q, g/3/q, b/3/q', 'b/2/w',
        ],
        'tempo': 76,
    }],

    'chopin': [{
        'title_kw': None,
        'treble': [
            # Ноктюрн ми-бемоль мажор Op.9 No.2
            'e/5/h., d/5/8, c/5/q',
            'b/4/h, c/5/q, d/5/q',
            'e/5/q, d/5/8, c/5/8, b/4/q, a/4/q',
            'g/4/h., r/q',
            'bb/4/h., a/4/8, g/4/q',
            'f/4/h, g/4/q, a/4/q',
            'bb/4/q, a/4/8, g/4/8, f/4/q, e/4/q',
            'f/4/w',
            # Средний раздел
            'c/5/q, eb/5/q, g/5/q, eb/5/q',
            'f/5/q, ab/5/q, c/6/q, ab/5/q',
            'g/5/q, f/5/q, eb/5/q, d/5/q',
            'c/5/h, r/h',
            # Возврат
            'e/5/h., d/5/8, c/5/q',
            'b/4/h, c/5/q, d/5/q',
            'e/5/q, d/5/8, c/5/8, b/4/q, a/4/q',
            'g/4/w',
        ],
        'bass': [
            'c/3/q, g/3/q, e/4/q, g/3/q', 'g/2/q, b/3/q, d/4/q, b/3/q',
            'a/2/q, e/3/q, c/4/q, e/3/q', 'f/3/q, c/4/q, a/3/q, c/4/q',
            'bb/2/q, f/3/q, d/4/q, f/3/q', 'f/3/q, c/4/q, a/3/q, c/4/q',
            'bb/2/q, f/3/q, d/3/q, f/3/q', 'f/3/q, c/4/q, f/3/q, c/3/q',
            'c/3/q, g/3/q, eb/4/q, g/3/q', 'f/3/q, c/4/q, ab/3/q, c/4/q',
            'g/3/q, d/4/q, b/3/q, d/4/q', 'c/3/q, g/3/q, e/3/q, g/3/q',
            'c/3/q, g/3/q, e/4/q, g/3/q', 'g/2/q, b/3/q, d/4/q, b/3/q',
            'a/2/q, e/3/q, c/4/q, e/3/q', 'g/2/q, d/3/q, g/3/q, d/3/q',
        ],
        'tempo': 72,
    }],

    'liszt': [{
        'title_kw': None,
        'treble': [
            # Грёзы любви — Liebestraum
            'c#/5/q, d/5/8, c#/5/8, b/4/q, a/4/q',
            'g#/4/h, a/4/q, b/4/q',
            'c#/5/8, d/5/8, e/5/8, f#/5/8, g#/5/q, a/5/q',
            'a/5/h., g#/5/8, f#/5/q',
            'e/5/q, f#/5/q, g#/5/q, a/5/q',
            'b/5/q, a/5/q, g#/5/q, f#/5/q',
            'e/5/q, d#/5/q, c#/5/q, b/4/q',
            'a/4/w',
            'f#/5/q, e#/5/q, f#/5/q, g#/5/q',
            'a/5/q, b/5/q, c#/6/q, b/5/q',
            'a/5/q, g#/5/q, f#/5/q, e/5/q',
            'd#/5/h, c#/5/h',
            'a/5/h, g#/5/q, f#/5/q',
            'e/5/q, d#/5/q, c#/5/h',
            'b/4/q, c#/5/q, d#/5/q, e/5/q',
            'a/4/w',
        ],
        'bass': [
            'a/2/q, e/3/q, a/3/q, e/3/q', 'a/2/q, c#/3/q, e/3/q, a/3/q',
            'd/3/q, a/3/q, f#/3/q, d/3/q', 'e/2/q, b/2/q, e/3/q, b/3/q',
            'a/2/q, e/3/q, c#/3/q, e/3/q', 'd/3/q, f#/3/q, a/3/q, f#/3/q',
            'g#/2/q, d#/3/q, b/3/q, d#/3/q', 'a/2/q, e/3/q, a/3/q, e/3/q',
            'f#/3/q, c#/4/q, a/3/q, f#/3/q', 'b/2/q, f#/3/q, d#/3/q, f#/3/q',
            'e/3/q, b/3/q, g#/3/q, e/3/q', 'a#/2/q, f/3/q, c#/3/q, f/3/q',
            'a/2/q, e/3/q, c#/3/q, a/2/q', 'd#/3/q, a#/3/q, f#/3/q, a#/3/q',
            'e/3/q, b/3/q, g#/3/q, b/3/q', 'a/2/w',
        ],
        'tempo': 88,
    }],

    'brahms': [{
        'title_kw': None,
        'treble': [
            # Интермеццо op.118 №2
            'f/5/h, e/5/q, d/5/q',
            'c/5/q, b/4/q, a/4/h',
            'bb/4/q, a/4/q, g/4/h',
            'f/4/h., r/q',
            'a/4/q, bb/4/q, c/5/q, d/5/q',
            'e/5/q, d/5/q, c/5/q, bb/4/q',
            'a/4/q, g/4/q, f/4/h',
            'a/4/w',
            'f/5/q, e/5/q, d/5/q, c/5/q',
            'bb/4/q, a/4/q, g/4/h',
            'c/5/q, bb/4/q, a/4/q, g/4/q',
            'f/4/w',
            'a/4/q, c/5/q, e/5/q, c/5/q',
            'f/5/q, e/5/q, d/5/q, c/5/q',
            'b/4/q, a/4/q, g/4/q, f/4/q',
            'a/4/w',
        ],
        'bass': [
            'f/3/q, c/4/q, a/3/q, f/3/q', 'c/3/q, g/3/q, e/3/q, c/3/q',
            'f/2/q, c/3/q, f/3/q, c/3/q', 'bb/2/h, f/3/h',
            'f/3/q, c/4/q, a/3/q, c/4/q', 'g/3/q, d/4/q, b/3/q, d/4/q',
            'c/3/q, g/3/q, e/3/q, c/3/q', 'f/3/q, c/4/q, f/3/q, c/3/q',
            'f/3/q, c/4/q, a/3/q, f/3/q', 'g/3/q, d/4/q, bb/3/q, g/3/q',
            'a/3/q, e/4/q, c/4/q, a/3/q', 'f/3/q, c/4/q, f/3/q, c/3/q',
            'f/3/q, c/4/q, a/3/q, f/3/q', 'g/3/q, c/4/q, bb/3/q, g/3/q',
            'c/3/q, g/3/q, e/3/q, c/3/q', 'f/3/w',
        ],
        'tempo': 84,
    }],

    'tchaikovsky': [{
        'title_kw': None,
        'treble': [
            # Тема лебедей — Act II
            'b/4/h, a/4/8, f#/4/8',
            'd/4/8, e/4/8, f#/4/h',
            'b/3/8, d/4/8, f#/4/h',
            'a/4/8, g/4/8, e/4/h',
            'b/4/h, a/4/8, f#/4/8',
            'd/4/8, e/4/8, f#/4/q, d/5/q',
            'e/5/h, d/5/8, b/4/8',
            'c#/5/h, a/4/h',
            # Лирическое развитие
            'd/5/q, c#/5/q, b/4/q, a/4/q',
            'g/4/h, f#/4/h',
            'e/4/q, f#/4/q, g/4/q, a/4/q',
            'b/4/w',
            # Кульминация
            'd/5/q, e/5/q, f#/5/q, e/5/q',
            'd/5/q, c#/5/q, b/4/q, a/4/q',
            'g/4/q, a/4/q, b/4/q, c#/5/q',
            'd/5/h, f#/5/h',
            # Угасание
            'e/4/q, f#/4/q, g/4/q, f#/4/q',
            'e/4/h, d/4/h',
            'c#/4/q, d/4/q, e/4/h',
            'b/3/w',
        ],
        'bass': [
            'b/2/q, f#/3/q, b/3/q, f#/3/q', 'b/2/q, d/3/q, f#/3/q, d/3/q',
            'b/2/q, f#/3/q, b/3/q, f#/3/q', 'e/3/q, g/3/q, b/3/q, g/3/q',
            'b/2/q, f#/3/q, b/3/q, f#/3/q', 'b/2/q, d/3/q, f#/3/q, d/3/q',
            'e/3/q, b/3/q, g/3/q, b/3/q', 'a/2/q, e/3/q, c#/3/q, e/3/q',
            'd/3/q, a/3/q, f#/3/q, a/3/q', 'g/3/q, d/3/q, g/3/q, d/3/q',
            'a/2/q, e/3/q, c#/3/q, e/3/q', 'b/2/q, f#/3/q, b/2/q, f#/3/q',
            'b/2/q, f#/3/q, b/3/q, f#/3/q', 'd/3/q, a/3/q, f#/3/q, a/3/q',
            'e/3/q, b/3/q, g/3/q, b/3/q', 'b/2/h, b/3/h',
            'c#/3/q, g#/3/q, c#/3/q, g#/3/q', 'f#/3/q, c#/3/q, a/2/q, c#/3/q',
            'g#/2/q, d#/3/q, g#/3/q, f#/3/q', 'b/2/w',
        ],
        'tempo': 96,
    }],

    'dvořák': [{
        'title_kw': None,
        'treble': [
            # Новый Свет — Largo (Симфония № 9)
            'e/5/h, d/5/q, c#/5/q',
            'b/4/h., a/4/8, g/4/q',
            'a/4/q, b/4/q, c#/5/h',
            'e/5/h, r/h',
            'f#/5/q, e/5/q, d/5/q, c#/5/q',
            'b/4/h, a/4/h',
            'g/4/q, a/4/q, b/4/q, c#/5/q',
            'd/5/w',
            'e/5/h, d/5/q, c#/5/q',
            'b/4/h., a/4/8, g/4/q',
            'f#/4/q, g/4/q, a/4/h',
            'e/4/w',
            'd/5/q, c#/5/q, b/4/q, a/4/q',
            'g/4/q, f#/4/q, e/4/h',
            'f#/4/q, g/4/q, a/4/q, b/4/q',
            'e/4/w',
        ],
        'bass': [
            'a/2/q, e/3/q, c#/4/q, e/3/q', 'a/2/q, e/3/q, a/3/q, e/3/q',
            'd/3/q, a/3/q, f#/3/q, a/3/q', 'e/3/h, a/2/h',
            'b/2/q, f#/3/q, d#/3/q, f#/3/q', 'e/3/q, a/3/q, c#/3/q, a/3/q',
            'a/2/q, e/3/q, a/3/q, e/3/q', 'd/3/h, a/2/h',
            'a/2/q, e/3/q, c#/4/q, e/3/q', 'a/2/q, e/3/q, a/3/q, e/3/q',
            'd/3/q, a/3/q, f#/3/q, d/3/q', 'a/2/q, e/3/q, a/2/q, e/2/q',
            'b/2/q, f#/3/q, b/2/q, f#/3/q', 'c#/3/q, g#/3/q, c#/3/q, g#/2/q',
            'a/2/q, e/3/q, a/2/q, e/2/q', 'a/2/w',
        ],
        'tempo': 90,
    }],

    'mahler': [{
        'title_kw': None,
        'treble': [
            # Симфония № 5 — Адажиетто
            'd/5/h., c/5/8, b/4/q',
            'a/4/h, g/4/q, f/4/q',
            'e/4/h, f/4/q, g/4/q',
            'a/4/w',
            'b/4/h, a/4/q, g/4/q',
            'f/4/h, e/4/q, d/4/q',
            'e/4/q, f/4/q, g/4/q, a/4/q',
            'f/4/w',
            'c/5/q, d/5/q, e/5/q, f/5/q',
            'g/5/q, f/5/q, e/5/q, d/5/q',
            'c/5/h, b/4/h',
            'a/4/w',
            'd/5/h., c/5/8, b/4/q',
            'a/4/h, g/4/q, f/4/q',
            'g/4/q, a/4/q, bb/4/h',
            'a/4/w',
        ],
        'bass': [
            'd/3/q, a/3/q, f/3/q, a/3/q', 'd/3/q, f/3/q, a/3/q, c/4/q',
            'g/2/q, d/3/q, b/3/q, d/3/q', 'a/2/w',
            'd/3/q, a/3/q, f/3/q, a/3/q', 'bb/2/q, f/3/q, d/3/q, f/3/q',
            'c/3/q, g/3/q, e/3/q, g/3/q', 'f/3/q, c/4/q, a/3/q, f/3/q',
            'a/3/q, e/4/q, c/4/q, e/4/q', 'bb/2/q, f/3/q, d/3/q, f/3/q',
            'c/3/q, g/3/q, e/3/q, g/3/q', 'a/2/q, e/3/q, a/3/q, e/3/q',
            'd/3/q, a/3/q, f/3/q, a/3/q', 'd/3/q, f/3/q, a/3/q, c/4/q',
            'g/2/q, d/3/q, bb/3/q, d/3/q', 'a/2/w',
        ],
        'tempo': 76,
    }],

    'debussy': [{
        'title_kw': None,
        'treble': [
            # Clair de Lune
            'r/h, f/5/q, e/5/q',
            'c/5/h., d/5/q',
            'c/5/h, a/4/h',
            'r/h, f/5/q, e/5/q',
            'c/5/h., d/5/q',
            'bb/4/q, a/4/q, g/4/h',
            'f/4/q, g/4/q, a/4/h',
            'f/4/h, r/h',
            'f/5/8, e/5/8, d/5/8, c/5/8, bb/4/q, a/4/q',
            'g/4/q, f/4/q, g/4/q, a/4/q',
            'bb/4/8, c/5/8, d/5/8, e/5/8, f/5/q, g/5/q',
            'a/5/h, g/5/h',
            'd/5/q, c/5/q, bb/4/q, a/4/q',
            'g/4/h, a/4/h',
            'r/h, f/5/q, e/5/q',
            'f/4/w',
        ],
        'bass': [
            'f/3/q, a/3/q, c/4/q, a/3/q', 'f/3/q, a/3/q, c/4/q, a/3/q',
            'f/3/q, a/3/q, c/4/q, a/3/q', 'e/3/q, g/3/q, c/4/q, g/3/q',
            'f/3/q, a/3/q, c/4/q, a/3/q', 'd/3/q, f/3/q, a/3/q, f/3/q',
            'bb/2/q, f/3/q, d/3/q, f/3/q', 'f/3/q, a/3/q, c/4/q, a/3/q',
            'f/3/q, a/3/q, c/4/q, a/3/q', 'd/3/q, a/3/q, f/3/q, a/3/q',
            'bb/2/q, f/3/q, d/3/q, f/3/q', 'c/3/q, g/3/q, e/3/q, g/3/q',
            'f/3/q, a/3/q, c/4/q, a/3/q', 'e/3/q, g/3/q, c/4/q, g/3/q',
            'f/3/q, a/3/q, c/4/q, a/3/q', 'f/3/w',
        ],
        'tempo': 58,
    }],

    'ravel': [{
        'title_kw': None,
        'treble': [
            # Болеро — главная тема
            'c/5/q, e/5/8, g/5/8, e/5/q, c/5/q',
            'f/5/q, d/5/q, b/4/q, g/4/q',
            'a/4/q, c/5/q, e/5/q, g/5/q',
            'f/5/h, e/5/q, d/5/q',
            'c/5/q, d/5/q, e/5/q, f/5/q',
            'g/5/q, a/5/q, bb/5/q, a/5/q',
            'g/5/q, f/5/q, e/5/q, d/5/q',
            'c/5/w',
            'g/5/q, f/5/q, e/5/q, d/5/q',
            'c/5/q, b/4/q, a/4/q, g/4/q',
            'f/4/q, g/4/q, a/4/q, bb/4/q',
            'c/5/h, d/5/h',
            'e/5/q, d/5/q, c/5/q, b/4/q',
            'a/4/q, g/4/q, f/4/q, e/4/q',
            'f/4/q, g/4/q, a/4/q, c/5/q',
            'c/5/w',
        ],
        'bass': [
            'c/3/q, g/3/q, c/4/q, g/3/q', 'f/3/q, c/4/q, a/3/q, f/3/q',
            'a/2/q, e/3/q, a/3/q, e/3/q', 'd/3/q, a/3/q, f/3/q, d/3/q',
            'c/3/q, g/3/q, e/3/q, g/3/q', 'g/3/q, d/4/q, bb/3/q, g/3/q',
            'c/3/q, g/3/q, e/3/q, c/3/q', 'f/3/q, c/4/q, f/3/q, c/3/q',
            'c/3/q, g/3/q, c/4/q, g/3/q', 'f/3/q, c/4/q, a/3/q, f/3/q',
            'bb/2/q, f/3/q, d/3/q, f/3/q', 'c/3/q, g/3/q, e/3/q, g/3/q',
            'a/2/q, e/3/q, a/2/q, e/2/q', 'g/2/q, d/3/q, g/2/q, d/3/q',
            'f/3/q, c/4/q, a/3/q, f/3/q', 'c/3/w',
        ],
        'tempo': 96,
    }],

    'stravinsky': [{
        'title_kw': None,
        'treble': [
            # Весна священная — вступление
            'c/5/8, b/4/8, g/4/8, e/4/8, b/4/q',
            'a/4/8, g/4/8, e/4/q, a/4/q',
            'g/4/8, e/4/8, d/4/q, g/4/q',
            'c/5/q, b/4/8, a/4/8, g/4/q, e/4/q',
            'f/4/8, e/4/8, d/4/q, f/4/q',
            'e/4/q, d/4/q, c/4/h',
            'b/3/8, c/4/8, d/4/8, e/4/8, f/4/q, g/4/q',
            'a/4/h, g/4/h',
            # Пляска щеголих — политональный ритм
            'e/5/q, e/5/q, e/5/q, eb/5/q',
            'e/5/8, eb/5/8, e/5/q, e/5/q, eb/5/q',
            'e/5/q, eb/5/q, e/5/q, r/q',
            'f/5/q, e/5/q, d/5/q, c/5/q',
            'bb/4/q, a/4/q, ab/4/q, g/4/q',
            'f/4/q, e/4/q, d/4/q, c/4/q',
            'e/4/8, f/4/8, g/4/8, a/4/8, b/4/q, c/5/q',
            'd/5/h, c/5/h',
        ],
        'bass': [
            'c/3/w', 'c/3/w', 'c/3/w', 'c/3/w',
            'f/3/q, c/3/q, f/3/q, c/3/q', 'g/3/q, c/3/q, g/3/q, c/3/q',
            'f/3/q, c/3/q, g/3/q, c/3/q', 'c/3/w',
            'eb/3/q, bb/3/q, eb/3/q, bb/3/q', 'eb/3/q, bb/3/q, eb/3/q, bb/3/q',
            'eb/3/q, bb/3/q, eb/3/q, bb/3/q', 'eb/3/q, bb/3/q, eb/3/q, bb/3/q',
            'ab/2/q, eb/3/q, ab/2/q, eb/3/q', 'g/2/q, d/3/q, g/2/q, d/3/q',
            'f/2/q, c/3/q, f/2/q, c/3/q', 'c/3/q, g/3/q, c/3/q, g/2/q',
        ],
        'tempo': 72,
    }],

    'prokofiev': [{
        'title_kw': None,
        'treble': [
            # Ромео и Джульетта — Монтекки и Капулетти
            'c/5/q, d/5/q, eb/5/q, f/5/q',
            'g/5/q, f/5/q, eb/5/q, d/5/q',
            'c/5/8, b/4/8, bb/4/8, a/4/8, ab/4/q, g/4/q',
            'c/5/h, r/h',
            'ab/4/q, bb/4/q, c/5/q, d/5/q',
            'eb/5/q, d/5/q, c/5/q, bb/4/q',
            'ab/4/q, g/4/q, f/4/q, eb/4/q',
            'c/5/h, r/h',
            'c/5/q, eb/5/q, g/5/q, eb/5/q',
            'f/5/q, ab/5/q, c/6/q, ab/5/q',
            'g/5/q, f/5/q, eb/5/q, d/5/q',
            'c/5/h, r/h',
            'eb/5/q, d/5/q, c/5/q, bb/4/q',
            'ab/4/q, g/4/q, f/4/q, eb/4/q',
            'd/4/q, eb/4/q, f/4/q, g/4/q',
            'c/5/w',
        ],
        'bass': [
            'c/3/q, g/3/q, eb/3/q, g/3/q', 'c/3/q, ab/3/q, f/3/q, ab/3/q',
            'g/2/q, d/3/q, b/3/q, d/3/q', 'c/3/h, c/2/h',
            'ab/2/q, eb/3/q, c/3/q, eb/3/q', 'bb/2/q, f/3/q, d/3/q, f/3/q',
            'eb/3/q, bb/3/q, g/3/q, bb/3/q', 'c/3/h, c/2/h',
            'c/3/q, g/3/q, eb/4/q, g/3/q', 'f/3/q, c/4/q, ab/3/q, c/4/q',
            'g/3/q, d/4/q, b/3/q, d/4/q', 'c/3/q, g/3/q, c/3/q, g/2/q',
            'ab/2/q, eb/3/q, ab/3/q, eb/3/q', 'g/2/q, d/3/q, g/3/q, d/3/q',
            'f/2/q, c/3/q, f/3/q, c/3/q', 'c/3/w',
        ],
        'tempo': 112,
    }],

    'shostakovich': [{
        'title_kw': None,
        'treble': [
            # Симфония № 7 — нашествие
            'd/5/q, eb/5/q, d/5/q, c#/5/q',
            'c/5/q, b/4/q, bb/4/q, a/4/q',
            'ab/4/q, g/4/q, f#/4/q, f/4/q',
            'e/4/h, r/h',
            'd/5/q, r/q, eb/5/q, r/q',
            'e/5/q, r/q, f/5/q, r/q',
            'f#/5/q, e/5/q, d/5/q, c/5/q',
            'b/4/h, r/h',
            'a/5/q, g/5/q, f/5/q, e/5/q',
            'eb/5/q, d/5/q, c/5/q, b/4/q',
            'bb/4/q, a/4/q, ab/4/q, g/4/q',
            'd/5/h, r/h',
            'd/5/q, eb/5/q, d/5/q, c#/5/q',
            'c/5/q, b/4/q, bb/4/q, a/4/q',
            'g/4/q, a/4/q, b/4/q, c/5/q',
            'd/5/w',
        ],
        'bass': [
            'd/3/q, a/3/q, d/3/q, a/3/q', 'g/2/q, d/3/q, g/3/q, d/3/q',
            'c/3/q, g/3/q, c/3/q, g/2/q', 'd/2/h, d/3/h',
            'd/3/8, r/8, a/3/8, r/8, d/3/8, r/8, a/3/8, r/8',
            'g/3/8, r/8, d/3/8, r/8, g/3/8, r/8, d/3/8, r/8',
            'a/2/q, e/3/q, a/2/q, e/3/q', 'b/2/h, f#/3/h',
            'd/3/q, a/3/q, d/3/q, a/3/q', 'g/2/q, d/3/q, g/3/q, d/3/q',
            'c/3/q, g/3/q, c/3/q, g/2/q', 'd/2/h, d/3/h',
            'd/3/q, a/3/q, d/3/q, a/3/q', 'g/2/q, d/3/q, g/3/q, d/3/q',
            'a/2/q, e/3/q, a/2/q, e/2/q', 'd/2/w',
        ],
        'tempo': 92,
    }],

    'bartók': [{
        'title_kw': None,
        'treble': [
            # Концерт для оркестра — Introduzione
            'c/5/q, d/5/q, eb/5/q, g/5/q',
            'f#/5/q, e/5/q, d/5/q, c/5/q',
            'bb/4/8, c/5/8, d/5/8, eb/5/8, f/5/q, g/5/q',
            'a/5/h, r/h',
            'g/5/q, f/5/q, eb/5/q, d/5/q',
            'c/5/q, bb/4/q, ab/4/q, g/4/q',
            'ab/4/q, g/4/q, f/4/q, e/4/q',
            'c/5/h, r/h',
            'c/5/8, d/5/8, eb/5/8, f/5/8, g/5/q, ab/5/q',
            'bb/5/q, ab/5/q, g/5/q, f/5/q',
            'eb/5/q, d/5/q, c/5/q, b/4/q',
            'a/5/h, r/h',
            'c/5/q, eb/5/q, f#/5/q, a/5/q',
            'g/5/q, e/5/q, c/5/q, a/4/q',
            'f/4/q, g/4/q, a/4/q, b/4/q',
            'c/5/w',
        ],
        'bass': [
            'c/3/q, f#/3/q, c/3/q, f#/3/q', 'bb/2/q, e/3/q, bb/2/q, e/3/q',
            'g/2/q, db/3/q, g/2/q, db/3/q', 'c/3/h, r/h',
            'g/3/q, c/3/q, g/3/q, c/3/q', 'f/3/q, bb/2/q, f/3/q, bb/2/q',
            'eb/3/q, a/2/q, eb/3/q, a/2/q', 'c/3/h, r/h',
            'c/3/q, f#/3/q, c/3/q, f#/3/q', 'bb/2/q, e/3/q, bb/2/q, e/3/q',
            'ab/2/q, d/3/q, ab/2/q, d/3/q', 'c/3/h, r/h',
            'c/3/q, f#/3/q, c/3/q, f#/3/q', 'g/2/q, c/3/q, g/2/q, c/3/q',
            'f/2/q, c/3/q, f/2/q, c/3/q', 'c/3/w',
        ],
        'tempo': 108,
    }],

    'schoenberg': [{
        'title_kw': None,
        'treble': [
            # Просветлённая ночь — Verklärte Nacht
            'c/5/q, f#/5/q, bb/4/q, e/5/q',
            'ab/4/q, d/5/q, g/4/q, c#/5/q',
            'f/4/8, b/4/8, eb/5/8, a/4/8, d/5/q, g#/4/q',
            'c/5/h, r/h',
            'e/5/q, f/5/q, g/5/q, ab/5/q',
            'bb/5/q, a/5/q, g#/5/q, f#/5/q',
            'f/5/q, e/5/q, eb/5/q, d/5/q',
            'c/5/h, r/h',
            'c/5/q, f#/5/q, bb/4/q, e/5/q',
            'ab/4/q, d/5/q, f/4/q, b/4/q',
            'eb/5/q, a/4/q, d/4/q, g#/4/q',
            'c/5/w',
            'g/5/q, f/5/q, e/5/q, eb/5/q',
            'd/5/q, db/5/q, c/5/q, b/4/q',
            'bb/4/q, a/4/q, ab/4/q, g/4/q',
            'c/5/w',
        ],
        'bass': [
            'c/3/q, f#/3/q, bb/2/q, e/3/q', 'ab/2/q, d/3/q, g/2/q, c#/3/q',
            'f/2/q, b/2/q, eb/3/q, a/2/q', 'c/3/h, r/h',
            'e/3/q, bb/3/q, g/3/q, db/3/q', 'ab/2/q, d/3/q, f/3/q, b/2/q',
            'eb/3/q, a/2/q, c/3/q, f#/2/q', 'c/3/h, r/h',
            'c/3/q, f#/3/q, c/3/q, f#/3/q', 'g/2/q, db/3/q, g/2/q, db/3/q',
            'ab/2/q, d/3/q, ab/2/q, d/3/q', 'c/3/h, f#/2/h',
            'g/2/q, d/3/q, g/2/q, d/3/q', 'f/2/q, c/3/q, f/2/q, c/3/q',
            'eb/2/q, bb/2/q, eb/3/q, bb/2/q', 'c/3/w',
        ],
        'tempo': 80,
    }],

    'reich': [{
        'title_kw': None,
        'treble': [
            # Piano Phase — полный паттерн
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8, c#/5/8',
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'b/4/8, f#/4/8, d/5/8, c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8',
            'd/5/8, f#/4/8, e/4/8, c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8',
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8',
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8, c#/5/8',
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
            'b/4/8, f#/4/8, d/5/8, c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8',
            'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
        ],
        'bass': [
            'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
            'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
            'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
            'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
            'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
            'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
            'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
            'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
            'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
            'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
            'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
            'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
        ],
        'tempo': 184,
    }],

    'glass': [{
        'title_kw': None,
        'treble': [
            # Etude No.2 — минималистичный паттерн
            'e/4/8, b/4/8, d/5/8, b/4/8, e/4/8, b/4/8, d/5/8, b/4/8',
            'a/4/8, e/5/8, c#/5/8, e/5/8, a/4/8, e/5/8, c#/5/8, e/5/8',
            'g/4/8, b/4/8, e/5/8, b/4/8, g/4/8, b/4/8, e/5/8, b/4/8',
            'f#/4/8, a/4/8, d/5/8, a/4/8, f#/4/8, a/4/8, d/5/8, a/4/8',
            'e/4/8, b/4/8, d/5/8, b/4/8, e/4/8, b/4/8, d/5/8, b/4/8',
            'a/4/8, e/5/8, c#/5/8, e/5/8, a/4/8, e/5/8, c#/5/8, e/5/8',
            'g/4/8, b/4/8, e/5/8, b/4/8, g/4/8, b/4/8, e/5/8, b/4/8',
            'f#/4/8, a/4/8, d/5/8, a/4/8, f#/4/8, a/4/8, d/5/8, a/4/8',
            'e/4/8, b/4/8, d/5/8, b/4/8, e/5/8, b/4/8, d/5/8, b/4/8',
            'a/4/8, e/5/8, c#/5/8, e/5/8, a/5/8, e/5/8, c#/5/8, e/5/8',
            'g/4/8, b/4/8, e/5/8, b/4/8, g/5/8, b/4/8, e/5/8, b/4/8',
            'f#/4/8, a/4/8, d/5/8, a/4/8, f#/4/8, a/4/8, d/5/8, a/4/8',
        ],
        'bass': [
            'e/3/h, e/3/h', 'a/2/h, a/2/h', 'g/2/h, g/2/h', 'd/3/h, d/3/h',
            'e/3/h, e/3/h', 'a/2/h, a/2/h', 'g/2/h, g/2/h', 'd/3/h, d/3/h',
            'e/3/h, e/2/h', 'a/2/h, e/2/h', 'g/2/h, d/2/h', 'd/3/h, a/2/h',
        ],
        'tempo': 140,
    }],

    'arvo pärt': [{
        'title_kw': None,
        'treble': [
            # Spiegel im Spiegel — зеркало в зеркале
            'a/4/h, b/4/q, c/5/q',
            'b/4/h, a/4/h',
            'g/4/h, a/4/q, b/4/q',
            'a/4/w',
            'e/5/h, d/5/q, c/5/q',
            'b/4/h, a/4/h',
            'c/5/h, b/4/q, a/4/q',
            'a/4/w',
            'a/4/h, b/4/q, c/5/q',
            'd/5/h, c/5/q, b/4/q',
            'c/5/h, a/4/h',
            'a/4/w',
            'e/5/q, d/5/q, c/5/q, b/4/q',
            'a/4/h, g/4/h',
            'a/4/h, b/4/h',
            'a/4/w',
        ],
        'bass': [
            'a/3/w', 'a/3/w', 'a/3/w', 'a/3/w',
            'a/3/w', 'a/3/w', 'a/3/w', 'a/3/w',
            'a/3/w', 'a/3/w', 'a/3/w', 'a/3/w',
            'a/3/w', 'a/3/w', 'a/3/w', 'a/3/w',
        ],
        'tempo': 52,
    }],
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
    name_lower = composer_name.lower()
    for key, patterns in KNOWN_COMPOSERS.items():
        if key in name_lower:
            return patterns[0]
    return None


def get_era_pattern(era):
    return ERA_PATTERNS.get(era, ERA_PATTERNS['Classical'])


# ─── Основной запуск (FORCE-UPDATE ALL) ───────────────────────────────────────
def run():
    print('Загружаем composers...')
    status, composers = sb_get('composers?select=id,name,era&limit=200')
    if status != 200:
        print(f'[ERR] composers: {status} {composers}')
        return
    print(f'Найдено {len(composers)} composers\n')

    comp_map = {c['id']: c for c in composers}

    print('Загружаем pieces...')
    status, pieces = sb_get('pieces?select=id,composer_id,title&limit=1000')
    if status != 200:
        print(f'[ERR] pieces: {status} {pieces}')
        return

    print(f'Всего pieces: {len(pieces)} — обновляем ВСЕ\n')

    updated = skipped = 0

    for piece in pieces:
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
    run()

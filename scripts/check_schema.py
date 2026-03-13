import sys, io, urllib.request, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import os
URL = os.environ.get('VITE_SUPABASE_URL', '')
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}'}

def get(path):
    req = urllib.request.Request(f'{URL}{path}', headers=H)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# Смотрим что есть в таблице composers
status, data = get('/rest/v1/composers?select=*&limit=3')
print('Status:', status)
print(json.dumps(data, indent=2, ensure_ascii=False))

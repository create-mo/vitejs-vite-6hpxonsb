# Classical Music Timeline — Project Context

## What this is

Interactive map of classical composers built with React 19 + TypeScript + Vite 7 + VexFlow 5 + Web Audio API.

**GitHub:** https://github.com/create-mo/vitejs-vite-6hpxonsb
**Dev environment:** StackBlitz (reads directly from GitHub — local changes must be pushed to take effect)
**Local folder:** `C:\Users\user\vitejs-vite-6hpxonsb`

## Visual concept

- Composers arranged **left→right chronologically**
- Connected by **"roads" styled as 5-line musical staves** with scattered black dots (stemless eighth notes)
- Roads labeled with **street-sign style** musical period names (Baroque, Classical, Romantic…)
- Navigation like a GPS navigator: click composer/road → camera centers on it; click screen edge → move through time
- Simultaneous composers **stack vertically** at the same X position

## Supabase

**URL:** `https://jtytuaxjkyswzuqrwweq.supabase.co`
Credentials are in `.env` (gitignored — never commit).

**Tables:**
- `composers` — 70 rows: `id` (UUID), `name`, `era`, `life_dates`, `image`, `x`, `y`, `predecessors[]`, `openopus_id`
- `pieces` — up to 700 rows: `id` (UUID), `composer_id` (FK), `title`, `tempo`, `treble text[]`, `bass text[]`

**Important schema notes:**
- Column is `name`, NOT `label`
- IDs are UUIDs, not integers

Data seeded via `scripts/seed_supabase.py` (pure Python stdlib, no Node) from Open Opus API (https://api.openopus.org).
`treble[]` and `bass[]` arrays are currently **empty** — musical note data not yet populated.

Supabase free plan limits: max ~70 composers, ~10 pieces each.

## Key source files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Plain fetch Supabase client — **no SDK**, works in StackBlitz |
| `src/hooks/useComposers.ts` | Fetches 70 composers + pieces from Supabase |
| `src/hooks/useAudioPlayer.ts` | Web Audio API: ADSR, ERA_DYNAMICS, simultaneous treble+bass, effects |
| `src/components/ScoreCanvas.tsx` | Main canvas, uses useAudioPlayer + useComposers |
| `src/components/FullScreenScore.tsx` | Fullscreen score view + effect toggle buttons |
| `src/components/StaveRoad.tsx` | SVG road-as-musical-stave component |
| `src/data/database.ts` | Local fallback data while Supabase loads |
| `scripts/seed_supabase.py` | Python seeder script (Open Opus → Supabase) |
| `supabase/migrations/` | SQL migrations (run in Supabase SQL Editor, not via CLI) |

## Audio system

```typescript
// ERA_DYNAMICS — ADSR profiles per era
Baroque:        { attack: 0.005, decay: 0.04, sustain: 0.30, release: 0.08, peak: 0.25 }
Classical:      { attack: 0.012, decay: 0.10, sustain: 0.55, release: 0.18, peak: 0.35 }
Romantic:       { attack: 0.025, decay: 0.14, sustain: 0.72, release: 0.40, peak: 0.45 }
'20th Century': { attack: 0.008, decay: 0.07, sustain: 0.42, release: 0.25, peak: 0.30 }
Contemporary:   { attack: 0.003, decay: 0.03, sustain: 0.22, release: 0.12, peak: 0.20 }

// PlayEffect: 'none' | 'thirds' | 'arpeggio'
// Treble and bass play SIMULTANEOUSLY (not sequentially)
// Timbre: triangle + sine oscillators (sine at 2× freq for harmonic richness)
```

## Status (as of 2026-03-13)

### Done
- [x] ADSR envelope in `useAudioPlayer.ts`
- [x] Treble + bass play simultaneously
- [x] ERA_DYNAMICS for 5 eras
- [x] Thirds/arpeggio effects with UI toggle (Обычно / Терции / Арпеджио)
- [x] Supabase integration without SDK (plain fetch, StackBlitz-compatible)
- [x] 70 composers + metadata seeded in DB
- [x] Fallback to local DATABASE while Supabase loads
- [x] `.env` protected from GitHub (in `.gitignore`)

### Not done / next steps
- [ ] **Note data**: `treble[]` and `bass[]` are empty for all 70 seeded composers — needs population
- [ ] **Navigator UI**: camera pan mechanics, road rendering, street-sign labels — `StaveRoad.tsx` exists but full map interaction not implemented
- [ ] **Composer connections**: `predecessors[]` field exists in DB but influence graph/roads not fully wired to UI

## Important gotchas

1. **StackBlitz ≠ local**: StackBlitz reads from GitHub. Always push changes to see them in StackBlitz.
2. **No npm install in StackBlitz**: External packages from npm registry don't work. That's why `@supabase/supabase-js` was replaced with plain `fetch`.
3. **Python for scripts**: Node.js unavailable in shell. Use `C:\Users\user\AppData\Local\Programs\Python\Python314\python.exe`.
4. **SQL migrations**: Run in Supabase SQL Editor (Dashboard), not via CLI — PostgREST doesn't support DDL.
5. **Free plan**: Supabase free tier — keep composers ≤ 70, pieces ≤ 10 per composer.

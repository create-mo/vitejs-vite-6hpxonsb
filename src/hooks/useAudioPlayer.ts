import { useRef, useState } from 'react';
import type { MusicPiece } from '../data/database';

export type Era = 'Baroque' | 'Classical' | 'Romantic' | '20th Century' | 'Contemporary';
export type PlayEffect = 'none' | 'thirds' | 'arpeggio';
export type PlaybackState = 'stopped' | 'playing' | 'paused';

interface ADSR {
  attack: number;   // seconds
  decay: number;    // seconds
  sustain: number;  // 0–1 multiplier of peak gain
  release: number;  // seconds
  peak: number;     // peak gain
}

// Динамика по эпохам: барокко — клавесин (жёсткая атака, нет сустейна),
// романтизм — фортепьяно (мягкая атака, долгий сустейн)
export const ERA_DYNAMICS: Record<Era, ADSR> = {
  Baroque:          { attack: 0.005, decay: 0.04, sustain: 0.30, release: 0.08, peak: 0.25 },
  Classical:        { attack: 0.012, decay: 0.10, sustain: 0.55, release: 0.18, peak: 0.35 },
  Romantic:         { attack: 0.025, decay: 0.14, sustain: 0.72, release: 0.40, peak: 0.45 },
  '20th Century':   { attack: 0.008, decay: 0.07, sustain: 0.42, release: 0.25, peak: 0.30 },
  Contemporary:     { attack: 0.003, decay: 0.03, sustain: 0.22, release: 0.12, peak: 0.20 },
};

const FLAT_MAP: Record<string, string> = {
  db: 'c#', eb: 'd#', gb: 'f#', ab: 'g#', bb: 'a#',
};
const NOTE_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];

function getFreq(note: string): number {
  const parts = note.toLowerCase().trim().split('/');
  if (parts.length < 2) return 0;
  const raw = parts[0];
  const name = FLAT_MAP[raw] ?? raw;
  const oct = parseInt(parts[1]);
  if (isNaN(oct)) return 0;
  const idx = NOTE_NAMES.indexOf(name);
  if (idx === -1) return 0;
  return 440 * Math.pow(2, (idx + (oct + 1) * 12 - 69) / 12);
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  adsr: ADSR,
  gainScale = 1,
  reverbNode?: GainNode
) {
  if (freq <= 0 || duration <= 0) return;

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc2.type = 'sine';
  osc3.type = 'sine';

  osc.frequency.value = freq;
  osc2.frequency.value = freq * 2;    // октава
  osc3.frequency.value = freq * 1.5;  // кварта

  osc.connect(gain);
  osc2.connect(gain);
  osc3.connect(gain);

  const dest = reverbNode || ctx.destination;
  gain.connect(dest);

  const p = adsr.peak * gainScale;
  const attackEnd = startTime + adsr.attack;
  const decayEnd = attackEnd + adsr.decay;
  const releaseStart = Math.max(decayEnd, startTime + duration - adsr.release);
  const noteEnd = releaseStart + adsr.release;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(p, attackEnd);
  gain.gain.linearRampToValueAtTime(p * adsr.sustain, decayEnd);
  gain.gain.setValueAtTime(p * adsr.sustain, releaseStart);
  gain.gain.linearRampToValueAtTime(0.0001, noteEnd);

  osc.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  osc.stop(noteEnd);
  osc2.stop(noteEnd);
  osc3.stop(noteEnd);
}

function scheduleVoice(
  ctx: AudioContext,
  measures: string[],
  startTime: number,
  beatTime: number,
  adsr: ADSR,
  gainScale: number,
  effect: PlayEffect,
  reverbNode?: GainNode
): number {
  let t = startTime;

  for (const measure of measures) {
    const tokens = measure.split(',');
    const dur = (beatTime * 4) / tokens.length;

    for (const token of tokens) {
      const parts = token.trim().split('/');
      if (parts.length < 2 || parts[0].trim() === 'r') {
        t += dur;
        continue;
      }
      const freq = getFreq(parts[0] + '/' + parts[1]);

      if (effect === 'arpeggio') {
        const third = freq * Math.pow(2, 4 / 12);
        const fifth = freq * Math.pow(2, 7 / 12);
        const step = dur / 3;
        playTone(ctx, freq,  t,            step * 2.2, adsr, gainScale, reverbNode);
        playTone(ctx, third, t + step,     step * 2.2, adsr, gainScale * 0.8, reverbNode);
        playTone(ctx, fifth, t + step * 2, step * 2.2, adsr, gainScale * 0.7, reverbNode);
      } else {
        playTone(ctx, freq, t, dur, adsr, gainScale, reverbNode);
        if (effect === 'thirds') {
          playTone(ctx, freq * Math.pow(2, 4 / 12), t, dur, adsr, gainScale * 0.5, reverbNode);
        }
      }

      t += dur;
    }
  }

  return t;
}

export function useAudioPlayer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [effect, setEffect] = useState<PlayEffect>('none');

  const stop = () => {
    timeoutsRef.current.forEach(window.clearTimeout);
    timeoutsRef.current = [];
    ctxRef.current?.close();
    ctxRef.current = null;
    setPlaybackState('stopped');
  };

  const togglePlayPause = (piece: MusicPiece, era: Era) => {
    if (playbackState === 'stopped') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
      const ctx = new Ctx() as AudioContext;
      ctxRef.current = ctx;

      const adsr = ERA_DYNAMICS[era];
      const beatTime = 60 / piece.tempo;
      const t0 = ctx.currentTime + 0.05;

      // Простой reverb через delay + feedback
      const reverbGain = ctx.createGain();
      const delay1 = ctx.createDelay(0.5);
      const delay2 = ctx.createDelay(0.3);
      const fb = ctx.createGain();
      const wet = ctx.createGain();

      delay1.delayTime.value = 0.05;  // 50ms
      delay2.delayTime.value = 0.03;  // 30ms
      fb.gain.value = 0.3;             // feedback 30%
      wet.gain.value = 0.15;            // 15% wet signal

      reverbGain.connect(delay1);
      reverbGain.connect(delay2);
      delay1.connect(fb);
      delay2.connect(fb);
      fb.connect(delay1);
      fb.connect(delay2);
      delay1.connect(wet);
      delay2.connect(wet);
      reverbGain.connect(ctx.destination);
      wet.connect(ctx.destination);

      // Треббл и бас играют ОДНОВРЕМЕННО с одного t0
      const trebleEnd = scheduleVoice(ctx, piece.treble, t0, beatTime, adsr, 1.0, effect, reverbGain);
      scheduleVoice(ctx, piece.bass, t0, beatTime, { ...adsr, peak: adsr.peak * 0.65 }, 0.65, 'none', reverbGain);

      timeoutsRef.current.push(
        window.setTimeout(
          () => setPlaybackState('stopped'),
          (trebleEnd - t0) * 1000 + 400
        )
      );
      setPlaybackState('playing');
    } else if (playbackState === 'playing') {
      ctxRef.current?.suspend();
      setPlaybackState('paused');
    } else {
      ctxRef.current?.resume();
      setPlaybackState('playing');
    }
  };

  return { playbackState, effect, setEffect, togglePlayPause, stop };
}

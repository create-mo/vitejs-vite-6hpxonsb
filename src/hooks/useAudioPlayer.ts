import { useRef, useState } from 'react';
import type { MusicPiece } from '../data/database';

export type Era = 'Baroque' | 'Classical' | 'Romantic' | '20th Century' | 'Contemporary';
export type PlayEffect = 'none';  // Removed 'thirds' | 'arpeggio' — using only 'none'
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

// Duration mapping: note value → beats (relative to whole note = 4 beats)
const DURATION_MAP: Record<string, number> = {
  'w': 4,       // whole note
  'h': 2,       // half note
  'q': 1,       // quarter note
  '8': 0.5,     // eighth note
  '16': 0.25,   // sixteenth note
  '32': 0.125,  // thirty-second note
};

// Reverb parameters per era
const REVERB_PARAMS: Record<Era, { delayTime: number; feedback: number; dryWet: number }> = {
  'Baroque': { delayTime: 0.08, feedback: 0.15, dryWet: 0.12 },
  'Classical': { delayTime: 0.12, feedback: 0.22, dryWet: 0.16 },
  'Romantic': { delayTime: 0.20, feedback: 0.35, dryWet: 0.22 },
  '20th Century': { delayTime: 0.06, feedback: 0.12, dryWet: 0.10 },
  'Contemporary': { delayTime: 0.05, feedback: 0.10, dryWet: 0.08 },
};

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
  withVibrato = false,
  wetGain?: GainNode
) {
  if (freq <= 0 || duration <= 0) return;

  // Main oscillator: sine (warm, vocal-like)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;

  osc.connect(gain);
  if (wetGain) {
    gain.connect(ctx.destination);
    gain.connect(wetGain);
  } else {
    gain.connect(ctx.destination);
  }

  // Second oscillator: weak sawtooth for attack sheen
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sawtooth';
  osc2.frequency.value = freq;
  osc2.connect(gain2);
  if (wetGain) {
    gain2.connect(ctx.destination);
    gain2.connect(wetGain);
  } else {
    gain2.connect(ctx.destination);
  }

  // Vibrato (optional, for Romantic/Contemporary)
  let vibrato: OscillatorNode | null = null;
  let vibratoGain: GainNode | null = null;
  if (withVibrato) {
    vibrato = ctx.createOscillator();
    vibratoGain = ctx.createGain();
    vibrato.frequency.value = 5.5;  // Hz
    vibratoGain.gain.value = freq * 0.005;  // ±0.5% pitch
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
  }

  // ADSR envelope
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

  // Sawtooth: weaker, only on attack
  const sawtooth_peak = adsr.peak * gainScale * 0.08;
  gain2.gain.setValueAtTime(0, startTime);
  gain2.gain.linearRampToValueAtTime(sawtooth_peak, startTime + adsr.attack * 0.5);
  gain2.gain.linearRampToValueAtTime(0, decayEnd);
  gain2.gain.setValueAtTime(0, releaseStart);
  gain2.gain.linearRampToValueAtTime(0, noteEnd);

  osc.start(startTime);
  osc2.start(startTime);
  if (vibrato) vibrato.start(startTime + adsr.attack + 0.05);

  osc.stop(noteEnd);
  osc2.stop(noteEnd);
  if (vibrato) vibrato.stop(noteEnd);
}

function scheduleVoice(
  ctx: AudioContext,
  measures: string[],
  startTime: number,
  beatTime: number,
  adsr: ADSR,
  gainScale: number,
  era: Era,
  wetGain?: GainNode
): number {
  let t = startTime;
  const LEGATO_OVERLAP = 0.05;

  for (const measure of measures) {
    const tokens = measure.split(',');
    let beatPosition = 0;

    for (const token of tokens) {
      const parts = token.trim().split('/');

      // Check for rest
      if (parts.length < 2 || parts[0].trim() === 'r') {
        // Parse duration for rests too
        const durCode = parts[1]?.trim() ?? 'q';
        const beats = DURATION_MAP[durCode] ?? 1;
        const dur = beatTime * beats;
        t += dur;
        beatPosition++;
        continue;
      }

      // Parse duration from token
      const durCode = parts[2]?.trim() ?? 'q';
      const beats = DURATION_MAP[durCode] ?? 1;
      const dur = beatTime * beats;

      const freq = getFreq(parts[0] + '/' + parts[1]);
      if (freq <= 0) {
        t += dur;
        beatPosition++;
        continue;
      }

      // Legato overlap
      const noteStart = Math.max(startTime, t - LEGATO_OVERLAP);

      // Accentuation: first beat of measure is 15% louder
      const accent = beatPosition === 0 ? 1.15 : 1.0;
      const accentedGainScale = gainScale * accent;

      // Vibrato only for Romantic and Contemporary
      const withVibrato = era === 'Romantic' || era === 'Contemporary';

      playTone(ctx, freq, noteStart, dur, adsr, accentedGainScale, withVibrato, wetGain);

      t += dur;
      beatPosition++;
    }
  }

  return t;
}

export function useAudioPlayer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');

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

      // Setup reverb (era-dependent)
      const reverbParams = REVERB_PARAMS[era];
      const delayNode = ctx.createDelay(0.5);
      const feedbackGain = ctx.createGain();
      const dryWetGain = ctx.createGain();

      delayNode.delayTime.value = reverbParams.delayTime;
      feedbackGain.gain.value = reverbParams.feedback;
      dryWetGain.gain.value = reverbParams.dryWet;

      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      delayNode.connect(ctx.destination);
      dryWetGain.connect(delayNode);

      // Treble and bass play simultaneously
      const trebleEnd = scheduleVoice(ctx, piece.treble, t0, beatTime, adsr, 1.0, era, dryWetGain);
      scheduleVoice(
        ctx,
        piece.bass,
        t0,
        beatTime,
        { ...adsr, peak: adsr.peak * 0.65 },
        0.65,
        era,
        dryWetGain
      );

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

  return { playbackState, togglePlayPause, stop };
}

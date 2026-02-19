/**
 * Key decision pipeline: Stage 1 (candidates) → Stage 2 (inertia) → Stage 3 (tonicization shield)
 * → Stage 4 (modulation promotion) → Stage 5 (naming tie-breakers).
 * Order is fixed and testable; params control thresholds.
 */

import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';
import { inferKey } from './keyInference.js';
import { detectModulation } from './modulationDetection.js';
import type { KeyModulationParams } from './keyModulationParams.js';
import { DEFAULT_KEY_MODULATION_PARAMS } from './keyModulationParams.js';

export interface PipelineInput {
  chordRoots: RootSemitone[];
  segments: number[][];
  chordQualities: string[];
}

export interface PipelineResult {
  key: Key;
  modulated: boolean;
  segmentKeys?: Array<{ startIndex: number; endIndex: number; key: Key }>;
  /** Margin between best and second key (two-track); commit when above commitMarginThreshold. */
  margin?: number;
}

/** Detect repeating loop (first half === second half); use for single-center heuristic (doc 19). */
function isLoop(chordRoots: RootSemitone[]): boolean {
  const n = chordRoots.length;
  if (n < 4 || n % 2 !== 0) return false;
  const half = n >> 1;
  for (let i = 0; i < half; i++) if (chordRoots[i] !== chordRoots[half + i]) return false;
  return true;
}

/**
 * Stage 1: Generate candidate keys per segment/window.
 * Currently: inferKey on full progression; yields top key + alternates (conceptually top-2 + margin).
 * Loop heuristic (doc 19): when progression is a repeat, boost last-chord weight for single center.
 */
function stage1Candidates(input: PipelineInput): Key {
  const opts = { chordRoots: input.chordRoots };
  if (isLoop(input.chordRoots)) {
    return inferKey(input.segments, { ...opts, lastTonicBonus: 0.18 });
  }
  return inferKey(input.segments, opts);
}

/**
 * Stage 2: Apply inertia (key-change penalty, hysteresis).
 * Single-key path: pass through; inertia is enforced in Stage 4 via modulationMinSpanChords,
 * snapbackWindowChords, and persistenceChords (new key must persist before promotion).
 * Full hysteresis/cooldown (enter > exit, block switch for N chords) applies when we have
 * two-track or per-segment keys (see commitMarginThreshold, cooldownAfterSwitchChords).
 */
function stage2Inertia(_input: PipelineInput, key: Key, _params: KeyModulationParams): Key {
  return key;
}

/**
 * Stage 3: Tonicization shield (V/x resolver).
 * Stub: pass through; later will mark applied-dominant events so they don't feed promotion.
 */
function stage3TonicizationShield(_input: PipelineInput, key: Key, _params: KeyModulationParams): Key {
  return key;
}

/**
 * Stage 4: Modulation promotion (cadence + min span + no snapback).
 * Uses params.modulationMinSpanChords and params.snapbackWindowChords.
 */
function stage4Promotion(
  input: PipelineInput,
  key: Key,
  params: KeyModulationParams
): { modulated: boolean; segmentKeys?: Array<{ startIndex: number; endIndex: number; key: Key }> } {
  return detectModulation(input.chordRoots, input.segments, key, input.chordQualities, {
    modulationMinSpanChords: params.modulationMinSpanChords,
    snapbackWindowChords: params.snapbackWindowChords,
    persistenceChords: params.persistenceChords,
  });
}

/** Qualities that imply major tonic. */
const MAJOR_QUALITIES = new Set<string>(['maj', 'maj7', 'maj6', '']);
/** Qualities that imply minor tonic. */
const MINOR_QUALITIES = new Set<string>(['min', 'min7', 'min6']);

/**
 * Stage 5: Naming tie-breakers (parallel major/minor, Picardy).
 * Name vs function split (doc 14): tonic is fixed by Stages 1–4; Stage 5 only sets mode (name)
 * from chord evidence (thirds/leading tones, tonic prevalence). Does not change key.root.
 * Picardy: do not rename to major on last chord alone (final tonic quality weak unless reinforced).
 */
function stage5Naming(input: PipelineInput, key: Key, _params: KeyModulationParams): Key {
  const { chordRoots, chordQualities } = input;
  const root = key.root;
  if (!chordRoots.length || chordQualities.length !== chordRoots.length) return key;

  let majCount = 0;
  let minCount = 0;
  for (let i = 0; i < chordRoots.length; i++) {
    if (chordRoots[i] !== root) continue;
    const q = (chordQualities[i] ?? '').toLowerCase();
    if (MAJOR_QUALITIES.has(q)) majCount++;
    else if (MINOR_QUALITIES.has(q)) minCount++;
  }

  // Picardy: only one major tonic and it's the last chord → treat as minor (Picardy third)
  const lastIsMajor =
    chordRoots[chordRoots.length - 1] === root &&
    MAJOR_QUALITIES.has((chordQualities[chordQualities.length - 1] ?? '').toLowerCase());
  if (key.mode === 'major' && majCount === 1 && minCount >= 1 && lastIsMajor) {
    return { ...key, mode: 'minor' };
  }

  // Tie-break by prevalence: more minor tonic chords → minor; more major → major
  if (minCount > majCount) return { ...key, mode: 'minor' };
  if (majCount > minCount) return { ...key, mode: 'major' };
  return key;
}

/**
 * Run the full pipeline. Current behavior is preserved by delegating to inferKey and detectModulation.
 */
export function runKeyDecisionPipeline(
  input: PipelineInput,
  params: KeyModulationParams = DEFAULT_KEY_MODULATION_PARAMS
): PipelineResult {
  const key1 = stage1Candidates(input);
  const key2 = stage2Inertia(input, key1, params);
  const key3 = stage3TonicizationShield(input, key2, params);
  const mod = stage4Promotion(input, key3, params);
  const key5 = stage5Naming(input, key3, params);
  return {
    key: key5,
    modulated: mod.modulated,
    segmentKeys: mod.segmentKeys,
    margin: key3.margin,
  };
}

/**
 * Ollama HTTP client for STEM Forge engine (FOSS stack).
 * Router LLM (Qwen) + Music LLM (ChatMusician or fallback).
 * See docs/FOSS_AND_LOCAL_LLM_STACK.md
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "./quality-score.mjs";

const OLLAMA_BASE = "http://localhost:11434";
const SCRIPTS_DIR = join(import.meta.dirname ?? import.meta.path, ".");
const ALLOWLIST_PATH = join(SCRIPTS_DIR, "stem-forge-allowlist.json");

const DEFAULT_ALLOWLIST = new Set(["rave-guitar", "basic-pitch-only", "fluid-synth"]);
let _allowlist = null;
let _routerModel = "qwen2.5-coder:7b";
let _musicModel = "llama3.2:latest";

if (existsSync(ALLOWLIST_PATH)) {
  try {
    const data = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf-8"));
    if (Array.isArray(data.cloneModels)) _allowlist = new Set(data.cloneModels);
    if (typeof data.routerModel === "string") _routerModel = data.routerModel;
    if (typeof data.musicModel === "string") _musicModel = data.musicModel;
  } catch (_) {}
}
if (!_allowlist) _allowlist = DEFAULT_ALLOWLIST;

/** Default model names (override via env or options). Loaded from stem-forge-allowlist.json if present. */
const DEFAULT_ROUTER_MODEL = _routerModel;
const DEFAULT_MUSIC_MODEL = _musicModel;

/**
 * Allowed model IDs per stem (router must return one of these). From stem-forge-allowlist.json or default.
 */
export const STEM_CLONE_ALLOWLIST = _allowlist;

/**
 * POST to Ollama /api/chat. Body: { model, messages, stream: false }.
 * @param {string} model - Ollama model name
 * @param {Array<{ role: string, content: string }>} messages
 * @param {{ baseUrl?: string }} [options]
 * @returns {Promise<{ message: { content: string }, done: boolean }>}
 */
export async function ollamaChat(model, messages, options = {}) {
  const base = options.baseUrl ?? OLLAMA_BASE;
  const url = `${base}/api/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama chat failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

/**
 * Router: ask LLM to pick model per stem from allowlist. Validates response against allowlist.
 * Stems may include optional mono (single-note), lengthSec, complexity (e.g. note count) for better routing.
 * @param {{ stems: Array<{ stemId: string, instrument?: string, mono?: boolean, poly?: boolean, lengthSec?: number, complexity?: string | number }>, allowlist?: Set<string> }} input
 * @param {{ model?: string, baseUrl?: string }} [options]
 * @returns {Promise<Array<{ stemId: string, modelId: string }>>}
 */
export async function runRouter(input, options = {}) {
  const allowlist = input.allowlist ?? STEM_CLONE_ALLOWLIST;
  const model = options.model ?? process.env.OLLAMA_ROUTER_MODEL ?? DEFAULT_ROUTER_MODEL;
  const registry = options.registry ?? loadRegistry();
  const qualityHints = registry
    .filter((e) => e.quality_score != null && allowlist.has(e.id))
    .map((e) => `${e.id}:${Number(e.quality_score).toFixed(2)}`)
    .join(", ");
  const qualityLine = qualityHints
    ? ` Prefer models with higher quality_score when suitable (scores: ${qualityHints}).`
    : "";
  const systemPrompt = `You are a routing agent. Output only valid JSON, no markdown. For each stem, choose exactly one modelId from the allowlist. Format: { "choices": [ { "stemId": "<id>", "modelId": "<from allowlist>" } ] }. Allowlist: ${[...allowlist].join(", ")}. Use stem hints (mono/poly, lengthSec, complexity) when provided to pick a suitable model.${qualityLine}`;
  const userContent = JSON.stringify({
    stems: input.stems,
    allowlist: [...allowlist],
  });
  const data = await ollamaChat(
    model,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    { baseUrl: options.baseUrl }
  );
  const content = data.message?.content?.trim() ?? "";
  let parsed;
  try {
    const jsonStr = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Router did not return valid JSON: ${content.slice(0, 200)}`);
  }
  const choices = Array.isArray(parsed.choices) ? parsed.choices : [];
  const out = [];
  for (const c of choices) {
    const stemId = c.stemId;
    const modelId = c.modelId;
    if (!stemId || !modelId) continue;
    if (!allowlist.has(modelId)) continue; // validate against allowlist
    out.push({ stemId, modelId });
  }
  return out;
}

/**
 * Music LLM: articulations / style prompts for a stem (e.g. for RAVE).
 * @param {{ summary: string, midiSnippet?: string, desiredStyle?: string }} input
 * @param {{ model?: string, baseUrl?: string }} [options]
 * @returns {Promise<string>} Raw text or JSON string from model
 */
export async function runMusicLlm(input, options = {}) {
  const model = options.model ?? process.env.OLLAMA_MUSIC_MODEL ?? DEFAULT_MUSIC_MODEL;
  const userContent = [
    "You are a music expert. Suggest articulations (slides, hammer-ons, accents) or style prompts for synthesis.",
    `Context: ${input.summary}`,
    input.midiSnippet ? `MIDI info: ${input.midiSnippet}` : "",
    input.desiredStyle ? `Desired style: ${input.desiredStyle}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const data = await ollamaChat(
    model,
    [
      { role: "system", content: "Respond with concise, actionable suggestions. Prefer short bullet points or JSON." },
      { role: "user", content: userContent },
    ],
    { baseUrl: options.baseUrl }
  );
  return data.message?.content ?? "";
}

/**
 * Check if Ollama is reachable (e.g. for "engine ready" or fallback).
 * @param {{ baseUrl?: string }} [options]
 * @returns {Promise<boolean>}
 */
export async function ollamaHealth(options = {}) {
  const base = options.baseUrl ?? OLLAMA_BASE;
  try {
    const res = await fetch(`${base}/api/tags`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

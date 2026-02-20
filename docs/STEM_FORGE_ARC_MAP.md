# STEM Forge Engine — ARC Map (Plan vs Done)

Governed by `docs/FOSS_AND_LOCAL_LLM_STACK.md`. **ARC order:** FOUNDATION → OPERATIONS → STEM ENGINES (lowest to highest). Fill gaps from bottom to top; no redoing or erasing.

---

## FOUNDATION (lowest arc)

Infra, script contracts, ffmpeg, venvs, and data shapes.

| Item | Plan (FOSS doc) | Status | Gap to fill |
|------|------------------|--------|-------------|
| audio_to_midi.py | Basic Pitch + pretty-midi; JSON in/out | Done (script + runner) | — |
| pretty-midi | Clean MIDI; micro-notes, quantize | Done (inside audio_to_midi) | — |
| midi_clean.py | Standalone: `{ midiPath }` → `{ cleanedMidiPath, stats }` | Done | — |
| ffmpeg | Convert to 48 kHz 16/24-bit; cut/merge stems | Done | — |
| mir_compare.py | Librosa metrics → JSON | Done (script + runner) | — |
| quality_score | Metrics → update model/registry | Done | quality-score.mjs; pipeline updates registry after MIR |
| Song grid | Source of truth for tempo/meter; engines consume | Done | Runbook + pipeline --bpm/--time-sig/--grid-file |
| midi_to_clone.py | RAVE (or HeartMuLa); contract | Done | RAVE render (ref or duration-from-MIDI); HeartMuLa clear error when selected |
| Essentia (optional) | Advanced MIR in mir_compare | Done | Optional branch in mir_compare (key/tempo when installed) |

---

## OPERATIONS (middle arc)

Orchestration, registry, router, music LLM, and pipeline flow.

| Item | Plan (FOSS doc) | Status | Gap to fill |
|------|------------------|--------|-------------|
| Ollama client | POST to 11434; chat/generate | Done (ollama-client.mjs) | — |
| Router (Qwen) | Stems + allowlist → JSON; validate | Done | Optional mono/poly, lengthSec, complexity per stem |
| Allowlist / registry | Allowed models per stem from registry | Done | stem-forge-registry.json; quality_score; loader in quality-score.mjs |
| Pipeline | One flow: stems → audio_to_midi → clone → MIR | Done | Registry updated after MIR |
| Music LLM (ChatMusician) | Articulations, style prompts | Done | Runbook: fallback doc + skip router if Ollama down |
| Validate router output | Chosen model in allowlist | Done | — |

---

## STEM ENGINES (highest arc)

Song grid and stem packages (guitar, drum, vocal, midi-to-audio); FOSS clone (RAVE, HeartMuLa).

| Item | Plan (FOSS / STEM_ENGINES_EXPORT) | Status | Gap to fill |
|------|-----------------------------------|--------|-------------|
| Song grid | parseMidiBufferToGrid, songGridFromUserInput | Done | Pipeline --bpm/--time-sig/--grid-file; runbook stem-engine wiring |
| midi-to-audio | renderMidiToWav(midiBuffer, { grid, sampleRate }) | Package exists | Consume pipeline output from app/script (doc in runbook) |
| guitar / drum / vocal | analyze, separate, extractMelody | Packages exist | Document in STEM_ENGINES_EXPORT_OPTIONS.md |
| RAVE in midi_to_clone | Load model; render clone WAV | Done | RAVE_MODEL_PATH; ref or duration-from-MIDI → WAV |
| HeartMuLa (optional) | Registry type; route in midi_to_clone | Done | In allowlist; doc in runbook |

---

## Implementation order (from FOSS doc §5)

1. audio_to_midi — Done  
2. Ollama + Qwen routing — Done  
3. midi_to_clone (RAVE) — Contract + runner done; RAVE load = gap  
4. mir_compare (Librosa) — Done  
5. ChatMusician — Client path done; fallback doc = gap  

This map is the checklist for filling blanks from FOUNDATION → OPERATIONS → STEM ENGINES without redoing or erasing existing work.

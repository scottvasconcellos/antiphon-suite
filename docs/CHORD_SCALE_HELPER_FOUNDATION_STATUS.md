# Chord Scale Helper — Foundation Status

**Status: 100% complete.** Foundation arc is done; ready to enter Operations arc when you are.

## What Was Done (Foundation to 100%)

1. **Layer0 doc** — [layer0_chord_scale_helper.md](layer0_chord_scale_helper.md): product authority (exact quote), Distribution (standalone, Hub-managed when present).
2. **Layer app package** — `apps/layer-app-chord-scale-helper/`: package.json, tsconfig.json, domain types in `src/domain/`, README.
3. **Artifact v1** — `artifacts/v1/manifest.json` + `app.txt`; digest uses repo’s stub SHA (same as hello-world/rhythm) so `installArtifactToDisk` passes.
4. **Entitlement** — `antiphon.layer.chord-scale-helper` added to `apps/layer0-authority/data/state.json` (version 1.0.0, not-installed, owned).
5. **Hub artifact fetcher** — `apps/layer0-hub/src/services/artifactFetcher.ts`: `appIdToDirectory` and comment updated for chord-scale-helper.
6. **Foundation artifact test** — `apps/layer0-hub/tests/foundation-artifact.test.ts`: happy-path install for chord-scale-helper 1.0.0.
7. **Research index** — [chord_scale_helper_research_index.md](chord_scale_helper_research_index.md).

## Debug / Verification

- **Chord-scale-helper typecheck:** `pnpm run typecheck` in `apps/layer-app-chord-scale-helper` — pass.
- **Foundation artifact test:** `pnpm run test:foundation:artifacts` in `apps/layer0-hub` — pass (hello-world, rhythm, chord-scale-helper + digest-mismatch case).
- **Smoke:** `pnpm run smoke` — pass (build, typecheck, control-plane + foundation smoke).
- **Gate:** `pnpm run gate` — smoke and snapshot checks pass; **rc-check** fails with `repo_scope_not_clean` until scoped changes are committed (expected; not a foundation bug).

## Note on Artifact Digest

Demo layer apps use the repo’s **stub digest** (see `diskArtifactInstaller.ts` `sha256()`), not cryptographic SHA-256. Chord-scale-helper’s manifest uses that stub for `app.txt` so install verification matches. For real releases you would switch to real SHA-256 and installer verification.

---

## Operations Arc — Next Steps

Per [layer0_chord_scale_helper.md](layer0_chord_scale_helper.md), do not start Operations until Foundation is ≥95% (done). Do not start Skin until Operations is ≥95%.

**Operations scope (harmonic analysis engine):**

- **Engine Research Plan implemented:** Research digest ([chord_scale_helper_research_digest.md](chord_scale_helper_research_digest.md)), suggested readings in research index, expanded engine spec (key algorithm, chord-scale tie-breakers, RN/applied/borrowed/modulation, MIDI, consistency). Domain: `Key.alternates`, `RomanNumeral.appliedToDegree`. Key inference: cadence bonus, first/last tonic, alternates when ambiguous. BorrowedModalDetection (`isBorrowedChord`, `getAppliedToDegree`) and ModulationDetection (MVP: no modulation). Chord-scale: avoid-note table, `scaleHasNoAvoidNote`, Lydian over Ionian for maj7. MIDI: `getTimeSignatureFromMidiMeta`, `getChordFromPitchClassSet`, `buildScaleMapForExport`. See `apps/layer-app-chord-scale-helper/src/engine/` and [chord_scale_helper_engine_spec.md](chord_scale_helper_engine_spec.md).

1. **Key inference** — Infer key (and mode) from a chord progression; handle ambiguous/modal cases (see research: Modal Key Detection.pdf).
2. **Chord detection** — From MIDI or manual entry: parse chords, beat-snap, chord duration in beats.
3. **Time signature detection** — From MIDI or user input.
4. **One chord-scale per chord** — Assign exactly one scale to each chord; internal consistency (key, Roman numeral, scale, chord) never contradict.
5. **Roman numeral derivation** — Compute and attach Roman numeral (and borrowed/modal) per chord from key.
6. **Borrowed/modal handling** — Distinguish borrowed chords vs modulation (see Known Risks in layer0 doc).
7. **MIDI import** — Parse MIDI to progression (chords, time signature, tempo).
8. **MIDI export** — Export chord progression + scale map aligned to measure structure (beat/measure from domain types).
9. **Manual chord entry** — Button builder + optional syntax; output `Progression` + `AnalyzedProgression` using existing domain types.

**Where to build:** Engine logic in `apps/layer-app-chord-scale-helper/src/` (e.g. `engine/` or `services/`); consume domain types from `src/domain/`. Use [chord_scale_helper_research_index.md](chord_scale_helper_research_index.md) for research inputs. No UI skin yet (Skin arc).

**Success criteria (from layer0):** Given a MIDI progression with clear harmonic intent, the app must detect time signature, infer key, assign one coherent chord-scale per chord, display correct Roman numerals and scale notes, and export a MIDI scale map aligned to measure structure. Failure if scale contradicts chord, Roman numeral contradicts key, or key detection is clearly wrong for a straightforward progression.

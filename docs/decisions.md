# Decisions

Append-only ADR (Architecture Decision Record) log.
**Do not edit past entries.** If a decision is reversed, add a new entry.

Format:
```
## [YYYY-MM-DD] Title
**Decision:** ...
**Rationale:** ...
**Alternatives considered:** ...
```

---

## [2026-03-14] Use CLAUDE.md for behavioral rules instead of npx skill packages
**Decision:** Behavioral rules (plan mode, sub-agent strategy, self-verification, security) are encoded in CLAUDE.md rather than installed via npm packages.
**Rationale:** `npx skills add` is not a real Claude Code mechanism. Skills and behavioral rules are configured via CLAUDE.md instructions read by Claude at session start.
**Alternatives considered:** External npm packages — not viable (packages don't exist).

---

## [2026-03-14] kick_sub_share_gate must NOT be propagated to synthetic eval
**Decision:** `--enable-kick-sub-share-gate` is passed to the real-stem eval command only, never to the synthetic (`synth_cmd`) eval in `run_drum_engine_gate.py`.
**Rationale:** Synthetic kicks are generated as pure sub-bass (low mid content by design). The resonance gate condition (`sub_share >= 0.65 AND mid_share <= 0.26`) matches synthetic TP kicks as well as real FP resonance tails — applying it to synthetic eval drops the synthetic pass rate from 100% to ~0%. This architectural constraint is permanent and must survive any future refactor of the gate script.
**Alternatives considered:** Adjusting thresholds to spare synthetic kicks — not viable; synthetic sub_share distribution overlaps the gate zone completely.

---

## [2026-03-14] Exclude STAR_REAL clips from gate denominator (eval mismatch, not engine failure)
**Decision:** The 10 STAR_REAL_* clips have `eval_excluded: true` in `manifest.json` and are not counted toward the real-stem pass rate (denominator = 7: ENST_001–005, A2MD_001–002).
**Rationale:** STAR GT MIDI uses non-GM pitches 88–94 (instrument-specific re-synthesized kit sounds). The scoring contract maps kick to pitches [35, 36] only; GT pitch mismatch gives precision ~0.04 even when the engine correctly detects all bass-drum-like onsets. This is an evaluation mismatch, not an engine defect. STAR clips still run and print metrics for diagnostic value but do not affect pass/fail.
**Alternatives considered:** Re-mapping STAR GT to GM pitches — requires access to the original STAR dataset and pitch re-labelling; deferred indefinitely.

---

## [2026-03-14] Recommended gate flags include --use-real-backend
**Decision:** The canonical eval command is:
`--use-real-backend --use-onset-suppressor --enable-kick-reverb-snare-filter --enable-kick-sub-share-gate`
**Rationale:** `--use-real-backend` (Demucs htdemucs stem separation) is neutral-to-positive on ENST clips and adds no regression on synthetic. Including it in the canonical command ensures every gate run reflects the same pipeline configuration. Omitting it was a prior-session inconsistency that caused a small result discrepancy on ENST_003 (snare R 0.73→0.77 when real backend is added).
**Alternatives considered:** Keeping real backend off by default to reduce gate time — rejected; the 900s timeout is acceptable and consistency matters more than speed.

---

## [2026-03-14] kick_reverb_snare_filter Arm A threshold = 0.35
**Decision:** Suppress snares near a kick if their `sub_share >= 0.35` (Arm A of `_kick_reverb_snare_filter`).
**Rationale:** Empirical distributions from ENST:
- Max synthetic snare sub_share: 0.189
- Max ENST TP snare sub_share: 0.177
- Min ENST FP (kick-resonance) snare sub_share: 0.371
Gap of 0.18 between max TP and min FP gives safe threshold at 0.35. Window 80ms (symmetric) covers timing jitter between kick onset and resonance-induced snare FP.
**Alternatives considered:** 0.22 (too aggressive, clips some genuine simultaneous hits); 0.45 (too permissive, misses most resonance FPs).

# Lessons

Append-only. One line per corrected mistake or non-obvious discovery.
Format: `- [YYYY-MM-DD] <what was wrong or surprising> → <correct approach>`

---

- [2026-03-14] `npx skills add <package>` is not a real Claude Code mechanism → Claude Code skills/behaviors are configured via CLAUDE.md rules read at session start; no npm install required
- [2026-03-14] Stale "current state" in CLAUDE.md causes cold-start confusion → keep a separate CURRENT.md updated each iteration; CLAUDE.md is for permanent conventions only
- [2026-03-14] Uncommitted changes from a prior session caused session-replay confusion (new session re-issued old iter 038 prompt while working tree was at iter 041) → commit and push at the end of every session, not just at milestones; check `git diff --stat HEAD` at session start before acting
- [2026-03-14] Gate run without `--use-real-backend` vs with it produces slightly different real-stem results (ENST_003 snare R 0.73→0.77) → always run with the full canonical flags so results are reproducible across sessions

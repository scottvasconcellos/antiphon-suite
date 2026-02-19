# Modulation Detection Failure Analysis

**Date:** 2026-02-17  
**Current Status:** Pass 198, Fail 21, Pass+soft 231/252 (91.7%)  
**Target:** ≥90% pass+soft rate ✅ (meets target, but regressed from 200→198 pass)

## Executive Summary

The harmonic analysis engine currently has 21 failing test cases out of 252 total cases. The pass+soft rate of 91.7% meets the 90% target, but we regressed from 200 passing cases to 198. This document provides a detailed analysis of each failure and identifies knowledge gaps that need to be addressed.

## Failure Categories

### 1. Missed Modulations (9 cases)
Cases where the engine should detect modulation but doesn't.

### 2. False Modulations (10 cases)
Cases where the engine incorrectly detects modulation when there shouldn't be any.

### 3. Key Inference Issues (2 cases)
Cases where the primary key inference is incorrect (mode or root).

---

## Detailed Failure Analysis

### MISSED MODULATIONS

#### K021: V/V-V-I Cadence Detection
- **Progression:** `C Am Dm G C Am D G C`
- **Expected:** Modulates from C:maj [0-4] to G:maj [5-8]
- **Actual:** No modulation detected
- **Notes:** "Am pivot; D-G implies V-I in G"
- **Root Fingerprint:** `0,9,2,7,0,9,2,7,0`
- **Analysis:**
  - D-G cadence at positions 6-7 should be detected as V-I in G
  - Progression ends on C (original tonic), which may trigger snapback detection
  - Prefix inference may be picking G:maj instead of C:maj
  - **What to learn:** How to handle middle modulations that return to original key at the end

#### K034: Chromatic Modulation
- **Progression:** `C Db Ab Eb Bb`
- **Expected:** Modulates from Db:maj (all chords in Db:maj)
- **Actual:** No modulation detected, but key inference picks C:min
- **Notes:** "Immediate Db establishment."
- **Root Fingerprint:** `0,1,8,3,10`
- **Analysis:**
  - Very short progression (5 chords)
  - All chords are diatonic in Db:maj (C=VII, Db=I, Ab=IV, Eb=V, Bb=I)
  - Engine is inferring C:min instead of Db:maj
  - **What to learn:** How to detect key establishment from chromatic progressions, recognize Db:maj from chord content

#### K047: V-I Cadence Detection
- **Progression:** `C G/B Am F D7/F# G`
- **Expected:** Modulates from C:maj [0-3] to G:maj [4-5]
- **Actual:** No modulation detected
- **Notes:** "D7->G = V->I in G"
- **Root Fingerprint:** `0,7,9,5,2,7`
- **Analysis:**
  - D7→G cadence at positions 4-5 should be detected
  - Prefix `C G/B Am F` may be inferring to G:maj instead of C:maj
  - Inversions (G/B, D7/F#) may be confusing prefix inference
  - **What to learn:** How to handle inversions in prefix inference for V-I cadences

#### K133: V/V-V-I Pattern
- **Progression:** `D G A D B7 Em Am D`
- **Expected:** Modulates from D:maj [0-3] to A:min [5-7]
- **Actual:** No modulation detected
- **Notes:** "Ambiguous modulation"
- **Root Fingerprint:** `2,7,9,2,11,4,9,2`
- **Analysis:**
  - Starts and ends on D
  - Contains B7-Em-Am progression (V-ii-i in A:min)
  - May be filtered as tonicization or snapback due to return to D
  - **What to learn:** How to distinguish genuine modulations from tonicizations in progressions that return to original key

#### K168: Multi-step Modulation
- **Progression:** `Dm G C F B7 Em A D`
- **Expected:** Modulates from C:maj [0-3] to D:maj [4-7], "A–D cadence"
- **Actual:** No modulation detected
- **Category:** `multi_step_modulation`
- **Analysis:**
  - Progression goes through multiple keys: Dm→G→C→F→B7→Em→A→D
  - Should detect C:maj [0-3] then D:maj [4-7]
  - Current engine only detects single modulation point
  - **What to learn:** How to detect and represent multi-step modulations (A→B→C), iterate modulation detection on segments

#### K196-K199: Extreme Stress Ending Cadences
- **K196:** `C E A D G B E A` - Expected: C:maj [0-2] → A:maj [3-7], "E–A cadence"
- **K197:** `D F# B E A D G C` - Expected: D:maj [0-5] → C:maj [6-7]
- **K198:** `G B E A D G C F` - Expected: G:maj [0-5] → F:maj [6-7]
- **K199:** `F A D G C F Bb Eb` - Expected: F:maj [0-5] → Eb:maj [6-7]
- **Category:** `extreme_stress`
- **Analysis:**
  - All are long progressions (8 chords) with ending cadences
  - Cadences are at the very end (last 2 chords)
  - Global key inference may be picking the ending key, causing filter to block modulation
  - **What to learn:** How to detect ending modulations when global key equals cadence key

---

### FALSE MODULATIONS

#### K080: False V-I Detection
- **Progression:** `C G Am F D G Em`
- **Expected:** No modulation, "Weak C, alternates"
- **Actual:** Modulation detected
- **Root Fingerprint:** `0,7,9,5,2,7,4`
- **Analysis:**
  - Contains D→G cadence but should not modulate
  - Returns to Em at the end (relative minor of G)
  - May be a tonicization rather than modulation
  - **What to learn:** How to distinguish tonicizations from modulations when progression returns to relative minor

#### K081: Key Inference Issue (Now False Modulation)
- **Progression:** `C G/B Am G F C/E Dm G`
- **Expected:** C:maj, no modulation
- **Actual:** False modulation detected (was "strong case: expected C:maj, got G:maj")
- **Notes:** "Inversions in C"
- **Root Fingerprint:** `0,7,9,7,5,0,2,7`
- **Analysis:**
  - **REGRESSION:** Previously was key inference issue, now detecting false modulation
  - Many inversions (G/B, C/E) confuse the engine
  - Ends on G which may trigger cadence detection
  - **What to learn:** How to handle inversions without triggering false modulations

#### K086-K088: Relative Minor False Positives
- **K086:** `Dm G C F` - Expected: C:maj, no modulation
- **K087:** `Em A D G` - Expected: D:maj, no modulation  
- **K088:** `Am D G C` - Expected: G:maj, no modulation
- **Root Fingerprints:** `2,7,0,5`, `4,9,2,7`, `9,2,7,0`
- **Analysis:**
  - All contain V-I cadences to relative minor keys
  - Should be recognized as tonicizations, not modulations
  - Short progressions (4 chords) with return to major
  - **What to learn:** How to filter V-i cadences to relative minor when progression is short and returns to major

#### K100: False Modulation (Modal Mixture)
- **Progression:** `C F G C Ab Bb C Fm G C`
- **Expected:** No modulation, "Heavy mixture"
- **Actual:** Modulation detected
- **Analysis:**
  - Contains modal mixture (Ab, Bb, Fm from C:min)
  - Should stay in C:maj despite borrowed chords
  - May be detecting Ab-Bb or Fm-G as cadences
  - **What to learn:** How to recognize modal mixture and filter false modulations from borrowed chords

#### K183, K185, K186: Ambiguous Loop False Positives
- **K183:** `Em C G D Em C D G` - Expected: E:min, no modulation, "E min vs G maj ambiguous"
- **K185:** `F#m D A E F#m D E A` - Expected: A:maj, no modulation
- **K186:** `Cm Ab Eb Bb Cm Ab Bb Eb` - Expected: Eb:maj, no modulation, "Eb maj primary"
- **Categories:** `key_ambiguous`, `ambiguous_loop`
- **Root Fingerprints:** `4,0,7,2,4,0,2,7`, `6,2,9,4,6,2,4,9`, `0,8,3,10,0,8,10,3`
- **Analysis:**
  - All are loops (first half = second half)
  - Key ambiguity between relative major/minor
  - Current filtering not strong enough
  - **What to learn:** How to definitively block modulations in ambiguous loops with key ambiguity

#### K226, K242: Short V-i False Positives
- **K226:** `Am F C` - Expected: C:maj, no modulation
- **K242:** `Am D G C` - Expected: C:maj, no modulation
- **Root Fingerprints:** `9,5,7,0`, `9,2,7,0`
- **Analysis:**
  - Very short progressions (3-4 chords)
  - Contain V-i cadences to relative minor
  - Should be recognized as tonicizations
  - **What to learn:** How to filter very short progressions with V-i cadences

---

### KEY INFERENCE ISSUES

#### K112: Key Inference (Relative Minor Ambiguity)
- **Progression:** `Dm Bb F C`
- **Expected:** F:maj
- **Actual:** D:min
- **Notes:** "vi–IV–I–V in F"
- **Analysis:**
  - 4-chord progression starting on Dm (relative minor of F)
  - Should recognize as vi-IV-I-V pattern in F:maj
  - Engine is picking D:min instead
  - **What to learn:** How to prefer major mode when progression follows major key patterns (I-V cadence present)

#### K122: Key Inference (Relative Minor Ambiguity)
- **Progression:** `F#m D A E`
- **Expected:** A:maj
- **Actual:** F#:min
- **Notes:** "vi–IV–I–V"
- **Analysis:**
  - 4-chord progression starting on F#m (relative minor of A)
  - Should recognize as vi-IV-I-V pattern in A:maj
  - Engine is picking F#:min instead
  - **What to learn:** Same as K112 - recognize major key patterns even when starting on relative minor

---

## Knowledge Gaps & Learning Needs

### 1. Prefix Inference for V/V-V-I Cadences
**Problem:** When detecting V/V-V-I cadences, prefix inference may pick the cadence key instead of the original key.

**Examples:** K021, K047

**What to Learn:**
- How to prevent prefix inference from being influenced by chords that are part of the cadence
- Whether to use even more conservative settings (lower lastTonicBonus, ignore cadence chords)
- Whether to use first chord root as anchor when prefix inference is ambiguous

### 2. Middle Modulations That Return Home
**Problem:** Progressions that modulate in the middle but return to the original key at the end are being filtered as snapbacks.

**Examples:** K021, K133

**What to Learn:**
- When is a middle modulation strong enough to report even if progression returns home?
- How many chords in the new key segment are needed?
- Should we check if the return happens "within" the segment vs "at the end"?

### 3. Ending Cadence Detection When Global Key Equals Cadence Key
**Problem:** When the global key inference picks the ending key, filters block modulation detection.

**Examples:** K196-K199

**What to Learn:**
- How to detect ending modulations when global key equals cadence key
- Whether to use prefix-based key inference instead of global key for filtering
- How to recognize "extreme stress" cases that should override normal filters

### 4. Ambiguous Loop Filtering
**Problem:** Current filtering (margin < 0.15, segment length < 5) is not strong enough for ambiguous loops.

**Examples:** K183, K185, K186

**What to Learn:**
- What margin threshold definitively indicates ambiguity?
- Should we check if keyBefore alternates include cadence key?
- Should we block ALL modulations in loops when key ambiguity exists?

### 5. Tonicization vs Modulation Distinction
**Problem:** Short progressions with V-I cadences are being detected as modulations when they're actually tonicizations.

**Examples:** K080, K086-K088, K226, K242

**What to Learn:**
- What length threshold distinguishes tonicization from modulation?
- How to detect "return to original key" signals?
- Should V-i cadences to relative minor always be filtered if progression is short?

### 6. Inversion Handling
**Problem:** Progressions with many inversions confuse both key inference and modulation detection.

**Examples:** K081 (regression), K047

**What to Learn:**
- How to recognize inversion-heavy progressions
- Whether to give extra weight to first chord root when inversions are present
- How to prevent inversions from triggering false cadence detection

### 7. Chromatic Modulations
**Problem:** Modulations without traditional V-I cadences are not detected.

**Examples:** K034

**What to Learn:**
- How to detect chromatic modulations
- What harmonic signals indicate modulation without cadences?
- Whether to use pitch-class histogram analysis for these cases

### 8. Multi-step Modulations
**Problem:** Current engine only detects single modulation point.

**Examples:** K168

**What to Learn:**
- How to detect multiple modulation points in a single progression
- How to represent A→B→C modulations in segmentKeys
- Whether to iterate modulation detection on segments

### 9. Very Short Progressions (2 chords)
**Problem:** Two-chord progressions are ambiguous for key inference.

**Examples:** K112, K122

**What to Learn:**
- Default heuristics for 2-chord progressions
- Whether to prefer major mode when first chord is major
- Whether to use chord quality (major vs minor) as tie-breaker

---

## Regression Analysis

### Cases That Regressed
- **K081:** Changed from "strong case: expected C:maj, got G:maj" to "false modulation"
  - **Cause:** Recent changes to key inference bonuses may have made G:maj win, then modulation detection triggered on G cadence
  - **Impact:** Medium - key inference issue became modulation issue

### Cases That Improved
- **K047:** Was failing, now status unclear (need to verify)
- **K020:** Was failing, now passing (fixed in previous commit)

---

## Recommendations

### Immediate Actions
1. **Revert K081 regression:** Investigate why key inference bonuses caused false modulation
2. **Strengthen ambiguous loop filtering:** Increase margin threshold or add keyBefore alternates check
3. **Fix ending cadence detection:** Use prefix-based filtering instead of global key for K196-K199

### Medium-term Improvements
1. **Improve prefix inference:** Use first chord as anchor when prefix inference is ambiguous
2. **Enhance snapback detection:** Distinguish "return within segment" from "return at end"
3. **Add tonicization filter:** Explicit filter for short V-i cadences to relative minor

### Long-term Research
1. **Chromatic modulation detection:** Research harmonic signals for non-cadence modulations
2. **Multi-step modulation support:** Design algorithm for detecting multiple modulation points
3. **Inversion-aware analysis:** Develop heuristics for recognizing and handling inversions

---

## Test Results Summary

```
Pass:      198
Soft-pass: 33
Fail:      21
Total:     252
Pass+soft: 231/252 (91.7%)
```

**Status:** ✅ Meets 90% target, but regressed from 200→198 pass cases.

---

## File Location

This analysis is located at:
```
docs/MODULATION_FAILURE_ANALYSIS.md
```

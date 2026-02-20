# STEM Forge Enhanced Workflow

## Overview

Intelligent bulk stem processing with cross-reference analysis, auto-instrument detection, polyphonic separation, and high-quality remastering with advanced MIDI articulations.

---

## Workflow Phases

### Phase 1: Bulk Upload & Analysis
**User action:** Drag all stems into the app

**System actions:**
1. Upload all stems
2. **Cross-reference analysis** across all stems:
   - Detect tempo (BPM) — analyze all stems together, find common tempo
   - Detect key signature — harmonic analysis across stems
   - Detect time signature — measure detection across stems
   - Create unified MIDI map/tempo grid as backbone
3. **Auto-instrument detection** for each stem:
   - Electric lead guitar
   - Electric rhythm guitar
   - Acoustic guitar
   - Drums/beat (with kick, snare, top/cymbals distinction)
   - Percussion
   - Piano/electric piano/keys (rhythm keys, lead synths)
   - Vocals (melody)
   - Background vocals (harmonies)
   - Bass

**Output:** Each stem auto-assigned to an instrument track category

---

### Phase 2: Polyphonic Separation
**System actions:**
1. **Guitar separation:** If a stem contains guitars, separate into:
   - Lead guitar (melodic lines, solos)
   - Rhythm guitar (chords, rhythm patterns)
2. **Vocal separation:** If a stem contains vocals, separate into:
   - Vocal melody (main lead vocal)
   - Background vocals (harmonies, backing)
3. **Drum separation:** If a stem contains drums, separate into:
   - Kick drum
   - Snare drum
   - Tops/cymbals (hi-hats, crashes, rides)

**Output:** Subdivided stems ready for individual processing

---

### Phase 3: MIDI Generation
**System actions:**
1. Convert all stems (and subdivisions) to MIDI using FOSS tools
2. Generate MIDI for each track:
   - Basic MIDI (note on/off, velocity, pitch)
   - **Advanced MIDI** (with articulations):
     - **Guitars/Bass:** slides, bends, hammer-ons, pull-offs, squeaks, optional buzz (toggleable)
     - **Drums:** flams, pedal sounds, ghost notes, rim shots
     - **Keys:** sustain, pedal, legato transitions
     - **Vocals:** (handled separately in Phase 6)
3. Save all MIDI files (don't export yet)

**Output:** MIDI files with basic and advanced articulations

---

### Phase 4: Remaster Selection
**User action:** Select which tracks to remaster

**UI:**
- Show all detected tracks (stems + subdivisions)
- Checkboxes for each track: "Remaster this track?"
- Summary: "X of Y tracks selected for remastering"

**Output:** User selection of tracks to remaster

---

### Phase 5: Remastering (High-Quality Audio Generation)
**System actions:**
For each selected track:
1. **Sophisticated synthesis** combining:
   - Original audio file (reference)
   - MIDI file (timing, notes, articulations)
   - Tempo/time signature grid (alignment)
2. Generate **optimal human-performance replica**:
   - Super clean, super realistic
   - Time-aligned to tempo/MIDI map
   - Matches measures and beat grid
   - High fidelity: 44.1kHz or 48kHz
   - Watermark-free

**Output:** High-quality remastered audio files

---

### Phase 6: Backing Vocals & Lyrics
**Special handling for backing vocals:**
1. **Lyrics input:**
   - User can paste/type lyrics
   - **Auto-detect option:** Extract lyrics from audio (if possible)
   - Lyrics aligned to MIDI timing (blocks per measure/phrase)
2. **Vowel matching:** Ensure AI-generated backing vocals match vowel sounds
3. **High-quality AI vocals:** Generate watermark-free, realistic backing vocals

**Output:** Remastered backing vocals with matching lyrics/vowels

---

### Phase 7: Export
**Output files:**
1. **MIDI files:**
   - Basic MIDI (all tracks)
   - Advanced MIDI (with articulations, all tracks)
2. **Remastered audio files:**
   - High-fidelity WAV files (44.1kHz or 48kHz)
   - One file per remastered track
   - Time-aligned to tempo grid
3. **Project metadata:**
   - Tempo map
   - Key signature
   - Time signature
   - Instrument assignments

---

## Technical Implementation Notes

### Instrument Detection
- Use MIR (Music Information Retrieval) features:
  - Spectral analysis (guitar vs piano vs drums)
  - Onset detection (drums vs sustained instruments)
  - Harmonic content (vocals vs instruments)
  - Frequency range analysis (bass vs guitar vs keys)
- Cross-reference with MIDI note patterns:
  - Chord patterns → rhythm guitar
  - Melodic lines → lead guitar
  - Percussive patterns → drums
- Use FOSS tools: Essentia, Librosa, or custom classifiers

### Polyphonic Separation
- **Guitars:** Source separation (lead vs rhythm) using:
  - Frequency domain analysis
  - MIDI pattern analysis (chords vs melodies)
  - Temporal patterns (rhythm vs lead)
- **Vocals:** Source separation using:
  - Harmonic analysis (melody vs harmony)
  - Frequency range (lead vs background)
  - MIDI note patterns
- **Drums:** Use LarsNet-style models or similar:
  - Kick/snare/tops separation
  - Multi-head U-Net architecture
  - Trained on drum-specific datasets

### Advanced MIDI Articulations
- **Detection:** Analyze original audio for:
  - Slides: pitch bends in MIDI
  - Bends: continuous pitch changes
  - Hammer-ons/pull-offs: rapid note transitions
  - Squeaks: high-frequency artifacts
  - Buzz: optional, toggleable
- **Encoding:** Use MIDI CC (Control Change) messages:
  - Pitch bend wheel
  - Aftertouch
  - CC for articulations
- **Drums:** Use MIDI note velocities and articulations:
  - Flams: rapid double hits
  - Pedal sounds: sustain/decay
  - Ghost notes: low-velocity notes

### Remastering Synthesis
- **Input:** Original audio + MIDI + tempo grid
- **Process:**
  1. Align MIDI to tempo grid
  2. Use MIDI to guide synthesis
  3. Use original audio as reference for timbre
  4. Generate clean, realistic performance
- **Tools:** RAVE, HeartMuLa, or similar neural audio synthesis models
- **Output:** High-fidelity audio aligned to grid

### Lyrics & Backing Vocals
- **Lyrics extraction:** Use speech-to-text or manual input
- **Alignment:** Map lyrics to MIDI timing (phrases per measure)
- **Vowel matching:** Ensure AI vocals match vowel sounds from lyrics
- **Generation:** Use text-to-speech or voice synthesis models with lyrics input

---

## UI Flow

1. **Upload screen:** Drag & drop all stems
2. **Analysis screen:** "Analyzing stems... Detecting instruments... Cross-referencing tempo/key..."
3. **Instrument assignment screen:** Show detected instruments, allow manual override
4. **MIDI generation screen:** "Generating MIDI... Adding articulations..."
5. **Remaster selection screen:** Checkboxes for each track
6. **Processing screen:** Progress bars per track
7. **Results screen:** Download MIDI + remastered audio files

---

## Future Enhancements

- **Generate matching parts:** After remastering, generate complementary parts that match style/tempo/key
- **Style transfer:** Apply different performance styles to remastered tracks
- **Real-time preview:** Preview remastered tracks before full generation

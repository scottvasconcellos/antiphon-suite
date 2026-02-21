# Drum Engine Pack — Install (Omnizart via Docker)

The **Advanced Drum Engine** uses [Omnizart](https://github.com/Music-and-Culture-Technology-Lab/omnizart) for high-accuracy drum transcription. Omnizart requires Python 3.8 and TensorFlow 2.5, which are not available on ARM macOS with current Python; we run it via **Docker** instead.

## 1. Install Docker

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and **start the Docker daemon** (Docker must be running).

## 2. Pull the Omnizart image (one time)

```bash
docker pull mctlab/omnizart:latest
```

## 3. Run the Advanced Drum Engine

**Option A — Node helper (tries Advanced, falls back to Basic if Docker is not running):**

```bash
cd apps/StemForgeMIDI
node scripts/run_drum_engine.mjs "/path/to/your/drums.wav" ".tmp-drum-test"
```

**Option B — Advanced only (Python):**

```bash
cd apps/StemForgeMIDI
echo '{"audioPath":"/full/path/to/drums.wav","outputDir":"/full/path/to/apps/StemForgeMIDI/.tmp-drum-test"}' | .venv/bin/python3 scripts/advanced_drum_engine.py
```

Output: four MIDI files in the given output dir: `*_drums_kick.mid`, `*_drums_snare.mid`, `*_drums_tops.mid`, `*_drums_perc.mid`.

## If Docker is not running

The pipeline and `run_drum_engine.mjs` fall back to the **Basic Drum Engine** (Librosa), so you still get four MIDI files.

## ARM Mac (Apple Silicon)

The official image `mctlab/omnizart:latest` is linux/amd64 and may fail or run slowly under emulation on ARM. If the Advanced engine fails, use the Basic Drum Engine (duration and tempo are aligned to the source audio).

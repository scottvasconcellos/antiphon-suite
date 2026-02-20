#!/usr/bin/env node
/**
 * STEM Forge app server: static UI + API for upload, process, export.
 * Run from project root: node app/server.mjs or pnpm run stem-forge:app
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { spawn } from "node:child_process";

const APP_DIR = join(import.meta.dirname ?? import.meta.path, ".");
const STEMFORGE_DIR = join(APP_DIR, ".."); // apps/stemforge
const REPO_ROOT = join(STEMFORGE_DIR, "..", ".."); // monorepo root
const UPLOAD_DIR = join(STEMFORGE_DIR, ".tmp-stem-forge-uploads");
const AUDIO_EXTS = new Set([".wav", ".aiff", ".aif", ".flac", ".ogg", ".m4a"]);
const BASE_PORT = Number(process.env.STEM_FORGE_PORT) || 5174;

function detectInstrumentFromPath(path) {
  const name = path.toLowerCase();
  if (name.includes("lead") || name.includes("solo")) return "electric-lead-guitar";
  if (name.includes("rhythm") || name.includes("chord")) return "electric-rhythm-guitar";
  if (name.includes("acoustic")) return "acoustic-guitar";
  if (name.includes("kick") || name.includes("kickdrum")) return "drums-kick";
  if (name.includes("snare")) return "drums-snare";
  if (name.includes("hat") || name.includes("cymbal") || name.includes("top")) return "drums-tops";
  if (name.includes("drum") || name.includes("beat")) return "drums-kick"; // Default drums
  if (name.includes("perc")) return "percussion";
  if (name.includes("piano")) return "piano";
  if (name.includes("key") || name.includes("synth")) return "keys-lead-synth";
  if (name.includes("vocal") || name.includes("voice") || name.includes("sing")) {
    return name.includes("back") || name.includes("harmony") ? "vocals-background" : "vocals-melody";
  }
  if (name.includes("bass")) return "bass";
  return "unknown";
}

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipart(buffer, boundary) {
  const parts = [];
  const b = buffer.toString("binary");
  const partsStr = b.split("--" + boundary);
  for (const part of partsStr) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const headers = part.slice(0, headerEnd);
    const body = part.slice(headerEnd + 4).replace(/\r\n$/, "");
    const nameMatch = headers.match(/name="([^"]+)"/);
    const fileMatch = headers.match(/filename="([^"]+)"/);
    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: fileMatch ? fileMatch[1] : null,
        body: Buffer.from(body, "binary"),
      });
    }
  }
  return parts;
}

async function start() {
  const server = createServer(async (req, res) => {
    const port = server.address()?.port ?? BASE_PORT;
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    const pathname = url.pathname;

    if (pathname === "/" || pathname === "/index.html") {
      const file = join(APP_DIR, "public", "index.html");
      if (!existsSync(file)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(readFileSync(file));
      return;
    }

    if (pathname === "/api/upload" && req.method === "POST") {
      ensureUploadDir();
      const raw = await parseBody(req);
      const contentType = req.headers["content-type"] || "";
      const boundary = contentType.split("boundary=")[1]?.trim()?.replace(/^["']|["';]\s*$/g, "") || "";
      if (!boundary) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing multipart boundary" }));
        return;
      }
      const parts = parseMultipart(raw, boundary);
      const paths = [];
      for (const part of parts) {
        if (!part.filename || !AUDIO_EXTS.has(extname(part.filename).toLowerCase())) continue;
        const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const outPath = join(UPLOAD_DIR, `${Date.now()}-${paths.length}-${safeName}`);
        writeFileSync(outPath, part.body);
        paths.push(outPath);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ paths }));
      return;
    }

    if (pathname === "/api/process" && req.method === "POST") {
      const raw = await parseBody(req);
      let body;
      try {
        body = JSON.parse(raw.toString());
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { paths = [], options = {} } = body;
      if (!Array.isArray(paths) || paths.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "paths must be a non-empty array" }));
        return;
      }
      const args = ["--stems", ...paths];
      if (options.clone) args.push("--clone");
      if (options.mir) args.push("--mir");
      if (options.router) args.push("--router");
      const scriptPath = join(STEMFORGE_DIR, "scripts", "run-stem-pipeline.mjs");
      const child = spawn("node", [scriptPath, ...args], {
        cwd: STEMFORGE_DIR,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (c) => { stdout += c; });
      child.stderr?.on("data", (c) => { stderr += c; });
      child.on("close", (code) => {
        try {
          const out = JSON.parse(stdout.trim());
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ...out, _stderr: stderr || undefined }));
        } catch {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Pipeline failed", stderr: stderr.slice(-500), code }));
        }
      });
      child.on("error", (err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
      return;
    }

    if (pathname === "/api/analyze" && req.method === "POST") {
      const raw = await parseBody(req);
      let body;
      try {
        body = JSON.parse(raw.toString());
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { paths = [] } = body;
      if (!Array.isArray(paths) || paths.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "paths must be a non-empty array" }));
        return;
      }
      // Run analysis: cross-reference tempo/key/time signature + instrument detection
      const scriptPath = join(STEMFORGE_DIR, "scripts", "run-stem-pipeline.mjs");
      const args = ["--stems", ...paths, "--router"]; // Use router for instrument detection
      const child = spawn("node", [scriptPath, ...args], {
        cwd: STEMFORGE_DIR,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (c) => { stdout += c; });
      child.stderr?.on("data", (c) => { stderr += c; });
      child.on("close", (code) => {
        try {
          const pipelineOut = JSON.parse(stdout.trim());
          // Extract analysis results: tempo, key, time signature, instruments
          // For now, return mock data structure - will be enhanced with actual analysis
          const analysis = {
            tempo: pipelineOut.tempo || 120, // TODO: detect from audio
            keySignature: pipelineOut.keySignature || "C:maj", // TODO: detect from audio
            timeSignature: pipelineOut.timeSignature || "4/4", // TODO: detect from audio
            instruments: paths.map((p, i) => ({
              path: p,
              name: p.split("/").pop(),
              instrument: pipelineOut.router?.[i]?.instrument || detectInstrumentFromPath(p), // Fallback to filename-based detection
            })),
          };
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(analysis));
        } catch {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Analysis failed", stderr: stderr.slice(-500), code }));
        }
      });
      child.on("error", (err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
      return;
    }

    if (pathname === "/api/generate-midi" && req.method === "POST") {
      const raw = await parseBody(req);
      let body;
      try {
        body = JSON.parse(raw.toString());
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { stems = [], advanced = false, options = {} } = body;
      if (!Array.isArray(stems) || stems.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "stems must be a non-empty array" }));
        return;
      }
      const scriptPath = join(STEMFORGE_DIR, "scripts", "run-stem-pipeline.mjs");
      const paths = stems.map(s => s.path || s);
      const args = ["--stems", ...paths];
      const child = spawn("node", [scriptPath, ...args], {
        cwd: STEMFORGE_DIR,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (c) => { stdout += c; });
      child.stderr?.on("data", (c) => { stderr += c; });
      child.on("close", (code) => {
        try {
          const pipelineOut = JSON.parse(stdout.trim());
          // Format MIDI results with track info
          const tracks = (pipelineOut.stems || []).map((s, i) => ({
            id: `track-${i}`,
            name: (s.path || "").split("/").pop(),
            instrument: stems[i]?.instrument || "unknown",
            midiPath: s.midiPath,
            advancedMidiPath: advanced ? s.midiPath : null, // TODO: generate advanced MIDI with articulations
          }));
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ tracks, midiFiles: tracks.map(t => t.midiPath).filter(Boolean) }));
        } catch {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "MIDI generation failed", stderr: stderr.slice(-500), code }));
        }
      });
      child.on("error", (err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
      return;
    }

    if (pathname === "/api/remaster" && req.method === "POST") {
      const raw = await parseBody(req);
      let body;
      try {
        body = JSON.parse(raw.toString());
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { tracks = [], tempo, keySignature, timeSignature } = body;
      if (!Array.isArray(tracks) || tracks.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "tracks must be a non-empty array" }));
        return;
      }
      // Run remastering: use MIDI + original audio + tempo grid
      const scriptPath = join(STEMFORGE_DIR, "scripts", "run-stem-pipeline.mjs");
      const paths = tracks.map(t => t.path || t.midiPath?.replace(/\.mid$/, ".wav") || "").filter(Boolean);
      const args = ["--stems", ...paths, "--clone"];
      if (tempo) args.push("--bpm", String(tempo));
      if (timeSignature) args.push("--time-sig", timeSignature);
      const child = spawn("node", [scriptPath, ...args], {
        cwd: STEMFORGE_DIR,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (c) => { stdout += c; });
      child.stderr?.on("data", (c) => { stderr += c; });
      child.on("close", (code) => {
        try {
          const pipelineOut = JSON.parse(stdout.trim());
          const remasteredFiles = (pipelineOut.stems || []).map((s, i) => ({
            name: (s.path || "").split("/").pop(),
            instrument: tracks[i]?.instrument || "unknown",
            path: s.clonePath,
          })).filter(f => f.path);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ remasteredFiles }));
        } catch {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Remastering failed", stderr: stderr.slice(-500), code }));
        }
      });
      child.on("error", (err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
      return;
    }

    if (pathname === "/api/file" && req.method === "GET") {
      const filePath = url.searchParams.get("path");
      if (!filePath) {
        res.writeHead(400);
        res.end("Missing path");
        return;
      }
      const abs = filePath.startsWith("/") ? filePath : join(REPO_ROOT, filePath);
      const normalized = resolve(abs);
      const repoNormalized = resolve(REPO_ROOT);
      if (!normalized.startsWith(repoNormalized)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      if (!existsSync(normalized)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const name = normalized.split("/").pop();
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${name}"`,
      });
      res.end(readFileSync(normalized));
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  for (let p = BASE_PORT; p < BASE_PORT + 20; p++) {
    try {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(p, () => {
          server.removeListener("error", reject);
          resolve();
        });
      });
      console.log(`STEM Forge app: http://localhost:${p}`);
      return;
    } catch (err) {
      if (err.code !== "EADDRINUSE") throw err;
    }
  }
  throw new Error("No port available (tried " + BASE_PORT + "–" + (BASE_PORT + 19) + ")");
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 4311
  },
  build: {
    rollupOptions: {
      // Node-only artifact fetch/install are dynamically imported only when !isBrowser.
      // Keep them out of the client bundle so Vite doesn't try to bundle node:fs/node:path.
      external: (id) =>
        id.includes("artifactFetcher") ||
        id.includes("diskArtifactInstaller")
    }
  }
});

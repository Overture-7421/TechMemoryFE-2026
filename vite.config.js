import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages project site: served from https://<user>.github.io/<repo>/,
  // so assets need this prefix. Must match the actual repo name
  // (Overture-7421/TechMemoryFE-2026) — update if the repo is renamed.
  base: "/TechMemoryFE-2026/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});

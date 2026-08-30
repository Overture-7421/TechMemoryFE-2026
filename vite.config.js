import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages project site: served from https://<user>.github.io/<repo>/,
  // so assets need this prefix. Change "techmemory" if the repo is renamed.
  base: "/techmemory/",
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

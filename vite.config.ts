import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ["stockfish"],
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer (used by multi-threaded Stockfish)
      // Not needed for single-threaded version but good to have for future
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});

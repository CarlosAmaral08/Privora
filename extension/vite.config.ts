import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "chrome114",
    rollupOptions: {
      input: {
        popup: "index.html",
        "service-worker": "src/background/serviceWorker.ts",
      },
      output: {
        entryFileNames: (chunk) => chunk.name === "service-worker" ? "service-worker.js" : "assets/[name]-[hash].js",
      },
    },
  },
});

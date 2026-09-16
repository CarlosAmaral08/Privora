import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "VITE_");
  const apiBaseUrl = environment.VITE_PRIVORA_API_BASE_URL;
  if (!apiBaseUrl && mode !== "test") {
    throw new Error(`VITE_PRIVORA_API_BASE_URL não definida para o modo ${mode}.`);
  }

  return {
    base: "./",
    plugins: apiBaseUrl ? [configureBackendHostPermission(apiBaseUrl)] : [],
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
  };
});

function configureBackendHostPermission(apiBaseUrl: string): Plugin {
  const backendOriginPattern = backendHostPattern(apiBaseUrl);
  return {
    name: "privora-backend-host-permission",
    async writeBundle(options) {
      const outputDirectory = typeof options.dir === "string" ? options.dir : "dist";
      const manifestPath = resolve(outputDirectory, "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
      manifest.host_permissions = [backendOriginPattern];
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    },
  };
}

function backendHostPattern(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("VITE_PRIVORA_API_BASE_URL deve usar HTTP ou HTTPS.");
  }
  return `${url.origin}/*`;
}

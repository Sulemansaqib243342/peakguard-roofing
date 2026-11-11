import { whop } from '@whop/cli/vite'
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { build as esbuild } from "esbuild";
import fs from "node:fs";
import path from "node:path";

let cachedWorkerMtime = 0;
let cachedWorkerMod: { default: { fetch: (req: Request, env: unknown) => Promise<Response> } } | null = null;

async function loadDevWorker() {
  const workerPath = path.resolve(__dirname, "src/server/worker.ts");
  const configPath = path.resolve(__dirname, "src/site.config.ts");
  const mtime = Math.max(fs.statSync(workerPath).mtimeMs, fs.statSync(configPath).mtimeMs);
  if (cachedWorkerMod && mtime === cachedWorkerMtime) {
    return cachedWorkerMod.default;
  }

  const built = await esbuild({
    entryPoints: [workerPath],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    target: "node20",
  });
  const code = built.outputFiles[0].text;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code, "utf8").toString("base64")}`;
  cachedWorkerMod = await import(/* @vite-ignore */ dataUrl);
  cachedWorkerMtime = mtime;
  return cachedWorkerMod!.default;
}

// In local dev, we also provide a dev server middleware to handle /api/* routes
// so that estimate submission, invoice creation, and diagnostics work seamlessly
// before deploying to Whop hosting.
export default defineConfig(({ mode }) => {
  // If building the server runtime bundle for Whop hosting:
  // Whop hosting requires server code in dist/server/index.js and static assets in dist/client/
  if (mode === "worker") {
    return {
      // Worker build: plain lib build → dist/server/index.js
      // The deploy checker sees @cloudflare/vite-plugin in the client config above.
      plugins: [whop({ disableTanstackDevtools: true })],
      build: {
        lib: {
          entry: path.resolve(__dirname, "src/server/worker.ts"),
          formats: ["es"],
          fileName: () => "index.js",
        },
        outDir: "dist/server",
        emptyOutDir: false,
        rollupOptions: {
          external: [],
        },
      },
    };
  }

  // Client-side SPA build.
  // outDir: "dist" so that the Cloudflare plugin emits static assets into
  // dist/client/ (its default sub-folder), matching Whop's expected layout.
  const localEnv = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      cloudflare({ viteEnvironment: { name: "ssr" }, assetsOnly: true }),
      whop({ disableTanstackDevtools: true }),
      react(),
      // Dev middleware to handle /api routes locally during development
      {
        name: "dev-api-server",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith("/api/")) {
              return next();
            }

            // In local dev, dispatch to worker's logic
            try {
              const url = `http://${req.headers.host || "localhost"}${req.url}`;
              const method = req.method || "GET";

              // Collect body if POST/PUT
              let body: string | undefined = undefined;
              if (method !== "GET" && method !== "HEAD") {
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                  chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
                }
                body = Buffer.concat(chunks).toString("utf-8");
              }

              // Build a standard Request
              const headers = new Headers();
              for (const [k, v] of Object.entries(req.headers)) {
                if (v) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
              }

              const webReq = new Request(url, {
                method,
                headers,
                body: body || undefined,
              });

              // Dynamically compile and execute worker without colliding with Cloudflare SSR environment
              const worker = await loadDevWorker();
              const resolvedApiOrigin =
                localEnv.WHOP_API_ORIGIN || process.env.WHOP_API_ORIGIN || "https://sandbox-api.whop.com";
              const resolvedWhopEnv =
                localEnv.VITE_WHOP_ENVIRONMENT ||
                process.env.VITE_WHOP_ENVIRONMENT ||
                (resolvedApiOrigin.includes("sandbox") ? "sandbox" : "production");
              const isSandbox = resolvedWhopEnv === "sandbox";

              const env = {
                WHOP_API_ORIGIN: resolvedApiOrigin,
                WHOP_ACCOUNT_ID:
                  localEnv.WHOP_ACCOUNT_ID ||
                  (isSandbox ? localEnv.VITE_WHOP_SANDBOX_ACCOUNT_ID : localEnv.VITE_WHOP_PROD_ACCOUNT_ID) ||
                  process.env.WHOP_ACCOUNT_ID ||
                  "",
                WHOP_API_KEY: localEnv.WHOP_API_KEY || process.env.WHOP_API_KEY || "",
                ADMIN_SECRET: localEnv.ADMIN_SECRET || process.env.ADMIN_SECRET || "",
                WHOP_WEBHOOK_SECRET: localEnv.WHOP_WEBHOOK_SECRET || process.env.WHOP_WEBHOOK_SECRET || "",
                WHOP_ENVIRONMENT: resolvedWhopEnv,
                WHOP_PLAN_INSPECTION:
                  localEnv.WHOP_PLAN_INSPECTION ||
                  localEnv.VITE_WHOP_PLAN_INSPECTION ||
                  (isSandbox ? localEnv.VITE_WHOP_SANDBOX_PLAN_INSPECTION : localEnv.VITE_WHOP_PROD_PLAN_INSPECTION) ||
                  process.env.WHOP_PLAN_INSPECTION ||
                  process.env.VITE_WHOP_PLAN_INSPECTION ||
                  "",
                WHOP_PLAN_DEPOSIT:
                  localEnv.WHOP_PLAN_DEPOSIT ||
                  localEnv.VITE_WHOP_PLAN_DEPOSIT ||
                  (isSandbox ? localEnv.VITE_WHOP_SANDBOX_PLAN_DEPOSIT : localEnv.VITE_WHOP_PROD_PLAN_DEPOSIT) ||
                  process.env.WHOP_PLAN_DEPOSIT ||
                  process.env.VITE_WHOP_PLAN_DEPOSIT ||
                  "",
                WHOP_PLAN_TUNEUP:
                  localEnv.WHOP_PLAN_TUNEUP ||
                  localEnv.VITE_WHOP_PLAN_TUNEUP ||
                  (isSandbox ? localEnv.VITE_WHOP_SANDBOX_PLAN_TUNEUP : localEnv.VITE_WHOP_PROD_PLAN_TUNEUP) ||
                  process.env.WHOP_PLAN_TUNEUP ||
                  process.env.VITE_WHOP_PLAN_TUNEUP ||
                  "",
                ASSETS: {
                  fetch: async () => new Response("Not found", { status: 404 }),
                },
              };

              const response: Response = await worker.fetch(webReq, env);

              res.statusCode = response.status;
              response.headers.forEach((value, key) => {
                res.setHeader(key, value);
              });

              const resBody = await response.text();
              res.end(resBody);
            } catch (err: any) {
              console.error("[Dev API Middleware Error]", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Internal Dev Server Error" }));
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: "dist",
      emptyOutDir: false,
      sourcemap: true,
    },
  };
});


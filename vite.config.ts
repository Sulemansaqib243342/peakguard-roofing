import { whop } from '@whop/cli/vite'
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

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

              // Dynamically import worker and execute
              const { default: worker } = await server.ssrLoadModule("/src/server/worker.ts");
              const env = {
                WHOP_API_ORIGIN: process.env.WHOP_API_ORIGIN || localEnv.WHOP_API_ORIGIN || "https://sandbox-api.whop.com",
                WHOP_ACCOUNT_ID: process.env.WHOP_ACCOUNT_ID || localEnv.WHOP_ACCOUNT_ID || "",
                WHOP_API_KEY: process.env.WHOP_API_KEY || localEnv.WHOP_API_KEY || "",
                ADMIN_SECRET: process.env.ADMIN_SECRET || localEnv.ADMIN_SECRET || "",
                WHOP_WEBHOOK_SECRET: process.env.WHOP_WEBHOOK_SECRET || localEnv.WHOP_WEBHOOK_SECRET || "",
                WHOP_ENVIRONMENT: process.env.VITE_WHOP_ENVIRONMENT || localEnv.VITE_WHOP_ENVIRONMENT || "",
                WHOP_PLAN_INSPECTION: process.env.VITE_WHOP_PLAN_INSPECTION || localEnv.VITE_WHOP_PLAN_INSPECTION || "",
                WHOP_PLAN_DEPOSIT: process.env.VITE_WHOP_PLAN_DEPOSIT || localEnv.VITE_WHOP_PLAN_DEPOSIT || "",
                WHOP_PLAN_TUNEUP: process.env.VITE_WHOP_PLAN_TUNEUP || localEnv.VITE_WHOP_PLAN_TUNEUP || "",
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


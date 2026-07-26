import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = "http://127.0.0.1:8000";

// Log incoming requests for observability
app.use((req, _res, next) => {
  console.log(`[Proxy Server] ${req.method} ${req.url}`);
  next();
});

// Proxy /api/* requests to the Python FastAPI backend
app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    onError: (err, _req, res) => {
      console.error("[Proxy Error] Unable to connect to Python backend:", err.message);
      res.status(502).json({
        error: "Bad Gateway",
        message: "The Python backend (FastAPI) is currently offline or unreachable. Please start the backend service on port 8000.",
      });
    },
  })
);

// Serve frontend with Vite middleware in development or static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Middleware
    console.log("[Proxy Server] Starting in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "apps/frontend"),
    });
    app.use(vite.middlewares);
  } else {
    // Production mode serving static compiled assets
    console.log("[Proxy Server] Starting in PRODUCTION mode serving static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=============================================================`);
    console.log(` PMOPilot Hybrid Server listening on:`);
    console.log(`   - Frontend Interface: http://localhost:${PORT}`);
    console.log(`   - Proxied API Base:   http://localhost:${PORT}/api`);
    console.log(`   - Backend Python Target: ${BACKEND_URL}`);
    console.log(`=============================================================`);
  });
}

startServer();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 8000;

// Configurar proxy para redirigir peticiones /api/* al backend FastAPI
app.use("/api", createProxyMiddleware({
  target: `http://localhost:${BACKEND_PORT}`,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'  // Mantener el prefijo /api
  },
  onProxyReq: (proxyReq, req, res) => {
    // Inyectar headers de rol para RBAC (en desarrollo)
    // En producción, esto vendría de autenticación real
    if (!req.headers['x-user-role']) {
      proxyReq.setHeader('X-User-Role', 'leader');  // Default to leader for development
    }
    
    // Log de peticiones proxy para debugging
    console.log(`[Proxy] ${req.method} ${req.url} -> Backend:${BACKEND_PORT}`);
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    
    // Si el backend no está disponible, proporcionar respuestas mock
    if (req.url?.startsWith('/api/health')) {
      res.json({ 
        status: "backend_unavailable", 
        message: "Backend FastAPI no disponible",
        frontend_only: true 
      });
    } else {
      res.status(503).json({ 
        error: "Backend service unavailable",
        detail: "El backend FastAPI no está ejecutándose",
        suggestion: "Ejecuta 'npm run dev:backend' en otra terminal"
      });
    }
  }
}));

// ----------------------------------------------------
// VITE INTEGRATION / STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 PMOPilot Frontend Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Local Development URL: http://localhost:${PORT}`);
    console.log(`⚙️  Backend Proxy: http://localhost:${PORT}/api -> http://localhost:${BACKEND_PORT}/api`);
    console.log(`🔧 Para iniciar el backend: npm run dev:backend`);
    console.log(`👑 RBAC: Usando rol 'leader' por defecto (cambia con header X-User-Role)`);
  });
}

startServer();
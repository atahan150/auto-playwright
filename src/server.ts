import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { autoHandler } from "./api/auto-handler";
import { healthHandler } from "./api/health-handler";

const app = new Hono();

// Simple CORS middleware for Python client
app.use("/*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (c.req.method === "OPTIONS") {
    return c.text("", 200);
  }
  
  await next();
  return;
});

// Health check endpoint
app.get("/health", healthHandler);

// Main auto endpoint
app.post("/auto", autoHandler);

// Error handling
app.onError((err, c) => {
  console.error("Server error:", err.message);
  return c.json({ error: err.message }, 500);
});

// Start server
const startServer = (port: number = 3001) => {
  return new Promise((resolve) => {
    const server = serve(
      {
        fetch: app.fetch,
        port,
      },
      (info) => {
        console.log(`Auto Playwright API server running on port ${info.port}`);
        resolve({
          close: () => server.close(),
          port: info.port,
        });
      },
    );
  });
};

export { startServer, app }; 
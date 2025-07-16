import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { AIManager } from "./ai-manager";

const app = new Hono();

// CORS middleware
app.use("/*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }
  await next();
});

// Health check
app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    service: "auto-playwright-api",
    timestamp: new Date().toISOString()
  });
});

// Main auto endpoint
app.post("/auto", async (c) => {
  try {
    const body = await c.req.json();
    const { task, snapshot, options = {} } = body;

    if (!task || !snapshot) {
      return c.json({ success: false, error: "Task and snapshot are required" }, 400);
    }

    const selectedProvider = options.provider || "gemini";
    let apiKey;
    
    if (selectedProvider === "gemini") {
      apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return c.json({ success: false, error: "Gemini API key is required." }, 400);
      }
    } else {
        return c.json({ success: false, error: `Provider '${selectedProvider}' is not supported in this server configuration.` }, 400);
    }

    const model = options.model || "gemini-1.5-flash";
    
    const aiManager = new AIManager({
      provider: "gemini",
      model,
      apiKey,
      debug: options.debug || false
    });

    const result = await aiManager.completeTask({ task, snapshot, options });

    return c.json({ success: true, result });

  } catch (error) {
    console.error("Auto handler error:", error);
    return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

// Start server
const port = 3002;
serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Auto Playwright API server running on port ${info.port}`);
  },
);
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

// CORS middleware
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

// Health check
app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    service: "auto-playwright-api",
    timestamp: new Date().toISOString()
  });
});

// Main auto endpoint with real OpenAI integration
app.post("/auto", async (c) => {
  try {
    const body = await c.req.json();
    const { task, snapshot, options = {} } = body;

    if (!task || !snapshot) {
      return c.json({
        success: false,
        error: "Task and snapshot are required"
      }, 400);
    }

    // Provider ve API key kontrolü
    const selectedProvider = options.provider || "gemini";
    let apiKey;
    
    if (selectedProvider === "openai") {
      apiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return c.json({
          success: false,
          error: "OpenAI API key gerekli. Environment variable OPENAI_API_KEY ayarlayın veya options.openaiApiKey gönderin."
        }, 400);
      }
    } else if (selectedProvider === "gemini") {
      apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return c.json({
          success: false,
          error: "Gemini API key gerekli. Environment variable GEMINI_API_KEY ayarlayın veya options.geminiApiKey gönderin."
        }, 400);
      }
    } else {
      return c.json({
        success: false,
        error: `Desteklenmeyen provider: ${selectedProvider}. 'openai' veya 'gemini' kullanın.`
      }, 400);
    }

    // AI Manager ile provider seçimi
    const { AIManager } = await import("./ai-manager");
    
    // Model belirleme
    const model = options.model || (selectedProvider === "gemini" ? "gemini-1.5-flash" : "gpt-4o");
    
    const aiManager = new AIManager({
      provider: selectedProvider as "openai" | "gemini",
      model,
      apiKey,
      debug: options.debug || false
    });

    const result = await aiManager.completeTask({
      task,
      snapshot,
      options
    });

    return c.json({
      success: true,
      result
    });

  } catch (error) {
    console.error("Auto handler error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Start server
const startServer = (port: number = 3002) => {
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

export { startServer };

// Direct run if called as main module
if (require.main === module) {
  startServer();
} 
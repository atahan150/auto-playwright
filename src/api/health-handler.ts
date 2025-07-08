import { Context } from "hono";

export const healthHandler = async (c: Context) => {
  return c.json({ 
    status: "ok", 
    service: "auto-playwright-api",
    timestamp: new Date().toISOString()
  });
}; 
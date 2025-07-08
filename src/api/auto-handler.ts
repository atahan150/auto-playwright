import { Context } from "hono";
import { z } from "zod";
import { completeHttpTask } from "../http-task-handler";

const requestSchema = z.object({
  task: z.string().min(1).max(1000),
  snapshot: z.object({
    dom: z.string(),
    url: z.string().optional(),
  }),
  options: z.object({
    model: z.string().optional(),
    debug: z.boolean().optional(),
    openaiApiKey: z.string().optional(),
    openaiBaseUrl: z.string().optional(),
    openaiDefaultQuery: z.object({}).optional(),
    openaiDefaultHeaders: z.object({}).optional(),
  }).optional(),
});

export const autoHandler = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { task, snapshot, options } = requestSchema.parse(body);

    // Execute auto task using HTTP-specific handler
    const result = await completeHttpTask({
      task,
      snapshot,
      options,
    });

    return c.json({
      success: true,
      result,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: "Invalid request format",
        details: error.errors,
      }, 400);
    }

    console.error("Auto handler error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
}; 
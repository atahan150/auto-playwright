import { RunnableFunctionWithParse } from "openai/lib/RunnableFunction";
import { z } from "zod";

/**
 * Creates actions for HTTP API mode - returns action instructions instead of executing them
 */
export const createHttpActions = (): Record<string, RunnableFunctionWithParse<any>> => {
  return {
    result_success: {
      function: async (args: { actions: any[] }) => {
        return { actions: args.actions };
      },
      name: "result_success",
      description: "Returns the actions to be performed by the Python client",
      parse: (args: string) => {
        return z.object({
          actions: z.array(z.object({
            type: z.string(),
            selector: z.string().optional(),
            value: z.string().optional(),
            key: z.string().optional(),
          })),
        }).parse(JSON.parse(args));
      },
      parameters: {
        type: "object",
        properties: {
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", description: "Action type: click, type, press, scroll, etc." },
                selector: { type: "string", description: "CSS selector for the element" },
                value: { type: "string", description: "Value to type or other parameters" },
                key: { type: "string", description: "Key to press" },
              },
            },
          },
        },
      },
    },

    result_error: {
      function: async (args: { errorMessage: string }) => {
        return { errorMessage: args.errorMessage };
      },
      name: "result_error",
      description: "Called when the task cannot be completed",
      parse: (args: string) => {
        return z.object({
          errorMessage: z.string(),
        }).parse(JSON.parse(args));
      },
      parameters: {
        type: "object",
        properties: {
          errorMessage: { type: "string" },
        },
      },
    },

    result_query: {
      function: async (args: { query: string }) => {
        return { query: args.query };
      },
      name: "result_query", 
      description: "Returns information extracted from the page",
      parse: (args: string) => {
        return z.object({
          query: z.string(),
        }).parse(JSON.parse(args));
      },
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
      },
    },
  };
}; 
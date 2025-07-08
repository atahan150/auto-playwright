import OpenAI from "openai";
import { TaskMessage, TaskResult } from "./types";
import { prompt, SYSTEM_PROMPT } from "./prompt";

const defaultDebug = process.env.AUTO_PLAYWRIGHT_DEBUG === "true";

export const completeHttpTask = async (
  task: TaskMessage,
): Promise<TaskResult> => {
  const openai = new OpenAI({
    apiKey: task.options?.openaiApiKey,
    baseURL: task.options?.openaiBaseUrl,
    defaultQuery: task.options?.openaiDefaultQuery,
    defaultHeaders: task.options?.openaiDefaultHeaders,
  });

  const debug = task.options?.debug ?? defaultDebug;

  try {
    const completion = await openai.chat.completions.create({
      model: task.options?.model ?? "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + "\n\nReturn JSON response with either: {\"actions\": [...]} for actions, {\"query\": \"...\"} for queries, or {\"errorMessage\": \"...\"} for errors."
        },
        { 
          role: "user", 
          content: prompt(task) + "\n\nReturn only valid JSON format."
        },
      ],
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    
    if (debug) {
      console.log("> AI Response:", content);
    }

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // JSON response parse et
    try {
      const result = JSON.parse(content);
      return result;
    } catch (parseError) {
      // JSON parse edilemezse, content'i query olarak döndür
      return {
        query: content
      };
    }

  } catch (error) {
    if (debug) {
      console.error("> OpenAI Error:", error);
    }
    
    return {
      errorMessage: error instanceof Error ? error.message : "OpenAI API hatası"
    };
  }
}; 
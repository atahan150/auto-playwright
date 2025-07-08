import OpenAI from "openai";
import { TaskMessage, TaskResult } from "../types";
import { prompt, SYSTEM_PROMPT } from "../prompt";

export class OpenAIProvider {
  private openai: OpenAI;
  private modelName: string;
  private debug: boolean;

  constructor(apiKey: string, modelName: string = "gpt-4o", debug: boolean = false) {
    this.openai = new OpenAI({ apiKey });
    this.modelName = modelName;
    this.debug = debug;
  }

  async completeTask(task: TaskMessage): Promise<TaskResult> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.modelName,
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
      
      if (this.debug) {
        console.log("> OpenAI Response:", content);
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
      if (this.debug) {
        console.error("> OpenAI Error:", error);
      }
      
      return {
        errorMessage: error instanceof Error ? error.message : "OpenAI API hatası"
      };
    }
  }

  // Model listesi alma
  static getAvailableModels(): string[] {
    return [
      "gpt-4o",
      "gpt-4o-mini", 
      "gpt-4-turbo",
      "gpt-3.5-turbo"
    ];
  }

  // Model bilgisi alma
  getModelInfo(): { name: string; provider: string } {
    return {
      name: this.modelName,
      provider: "OpenAI"
    };
  }
} 
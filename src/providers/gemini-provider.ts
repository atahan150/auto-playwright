import { GoogleGenerativeAI, ChatSession, EnhancedGenerateContentResponse, UsageMetadata } from "@google/generative-ai";
import { TaskMessage, TaskResult } from "../types";
import { prompt, SYSTEM_PROMPT } from "../prompt";

export class GeminiProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private debug: boolean;

  constructor(apiKey: string, modelName: string = "gemini-1.5-flash", debug: boolean = false) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
    this.debug = debug;
  }

  async completeTask(task: TaskMessage): Promise<TaskResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      const geminiSystemPrompt = `You are an expert web automation assistant.
Your goal is to analyze the provided DOM snapshot and user task, then return a single, valid JSON object describing the necessary actions or query result.

**RESPONSE FORMAT**
You must respond in JSON format only. The JSON object must have ONE of the following top-level keys:
- "actions": An array of action objects to perform in sequence.
- "query": A string containing the result of an information extraction task.
- "errorMessage": A string describing why the task cannot be completed.

**AVAILABLE ACTIONS & RULES**
1.  **Action Types:** Your primary actions are "click", "fill", and "press".
    - To click elements: {"type": "click", "selector": "...", "description": "..."}
    - To type text: {"type": "fill", "selector": "...", "value": "...", "description": "..."}
    - To press a keyboard key: {"type": "press", "key": "Enter", "description": "..."}
2.  **Selector Specificity is Crucial:** Always generate the most specific and unique CSS selector possible. Do not use generic tags like 'h1' or 'div' alone. Combine them with attributes (id, class, name, aria-label, placeholder, etc.) or structural relationships (e.g., 'form > button') to ensure they are unique.
3.  **Handling Text on Page:** To find an element by its visible text, use the \`:has-text()\` pseudo-class in your selector. For example, for a button like "<button>Accept All</button>", the best selector is \`"button:has-text('Accept All')"\`
4.  **Multi-Step Tasks:** If a task requires multiple steps (e.g., "click a field, then type in it"), return all steps in a single "actions" array in the correct order.
5.  **Conditional Actions:** For tasks like "accept cookies if the banner exists", first check for the element. If it exists, add the click action. If it does not exist, return an empty "actions" array: \`{"actions": []}\`.
6.  **JSON ONLY:** You MUST NOT add any text, comments, or markdown like \`\`\`json outside of the final JSON object. Your entire response must be the JSON object itself.
`;

      const userPrompt = prompt(task);
      const fullPrompt = `${geminiSystemPrompt}\n\n# User Task\n${userPrompt}`;

      if (this.debug) {
        console.log(">>> Sending New Request to Gemini...");
      }

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      if (this.debug) {
        console.log("\n<<< Raw Gemini Response:\n", text);
        const usage = response.usageMetadata;
        if (usage) {
            console.log(`\n--- Token Usage: Prompt: ${usage.promptTokenCount}, Candidates: ${usage.candidatesTokenCount}, Total: ${usage.totalTokenCount} ---\n`);
        }
      }

      try {
        const cleanedText = text.trim().replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
        const parsedResult = JSON.parse(cleanedText);
        return parsedResult;
      } catch (parseError) {
        console.error("JSON Parse Error. Raw text was:", text);
        return {
          errorMessage: `Failed to parse AI response as JSON. Raw response: ${text}`
        };
      }

    } catch (error) {
      if (this.debug) {
        console.error(">>> Gemini API Error:", error);
      }

      return {
        errorMessage: error instanceof Error ? error.message : "Gemini API error"
      };
    }
  }

  static getAvailableModels(): string[] {
    return [
      "gemini-1.5-pro",
      "gemini-1.5-flash", 
      "gemini-pro"
    ];
  }

  getModelInfo(): { name: string; provider: string } {
    return {
      name: this.modelName,
      provider: "Gemini"
    };
  }
}
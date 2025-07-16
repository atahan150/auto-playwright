import { TaskMessage, TaskResult } from "./types";
import { GeminiProvider } from "./providers/gemini-provider";

export type AIProvider = "gemini";

interface ProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  debug?: boolean;
}

export class AIManager {
  private provider: GeminiProvider;

  constructor(config: ProviderConfig) {
    switch (config.provider) {

      case "gemini":
        this.provider = new GeminiProvider(config.apiKey, config.model, config.debug);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  async completeTask(taskMessage: TaskMessage): Promise<TaskResult> {
    return await this.provider.completeTask(taskMessage);
  }
}

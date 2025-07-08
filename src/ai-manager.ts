import { TaskMessage, TaskResult } from "./types";
import { OpenAIProvider } from "./providers/openai-provider";
import { GeminiProvider } from "./providers/gemini-provider";
const aiModelsConfig = require("./config/ai-models.json");

export type AIProvider = "openai" | "gemini";

interface ProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  debug?: boolean;
}

export class AIManager {
  private provider: OpenAIProvider | GeminiProvider;

  constructor(config: ProviderConfig) {
    
    switch (config.provider) {
      case "openai":
        this.provider = new OpenAIProvider(config.apiKey, config.model, config.debug);
        break;
      case "gemini":
        this.provider = new GeminiProvider(config.apiKey, config.model, config.debug);
        break;
      default:
        throw new Error(`Desteklenmeyen AI provider: ${config.provider}`);
    }
  }

  async completeTask(task: TaskMessage): Promise<TaskResult> {
    return await this.provider.completeTask(task);
  }

  getProviderInfo(): { provider: string; model: string } {
    const info = this.provider.getModelInfo();
    return {
      provider: info.provider,
      model: info.name
    };
  }

  // Statik metodlar
  static getAvailableProviders(): AIProvider[] {
    return ["openai", "gemini"];
  }

  static getAvailableModels(provider: AIProvider): string[] {
    switch (provider) {
      case "openai":
        return OpenAIProvider.getAvailableModels();
      case "gemini":
        return GeminiProvider.getAvailableModels();
      default:
        return [];
    }
  }

  static getDefaultConfig(): { provider: AIProvider; model: string } {
    return {
      provider: aiModelsConfig.defaultProvider as AIProvider,
      model: aiModelsConfig.defaultModel
    };
  }

  static getModelInfo(provider: AIProvider, model: string) {
    const providerConfig = aiModelsConfig.providers[provider];
    if (!providerConfig) return null;
    
    const modelConfig = providerConfig.models[model];
    return modelConfig || null;
  }

  // API key kontrolü
  static validateConfig(config: ProviderConfig): string[] {
    const errors: string[] = [];

    if (!config.apiKey) {
      errors.push(`${config.provider.toUpperCase()} API key gerekli`);
    }

    if (!this.getAvailableProviders().includes(config.provider)) {
      errors.push(`Desteklenmeyen provider: ${config.provider}`);
    }

    if (!this.getAvailableModels(config.provider).includes(config.model)) {
      errors.push(`${config.provider} için desteklenmeyen model: ${config.model}`);
    }

    return errors;
  }
} 
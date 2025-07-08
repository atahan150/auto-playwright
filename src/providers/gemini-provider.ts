import { GoogleGenerativeAI } from "@google/generative-ai";
import { TaskMessage, TaskResult } from "../types";
import { prompt } from "../prompt";

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

      // Gemini için sistem promptu ve user promptu birleştiriyoruz
      const systemPrompt = `Sen bir web otomasyon asistanısın. Verilen DOM içeriğine bakarak kullanıcının talebini analiz et ve uygun aksiyonları öner.

JSON formatında yanıt ver:
- Aksiyonlar için: {"actions": [{"type": "click", "selector": "...", "description": "..."}]}
- Bilgi sorguları için: {"query": "sonuç metni"}
- Hatalar için: {"errorMessage": "hata açıklaması"}

Sadece geçerli JSON formatında yanıt ver, başka metin ekleme.`;

      const userPrompt = prompt(task);
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      if (this.debug) {
        console.log("> Gemini Request:", {
          model: this.modelName,
          prompt: fullPrompt.substring(0, 200) + "..."
        });
      }

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      if (this.debug) {
        console.log("> Gemini Response:", text);
      }

      // JSON parse et
      try {
        const parsedResult = JSON.parse(text.trim());
        return parsedResult;
      } catch (parseError) {
        // JSON parse edilemezse text'i query olarak döndür
        return {
          query: text.trim()
        };
      }

    } catch (error) {
      if (this.debug) {
        console.error("> Gemini Error:", error);
      }

      return {
        errorMessage: error instanceof Error ? error.message : "Gemini API hatası"
      };
    }
  }

  // Model listesi alma
  static getAvailableModels(): string[] {
    return [
      "gemini-1.5-pro",
      "gemini-1.5-flash", 
      "gemini-pro",
      "gemini-pro-vision"
    ];
  }

  // Model bilgisi alma
  getModelInfo(): { name: string; provider: string } {
    return {
      name: this.modelName,
      provider: "Gemini"
    };
  }
} 
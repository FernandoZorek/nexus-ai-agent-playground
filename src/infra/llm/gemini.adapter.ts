import { GoogleGenerativeAI } from "@google/generative-ai";
import { ILLMProvider, ToolDeclaration, LLMResponse } from "../../core/providers/llm.provider";
import { TelemetryService } from "../../shared/telemetry/telemetry.service";

export class GeminiAdapter implements ILLMProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateResponse(prompt: string, systemInstruction: string, tools: ToolDeclaration[]): Promise<LLMResponse> {
    const startTime = performance.now();
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      systemInstruction 
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: tools.length > 0 ? [{ functionDeclarations: tools as any }] : [],
    });

    const response = result.response;
    const duration = Math.round(performance.now() - startTime);

    if (response.usageMetadata) {
      TelemetryService.log({
        model: this.modelName,
        tokens: response.usageMetadata.totalTokenCount,
        duration: duration,
        action: tools.length > 0 ? "Function Calling / Reasoning" : "Final Response"
      });
    }

    const part = response.candidates?.[0].content.parts[0];

    if (part?.functionCall) {
      console.log("[GEMINI ADAPTER] Function Call Detected:", part.functionCall.name);
      return {
        toolCalls: [{
          name: part.functionCall.name,
          args: part.functionCall.args
        }]
      };
    }

    return { text: response.text() };
  }
}
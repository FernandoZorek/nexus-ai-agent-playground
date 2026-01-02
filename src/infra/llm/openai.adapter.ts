import OpenAI from "openai";
import { ILLMProvider, ToolDeclaration, LLMResponse } from "../../core/providers/llm.provider.js";

export class OpenAIAdapter implements ILLMProvider {
  private openai: OpenAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string) {
    this.openai = new OpenAI({ apiKey });
    this.modelName = modelName;
  }

  async generateResponse(prompt: string, systemInstruction: string, tools: ToolDeclaration[]): Promise<LLMResponse> {
    const formattedTools = tools.map(t => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));

    const response = await this.openai.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      tools: formattedTools as any,
    });

    const message = response.choices[0].message;

    if (message.tool_calls) {
      return {
        toolCalls: message.tool_calls.map(tc => ({
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments)
        }))
      };
    }

    return { text: message.content || "" };
  }
}
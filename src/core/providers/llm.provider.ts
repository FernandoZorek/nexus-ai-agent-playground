export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface LLMResponse {
  text?: string;
  toolCalls?: {
    name: string;
    args: any;
  }[];
}

export interface ILLMProvider {
  generateResponse(
    prompt: string, 
    systemInstruction: string, 
    tools: ToolDeclaration[]
  ): Promise<LLMResponse>;
}
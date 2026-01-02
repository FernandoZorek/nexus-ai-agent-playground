import { ILLMProvider } from "../providers/llm.provider.js";
import { HISTORY_SUMMARIZER_PROMPT } from "../../infra/llm/prompts/index.js";
import { ChatMessage } from "./memory-store.js";

export class SummarizerService {
  constructor(private llm: ILLMProvider) {}

  async summarize(history: ChatMessage[], existingSummary: string): Promise<string> {
    const newMessagesStr = history
      .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n');

    const prompt = HISTORY_SUMMARIZER_PROMPT({
      currentSummary: existingSummary,
      newMessages: newMessagesStr
    });

    console.log(`[SUMMARIZER] Compressing history...`);
    const response = await this.llm.generateResponse(prompt, "You are a helpful memory manager.", []);
    
    return response.text || existingSummary;
  }
}
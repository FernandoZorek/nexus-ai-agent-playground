import { ILLMProvider } from "../../core/providers/llm.provider.js";
import { SECURITY_GUARDRAIL_PROMPT } from "../../infra/llm/prompts/index.js";

export interface SecurityResult {
  safe: boolean;
  reason?: string;
  cleanedInput: string;
  formattedInput: string;
}

export class SecurityService {
  constructor(private llm: ILLMProvider) {}

  async validate(rawInput: string): Promise<SecurityResult> {
    const cleanedInput = this.sanitize(rawInput);

    if (cleanedInput.length === 0) {
      return { safe: false, reason: "Empty input", cleanedInput: "", formattedInput: "" };
    }

    const safetyPrompt = SECURITY_GUARDRAIL_PROMPT(cleanedInput);
    
    let isSafe = true;
    let blockReason = null;

    try {
      const response = await this.llm.generateResponse(
        safetyPrompt, 
        "You are a security firewall. Respond ONLY with raw JSON. No markdown, no code blocks.", 
        []
      );
      
      const rawJson = response.text?.replace(/```json|```/g, "").trim() || '{"safe": true}';
      const result = JSON.parse(rawJson);
      
      isSafe = result.safe;
      blockReason = result.reason;
    } catch (error) {
      console.error("[SECURITY SERVICE] JSON Parse failed, raw response:", error);
      isSafe = true;
    }

    return {
      safe: isSafe,
      reason: blockReason,
      cleanedInput,
      formattedInput: `<user_query>\n"""\n${cleanedInput}\n"""\n</user_query>`
    };
  }

  private sanitize(input: string): string {
    return input
      .replace(/"""/g, "''")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/\r?\n|\r/g, " ")
      .trim();
  }
}
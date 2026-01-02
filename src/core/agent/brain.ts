import { ILLMProvider, ToolDeclaration } from "../providers/llm.provider";
import { ITool } from "../tools/tool.interface";
import { MemoryStore } from "../state/memory-store";
import { SummarizerService } from "../state/summarizer.service";
import { SqliteMemoryStore } from "../state/sqlite-memory-store";
import { envs } from "../../shared/config/envs";
import { TelemetryService } from "../../shared/telemetry/telemetry.service";
import { SecurityService } from "../../shared/services/security.service";
import { 
  SUPPORT_AGENT_PROMPT, 
  RESPONSE_REFINER_PROMPT 
} from "../../infra/llm/prompts/index";

export class AgentBrain {
  private tools: Map<string, ITool> = new Map();
  private summarizer: SummarizerService;
  private security: SecurityService;

  constructor(private llm: ILLMProvider, toolList: ITool[], private memory: MemoryStore) {
    toolList.forEach(tool => this.tools.set(tool.name, tool));
    this.summarizer = new SummarizerService(this.llm);
    this.security = new SecurityService(this.llm);
  }

  async process(input: string, context: string, userId: string, stepId?: string): Promise<boolean> {
    if (!input || input.trim() === "") return false;

    if (envs.ENABLE_IDEMPOTENCY_CHECK && stepId && this.memory instanceof SqliteMemoryStore) {
      const alreadyProcessed = await this.memory.isStepProcessed(userId, stepId);
      if (alreadyProcessed) {
        console.log(`\x1b[33m[BRAIN] Skipping Step [${stepId}]: Already processed.\x1b[0m`);
        return false; 
      }
    }

    const securityStart = Date.now();
    const securityCheck = await this.security.validate(input);

    if (!securityCheck.safe) {
      console.error(`\x1b[31m[SECURITY ALERT] Blocked input from ${userId}: ${securityCheck.reason}\x1b[0m`);
      TelemetryService.log({ tokens: 0, duration: Date.now() - securityStart, action: "SECURITY_BLOCK" });
      
      await this.memory.saveMessage(userId, { 
        role: 'model', 
        content: "I cannot process this request due to security policies." 
      }, stepId);
      
      return true;
    }

    let history = await this.memory.getHistory(userId);

    if (history.length === 0 && this.memory instanceof SqliteMemoryStore) {
      const summary = await this.memory.getSummary(userId);
      if (summary) {
        await this.memory.saveMessage(userId, { role: 'system', content: `Previous context summary: ${summary}` });
        history = await this.memory.getHistory(userId);
      }
    }

    if (history.length >= 6) {
      console.log("[SUMMARIZER] Compressing history...");
      const summary = await this.summarizer.summarize(history, "");
      if (this.memory instanceof SqliteMemoryStore) {
        await this.memory.saveSummary(userId, summary);
      }
      await this.memory.saveMessage(userId, { role: 'system', content: `Summarized context: ${summary}` });
      // Notificamos a memória mas não deletamos fisicamente para manter a idempotência
      await this.memory.clearHistory(userId); 
      history = await this.memory.getHistory(userId);
    }

    const historyContext = history.map(m => `[${m.role.toUpperCase()}]: """${m.content}"""`).join('\n');
    const systemPrompt = SUPPORT_AGENT_PROMPT({ businessContext: context, historyContext });

    try {
      await this.memory.saveMessage(userId, { role: 'user', content: securityCheck.cleanedInput }, stepId);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return false;
      throw error;
    }

    try {
      console.log(`[BRAIN] Processing: ${securityCheck.cleanedInput}`);
      const start = Date.now();
      
      const decision = await this.llm.generateResponse(
        securityCheck.formattedInput, 
        systemPrompt, 
        this.getToolDeclarations()
      );
      
      TelemetryService.log({
        tokens: decision.usage?.totalTokens || 0,
        duration: Date.now() - start,
        action: decision.toolCalls?.length ? "Tool Calling" : "Text Response"
      });

      if (decision.toolCalls?.length) {
        for (const call of decision.toolCalls) {
          const tool = this.tools.get(call.name);
          if (tool) {
            let args = typeof call.args === 'string' ? JSON.parse(call.args) : call.args;
            if (!args.userId) args.userId = userId;

            const toolResult = await tool.execute(args);
            await this.memory.saveMessage(userId, { role: 'tool', content: JSON.stringify(toolResult) });

            const refinerInput = RESPONSE_REFINER_PROMPT({ toolName: call.name, toolResult: JSON.stringify(toolResult) });
            const final = await this.llm.generateResponse(refinerInput, systemPrompt, []);
            
            if (final.text) {
              console.log(`[AGENT]: ${final.text}`);
              await this.memory.saveMessage(userId, { role: 'model', content: final.text }, stepId);
            }
          }
        }
      } else if (decision.text) {
        console.log(`[AGENT]: ${decision.text}`);
        await this.memory.saveMessage(userId, { role: 'model', content: decision.text }, stepId);
      }

      return true;
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : JSON.stringify(error, null, 2);
      console.error("[CRITICAL ERROR]", errorMessage);
      await this.handlePanic(userId, errorMessage, stepId);
      return true;
    }
  }

  private async handlePanic(userId: string, reason: string, stepId?: string) {
    const errorMsg = "I encountered a technical issue. Connecting you to a human agent...";
    await this.memory.saveMessage(userId, { role: 'model', content: errorMsg }, stepId);
    const handoff = this.tools.get('direct_to_human');
    if (handoff) await handoff.execute({ userId, reason, priority: "high" });
  }

  private getToolDeclarations(): ToolDeclaration[] {
    return Array.from(this.tools.values()).map(t => t.toolDeclaration);
  }
}
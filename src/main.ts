import fs from 'fs';
import path from 'path';
import { envs } from "./shared/config/envs";
import { GeminiAdapter } from "./infra/llm/gemini.adapter";
import { AgentBrain } from "./core/agent/brain";
import { SqliteMemoryStore } from './core/state/sqlite-memory-store';
import { OnboardingStore } from "./core/state/onboarding-store";
import { TelemetryService } from "./shared/telemetry/telemetry.service";
import { OnboardingStateTool } from "./core/tools/onboarding-state.tool";
import { CustomerMessengerTool } from "./core/tools/customer-messenger.tool";
import { DocumentationSearchTool } from "./core/tools/rag-search.tool";
import { HandoffTool } from "./core/tools/handoff.tool";

async function main() {
  const llmProvider = new GeminiAdapter(envs.GEMINI_API_KEY, envs.GEMINI_MODEL);
  const memoryStore = new SqliteMemoryStore('nexus_brain.db');
  const onboardingStore = new OnboardingStore();

  const agent = new AgentBrain(llmProvider, [
    new OnboardingStateTool(onboardingStore),
    new CustomerMessengerTool(),
    new DocumentationSearchTool(),
    new HandoffTool()
  ], memoryStore);

  const scenariosPath = path.resolve(process.cwd(), 'tests', 'scenarios.json');
  const { scenarios } = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'));

  for (const scenario of scenarios) {
    console.log(`\n==================================================`);
    console.log(`🚀 STARTING SCENARIO: ${scenario.userId}`);
    console.log(`==================================================`);
    
    for (const step of scenario.steps) {
      const wasProcessed = await agent.process(step.text, scenario.context, scenario.userId, step.id);

      if (wasProcessed) {
        console.log(`...waiting 5s for next step...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }
  
  console.log("\n" + "=".repeat(40));
  console.log("📈 FINAL SESSION REPORT");
  console.log("=".repeat(40));
  console.log(`✅ Total Scenarios Processed: ${scenarios.length}`);
  
  if (envs.ENABLE_COST_LOGS) {
    console.log(`🔢 Total Tokens Consumed:    ${TelemetryService.getSessionTokens()}`);
    console.log(`💵 TOTAL SESSION COST:       $${TelemetryService.getTotalCost().toFixed(6)}`);
  } else {
    console.log(`ℹ️ Cost logging is disabled in ENV.`);
  }
  console.log("=".repeat(40) + "\n");
}

main().catch(console.error);
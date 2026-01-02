import { envs } from "../config/envs.js";

export class TelemetryService {
  private static totalTokens = 0;
  private static totalCost = 0;

  static log(data: { tokens: number; duration: number; action: string }) {
    this.totalTokens += data.tokens;
    
    const currentCost = (data.tokens / 1000) * envs.AI_COST_PER_1K_TOKENS;
    this.totalCost += currentCost;

    if (envs.ENABLE_COST_LOGS) {
      console.log(`\n📊 [TELEMETRY]`);
      console.log(`   Action:   ${data.action}`);
      console.log(`   Tokens:   ${data.tokens} (Total Session: ${this.totalTokens})`);
      console.log(`   Latency:  ${data.duration}ms`);
      console.log(`   Cost Est: $${currentCost.toFixed(6)}`);
      console.log(`--------------------------\n`);
    }
  }

  static getTotalCost(): number {
    return this.totalCost;
  }

  static getSessionTokens(): number {
    return this.totalTokens;
  }
}
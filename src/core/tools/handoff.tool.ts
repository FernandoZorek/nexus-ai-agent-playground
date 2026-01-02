import { ITool } from "./tool.interface.js";
import { z } from 'zod';

const handoffSchema = z.object({
  userId: z.string().catch("unknown_user"),
  reason: z.string().min(1).catch("A IA não forneceu uma razão clara para o transbordo."),
  priority: z.enum(["normal", "high"]).default("normal")
});

type HandoffArgs = z.infer<typeof handoffSchema>;

export class HandoffTool extends ITool {
  name = "direct_to_human";
  description = "Use this tool ONLY when the user explicitly asks for a human, wants to cancel a service, or when a technical error occurs that you cannot fix.";

  schema = handoffSchema;

  async execute(args: any) {
    try {
      const validated = this.schema.parse(args) as HandoffArgs;
      
      console.log(`\n⚠️  [HANDOFF SYSTEM]`);
      console.log(`   User: ${validated.userId}`);
      console.log(`   Priority: ${validated.priority.toUpperCase()}`);
      console.log(`   Reason: ${validated.reason}\n`);
      
      return { 
        status: "transferred", 
        queue: "human_support",
        ticketId: `NEXUS-${Date.now()}`,
        message: "Your request has been prioritized for a human agent."
      };
    } catch (err: any) {
      return { 
        status: "error", 
        message: "Failed to process handoff arguments safely." 
      };
    }
  }
}
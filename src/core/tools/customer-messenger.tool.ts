import { ITool } from "./tool.interface.js";
import { z } from 'zod';

const messengerSchema = z.object({
  userId: z.string().describe("The unique identifier of the customer. Use the provided userId."),
  message: z.string().min(1).describe("The FULL TEXT of the response you want to send to the user. This is mandatory."),
  priority: z.enum(["standard", "urgent"]).default("standard").describe("The priority of the message.")
});

type MessengerArgs = z.infer<typeof messengerSchema>;

export class CustomerMessengerTool extends ITool {
  name = "send_customer_message";
  description = "MANDATORY: Use this tool to send any text response back to the customer. You MUST provide the 'message' argument with your full answer.";

  schema = messengerSchema;

  async execute(args: any) {
    try {
      const validated = messengerSchema.parse(args) as MessengerArgs;
      
      console.log(`[TOOL] Message for ${validated.userId}: ${validated.message}`);
      
      return { 
        success: true, 
        delivered: true,
        priority: validated.priority 
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Missing required 'message' argument. Please provide the message content."
      };
    }
  }
}
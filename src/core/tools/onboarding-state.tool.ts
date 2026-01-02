import { ITool } from "./tool.interface.js";
import { OnboardingStore } from "../state/onboarding-store.js";
import { z } from 'zod';

export class OnboardingStateTool extends ITool {
  name = "get_user_onboarding_status";
  description = "Get the current progress of a customer's onboarding, including completed steps and detected blockers.";
  schema = z.object({
    userId: z.string().describe("The unique identifier of the customer.")
  });

  constructor(private store: OnboardingStore) {
    super();
  }

  async execute(args: z.infer<typeof this.schema>) {
    const { userId } = this.schema.parse(args);
    
    console.log(`[TOOL] Accessing OnboardingStore for user: ${userId}`);
    
    const state = await this.store.getState(userId);

    if (!state) {
      return { error: "User not found in the onboarding database." };
    }

    return {
      userId: state.userId,
      currentStep: state.currentStep,
      isStuck: state.isStuck,
      lastInteraction: state.lastInteraction
    };
  }
}
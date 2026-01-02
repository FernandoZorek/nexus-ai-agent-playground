
export interface CustomerState {
  userId: string;
  currentStep: 'signup' | 'api_setup' | 'first_request' | 'completed';
  isStuck: boolean;
  lastInteraction: string;
}

export class OnboardingStore {
  private states: Map<string, CustomerState> = new Map();

  constructor() {
    this.states.set("user_test_01", {
      userId: "user_test_01",
      currentStep: "api_setup",
      isStuck: true,
      lastInteraction: new Date().toISOString()
    });
  }

  async getState(userId: string): Promise<CustomerState | undefined> {
    return this.states.get(userId);
  }

  async updateState(userId: string, partialState: Partial<CustomerState>): Promise<void> {
    const current = this.states.get(userId);
    if (current) {
      this.states.set(userId, { ...current, ...partialState });
    }
  }
}
export interface ChatMessage {
  role: 'user' | 'model' | 'tool' | 'system';
  content: string;
}

export class MemoryStore {
  private history: Map<string, ChatMessage[]> = new Map();

  async getHistory(userId: string): Promise<ChatMessage[]> {
    return this.history.get(userId) || [];
  }

  async saveMessage(userId: string, message: ChatMessage, stepId?: string): Promise<void> {
    const userHistory = await this.getHistory(userId);
    userHistory.push(message);

    if (userHistory.length > 20) {
      userHistory.shift();
    }

    this.history.set(userId, userHistory);
  }

  
  async clearHistory(userId: string): Promise<void> {
    this.history.set(userId, []);
  }

  async removeOldMessages(userId: string, count: number): Promise<void> {
    const userHistory = await this.getHistory(userId);
    if (userHistory.length > count) {
      this.history.set(userId, userHistory.slice(count));
    }
  }
}
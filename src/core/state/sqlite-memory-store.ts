import Database from 'better-sqlite3';
import { MemoryStore, ChatMessage } from './memory-store';

export class SqliteMemoryStore extends MemoryStore {
  private db: Database.Database;

  constructor(dbPath: string = 'nexus_brain.db') {
    super();
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        stepId TEXT, 
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS summaries (
        userId TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Índice para busca rápida de idempotência (sem ser UNIQUE para permitir USER e MODEL)
      CREATE INDEX IF NOT EXISTS idx_step_user ON messages(userId, stepId);
      CREATE INDEX IF NOT EXISTS idx_user_time ON messages(userId, timestamp);
    `);
  }

  async isStepProcessed(userId: string, stepId: string): Promise<boolean> {
    const stmt = this.db.prepare(
      "SELECT id FROM messages WHERE userId = ? AND stepId = ? AND role = 'model' LIMIT 1"
    );
    const result = stmt.get(userId, stepId);
    return !!result;
  }

  async saveMessage(userId: string, message: ChatMessage, stepId?: string): Promise<void> {
    const stmt = this.db.prepare(
      'INSERT INTO messages (userId, role, content, stepId) VALUES (?, ?, ?, ?)'
    );
    const safeContent = message.content ?? "[Sem conteúdo]";
    stmt.run(userId, message.role, safeContent, stepId || null);
  }

  async getHistory(userId: string): Promise<ChatMessage[]> {
    const stmt = this.db.prepare(`
      SELECT role, content FROM messages 
      WHERE userId = ? 
      ORDER BY timestamp DESC LIMIT 10
    `);
    const rows = stmt.all(userId) as any[];
    return rows.reverse().map(row => ({ role: row.role, content: row.content }));
  }

  async clearHistory(userId: string): Promise<void> {
    console.log(`[SQLITE] History for ${userId} preserved for idempotency.`);
  }

  async saveSummary(userId: string, summary: string): Promise<void> {
    const safeSummary = summary ?? "[Sumário vazio]";
    this.db.prepare(`
      INSERT INTO summaries (userId, content) VALUES (?, ?)
      ON CONFLICT(userId) DO UPDATE SET content = excluded.content, updatedAt = CURRENT_TIMESTAMP
    `).run(userId, safeSummary);
  }

  async getSummary(userId: string): Promise<string | null> {
    const row = this.db.prepare('SELECT content FROM summaries WHERE userId = ?').get(userId) as any;
    return row ? row.content : null;
  }
}
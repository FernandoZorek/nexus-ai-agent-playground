import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const db = new Database('nexus_brain.db');

function exportAuditLogs() {
    console.log("📂 Starting Audit Log Export...");

    try {
        const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'").get();
        if (!tableCheck) {
            console.log("⚠️  The 'messages' database table was not found. Run the agent first.");
            return;
        }

        const users = db.prepare('SELECT DISTINCT userId FROM messages').all() as { userId: string }[];

        if (users.length === 0) {
            console.log("ℹ️  Database found, but no interactions recorded.");
            return;
        }

        const auditData = {
            exportTimestamp: new Date().toISOString(),
            totalUsers: users.length,
            sessions: users.map(u => {
                const userId = u.userId;
                
                const interactions = db.prepare(`
                    SELECT role, content, stepId, timestamp 
                    FROM messages 
                    WHERE userId = ? 
                    ORDER BY timestamp ASC
                `).all(userId);
                
                const summaryRow = db.prepare('SELECT content FROM summaries WHERE userId = ?').get(userId) as { content: string } | undefined;

                return {
                    userId,
                    hasActiveSummary: !!summaryRow,
                    currentSummary: summaryRow ? summaryRow.content : "No summary generated yet",
                    totalInteractions: interactions.length,
                    history: interactions.map((m: any) => ({
                        at: m.timestamp,
                        stepReference: m.stepId || "internal-logic",
                        role: m.role,
                        content: m.content
                    }))
                };
            })
        };

        const exportDir = path.join(process.cwd(), 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const fileName = `audit_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filePath = path.join(exportDir, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(auditData, null, 2), 'utf-8');

        console.log(`\n✅ Export completed successfully!`);
        console.log(`📍 File: ${filePath}`);
        console.log(`👥 Exported users: ${users.length}`);

    } catch (error: any) {
        console.error("❌ Export failed:", error.message);
    } finally {
        db.close();
    }
}

exportAuditLogs();
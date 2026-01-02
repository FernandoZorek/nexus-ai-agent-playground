import Database from 'better-sqlite3';

const db = new Database('nexus_brain.db');

function generateFullReport() {
    console.log("\n" + "=".repeat(85));
    console.log("📊 NEXUS AI AGENT: OPERATIONAL DASHBOARD (WITH STEP TRACKING)");
    console.log("=".repeat(85));

    try {
        const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'").get();
        if (!tableCheck) {
            console.log("⚠️  Database is empty or not initialized. Run the agent first.");
            return;
        }

        const stats = db.prepare(`
            SELECT role, COUNT(*) as count 
            FROM messages 
            GROUP BY role
        `).all() as { role: string, count: number }[];

        console.log("\n📈 MESSAGE DISTRIBUTION:");
        stats.forEach(s => {
            console.log(`- ${s.role.toUpperCase().padEnd(10)}: ${s.count} messages`);
        });

        console.log("\n📜 RECENT ACTIVITY LOG (Last 15 events):");
        console.log("-".repeat(85));
        console.log(`${"TIME".padEnd(9)} | ${"STEP_ID".padEnd(15)} | ${"ROLE".padEnd(8)} | ${"CONTENT"}`);
        console.log("-".repeat(85));

        const logs = db.prepare(`
            SELECT userId, role, content, stepId, timestamp 
            FROM messages 
            ORDER BY timestamp DESC 
            LIMIT 15
        `).all().reverse() as any[];

        logs.forEach(log => {
            const timePart = log.timestamp.includes(' ') ? log.timestamp.split(' ')[1] : log.timestamp;
            const time = timePart.substring(0, 8);
            
            const stepDisplay = log.stepId ? log.stepId.substring(0, 15) : "---";
            const roleLabel = log.role.toUpperCase().substring(0, 8);
            const contentSnippet = log.content.replace(/[\n\r]+/g, ' ').substring(0, 45);
            
            console.log(`${time.padEnd(9)} | ${stepDisplay.padEnd(15)} | ${roleLabel.padEnd(8)} | ${contentSnippet}...`);
        });

        const summaries = db.prepare('SELECT userId, content FROM summaries').all() as any[];
        if (summaries.length > 0) {
            console.log("\n🧠 LONG-TERM MEMORY (SUMMARIES):");
            summaries.forEach(s => {
                const summarySnippet = s.content.replace(/[\n\r]+/g, ' ').substring(0, 90);
                console.log(`- [${s.userId.padEnd(10)}]: ${summarySnippet}...`);
            });
        }

    } catch (error: any) {
        console.error("\n❌ Error generating report:", error.message);
    } finally {
        console.log("\n" + "=".repeat(85) + "\n");
        db.close();
    }
}

generateFullReport();
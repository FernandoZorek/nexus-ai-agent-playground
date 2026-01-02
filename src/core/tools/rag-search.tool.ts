import { ITool } from "./tool.interface.js";
import { z } from 'zod';

/**
 * MOCKED TOOL: Documentation Search (RAG)
 * This tool simulates a call to a remote RAG microservice.
 */
export class DocumentationSearchTool extends ITool {
  name = "search_documentation";
  description = "Searches official technical documentation and API references to solve integration errors.";

  schema = z.object({
    query: z.string().describe("The technical question or error message to troubleshoot.")
  });

  async execute({ query }: { query: string }) {
  console.log(`[MOCK RAG] Searching for: "${query}"`);
  
  const database = [
    // --- SALES & BUDGET ---
    { topic: "Standard Plan", content: "Price: $99/mo. Includes 50k requests and basic support." },
    { topic: "Pro Plan", content: "Price: $499/mo. Includes 500k requests, priority support, and custom headers." },
    { topic: "Enterprise Quote", content: "Custom pricing. Starting at $2500/mo. Includes unlimited nodes and 24/7 dedicated engineer." },
    
    // --- CONTRACTING & LEGAL ---
    { topic: "Contract Duration", content: "Standard contracts are monthly. Annual contracts receive a 20% discount." },
    { topic: "SLA Guarantee", content: "We offer 99.9% uptime for Pro and 99.99% for Enterprise plans." },
    
    // --- ONBOARDING & TECHNICAL ---
    { topic: "First Steps", content: "1. Create API Key. 2. Configure Gateway URL. 3. Deploy first route." },
    { topic: "403 Forbidden", content: "Cause: Missing scopes. Solution: Check 'Write' permissions in Settings." },
    { topic: "401 Unauthorized", content: "Cause: Expired token. Solution: Refresh JWT via /auth/refresh." },
    { topic: "Rate Limit Error", content: "Error 429. Occurs when quota is exceeded. Upgrade to Pro for higher limits." },
    { topic: "SDK Installation", content: "Available for Node.js, Python, and Go via 'npm install @nexus/sdk'." }
  ];

  const results = database.filter(d => 
    query.toLowerCase().split(' ').some(word => 
      word.length > 3 && (d.topic.toLowerCase().includes(word) || d.content.toLowerCase().includes(word))
    )
  );

  return results.length > 0 ? results : "No specific info found. Please refer to our sales team.";
  }
}
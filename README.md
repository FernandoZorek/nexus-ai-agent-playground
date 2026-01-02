# 🚀 Nexus AI Agent Playground

This project is a high-performance experimentation environment for AI Agents. It was designed to serve as a testing laboratory where developers can validate decision logic, tool chains, and state persistence. The system is flexible enough to operate with a fully mocked **RAG (Retrieval-Augmented Generation)** infrastructure for rapid testing or can be integrated with production RAG APIs, serving as a solid foundation that can be evolved into real-world use cases.


## 🛠️ Technologies and Integrations
- **Multi-LLM Provider:** Native integration with **Google Gemini** and **OpenAI GPT**, allowing you to switch between models via environment variables.
- **Engine:** [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Database:** [SQLite](https://www.sqlite.org/) for memory persistence and full data traceability.
- **Validation:** [Zod](https://zod.dev/) for rigorous validation of tools and configurations.
- **Security Engine:** Multi-layered defense system with Regex Sanitization and LLM-based Guardrails.

![ScreenShot](https://repository-images.githubusercontent.com/1126910898/4b5155c6-4e9f-40ac-bbd3-0695c56303b3)

## ✨ Key Features
- **Security Guardrails (Defense in Depth):** - **Physical Layer:** Regex-based sanitization to prevent delimiter collision (Triple Quotes & XML tags).
    - **Semantic Layer:** Specialized `SecurityService` that uses a dedicated LLM call to detect "Prompt Injection", "System Leakage", and "Instruction Override".
    - **Structural Layer:** Automatic wrapping of user input in `<user_query>` tags and triple quotes for structural isolation.
- **Dual RAG Strategy:** Supports a mocked knowledge base for fast validation or real RAG APIs for high-fidelity testing.
- **Data Provenance:** The system tracks and saves the **source of information**, allowing you to audit which documents or tools were consulted for each answer.
- **Idempotency Architecture:** Strict control via `stepId`, ensuring consistency during repeated automated test runs.
- **Memory Compression:** Built-in `[SUMMARIZER]` module that automatically triggers "Compressing history..." every 6 messages, optimizing context and reducing token costs.
- **Flexible Reporting:** Performance and cost metrics can be viewed in real-time on the screen or exported for later analysis.
- **Production-Ready Evolution:** Although designed as a playground, the architecture follows software standards (SOLID) that allow for a direct transition to a production environment.


## 🚀 Getting Started

### 1. Installation
* Install dependencies:
```bash
    npm install
```


### 2. Configuration
Create a `.env` file in the root directory:
```env
    # Options: 'gemini' or 'openai'
    LLM_PROVIDER=gemini

    # Model Versions
    GEMINI_MODEL=gemini-1.5-flash
    OPENAI_MODEL=gpt-4o
    AI_COST_PER_1K_TOKENS=0.002

    # --- API KEYS ---
    GEMINI_API_KEY=your_key_here
    OPENAI_API_KEY=your_key_here

    # --- APP CONFIG ---
    NODE_ENV=development
    ENABLE_COST_LOGS=true
    ENABLE_IDEMPOTENCY_CHECK=true
```

### 3. Available Scripts
The project includes a set of scripts for development, cleaning, and reporting:
```bash
npm run dev: Runs the project in development mode using tsx.

npm run build: Compiles the TypeScript code to JavaScript.

npm run start: Runs the compiled version from the dist folder.

npm run report: Generates a visual dashboard with session metrics.

npm run export: Exports detailed execution logs for external analysis.

npm run clean:db: Deletes the SQLite database and temporary WAL files.

npm run reset: Cleans the database and starts a fresh development run.
```

## 📊 Telemetry and Observability
The `TelemetryService` monitors every interaction to ensure total control over the agent:
* **Action:** Logs whether there was a direct response or tool usage (with latency logging).
* **Tokens & Costs:** Real-time calculation of token consumption and estimated cost per session.
* **Reports:** Terminal visualization with the option to export detailed execution logs.

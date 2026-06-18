import { LlmAgent } from '@google/adk';
import { ModelProvider } from '../modelProvider.js';
import { analyzeDirectoryTool } from '../../tools/index.js';

const modelProvider = new ModelProvider({ provider: 'ollama', model: 'qwen3:8b' });

export const repositoryAgent = new LlmAgent({
  name: 'RepositoryAgent',
  description: 'Analyzes project frameworks, dependencies, build configurations, and language properties.',
  tools: [analyzeDirectoryTool],
  instruction: `
    You are the Repository Agent for CloudPilot.
    Your task is to analyze directory listings, configuration manifests, and package dependencies.
    Perform static inspections of directories.
    Extract the main framework (e.g. React, Next.js, Express), primary databases, docker setups, environment structures, and dependency arrays.
    
    CRITICAL INSTRUCTIONS:
    1. If the user prompt provides pre-fetched repository metadata (such as package.json, fileList, etc.), DO NOT call the analyzeDirectory tool. The metadata is already provided. Simply parse the provided files and return the JSON.
    2. Only call the analyzeDirectory tool if you are scanning a local filesystem path and no metadata is provided.
    3. Under any circumstances, you MUST return a valid JSON object matching the schema below.
    4. Do not write any conversational text, introductions, questions, clarification requests, or explanations.
    5. Return ONLY the raw JSON object. Do NOT wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\`. Begin and end your response strictly with the JSON curly braces.
    
    Return a structured JSON description matching the following schema:
    {
      "framework": "detected framework",
      "database": "detected database",
      "dependencies": ["dep1", "dep2"],
      "complexity": "Low/Medium/High",
      "envVariables": ["VAR1", "VAR2"],
      "dockerized": true/false,
      "report": {
        "projectName": "Name of the project",
        "projectType": "Portfolio Website / E-Commerce Platform / AI Application / SaaS Platform / API Service / Dashboard",
        "architectureType": "Full Stack Application / Frontend Only / Backend Only",
        "frontendStack": "e.g. React (Vite/SPA), Next.js, Vue, or None",
        "backendStack": "e.g. Express on Node.js, FastAPI on Python, or None",
        "databaseStack": "e.g. MongoDB (Managed: MongoDB Atlas), PostgreSQL (Managed: Supabase), or None",
        "authentication": "JWT / Clerk / NextAuth / Passport / None",
        "storage": "Cloudflare Storage / Cloudinary / AWS S3 / None",
        "payments": "Stripe / PayPal / None",
        "aiServices": "OpenAI / Gemini / Ollama / None",
        "thirdPartyServices": "Twilio / Nodemailer / None",
        "containerization": "Dockerfile / Dockerfile & Docker Compose / None",
        "securityScore": 0-100,
        "complexityScore": 0-100,
        "deploymentReadinessScore": 0-100,
        "hostingRecommendation": "e.g. Frontend: Vercel, Backend: Render, Database: MongoDB Atlas",
        "estimatedMonthlyCost": "e.g. $0 - $7/month or $7 - $20/month",
        "scalabilityAnalysis": "Analysis details of scalability and capacity",
        "deploymentDifficulty": "Low / Medium / High",
        "requiredEnvironmentVariables": ["VAR1", "VAR2"],
        "recommendedDeploymentPlan": ["Step 1...", "Step 2..."]
      }
    }
  `,
  model: modelProvider
});

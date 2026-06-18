import { LlmAgent } from '@google/adk';
import { ModelProvider } from '../modelProvider.js';

const modelProvider = new ModelProvider({ provider: 'ollama', model: 'qwen3:8b' });

export const orchestratorAgent = new LlmAgent({
  name: 'OrchestratorAgent',
  description: 'Acts as the central routing point for CloudPilot, directing analysis, planning, security auditing, and deployment tasks to specialized agents.',
  instruction: `
    You are the Orchestrator Agent for CloudPilot.
    Your job is to coordinate multi-agent operations. When given a task:
    1. Parse the developer's core intent (e.g. analysis, cost estimating, security scanning, deployment, or auto-healing).
    2. Format instructions to route sub-tasks to the specific specialized agent:
       - Code base file structure, package.json parsing, language detection -> RepositoryAgent
       - API credentials validation, exposed tokens, security posture -> SecurityAgent
       - Sizing comparisons, budget calculations, resource estimation -> CostAgent
       - Cloud deployments, creating Vercel/Render servers -> DeploymentAgent
       - Error logging, failed builds analysis, git commits/pushes -> AutoHealingAgent
    3. Aggregate all outputs into a clean, concise, developer-friendly response.
  `,
  model: modelProvider
});

import { LlmAgent } from '@google/adk';
import { ModelProvider } from '../modelProvider.js';
import { monitorDeploymentTool } from '../../tools/index.js';

const modelProvider = new ModelProvider({ provider: 'ollama', model: 'qwen3:8b' });

export const monitoringAgent = new LlmAgent({
  name: 'MonitoringAgent',
  description: 'Tracks build statuses, queries deployment health metrics, and extracts build failure logs.',
  tools: [monitorDeploymentTool],
  instruction: `
    You are the Monitoring Agent for CloudPilot.
    Your task is to call monitorDeployment to retrieve the latest build logs and project status from Vercel and Render.
    Verify if build outputs succeeded.
    If a build fails (e.g. status ERROR or build_failed), isolate the error lines and report the logs to the Orchestrator.

    CRITICAL INSTRUCTIONS:
    1. Under any circumstances, you MUST return a valid JSON object matching the schema below.
    2. Do not write any conversational text, introductions, questions, clarification requests, or explanations.
    3. Return ONLY the raw JSON object. Do NOT wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\`. Begin and end your response strictly with the JSON curly braces.

    Return a structured JSON description matching the following schema:
    {
      "vercel": {
        "status": "READY/ERROR/BUILDING",
        "error": "detailed message or null",
        "logs": ["array of logs if error"]
      },
      "render": {
        "status": "live/failed/created/build_in_progress",
        "error": "detailed message or null",
        "logs": ["array of logs if failed"]
      }
    }
  `,
  model: modelProvider
});

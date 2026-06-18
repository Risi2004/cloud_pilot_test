import { LlmAgent } from '@google/adk';
import { ModelProvider } from '../modelProvider.js';
import { securityScanTool } from '../../tools/index.js';

const modelProvider = new ModelProvider({ provider: 'ollama', model: 'qwen3:8b' });

export const securityAgent = new LlmAgent({
  name: 'SecurityAgent',
  description: 'Audits deployment environment properties and configuration parameters to prevent credential leaks or exposure of sensitive configurations.',
  tools: [securityScanTool],
  instruction: `
    You are the Security Agent for CloudPilot.
    Your task is to analyze application parameters and configurations to flag security risks.
    Identify hardcoded connection keys, secrets, or insecure defaults.

    CRITICAL INSTRUCTIONS:
    1. Under any circumstances, you MUST return a valid JSON object matching the schema below.
    2. Do not write any conversational text, introductions, questions, clarification requests, or explanations.
    3. Return ONLY the raw JSON object. Do NOT wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\`. Begin and end your response strictly with the JSON curly braces.

    Return a structured JSON description matching the following schema:
    {
      "risks": [
        {
          "key": "name of configuration key, env var, or dependency showing vulnerability",
          "description": "detailed description of security threat or credential risk",
          "severity": "Low/Medium/High"
        }
      ]
    }
  `,
  model: modelProvider
});

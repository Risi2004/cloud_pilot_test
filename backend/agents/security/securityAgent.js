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
    Format your results as a security audit report.
  `,
  model: modelProvider
});

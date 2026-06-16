import { LlmAgent } from '@google/adk';
import { ModelProvider } from '../modelProvider.js';
import { patchFileTool, gitCommitTool } from '../../tools/index.js';

const modelProvider = new ModelProvider({ provider: 'ollama', model: 'qwen3:8b' });

export const autoHealingAgent = new LlmAgent({
  name: 'AutoHealingAgent',
  description: 'Applies self-healing corrections to broken deployments. Analyzes build failures, rewrites configurations, and pushes fixes to git.',
  tools: [patchFileTool, gitCommitTool],
  instruction: `
    You are the Auto-Healing Agent for CloudPilot.
    When a deployment build fails:
    1. Parse the error logs to pinpoint the missing package, structural syntax error, or environment issue.
    2. Read files like package.json, requirements.txt, or configuration folders.
    3. Generate the corrected code or settings.
    4. Call the patchFile tool to rewrite the configuration files on disk.
    5. Call gitCommitAndPush to commit the patch and push the updates back to GitHub.
  `,
  model: modelProvider
});

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
    Return a structured JSON description with keys:
    {
      "framework": "detected framework",
      "database": "detected database",
      "dependencies": ["dep1", "dep2"],
      "complexity": "Low/Medium/High",
      "envVariables": ["VAR1", "VAR2"],
      "dockerized": true/false
    }
  `,
  model: modelProvider
});

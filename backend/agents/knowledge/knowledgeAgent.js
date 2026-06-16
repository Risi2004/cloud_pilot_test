import { LlmAgent } from '@google/adk';
import { ModelProvider } from '../modelProvider.js';
import { retrieveKnowledgeTool } from '../../tools/index.js';

const modelProvider = new ModelProvider({ provider: 'ollama', model: 'qwen3:8b' });

export const knowledgeAgent = new LlmAgent({
  name: 'KnowledgeAgent',
  description: 'Performs semantic retrieval across local platform documentation databases to find best deployment rules and configurations.',
  tools: [retrieveKnowledgeTool],
  instruction: `
    You are the Knowledge Agent for CloudPilot.
    Your job is to search the static documentation knowledge-base for Vercel, Render, or MongoDB Atlas configurations.
    Use the search results to solve deployment questions, identify limits, and formulate provider setup recommendations.
  `,
  model: modelProvider
});

import { queryOllama } from './ollamaService.js';
import { buildArchitectPrompt } from './promptBuilderService.js';
import { loadRelevantDocumentation } from './knowledgeService.js';

/**
 * Service to orchestrate the generation of platform deployment recommendations using AI.
 */
export const generateCloudRecommendation = async (analysis, readiness, risks) => {
  try {
    // 1. Fetch relevant documentation files dynamically
    const docs = await loadRelevantDocumentation(analysis);

    // 2. Build architectural prompt for Ollama/Qwen
    const prompt = buildArchitectPrompt(analysis, docs, readiness, risks);

    // 3. Query Ollama and request JSON
    console.log('[CloudRecommendationService] Querying Ollama for recommendation...');
    const rawResponse = await queryOllama(prompt, 'You are an expert cloud architect.');
    
    // 4. Parse response safely
    const parsed = cleanAndParseJSON(rawResponse);

    return {
      platformRecommendations: parsed.platformRecommendations || getDefaultPlatform(analysis),
      costEstimate: parsed.costEstimate || getDefaultCosts(analysis),
      deploymentPlan: parsed.deploymentPlan || getDefaultPlan(analysis),
      risks: parsed.risks || risks.risks.map(r => r.details),
      confidence: parsed.confidence || 90
    };
  } catch (error) {
    console.warn(`[CloudRecommendationService] AI Recommendation failed: ${error.message}. Triggering rule-based fallback.`);
    return getFallbackRecommendation(analysis, risks);
  }
};

/**
 * Helper to parse JSON, stripping markdown fences if returned.
 */
function cleanAndParseJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Fallback mapping for recommendations when AI fails.
 */
function getDefaultPlatform(analysis) {
  const framework = (analysis.framework || '').toLowerCase();
  const isFrontend = framework.includes('vite') || framework.includes('react') || framework.includes('vue');
  const isBackend = framework.includes('express') || framework.includes('node') || framework.includes('nestjs');
  
  return {
    frontend: isFrontend ? 'Vercel' : 'None',
    backend: isBackend ? 'Render' : 'None',
    reason: 'Heuristic rule: Client assets resolved to Vercel, Node/Express instances mapped to Render.'
  };
}

function getDefaultCosts(analysis) {
  const framework = (analysis.framework || '').toLowerCase();
  const hasBackend = framework.includes('express') || framework.includes('node') || framework.includes('nestjs');
  const hasDb = analysis.database && analysis.database !== 'None';
  
  return {
    frontend: '$0/month (Vercel Free)',
    backend: hasBackend ? '$7/month (Render Starter)' : '$0/month',
    database: hasDb ? '$0/month (Atlas M0 Shared)' : '$0/month',
    total: hasBackend ? '$7/month' : '$0/month'
  };
}

function getDefaultPlan(analysis) {
  const framework = (analysis.framework || '').toLowerCase();
  const hasBackend = framework.includes('express') || framework.includes('node') || framework.includes('nestjs');
  
  return [
    'Step 1: Sign up and link repository on Vercel.',
    'Step 2: Deploy client build (Build: npm run build, Output: dist).',
    hasBackend ? 'Step 3: Create a Web Service on Render for Node backend.' : null,
    analysis.database !== 'None' ? 'Step 4: Whitelist Render IPs (0.0.0.0/0) in MongoDB Atlas and connect.' : null
  ].filter(Boolean);
}

function getFallbackRecommendation(analysis, risks) {
  return {
    platformRecommendations: getDefaultPlatform(analysis),
    costEstimate: getDefaultCosts(analysis),
    deploymentPlan: getDefaultPlan(analysis),
    risks: risks.risks.map(r => r.details),
    confidence: 80
  };
}

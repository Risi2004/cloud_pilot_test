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
    const rawResponse = await queryOllama(prompt, 'You are an expert cloud architect.', 'json');
    
    // 4. Parse response safely
    const parsed = cleanAndParseJSON(rawResponse);

    let plan = parsed.deploymentPlan || [];
    if (!Array.isArray(plan)) {
      if (typeof plan === 'string') {
        plan = plan.split(/\r?\n/).filter(line => line.trim());
      } else if (typeof plan === 'object') {
        plan = Object.values(plan);
      } else {
        plan = [];
      }
    }

    let parsedRisks = parsed.risks;
    if (parsedRisks && !Array.isArray(parsedRisks)) {
      if (typeof parsedRisks === 'string') {
        parsedRisks = parsedRisks.split(/\r?\n/).filter(line => line.trim());
      } else if (typeof parsedRisks === 'object') {
        parsedRisks = Object.values(parsedRisks);
      } else {
        parsedRisks = [];
      }
    }

    let recs = parsed.platformRecommendations || {};
    let fe = recs.frontend || 'None';
    let be = recs.backend || 'None';

    if (fe.toLowerCase().includes('vercel')) fe = 'Vercel';
    else if (fe.toLowerCase().includes('render')) fe = 'Render';
    else fe = 'None';

    if (be.toLowerCase().includes('render')) be = 'Render';
    else if (be.toLowerCase().includes('vercel')) be = 'Vercel';
    else be = 'None';

    recs.frontend = fe;
    recs.backend = be;

    return {
      platformRecommendations: recs,
      costEstimate: parsed.costEstimate,
      deploymentPlan: plan,
      risks: parsedRisks || risks.risks.map(r => r.details),
      confidence: parsed.confidence || 90
    };
  } catch (error) {
    console.error(`[CloudRecommendationService] Local Ollama model did not respond or failed: ${error.message}`);
    throw error;
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


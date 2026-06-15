import Analysis from '../models/Analysis.js';
import { fetchRepositoryInfo } from '../services/githubService.js';
import { calculateReadiness } from '../services/readinessService.js';
import { performRiskAnalysis } from '../services/riskAnalysisService.js';
import { generateCloudRecommendation } from '../services/cloudRecommendationService.js';

/**
 * Controller to handle POST /api/recommend.
 * Returns documentation-aware cloud deployment recommendations.
 */
export const getRecommendation = async (req, res) => {
  const { githubUrl, analysisId } = req.body;

  if (!githubUrl && !analysisId) {
    return res.status(400).json({ error: 'Either githubUrl or analysisId is required' });
  }

  try {
    const query = analysisId ? { _id: analysisId } : { githubUrl };
    const analysis = await Analysis.findOne(query);

    if (!analysis) {
      return res.status(404).json({ error: 'No analysis found for this repository. Analyze it first.' });
    }

    // 1. Fetch fresh repo info
    const repoInfo = await fetchRepositoryInfo(analysis.githubUrl);

    // 2. Perform readiness check
    const readiness = calculateReadiness(repoInfo, analysis);
    analysis.readiness = readiness;

    // 3. Perform risk analysis
    const risks = performRiskAnalysis(repoInfo, analysis);
    analysis.risks = risks;

    // 4. Generate documentation-aware recommendations
    const recommendations = await generateCloudRecommendation(analysis, readiness, risks);

    // 5. Save changes to DB
    analysis.recommendation = {
      frontend: recommendations.platformRecommendations.frontend,
      backend: recommendations.platformRecommendations.backend,
      reason: recommendations.platformRecommendations.reason,
      cost: recommendations.costEstimate.total
    };
    
    // Also save deployment plan steps if returned by AI
    if (recommendations.deploymentPlan && recommendations.deploymentPlan.length > 0) {
      analysis.deploymentPlan = { steps: recommendations.deploymentPlan };
    }

    await analysis.save();

    return res.status(200).json(analysis.recommendation);
  } catch (error) {
    console.error(`Recommendation Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Recommendation failed: ${error.message}` });
  }
};

import Analysis from '../models/Analysis.js';
import { fetchRepositoryInfo } from '../services/githubService.js';
import { calculateReadiness } from '../services/readinessService.js';
import { performRiskAnalysis } from '../services/riskAnalysisService.js';
import { generateCloudRecommendation } from '../services/cloudRecommendationService.js';
import { generateArchitectureReport } from '../services/reportGeneratorService.js';

/**
 * Controller to handle POST /api/report.
 * Compiles and returns the full CloudPilot Architecture Report.
 */
export const getReport = async (req, res) => {
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

    // 3. Perform risk check
    const risks = performRiskAnalysis(repoInfo, analysis);
    analysis.risks = risks;

    // 4. Generate Cloud recommendations
    const recommendation = await generateCloudRecommendation(analysis, readiness, risks);
    analysis.recommendation = {
      frontend: recommendation.platformRecommendations.frontend,
      backend: recommendation.platformRecommendations.backend,
      reason: recommendation.platformRecommendations.reason,
      cost: recommendation.costEstimate.total
    };
    if (recommendation.deploymentPlan && recommendation.deploymentPlan.length > 0) {
      analysis.deploymentPlan = { steps: recommendation.deploymentPlan };
    }

    // 5. Generate final Architecture Report
    const report = generateArchitectureReport(analysis, readiness, risks, recommendation);
    analysis.architectureReport = report;

    // Save all to database
    await analysis.save();

    return res.status(200).json(report);
  } catch (error) {
    console.error(`Report Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Report generation failed: ${error.message}` });
  }
};

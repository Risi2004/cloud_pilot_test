import Analysis from '../models/Analysis.js';
import { fetchRepositoryInfo } from '../services/githubService.js';
import { performRiskAnalysis } from '../services/riskAnalysisService.js';

/**
 * Controller to handle POST /api/risks.
 * Returns the architecture risk analysis profile.
 */
export const getRisks = async (req, res) => {
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

    // Fetch repository context files
    const repoInfo = await fetchRepositoryInfo(analysis.githubUrl);

    // Calculate risk profile
    const risks = performRiskAnalysis(repoInfo, analysis);

    // Save calculation to DB
    analysis.risks = risks;
    await analysis.save();

    return res.status(200).json(risks);
  } catch (error) {
    console.error(`Risks Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Risk analysis failed: ${error.message}` });
  }
};

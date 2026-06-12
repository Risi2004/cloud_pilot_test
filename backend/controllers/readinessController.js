import Analysis from '../models/Analysis.js';
import { fetchRepositoryInfo } from '../services/githubService.js';
import { calculateReadiness } from '../services/readinessService.js';

/**
 * Controller to handle POST /api/readiness.
 * Returns the deployment readiness profile.
 */
export const getReadiness = async (req, res) => {
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

    // Calculate readiness profile
    const readiness = calculateReadiness(repoInfo, analysis);

    // Save calculation to DB
    analysis.readiness = readiness;
    await analysis.save();

    return res.status(200).json(readiness);
  } catch (error) {
    console.error(`Readiness Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Readiness calculation failed: ${error.message}` });
  }
};

import Analysis from '../models/Analysis.js';
import { aiDeploymentPlan } from '../services/ollamaService.js';

export const getDeploymentPlan = async (req, res) => {
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

    // Ensure recommendation exists; if not, use standard fallback logic to build mock recommendation info
    let recommendation = analysis.recommendation;
    if (!recommendation || !recommendation.frontend) {
      recommendation = {
        frontend: 'Vercel',
        backend: analysis.framework.includes('Express') ? 'Render' : 'None',
        reason: 'Auto-resolved configuration recommendation.',
        cost: '$7 - $20/month'
      };
    }

    // Generate plan steps
    const steps = await aiDeploymentPlan(analysis, recommendation);

    // Save to DB
    analysis.deploymentPlan = { steps };
    await analysis.save();

    return res.status(200).json({ steps });
  } catch (error) {
    console.error(`Deployment Plan Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Deployment plan generation failed: ${error.message}` });
  }
};

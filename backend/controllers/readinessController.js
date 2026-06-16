import Analysis from '../models/Analysis.js';

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

    if (!analysis || !analysis.report) {
      throw new Error('AnalysisMissingError: No analyzed project report found in the database. Run repository analysis first.');
    }

    const score = analysis.report.deploymentReadinessScore || 50;
    const readinessLevel = score >= 80 ? 'High' : (score >= 45 ? 'Medium' : 'Low');

    const readiness = {
      score,
      readinessLevel,
      missingItems: []
    };

    // Save calculation to DB
    analysis.readiness = readiness;
    await analysis.save();

    return res.status(200).json(readiness);
  } catch (error) {
    console.error(`Readiness Controller Error: ${error.message}`);
    return res.status(500).json({ error: `${error.message}` });
  }
};

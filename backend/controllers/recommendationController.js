import Analysis from '../models/Analysis.js';

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

    if (!analysis || !analysis.report) {
      throw new Error('AnalysisMissingError: No analyzed project report found in the database. Run repository analysis first.');
    }

    const report = analysis.report;
    
    // Extract clean frontend and backend platforms from hostingRecommendation
    const hosting = report.hostingRecommendation || '';
    const frontend = hosting.includes('Vercel') ? 'Vercel' : (hosting.includes('Render') ? 'Render' : 'None');
    const backend = hosting.includes('Render') ? 'Render' : (hosting.includes('Vercel') ? 'Vercel' : 'None');

    const recommendation = {
      frontend,
      backend,
      reason: report.scalabilityAnalysis || 'Recommendation based on project framework characteristics.',
      cost: report.estimatedMonthlyCost || '$0/month'
    };

    // Save changes to DB
    analysis.recommendation = recommendation;
    await analysis.save();

    return res.status(200).json(analysis.recommendation);
  } catch (error) {
    console.error(`Recommendation Controller Error: ${error.message}`);
    return res.status(500).json({ error: `${error.message}` });
  }
};

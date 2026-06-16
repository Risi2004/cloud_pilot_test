import Analysis from '../models/Analysis.js';

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

    if (!analysis || !analysis.report) {
      throw new Error('AnalysisMissingError: No analyzed project report found in the database. Run repository analysis first.');
    }

    // Security risks can be compiled from analysis.report or risks object if populated by workflow
    const risksList = analysis.report.risks || [];
    const score = analysis.report.securityScore || 100;
    const severity = score < 50 ? 'High' : (score < 80 ? 'Medium' : 'Low');

    const risks = {
      risks: risksList,
      severity
    };

    // Save calculation to DB
    analysis.risks = risks;
    await analysis.save();

    return res.status(200).json(risks);
  } catch (error) {
    console.error(`Risks Controller Error: ${error.message}`);
    return res.status(500).json({ error: `${error.message}` });
  }
};

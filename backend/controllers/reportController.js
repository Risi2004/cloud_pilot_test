import Analysis from '../models/Analysis.js';

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

    if (!analysis || !analysis.report) {
      throw new Error('AnalysisMissingError: No analyzed project report found in the database. Run repository analysis first.');
    }

    const report = analysis.report;

    const fullReport = {
      projectType: report.projectType || 'Full Stack Application',
      architecture: report.architectureType || 'Full Stack',
      frontend: report.frontendStack || 'None',
      backend: report.backendStack || 'None',
      database: report.databaseStack || 'None',
      authentication: report.authentication || 'None',
      storage: report.storage || 'None',
      complexityScore: report.complexityScore || 50,
      deploymentReadiness: {
        score: report.deploymentReadinessScore || 50,
        readinessLevel: (report.deploymentReadinessScore || 50) >= 80 ? 'High' : ((report.deploymentReadinessScore || 50) >= 45 ? 'Medium' : 'Low'),
        missingItems: []
      },
      hostingRecommendation: {
        frontend: report.hostingRecommendation?.includes('Vercel') ? 'Vercel' : 'None',
        backend: report.hostingRecommendation?.includes('Render') ? 'Render' : 'None',
        reason: report.scalabilityAnalysis || ''
      },
      estimatedCost: {
        frontend: report.estimatedMonthlyCost || '$0/month',
        backend: '',
        database: '',
        total: report.estimatedMonthlyCost || '$0/month'
      },
      risks: [
        ...(report.risks || []).map(r => ({
          metric: 'Security',
          details: `${r.key}: ${r.description}`,
          severity: r.severity || 'Medium'
        })),
        ...(report.requiredEnvironmentVariables || []).map(variable => ({
          metric: 'Environment',
          details: `Configuration variable required: ${variable}`,
          severity: 'Low'
        }))
      ]
    };

    analysis.architectureReport = fullReport;
    await analysis.save();

    return res.status(200).json(fullReport);
  } catch (error) {
    console.error(`Report Controller Error: ${error.message}`);
    return res.status(500).json({ error: `${error.message}` });
  }
};

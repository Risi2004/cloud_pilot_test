/**
 * Service to assemble the final CloudPilot Architecture Report.
 */
export const generateArchitectureReport = (analysis, readiness, risks, recommendation) => {
  return {
    projectType: analysis.report?.projectType || 'Full Stack Application',
    architecture: analysis.report?.architectureType || 'Full Stack',
    frontend: analysis.framework || 'React (Vite)',
    backend: analysis.framework.toLowerCase().includes('express') || analysis.dependencies.includes('express') 
      ? 'Express.js on Node.js' 
      : 'None',
    database: analysis.database || 'None',
    authentication: analysis.report?.authentication || 'None',
    storage: analysis.report?.storage || 'None',
    complexityScore: analysis.report?.complexityScore || 50,
    deploymentReadiness: {
      score: readiness.score,
      readinessLevel: readiness.readinessLevel,
      missingItems: readiness.missingItems
    },
    hostingRecommendation: {
      frontend: recommendation.platformRecommendations.frontend,
      backend: recommendation.platformRecommendations.backend,
      reason: recommendation.platformRecommendations.reason
    },
    estimatedCost: {
      frontend: recommendation.costEstimate.frontend,
      backend: recommendation.costEstimate.backend,
      database: recommendation.costEstimate.database,
      total: recommendation.costEstimate.total
    },
    risks: risks.risks.map(r => ({
      metric: r.metric,
      details: r.details,
      severity: r.severity
    }))
  };
};

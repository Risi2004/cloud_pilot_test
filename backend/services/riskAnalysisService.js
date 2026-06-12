/**
 * Service to analyze code architecture and scan for configuration, reliability, and security risks.
 */
export const performRiskAnalysis = (repoInfo, analysis) => {
  const risks = [];

  const framework = (analysis.framework || '').toLowerCase();
  const hasBackend = framework.includes('express') || framework.includes('node') || framework.includes('nestjs') || framework.includes('fastify') || framework.includes('django') || framework.includes('flask') || framework.includes('fastapi');

  // 1. Missing Environment Variables Configuration (Medium Severity)
  if (!repoInfo.envExample) {
    risks.push({
      metric: 'Configuration',
      details: 'No .env.example file was found in the repository root. This increases deployment complexity and risk of missing configurations.',
      severity: 'Medium'
    });
  }

  // 2. Missing Dockerfile for Backend applications (Low/Medium Severity)
  if (!repoInfo.dockerfile && hasBackend) {
    risks.push({
      metric: 'Dockerization',
      details: 'Missing Dockerfile. Express/Node applications running in microservice environments should containerize to guarantee environment parity.',
      severity: 'Low'
    });
  }

  // 3. Missing or sparse documentation (Low Severity)
  if (!repoInfo.readme || repoInfo.readme.trim().length < 100) {
    risks.push({
      metric: 'Documentation',
      details: 'README.md is missing or contains insufficient details. This raises onboarding difficulties and configuration ambiguity.',
      severity: 'Low'
    });
  }

  // 4. Missing Health Check Endpoint (Medium Severity)
  // Check if file list or config contains any indicators of server status or health probes
  const filesList = repoInfo.fileList || [];
  const hasHealthFile = filesList.some(f => f.toLowerCase().includes('health') || f.toLowerCase().includes('status'));
  if (!hasHealthFile && hasBackend) {
    risks.push({
      metric: 'Reliability',
      details: 'No health check route or file detected. Platforms like Render require health endpoint checks (e.g. /healthz) to coordinate zero-downtime rolling updates.',
      severity: 'Medium'
    });
  }

  // 5. Missing Error Handling Middlewares (Low Severity)
  let hasExpressErrorHandling = true;
  if (repoInfo.packageJson && framework.includes('express')) {
    const mainFileContent = repoInfo.viteConfig || ''; // fallback search space
    if (mainFileContent && !mainFileContent.includes('err, req, res') && !mainFileContent.includes('errorHandler')) {
      hasExpressErrorHandling = false;
    }
  }
  if (!hasExpressErrorHandling) {
    risks.push({
      metric: 'Error Handling',
      details: 'No global Express error handling middleware or catch-all block identified. Unhandled rejections could cause the server instance to crash under load.',
      severity: 'Medium'
    });
  }

  // 6. Hardcoded secrets scanner (High Severity)
  // Scans file summaries, configs, package descriptors, and readmes for potential keys/tokens
  const contentToScan = [
    repoInfo.viteConfig || '',
    repoInfo.nextConfig || '',
    repoInfo.envExample || '',
    repoInfo.packageJson ? JSON.stringify(repoInfo.packageJson) : '',
    repoInfo.readme || ''
  ].join('\n').toLowerCase();

  // Basic regex check for hardcoded assignments of keys, tokens, or credentials
  const secretsRegex = /(api_key|apikey|secret|password|db_uri|database_url)\s*=\s*['"`][a-zA-Z0-9_\-\.\:\/@]{8,}['"`]/gi;
  const matches = contentToScan.match(secretsRegex);

  if (matches && matches.length > 0) {
    risks.push({
      metric: 'Security',
      details: `Possible hardcoded credentials/secrets detected inside files: ${matches.slice(0, 2).join(', ')}. Hardcoded credentials risk code leaks.`,
      severity: 'High'
    });
  }

  // Determine overall severity tier
  let severity = 'Low';
  if (risks.some(r => r.severity === 'High')) {
    severity = 'High';
  } else if (risks.some(r => r.severity === 'Medium')) {
    severity = 'Medium';
  }

  return {
    risks,
    severity
  };
};

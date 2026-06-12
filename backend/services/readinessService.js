/**
 * Service to calculate deployment readiness score and level based on repository artifacts.
 */
export const calculateReadiness = (repoInfo, analysis) => {
  const missingItems = [];
  let score = 0;

  // 1. Build scripts checks (25 points)
  let hasBuildScript = false;
  if (repoInfo.packageJson) {
    try {
      const pkg = typeof repoInfo.packageJson === 'string' ? JSON.parse(repoInfo.packageJson) : repoInfo.packageJson;
      const scripts = pkg.scripts || {};
      if (scripts.build || scripts.compile || scripts.prod) {
        hasBuildScript = true;
      }
    } catch (e) {}
  } else if (repoInfo.requirementsTxt) {
    // Python projects typically don't require compilation, but we check for setup files if present
    hasBuildScript = true;
  }

  if (hasBuildScript) {
    score += 25;
  } else {
    missingItems.push('Production build/compile script in package.json (e.g., "build": "vite build" or "build": "next build")');
  }

  // 2. Environment Variables configuration check (20 points)
  if (repoInfo.envExample && repoInfo.envExample.trim().length > 0) {
    score += 20;
  } else {
    missingItems.push('.env.example documentation file to list environment configurations');
  }

  // 3. Docker support check (15 points)
  if (repoInfo.dockerfile) {
    score += 15;
  } else {
    missingItems.push('Dockerfile for containerized cloud execution (recommended for Render/docker services)');
  }

  // 4. README documentation quality check (20 points)
  let readmePoints = 0;
  if (repoInfo.readme && repoInfo.readme.trim().length > 50) {
    const text = repoInfo.readme.toLowerCase();
    readmePoints += 10; // Found readme of decent length
    
    // Check key documentation headings
    const checks = ['install', 'setup', 'usage', 'deploy', 'configure', 'env'];
    const hits = checks.filter(check => text.includes(check)).length;
    
    if (hits >= 3) readmePoints += 10;
    else if (hits >= 1) readmePoints += 5;
  }

  score += readmePoints;
  if (readmePoints < 20) {
    missingItems.push('Comprehensive README.md with Setup and Deployment instructions');
  }

  // 5. Database Configuration & Client ORM dependency check (20 points)
  if (analysis.database === 'None') {
    score += 20; // Ready, no DB configs needed
  } else {
    const deps = analysis.dependencies || [];
    const hasOrm = deps.some(d => 
      ['mongoose', 'mongodb', 'pg', 'sequelize', 'prisma', 'mysql2', 'sqlite3', 'pymongo', 'sqlalchemy'].includes(d)
    );
    if (hasOrm) {
      score += 20;
    } else {
      missingItems.push(`Client driver/ORM dependencies for ${analysis.database} database integration (e.g. mongoose, prisma, pg)`);
    }
  }

  // Determine readiness level
  let readinessLevel = 'Low';
  if (score >= 80) {
    readinessLevel = 'High';
  } else if (score >= 45) {
    readinessLevel = 'Medium';
  }

  return {
    score: Math.min(100, score),
    readinessLevel,
    missingItems
  };
};

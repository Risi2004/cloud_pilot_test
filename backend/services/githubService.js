import axios from 'axios';

/**
 * Extracts owner and repository name from a GitHub URL.
 * Supports format: https://github.com/owner/repo
 */
export const parseGitHubUrl = (url) => {
  try {
    const cleanedUrl = url.trim().replace(/\/$/, '');
    const match = cleanedUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL format. Use https://github.com/owner/repo');
    }
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    return { owner, repo };
  } catch (error) {
    throw new Error(`Failed to parse URL: ${error.message}`);
  }
};

/**
 * Attempts to fetch a raw file from GitHub for main or master branches.
 */
const fetchRawFile = async (owner, repo, filepath) => {
  const branches = ['main', 'master'];
  for (const branch of branches) {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filepath}`;
      const response = await axios.get(url, { timeout: 5000 });
      if (response.status === 200) {
        return { content: response.data, success: true };
      }
    } catch (e) {
      // Continue to next branch
    }
  }
  return { content: null, success: false };
};

/**
 * Analyzes repository files to extract preliminary project structure.
 */
export const fetchRepositoryInfo = async (githubUrl) => {
  const { owner, repo } = parseGitHubUrl(githubUrl);
  
  const result = {
    name: repo,
    owner: owner,
    packageJson: null,
    requirementsTxt: null,
    packageLockExists: false,
    viteConfig: null,
    nextConfig: null,
    dockerfile: null,
    dockerCompose: null,
    envExample: null,
    readme: null,
    fileList: [],
    detectedLanguage: 'unknown'
  };

  // Fetch file list tree recursively
  let allFiles = [];
  const branches = ['main', 'master'];
  for (const branch of branches) {
    try {
      const treeRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=true`, { timeout: 4000 });
      if (treeRes.status === 200 && treeRes.data && Array.isArray(treeRes.data.tree)) {
        allFiles = treeRes.data.tree.map(f => f.path);
        break;
      }
    } catch (e) {
      // Ignore and try next branch
    }
  }

  // Fallback if recursive tree API failed/is not available
  if (allFiles.length === 0) {
    try {
      const apiRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`, { timeout: 3000 });
      if (apiRes.status === 200 && Array.isArray(apiRes.data)) {
        allFiles = apiRes.data.map(f => f.name);
      }
    } catch (e) {}
  }

  result.fileList = allFiles;

  // Helper to find path by name, prioritizing root then subfolders
  const findConfigPaths = (filename) => {
    return allFiles.filter(f => f === filename || f.endsWith('/' + filename));
  };

  // Fetch package.json (merge up to 3 if multiple found)
  const pkgPaths = findConfigPaths('package.json');
  if (pkgPaths.length > 0) {
    let mergedPkg = { dependencies: {}, devDependencies: {}, scripts: {} };
    let hasPkg = false;
    for (const p of pkgPaths.slice(0, 3)) {
      const pkgRes = await fetchRawFile(owner, repo, p);
      if (pkgRes.success) {
        hasPkg = true;
        try {
          const parsed = typeof pkgRes.content === 'string' ? JSON.parse(pkgRes.content) : pkgRes.content;
          Object.assign(mergedPkg.dependencies, parsed.dependencies || {});
          Object.assign(mergedPkg.devDependencies, parsed.devDependencies || {});
          Object.assign(mergedPkg.scripts, parsed.scripts || {});
        } catch (e) {}
      }
    }
    if (hasPkg) {
      result.packageJson = JSON.stringify(mergedPkg, null, 2);
      result.detectedLanguage = 'javascript';
    }
  }

  // Fetch requirements.txt (merge up to 3 if multiple found)
  const reqPaths = findConfigPaths('requirements.txt');
  if (reqPaths.length > 0) {
    let combinedReq = '';
    for (const p of reqPaths.slice(0, 3)) {
      const reqRes = await fetchRawFile(owner, repo, p);
      if (reqRes.success) {
        combinedReq += (typeof reqRes.content === 'string' ? reqRes.content : JSON.stringify(reqRes.content)) + '\n';
      }
    }
    if (combinedReq.trim()) {
      result.requirementsTxt = combinedReq;
      result.detectedLanguage = 'python';
    }
  }

  // Check package-lock.json existence
  result.packageLockExists = allFiles.some(f => f === 'package-lock.json' || f.endsWith('/package-lock.json'));

  // Fetch vite.config.js (first match)
  const vitePath = allFiles.find(f => f === 'vite.config.js' || f.endsWith('/vite.config.js'));
  if (vitePath) {
    const viteRes = await fetchRawFile(owner, repo, vitePath);
    if (viteRes.success) result.viteConfig = viteRes.content;
  }

  // Fetch next.config.js or next.config.mjs (first match)
  const nextPath = allFiles.find(f => 
    f === 'next.config.js' || f.endsWith('/next.config.js') || 
    f === 'next.config.mjs' || f.endsWith('/next.config.mjs')
  );
  if (nextPath) {
    const nextRes = await fetchRawFile(owner, repo, nextPath);
    if (nextRes.success) result.nextConfig = nextRes.content;
  }

  // Fetch Dockerfile (first match)
  const dockerPath = allFiles.find(f => 
    f.toLowerCase() === 'dockerfile' || f.toLowerCase().endsWith('/dockerfile')
  );
  if (dockerPath) {
    const dockerRes = await fetchRawFile(owner, repo, dockerPath);
    if (dockerRes.success) result.dockerfile = dockerRes.content;
  }

  // Fetch docker-compose.yml / docker-compose.yaml (first match)
  const composePath = allFiles.find(f => 
    f === 'docker-compose.yml' || f.endsWith('/docker-compose.yml') ||
    f === 'docker-compose.yaml' || f.endsWith('/docker-compose.yaml')
  );
  if (composePath) {
    const composeRes = await fetchRawFile(owner, repo, composePath);
    if (composeRes.success) result.dockerCompose = composeRes.content;
  }

  // Fetch .env.example (merge up to 3)
  const envPaths = findConfigPaths('.env.example');
  if (envPaths.length > 0) {
    let combinedEnv = '';
    for (const p of envPaths.slice(0, 3)) {
      const envRes = await fetchRawFile(owner, repo, p);
      if (envRes.success) {
        combinedEnv += (typeof envRes.content === 'string' ? envRes.content : JSON.stringify(envRes.content)) + '\n';
      }
    }
    if (combinedEnv.trim()) {
      result.envExample = combinedEnv;
    }
  }

  // Fetch README.md / readme.md (first match)
  const readmePath = allFiles.find(f => 
    f.toLowerCase() === 'readme.md' || f.toLowerCase().endsWith('/readme.md')
  );
  if (readmePath) {
    const readmeRes = await fetchRawFile(owner, repo, readmePath);
    if (readmeRes.success) {
      result.readme = typeof readmeRes.content === 'string'
        ? readmeRes.content.substring(0, 2000)
        : JSON.stringify(readmeRes.content).substring(0, 2000);
    }
  }

  return result;
};

/**
 * Extracts environment keys from raw .env.example content.
 */
export const extractEnvKeys = (envContent) => {
  if (!envContent) return [];
  try {
    const lines = typeof envContent === 'string' ? envContent.split(/\r?\n/) : [];
    const keys = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)/);
        if (match) {
          const key = match[1].trim();
          if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
            keys.push(key);
          }
        }
      }
    }
    return keys;
  } catch (e) {
    return [];
  }
};

/**
 * Generates fallback report structure mapping the full 20 detection checklist categories.
 */
export const generateFallbackReport = (repoInfo, basic) => {
  let deps = basic.dependencies || [];
  if (!Array.isArray(deps)) {
    if (deps && typeof deps === 'object') {
      deps = Object.keys(deps);
    } else if (typeof deps === 'string') {
      deps = [deps];
    } else {
      deps = [];
    }
  }
  const lowerDeps = deps.map(d => d.toLowerCase());
  
  let envKeys = basic.envVariables || [];
  if (!Array.isArray(envKeys)) {
    if (envKeys && typeof envKeys === 'object') {
      envKeys = Object.keys(envKeys);
    } else if (typeof envKeys === 'string') {
      envKeys = [envKeys];
    } else {
      envKeys = [];
    }
  }
  
  // Heuristic detections
  // 1. App Type
  let appType = "Portfolio Website";
  if (deps.some(d => d.includes('stripe') || d.includes('paypal'))) {
    appType = "E-Commerce Platform";
  } else if (deps.some(d => d.includes('openai') || d.includes('gemini') || d.includes('langchain') || d.includes('ollama'))) {
    appType = "AI Application";
  } else if (deps.some(d => d.includes('express') || d.includes('fastify')) && !deps.some(d => d.includes('react') || d.includes('vue'))) {
    appType = "API Service";
  } else if (deps.some(d => d.includes('chart') || d.includes('recharts') || d.includes('dashboard'))) {
    appType = "Dashboard";
  } else if (deps.some(d => d.includes('clerk') || d.includes('auth0') || d.includes('next-auth')) && basic.framework === 'Next.js') {
    appType = "SaaS Platform";
  }

  // Normalize Database
  let detectedDb = basic.database || 'None';
  if (detectedDb.toLowerCase() === 'mongodb') {
    detectedDb = 'MongoDB';
  } else if (detectedDb.toLowerCase() === 'postgresql' || detectedDb.toLowerCase() === 'postgres') {
    detectedDb = 'PostgreSQL';
  } else if (detectedDb.toLowerCase() === 'mysql') {
    detectedDb = 'MySQL';
  } else if (detectedDb.toLowerCase() === 'sqlite') {
    detectedDb = 'SQLite';
  }
  
  if (detectedDb === 'None') {
    if (deps.some(d => d === 'mongoose' || d === 'mongodb' || d.includes('pymongo'))) {
      detectedDb = 'MongoDB';
    } else if (deps.some(d => d === 'pg' || d.includes('postgres') || d.includes('psycopg2'))) {
      detectedDb = 'PostgreSQL';
    } else if (deps.some(d => d === 'mysql' || d === 'mysql2')) {
      detectedDb = 'MySQL';
    } else if (deps.some(d => d === 'sqlite3')) {
      detectedDb = 'SQLite';
    }
  }

  // Normalize Framework
  const frameworkName = (basic.framework || '').toLowerCase();

  // 2. Architecture Type
  const hasExpress = deps.some(d => d === 'express' || d === 'fastify' || d === '@nestjs/core');
  const hasPythonBackend = deps.some(d => ['django', 'flask', 'fastapi'].includes(d.toLowerCase()));
  const hasBackendApp = frameworkName.includes('express') || frameworkName.includes('nest') || frameworkName.includes('fastify') || frameworkName.includes('django') || frameworkName.includes('flask') || frameworkName.includes('fastapi') || hasExpress || hasPythonBackend;

  const hasReact = deps.some(d => d.includes('react') || d.includes('next') || d.includes('vue') || d.includes('svelte'));
  const hasFrontendApp = ['react', 'vue', 'next', 'angular', 'svelte', 'astro', 'nuxt'].some(f => frameworkName.includes(f)) || hasReact;

  let archType = "Full Stack Application";
  if (hasFrontendApp && !hasBackendApp) {
    archType = "Frontend Only";
  } else if (hasBackendApp && !hasFrontendApp) {
    archType = "Backend Only";
  }

  const isFrontend = archType === "Frontend Only";
  const isBackend = archType === "Backend Only" || archType === "Full Stack Application";

  // 3. Frontend frameworks
  let feFramework = "None";
  if (deps.some(d => d.includes('next'))) feFramework = "Next.js";
  else if (deps.some(d => d.includes('react'))) feFramework = "React";
  else if (deps.some(d => d.includes('vue'))) feFramework = "Vue";
  else if (deps.some(d => d.includes('svelte'))) feFramework = "Svelte";

  // 4. Build tools
  let buildTool = "None";
  if (repoInfo.viteConfig || deps.some(d => d.includes('vite'))) buildTool = "Vite";
  else if (deps.some(d => d.includes('webpack'))) buildTool = "Webpack";

  // 5. UI Libraries
  let uiLibrary = "None";
  if (deps.some(d => d.includes('tailwindcss'))) uiLibrary = "Tailwind CSS";
  else if (deps.some(d => d.includes('@mui/material'))) uiLibrary = "Material UI";
  else if (deps.some(d => d.includes('bootstrap'))) uiLibrary = "Bootstrap";

  // 6. Routing
  let routing = "None";
  if (deps.some(d => d.includes('react-router-dom'))) routing = "React Router";
  else if (feFramework === "Next.js") routing = "Next Router";

  // 7. Backend runtime/frameworks
  let beRuntime = "None";
  let beFramework = "None";
  if (frameworkName.includes('express') || deps.some(d => d === 'express')) {
    beRuntime = "Node.js (Express)";
    beFramework = "Express";
  } else if (frameworkName.includes('nest') || deps.some(d => d === '@nestjs/core')) {
    beRuntime = "Node.js (NestJS)";
    beFramework = "NestJS";
  } else if (frameworkName.includes('fastify') || deps.some(d => d === 'fastify')) {
    beRuntime = "Node.js (Fastify)";
    beFramework = "Fastify";
  } else if (frameworkName.includes('django') || deps.some(d => d.toLowerCase().includes('django'))) {
    beRuntime = "Python (Django)";
    beFramework = "Django";
  } else if (frameworkName.includes('flask') || deps.some(d => d.toLowerCase().includes('flask'))) {
    beRuntime = "Python (Flask)";
    beFramework = "Flask";
  } else if (frameworkName.includes('fastapi') || deps.some(d => d.toLowerCase().includes('fastapi'))) {
    beRuntime = "Python (FastAPI)";
    beFramework = "FastAPI";
  }

  // 8. ORMs
  let orm = "None";
  if (deps.some(d => d.includes('mongoose'))) orm = "Mongoose";
  else if (deps.some(d => d.includes('prisma'))) orm = "Prisma";
  else if (deps.some(d => d.includes('sequelize'))) orm = "Sequelize";

  // 9. Auth
  let authMethod = "None";
  if (lowerDeps.some(d => d.includes('passport'))) {
    authMethod = "Passport";
  } else if (lowerDeps.some(d => d.includes('next-auth') || d.includes('@auth/'))) {
    authMethod = "NextAuth";
  } else if (lowerDeps.some(d => d.includes('clerk'))) {
    authMethod = "Clerk";
  } else if (
    lowerDeps.some(d => d.includes('jsonwebtoken') || d.includes('jwt') || d.includes('jose') || d.includes('pyjwt')) ||
    envKeys.some(k => /jwt|token_secret|access_token|refresh_token|auth_secret/i.test(k))
  ) {
    authMethod = "JWT";
  }

  // 10. Storage
  let storageProvider = "None";
  if (
    lowerDeps.some(d => d.includes('cloudflare') || d.includes('wrangler') || d.includes('miniflare') || d === 'r2') ||
    envKeys.some(k => /cloudflare|cf_r2|r2_bucket|r2_access|r2_secret|r2_endpoint/i.test(k))
  ) {
    storageProvider = "Cloudflare Storage (R2/KV)";
  } else if (lowerDeps.some(d => d.includes('cloudinary'))) {
    storageProvider = "Cloudinary";
  } else if (lowerDeps.some(d => d.includes('aws-sdk') || d.includes('@aws-sdk'))) {
    storageProvider = "AWS S3";
  }

  // 11. Payments
  let paymentProvider = "None";
  if (deps.some(d => d.includes('stripe'))) paymentProvider = "Stripe";
  else if (deps.some(d => d.includes('paypal'))) paymentProvider = "PayPal";

  // 12. AI & Agentic AI
  const aiProviders = [];
  if (deps.some(d => d.includes('openai'))) aiProviders.push("OpenAI");
  if (deps.some(d => d.includes('google-generative-ai'))) aiProviders.push("Gemini");
  if (deps.some(d => d.includes('ollama'))) aiProviders.push("Ollama");

  const aiFrameworks = [];
  if (deps.some(d => d.includes('langchain'))) aiFrameworks.push("LangChain");

  const vectorDbs = [];
  if (deps.some(d => d.includes('pinecone'))) vectorDbs.push("Pinecone");
  if (deps.some(d => d.includes('qdrant'))) vectorDbs.push("Qdrant");

  // 13. Deployment
  let containerization = "None";
  if (repoInfo.dockerfile) containerization = "Dockerfile";
  if (repoInfo.dockerCompose) containerization = "Dockerfile & Docker Compose";

  let cicd = "None";
  if (repoInfo.fileList.some(f => f.includes('.github'))) cicd = "GitHub Actions";

  // 14. Third-Party Services
  let thirdPartyComm = "None";
  if (deps.some(d => d.includes('twilio'))) thirdPartyComm = "Twilio";
  else if (deps.some(d => d.includes('nodemailer'))) thirdPartyComm = "Nodemailer";

  let thirdPartyAnalytics = "None";
  if (deps.some(d => d.includes('google-analytics'))) thirdPartyAnalytics = "Google Analytics";

  // 15. Env Variables
  const sensitiveKeys = envKeys.filter(k => 
    /SECRET|KEY|PASSWORD|TOKEN|AUTH|CREDENTIAL|PRIVATE/i.test(k)
  );
  const missingKeys = envKeys.filter(k => 
    !process.env[k]
  );

  // 16. Security Checks
  const hasHelmet = deps.some(d => d === 'helmet');
  const hasCors = deps.some(d => d === 'cors');
  const hasRateLimit = deps.some(d => d.includes('rate-limit'));
  const hasValidator = deps.some(d => d === 'zod' || d === 'joi' || d === 'express-validator');
  
  let securityScore = 40;
  if (hasHelmet) securityScore += 15;
  if (hasCors) securityScore += 15;
  if (hasRateLimit) securityScore += 15;
  if (hasValidator) securityScore += 15;
  securityScore = Math.min(100, securityScore);

  // 17. Complexity Analysis
  let feComp = "Low";
  let beComp = "Low";
  let dbComp = "Low";
  if (deps.length > 25) {
    feComp = "High";
    beComp = "High";
  } else if (deps.length > 10) {
    feComp = "Medium";
    beComp = "Medium";
  }
  if (detectedDb !== "None") dbComp = "Medium";

  let complexityScore = 20;
  complexityScore += deps.length * 1.5;
  if (detectedDb !== "None") complexityScore += 15;
  if (authMethod !== "None") complexityScore += 15;
  if (aiProviders.length > 0) complexityScore += 20;
  complexityScore = Math.min(100, Math.round(complexityScore));

  // 18. Readiness Analysis
  const pkgJsonRaw = repoInfo.packageJson;
  let hasBuildScript = false;
  let hasStartScript = false;
  if (pkgJsonRaw) {
    try {
      const parsedPkg = typeof pkgJsonRaw === 'string' ? JSON.parse(pkgJsonRaw) : pkgJsonRaw;
      const scripts = parsedPkg.scripts || {};
      if (scripts.build) hasBuildScript = true;
      if (scripts.start) hasStartScript = true;
    } catch(e) {}
  }
  
  let readinessScore = 30;
  if (hasBuildScript) readinessScore += 25;
  if (hasStartScript) readinessScore += 25;
  if (basic.envVariables.length > 0) readinessScore += 10;
  if (repoInfo.dockerfile) readinessScore += 10;
  readinessScore = Math.min(100, readinessScore);

  // 19. Hosting Cost Estimates
  let feCost = "$0/month (Free Tier)";
  let beCost = "$0/month (Free Tier)";
  let dbCost = "$0/month (Shared Tier)";
  if (beFramework !== "None" || hasBackendApp) {
    beCost = "$7/month (Hobby Tier)";
  }
  if (detectedDb !== "None") {
    dbCost = "$0/month (MongoDB Atlas Free Shared)";
  }
  let estCost = hasFrontendApp && !hasBackendApp ? "$0/month (Vercel Free)" : "$7 - $20/month (Vercel Free + Render Hobby)";

  // 20. Scalability Estimates
  let scalingDiff = "Low";
  if (detectedDb !== "None") scalingDiff = "Medium";
  if (aiProviders.length > 0) scalingDiff = "Medium";

  return {
    projectName: basic.name || repoInfo.name,
    projectType: appType,
    architectureType: archType,
    frontendStack: feFramework !== "None" ? `${feFramework} (Build: ${buildTool}, UI: ${uiLibrary})` : "None",
    backendStack: beFramework !== "None" ? `${beFramework} on ${beRuntime}` : "None",
    databaseStack: detectedDb !== "None" ? `${detectedDb} (Managed: ${detectedDb === "MongoDB" ? "MongoDB Atlas" : "Supabase"}, ORM: ${orm})` : "None",
    authentication: authMethod,
    storage: storageProvider,
    payments: paymentProvider,
    aiServices: aiProviders.length > 0 ? `${aiProviders.join(', ')} (Frameworks: ${aiFrameworks.join(', ')}, VectorDBs: ${vectorDbs.join(', ')})` : "None",
    thirdPartyServices: [thirdPartyComm, thirdPartyAnalytics].filter(x => x !== "None").join(', ') || "None",
    containerization: containerization,
    securityScore: securityScore,
    complexityScore: complexityScore,
    deploymentReadinessScore: readinessScore,
    hostingRecommendation: `${hasFrontendApp ? "Frontend: Vercel" : ""} ${hasBackendApp ? "Backend: Render" : ""} ${detectedDb !== "None" ? `Database: ${detectedDb === "MongoDB" ? "MongoDB Atlas" : "Supabase"}` : ""}`.trim(),
    estimatedMonthlyCost: estCost,
    scalabilityAnalysis: `User Capacity: ${hasFrontendApp && !hasBackendApp ? "Up to 50k users/month" : "Up to 10k users/month"}. Difficulty: ${scalingDiff}. Growth: Upgrade CPU/RAM tiers as needed.`,
    deploymentDifficulty: complexityScore > 70 ? "High" : complexityScore > 30 ? "Medium" : "Low",
    requiredEnvironmentVariables: envKeys,
    recommendedDeploymentPlan: [
      hasFrontendApp ? `Deploy Frontend: Link repository to Vercel and configure root settings.` : null,
      hasBackendApp ? `Deploy Backend API: Setup web service container on Render.` : null,
      detectedDb !== "None" ? `Link database connection string under environment variables.` : null
    ].filter(Boolean)
  };
};



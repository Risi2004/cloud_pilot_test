import axios from 'axios';

const getOllamaUrl = () => {
  const url = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434';
  return `${url}/api/generate`;
};

const getModelName = () => {
  return process.env.OLLAMA_MODEL || 'qwen3:8b';
};

/**
 * Sends a prompt to Ollama with a timeout.
 * Strips out markdown formatting to safely parse JSON if required.
 */
export const queryOllama = async (prompt, systemPrompt = '') => {
  const url = getOllamaUrl();
  const model = getModelName();
  
  try {
    const response = await axios.post(url, {
      model: model,
      prompt: systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt,
      stream: false,
      think: false,
      options: {
        temperature: 0.3,
        num_predict: 800
      }
    }, {
      timeout: 300000 // 5-minute timeout for local models
    });

    if (response.data && response.data.response) {
      return response.data.response.trim();
    }
    throw new Error('Empty response from Ollama');
  } catch (error) {
    console.error(`Ollama Service Error: ${error.message}`);
    throw error;
  }
};

/**
 * Attempts to parse a JSON object from text, cleaning markdown fences.
 */
const parseJSONSafely = (text) => {
  let cleaned = text.trim();
  // Strip markdown fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  
  // Try finding JSON object in the text if there is leading text
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  return JSON.parse(cleaned);
};

/**
 * Generates repository analysis via AI.
 */
export const aiAnalyze = async (repoInfo, fallbackData) => {
  const systemPrompt = `You are a technical code analyzer. Analyze the provided repository files and structure, and output a JSON representation of the configuration.
You MUST respond with ONLY a valid JSON object matching this structure:
{
  "framework": "detected main framework (e.g. React, Next.js, Express, Django, FastAPI)",
  "database": "detected database (e.g. MongoDB, PostgreSQL, MySQL, SQLite, None)",
  "dependencies": ["dependency1", "dependency2", ...],
  "complexity": "Low, Medium, or High",
  "envVariables": ["KEY1", "KEY2", ...],
  "dockerized": true or false
}
Do not write any conversational text, explanations, or code blocks. Only return the JSON.`;

  const filesSummary = `
Repository: ${repoInfo.name}
Language: ${repoInfo.detectedLanguage}
Files in root: ${repoInfo.fileList.join(', ') || 'unknown'}
package-lock.json exists: ${repoInfo.packageLockExists}
vite.config.js contents: ${repoInfo.viteConfig || 'none'}
next.config.js contents: ${repoInfo.nextConfig || 'none'}
dockerfile contents: ${repoInfo.dockerfile || 'none'}
docker-compose.yml contents: ${repoInfo.dockerCompose || 'none'}
.env.example contents: ${repoInfo.envExample || 'none'}
README.md contents: ${repoInfo.readme || 'none'}
package.json contents: ${repoInfo.packageJson ? (typeof repoInfo.packageJson === 'string' ? repoInfo.packageJson : JSON.stringify(repoInfo.packageJson)) : 'none'}
requirements.txt contents: ${repoInfo.requirementsTxt || 'none'}
  `;

  try {
    const rawResponse = await queryOllama(filesSummary, systemPrompt);
    const parsed = parseJSONSafely(rawResponse);
    return {
      framework: parsed.framework || fallbackData.framework,
      database: parsed.database || fallbackData.database,
      dependencies: parsed.dependencies || fallbackData.dependencies,
      complexity: parsed.complexity || fallbackData.complexity,
      envVariables: parsed.envVariables || fallbackData.envVariables,
      dockerized: parsed.dockerized !== undefined ? parsed.dockerized : fallbackData.dockerized
    };
  } catch (e) {
    console.warn('Ollama AI analysis failed, falling back to rule-based details.');
    return fallbackData;
  }
};

/**
 * Generates platform recommendations.
 */
export const aiRecommend = async (analysis) => {
  const systemPrompt = `You are a cloud architect. Based on the repository analysis, recommend a deployment architecture.
You only support Vercel and Render.
- Frontend static/Jamstack apps go to Vercel (e.g. React, Vue, Next.js static, Vite).
- Backends/APIs/Fullstack Node servers go to Render (e.g. Express, Django, FastAPI).
- Databases are hosted externally (e.g. MongoDB Atlas).

You MUST respond with ONLY a JSON object matching this structure:
{
  "frontend": "Vercel or None",
  "backend": "Render or None",
  "reason": "Clear explanation of why this division makes sense, noting specific tools and database integrations.",
  "cost": "Cost estimate in range format, e.g., $0 - $7/month or $7 - $20/month"
}
Do not write any conversational text. Only return the JSON.`;

  const promptInput = JSON.stringify(analysis);

  try {
    const rawResponse = await queryOllama(promptInput, systemPrompt);
    const parsed = parseJSONSafely(rawResponse);
    return {
      frontend: parsed.frontend || 'Vercel',
      backend: parsed.backend || 'Render',
      reason: parsed.reason || 'Optimal architecture division: Vite/React to Vercel, Express/Node.js to Render.',
      cost: parsed.cost || '$7 - $20/month'
    };
  } catch (e) {
    console.warn('Ollama AI recommendation failed, using standard fallback.');
    
    // Heuristic fallback
    const isFrontendOnly = ['React (Vite/SPA)', 'Vue.js', 'Next.js'].includes(analysis.framework) && analysis.database === 'None';
    return {
      frontend: 'Vercel',
      backend: isFrontendOnly ? 'None' : 'Render',
      reason: isFrontendOnly 
        ? 'Excellent Jamstack choice. Frontends are best suited for Vercel\'s CDN Edge networks.'
        : `Hybrid split: Frontend hosted on Vercel for fast loading; backend web service hosted on Render with a ${analysis.database || 'MongoDB'} connection.`,
      cost: isFrontendOnly ? '$0/month (Free Tier)' : '$7 - $20/month (Hobby tiers)'
    };
  }
};

/**
 * Generates step-by-step deployment instructions.
 */
export const aiDeploymentPlan = async (analysis, recommendation) => {
  const systemPrompt = `You are a DevOps engineer. Create a step-by-step deployment guide for the project.
Target platforms: Frontend: ${recommendation.frontend}, Backend: ${recommendation.backend}.
Database: ${analysis.database}.
Return ONLY a JSON object with a 'steps' array of string values. Example:
{
  "steps": [
    "Step 1: Create a Vercel project and link your repository.",
    "Step 2: ..."
  ]
}
Keep it short, clear, and actionable. Only return the JSON.`;

  const promptInput = JSON.stringify({ analysis, recommendation });

  try {
    const rawResponse = await queryOllama(promptInput, systemPrompt);
    const parsed = parseJSONSafely(rawResponse);
    if (parsed.steps && Array.isArray(parsed.steps)) {
      return parsed.steps;
    }
    throw new Error('Invalid steps structure');
  } catch (e) {
    console.warn('Ollama AI deployment plan failed, generating static checklist.');
    
    const steps = [];
    if (recommendation.frontend && recommendation.frontend !== 'None') {
      steps.push(`Step 1: Sign up on Vercel and import the GitHub repository.`);
      steps.push(`Step 2: Configure the build settings. For Vite, set Build Command to 'npm run build' and Output Directory to 'dist'.`);
    }
    if (recommendation.backend && recommendation.backend !== 'None') {
      steps.push(`Step 3: Create a Web Service on Render and link the GitHub repository.`);
      steps.push(`Step 4: Configure environment variables on Render (PORT=10000, MONGODB_URI).`);
    }
    if (analysis.database && analysis.database !== 'None') {
      steps.push(`Step 5: Access MongoDB Atlas, whitelist all IPs (0.0.0.0/0) or Render's IP range, and copy the connection string.`);
    }
    steps.push(`Step 6: Verify deployment by visiting the Vercel URL and testing backend endpoint connectivity.`);
    return steps;
  }
};

/**
 * Main chat handler.
 */
export const aiChat = async (message, history = []) => {
  const systemPrompt = `You are CloudPilot, an Autonomous Cloud Engineer.
Your task is to help developers deploy web applications.
You only support Vercel and Render for deployment recommendations.
You do NOT support AWS, Terraform, Kubernetes, advanced monitoring, or incident response. Keep responses focused entirely on lightweight hosting (Vercel, Render) and standard setups (MongoDB Atlas, Node.js, Express, Vite, Python, etc.).
Keep answers concise, clear, and helpful. Use markdown code snippets for environment configurations or CLI commands if needed.
`;

  // Construct context prompt using history
  let chatPrompt = '';
  history.forEach(turn => {
    chatPrompt += `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}\n`;
  });
  chatPrompt += `User: ${message}\nAssistant:`;

  try {
    return await queryOllama(chatPrompt, systemPrompt);
  } catch (e) {
    console.error('Ollama chat failed.');
    return "I'm sorry, I am currently having trouble connecting to my local AI engine. I specialize in deploying static frontends to Vercel and web servers to Render. Please ensure Ollama is running locally with the qwen3:8b model, or let me know how I can help you manually!";
  }
};

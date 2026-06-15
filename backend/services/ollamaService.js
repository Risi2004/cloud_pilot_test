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
export const queryOllama = async (prompt, systemPrompt = '', format = undefined) => {
  const url = getOllamaUrl();
  const model = getModelName();
  
  try {
    const requestData = {
      model: model,
      prompt: systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt,
      stream: false,
      think: false,
      options: {
        temperature: 0.3,
        num_predict: 800
      }
    };
    if (format) {
      requestData.format = format;
    }
    const response = await axios.post(url, requestData, {
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
export const aiAnalyze = async (repoInfo) => {
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
    const rawResponse = await queryOllama(filesSummary, systemPrompt, 'json');
    const parsed = parseJSONSafely(rawResponse);
    let deps = parsed.dependencies || [];
    if (!Array.isArray(deps)) {
      if (deps && typeof deps === 'object') {
        deps = Object.keys(deps);
      } else if (typeof deps === 'string') {
        deps = [deps];
      } else {
        deps = [];
      }
    }

    let envs = parsed.envVariables || [];
    if (!Array.isArray(envs)) {
      if (envs && typeof envs === 'object') {
        envs = Object.keys(envs);
      } else if (typeof envs === 'string') {
        envs = [envs];
      } else {
        envs = [];
      }
    }

    let db = parsed.database || 'None';
    if (db.toLowerCase() === 'mongodb') {
      db = 'MongoDB';
    } else if (db.toLowerCase() === 'postgresql' || db.toLowerCase() === 'postgres') {
      db = 'PostgreSQL';
    } else if (db.toLowerCase() === 'mysql') {
      db = 'MySQL';
    } else if (db.toLowerCase() === 'sqlite') {
      db = 'SQLite';
    } else if (db.toLowerCase() === 'none') {
      db = 'None';
    }

    let fw = parsed.framework || 'unknown';
    if (fw.toLowerCase() === 'express' || fw.toLowerCase() === 'express.js') {
      fw = 'Express.js';
    } else if (fw.toLowerCase() === 'nestjs' || fw.toLowerCase() === 'nest') {
      fw = 'NestJS';
    } else if (fw.toLowerCase() === 'react') {
      fw = 'React (Vite/SPA)';
    } else if (fw.toLowerCase() === 'nextjs' || fw.toLowerCase() === 'next.js') {
      fw = 'Next.js';
    } else if (fw.toLowerCase() === 'vue' || fw.toLowerCase() === 'vue.js') {
      fw = 'Vue.js';
    }

    return {
      framework: fw,
      database: db,
      dependencies: deps,
      complexity: parsed.complexity || 'Low',
      envVariables: envs,
      dockerized: parsed.dockerized !== undefined ? parsed.dockerized : false
    };
  } catch (e) {
    console.error(`Local Ollama model did not respond or failed to analyze: ${e.message}`);
    throw e;
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
    const rawResponse = await queryOllama(promptInput, systemPrompt, 'json');
    const parsed = parseJSONSafely(rawResponse);
    return {
      frontend: parsed.frontend || 'Vercel',
      backend: parsed.backend || 'Render',
      reason: parsed.reason || 'Optimal architecture division: Vite/React to Vercel, Express/Node.js to Render.',
      cost: parsed.cost || '$7 - $20/month'
    };
  } catch (e) {
    console.error(`Local Ollama model did not respond or failed to recommend: ${e.message}`);
    throw e;
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
    const rawResponse = await queryOllama(promptInput, systemPrompt, 'json');
    const parsed = parseJSONSafely(rawResponse);
    if (parsed.steps && Array.isArray(parsed.steps)) {
      return parsed.steps;
    }
    throw new Error('Invalid steps structure');
  } catch (e) {
    console.error(`Local Ollama model did not respond or failed to generate deployment plan: ${e.message}`);
    throw e;
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

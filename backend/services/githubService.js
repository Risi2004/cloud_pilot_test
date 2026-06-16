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





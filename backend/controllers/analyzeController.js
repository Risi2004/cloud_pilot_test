import Analysis from '../models/Analysis.js';
import { fetchRepositoryInfo, fallbackAnalyze, generateFallbackReport } from '../services/githubService.js';
import { aiAnalyze } from '../services/ollamaService.js';
import { scanLocalDirectory, importDirectoryFiles } from '../services/localScanService.js';

export const analyzeRepository = async (req, res) => {
  const { githubUrl } = req.body;

  if (!githubUrl) {
    return res.status(400).json({ error: 'GitHub URL is required' });
  }

  try {
    // Check MongoDB cache first to bypass rate-limits & speed up dashboard
    let analysis = await Analysis.findOne({ githubUrl });
    
    // Fetch fresh files
    const repoInfo = await fetchRepositoryInfo(githubUrl);
    
    // Run rule-based analysis (provides both final values and safety fallback values for the AI)
    const ruleDetails = fallbackAnalyze(repoInfo);

    // Run AI analysis (focuses only on fast core parameter extraction)
    const aiDetails = await aiAnalyze(repoInfo, ruleDetails);

    // Combine AI core details with fallback heuristics
    const mergedDetails = {
      framework: aiDetails.framework || ruleDetails.framework,
      database: aiDetails.database || ruleDetails.database,
      dependencies: aiDetails.dependencies || ruleDetails.dependencies,
      complexity: aiDetails.complexity || ruleDetails.complexity,
      envVariables: aiDetails.envVariables || ruleDetails.envVariables,
      dockerized: aiDetails.dockerized !== undefined ? aiDetails.dockerized : ruleDetails.dockerized
    };

    // Dynamically compile the full 20-point checklist report
    const finalReport = generateFallbackReport(repoInfo, mergedDetails);

    if (analysis) {
      // Update existing record
      analysis.framework = mergedDetails.framework;
      analysis.database = mergedDetails.database;
      analysis.dependencies = mergedDetails.dependencies;
      analysis.complexity = mergedDetails.complexity;
      analysis.envVariables = mergedDetails.envVariables;
      analysis.dockerized = mergedDetails.dockerized;
      analysis.report = finalReport;
      // Reset recommendations/plans for new analysis
      analysis.recommendation = { frontend: '', backend: '', reason: '', cost: '' };
      analysis.deploymentPlan = { steps: [] };
      analysis.createdAt = new Date();
      await analysis.save();
    } else {
      // Create new record
      analysis = new Analysis({
        githubUrl,
        framework: mergedDetails.framework,
        database: mergedDetails.database,
        dependencies: mergedDetails.dependencies,
        complexity: mergedDetails.complexity,
        envVariables: mergedDetails.envVariables,
        dockerized: mergedDetails.dockerized,
        report: finalReport
      });
      await analysis.save();
    }

    return res.status(200).json({
      _id: analysis._id,
      githubUrl: analysis.githubUrl,
      framework: analysis.framework,
      database: analysis.database,
      dependencies: analysis.dependencies,
      complexity: analysis.complexity,
      envVariables: analysis.envVariables,
      dockerized: analysis.dockerized,
      report: analysis.report
    });
  } catch (error) {
    console.error(`Analyze Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Analysis failed: ${error.message}` });
  }
};

export const analyzeEditorCode = async (req, res) => {
  const { files, projectName } = req.body;

  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'Workspace files object is required' });
  }

  try {
    const mockUrl = `editor://local-project-${Date.now()}`;
    
    const fileList = Object.keys(files);

    const findEditorFiles = (filename) => {
      return fileList.filter(k => k === filename || k.endsWith('/' + filename));
    };

    const getCombinedPackageJson = () => {
      const keys = findEditorFiles('package.json');
      if (keys.length === 0) return null;
      if (keys.length === 1 && keys[0] === 'package.json') {
        return files['package.json'];
      }
      const mergedPkg = { dependencies: {}, devDependencies: {}, scripts: {} };
      for (const k of keys) {
        try {
          const parsed = JSON.parse(files[k]);
          Object.assign(mergedPkg.dependencies, parsed.dependencies || {});
          Object.assign(mergedPkg.devDependencies, parsed.devDependencies || {});
          Object.assign(mergedPkg.scripts, parsed.scripts || {});
        } catch (e) {}
      }
      return JSON.stringify(mergedPkg, null, 2);
    };

    const getCombinedRequirements = () => {
      const keys = findEditorFiles('requirements.txt');
      if (keys.length === 0) return null;
      return keys.map(k => files[k]).join('\n');
    };

    const getCombinedEnvExample = () => {
      const keys = findEditorFiles('.env.example');
      if (keys.length === 0) return null;
      return keys.map(k => files[k]).join('\n');
    };

    const findFirstFile = (filenames) => {
      for (const filename of filenames) {
        const keys = findEditorFiles(filename);
        if (keys.length > 0) {
          return files[keys[0]];
        }
      }
      return null;
    };

    const combinedPkg = getCombinedPackageJson();
    const combinedReq = getCombinedRequirements();

    const repoInfo = {
      name: projectName || 'local-editor-project',
      owner: 'local',
      packageJson: combinedPkg,
      requirementsTxt: combinedReq,
      packageLockExists: findEditorFiles('package-lock.json').length > 0,
      viteConfig: findFirstFile(['vite.config.js']),
      nextConfig: findFirstFile(['next.config.js', 'next.config.mjs']),
      dockerfile: findFirstFile(['Dockerfile', 'dockerfile']),
      dockerCompose: findFirstFile(['docker-compose.yml', 'docker-compose.yaml']),
      envExample: getCombinedEnvExample(),
      readme: findFirstFile(['README.md', 'readme.md']),
      fileList: fileList,
      detectedLanguage: combinedPkg ? 'javascript' : (combinedReq ? 'python' : 'unknown')
    };

    const ruleDetails = fallbackAnalyze(repoInfo);
    const aiDetails = await aiAnalyze(repoInfo, ruleDetails);

    const mergedDetails = {
      framework: aiDetails.framework || ruleDetails.framework,
      database: aiDetails.database || ruleDetails.database,
      dependencies: aiDetails.dependencies || ruleDetails.dependencies,
      complexity: aiDetails.complexity || ruleDetails.complexity,
      envVariables: aiDetails.envVariables || ruleDetails.envVariables,
      dockerized: aiDetails.dockerized !== undefined ? aiDetails.dockerized : ruleDetails.dockerized
    };

    const finalReport = generateFallbackReport(repoInfo, mergedDetails);

    const analysis = new Analysis({
      githubUrl: mockUrl,
      framework: mergedDetails.framework,
      database: mergedDetails.database,
      dependencies: mergedDetails.dependencies,
      complexity: mergedDetails.complexity,
      envVariables: mergedDetails.envVariables,
      dockerized: mergedDetails.dockerized,
      report: finalReport
    });
    
    await analysis.save();

    return res.status(200).json({
      _id: analysis._id,
      githubUrl: analysis.githubUrl,
      framework: analysis.framework,
      database: analysis.database,
      dependencies: analysis.dependencies,
      complexity: analysis.complexity,
      envVariables: analysis.envVariables,
      dockerized: analysis.dockerized,
      report: analysis.report
    });
  } catch (error) {
    console.error(`Editor Analyze Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Workspace analysis failed: ${error.message}` });
  }
};

export const analyzeLocalDirectory = async (req, res) => {
  const { localPath } = req.body;

  if (!localPath) {
    return res.status(400).json({ error: 'Local filesystem directory path is required' });
  }

  try {
    const repoInfo = await scanLocalDirectory(localPath);
    
    // Create standard mock url identifier
    // For safety, convert windows path backslashes to forward slashes, and prepend local://
    const sanitizedPath = localPath.replace(/\\/g, '/');
    const mockUrl = `local://${sanitizedPath}`;

    // Check if there is an existing database record
    let analysis = await Analysis.findOne({ githubUrl: mockUrl });

    const ruleDetails = fallbackAnalyze(repoInfo);
    const aiDetails = await aiAnalyze(repoInfo, ruleDetails);

    const mergedDetails = {
      framework: aiDetails.framework || ruleDetails.framework,
      database: aiDetails.database || ruleDetails.database,
      dependencies: aiDetails.dependencies || ruleDetails.dependencies,
      complexity: aiDetails.complexity || ruleDetails.complexity,
      envVariables: aiDetails.envVariables || ruleDetails.envVariables,
      dockerized: aiDetails.dockerized !== undefined ? aiDetails.dockerized : ruleDetails.dockerized
    };

    const finalReport = generateFallbackReport(repoInfo, mergedDetails);

    if (analysis) {
      // Update existing record
      analysis.framework = mergedDetails.framework;
      analysis.database = mergedDetails.database;
      analysis.dependencies = mergedDetails.dependencies;
      analysis.complexity = mergedDetails.complexity;
      analysis.envVariables = mergedDetails.envVariables;
      analysis.dockerized = mergedDetails.dockerized;
      analysis.report = finalReport;
      analysis.recommendation = { frontend: '', backend: '', reason: '', cost: '' };
      analysis.deploymentPlan = { steps: [] };
      analysis.createdAt = new Date();
      await analysis.save();
    } else {
      // Create new record
      analysis = new Analysis({
        githubUrl: mockUrl,
        framework: mergedDetails.framework,
        database: mergedDetails.database,
        dependencies: mergedDetails.dependencies,
        complexity: mergedDetails.complexity,
        envVariables: mergedDetails.envVariables,
        dockerized: mergedDetails.dockerized,
        report: finalReport
      });
      await analysis.save();
    }

    return res.status(200).json({
      _id: analysis._id,
      githubUrl: analysis.githubUrl,
      framework: analysis.framework,
      database: analysis.database,
      dependencies: analysis.dependencies,
      complexity: analysis.complexity,
      envVariables: analysis.envVariables,
      dockerized: analysis.dockerized,
      report: analysis.report
    });
  } catch (error) {
    console.error(`Local Directory Analyze Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Directory analysis failed: ${error.message}` });
  }
};

export const importLocalDirectory = async (req, res) => {
  const { localPath } = req.body;

  if (!localPath) {
    return res.status(400).json({ error: 'Local directory path is required' });
  }

  try {
    const files = await importDirectoryFiles(localPath);
    return res.status(200).json({ files });
  } catch (error) {
    console.error(`Import Local Directory Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Directory import failed: ${error.message}` });
  }
};


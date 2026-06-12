import fs from 'fs';
import path from 'path';

/**
 * Scans a local filesystem path for key project metadata files.
 */
export const scanLocalDirectory = async (localPath) => {
  const resolvedPath = path.resolve(localPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Directory does not exist: ${resolvedPath}`);
  }
  const stat = fs.statSync(resolvedPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${resolvedPath}`);
  }

  const result = {
    name: path.basename(resolvedPath),
    owner: 'local',
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

  const findFilesRecursively = (dir, filename, maxDepth = 3, currentDepth = 1) => {
    if (currentDepth > maxDepth) return [];
    let found = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (['node_modules', '.git', 'dist', 'build', '.next', 'venv', '.venv'].includes(item)) continue;
        const fullPath = path.join(dir, item);
        let itemStat;
        try {
          itemStat = fs.statSync(fullPath);
        } catch (e) {
          continue;
        }
        if (itemStat.isDirectory()) {
          found = found.concat(findFilesRecursively(fullPath, filename, maxDepth, currentDepth + 1));
        } else if (itemStat.isFile() && item.toLowerCase() === filename.toLowerCase()) {
          found.push(fullPath);
        }
      }
    } catch (e) {}
    return found;
  };

  const getFileListRecursively = (dir, maxDepth = 3, currentDepth = 1) => {
    if (currentDepth > maxDepth) return [];
    let filesList = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (['node_modules', '.git', 'dist', 'build', '.next', 'venv', '.venv'].includes(item)) continue;
        const fullPath = path.join(dir, item);
        let itemStat;
        try {
          itemStat = fs.statSync(fullPath);
        } catch (e) {
          continue;
        }
        const relativePath = path.relative(resolvedPath, fullPath).replace(/\\/g, '/');
        filesList.push(relativePath);
        if (itemStat.isDirectory()) {
          filesList = filesList.concat(getFileListRecursively(fullPath, maxDepth, currentDepth + 1));
        }
      }
    } catch (e) {}
    return filesList;
  };

  const getCombinedPackageJson = () => {
    const filePaths = findFilesRecursively(resolvedPath, 'package.json');
    if (filePaths.length === 0) return null;
    if (filePaths.length === 1 && filePaths[0] === path.join(resolvedPath, 'package.json')) {
      try {
        return fs.readFileSync(filePaths[0], 'utf8');
      } catch (e) {}
    }
    const mergedPkg = { dependencies: {}, devDependencies: {}, scripts: {} };
    for (const filePath of filePaths.slice(0, 5)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        Object.assign(mergedPkg.dependencies, parsed.dependencies || {});
        Object.assign(mergedPkg.devDependencies, parsed.devDependencies || {});
        Object.assign(mergedPkg.scripts, parsed.scripts || {});
      } catch (e) {}
    }
    return JSON.stringify(mergedPkg, null, 2);
  };

  const getCombinedRequirements = () => {
    const filePaths = findFilesRecursively(resolvedPath, 'requirements.txt');
    if (filePaths.length === 0) return null;
    let combined = '';
    for (const filePath of filePaths.slice(0, 5)) {
      try {
        combined += fs.readFileSync(filePath, 'utf8') + '\n';
      } catch (e) {}
    }
    return combined.trim() || null;
  };

  const getCombinedEnvExample = () => {
    const filePaths = findFilesRecursively(resolvedPath, '.env.example');
    if (filePaths.length === 0) return null;
    let combined = '';
    for (const filePath of filePaths.slice(0, 5)) {
      try {
        combined += fs.readFileSync(filePath, 'utf8') + '\n';
      } catch (e) {}
    }
    return combined.trim() || null;
  };

  const findFirstFile = (filenames) => {
    for (const filename of filenames) {
      const paths = findFilesRecursively(resolvedPath, filename);
      if (paths.length > 0) {
        try {
          return fs.readFileSync(paths[0], 'utf8');
        } catch (e) {}
      }
    }
    return null;
  };

  // Get recursive file list
  result.fileList = getFileListRecursively(resolvedPath);

  result.packageJson = getCombinedPackageJson();
  if (result.packageJson) result.detectedLanguage = 'javascript';

  result.requirementsTxt = getCombinedRequirements();
  if (result.requirementsTxt) result.detectedLanguage = 'python';

  result.packageLockExists = findFilesRecursively(resolvedPath, 'package-lock.json').length > 0;
  result.viteConfig = findFirstFile(['vite.config.js']);
  
  result.nextConfig = findFirstFile(['next.config.js', 'next.config.mjs']);
  result.dockerfile = findFirstFile(['Dockerfile', 'dockerfile']);
  result.dockerCompose = findFirstFile(['docker-compose.yml', 'docker-compose.yaml']);
  result.envExample = getCombinedEnvExample();
  
  const readmeContent = findFirstFile(['README.md', 'readme.md']);
  if (readmeContent) {
    result.readme = readmeContent.substring(0, 2000);
  }

  return result;
};

/**
 * Recursively scans and loads text files from a local folder to import into the editor.
 * Excludes heavy folders like node_modules, .git, etc., and enforces file count/size limits.
 */
export const importDirectoryFiles = async (localPath) => {
  const resolvedPath = path.resolve(localPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Directory does not exist: ${resolvedPath}`);
  }
  const stat = fs.statSync(resolvedPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${resolvedPath}`);
  }

  const files = {};
  const maxFiles = 60;
  const maxFileSize = 50 * 1024; // 50KB limit per file
  let fileCount = 0;

  const traverse = (currentPath) => {
    if (fileCount >= maxFiles) return;

    let items = [];
    try {
      items = fs.readdirSync(currentPath);
    } catch (e) {
      return;
    }

    for (const item of items) {
      if (fileCount >= maxFiles) return;

      // Exclude heavy directories/files
      if ([
        'node_modules',
        '.git',
        'dist',
        'build',
        '.next',
        'venv',
        '.venv',
        'package-lock.json',
        'yarn.lock'
      ].includes(item)) {
        continue;
      }

      const itemPath = path.join(currentPath, item);
      let itemStat;
      try {
        itemStat = fs.statSync(itemPath);
      } catch (e) {
        continue;
      }

      if (itemStat.isDirectory()) {
        traverse(itemPath);
      } else if (itemStat.isFile()) {
        if (itemStat.size <= maxFileSize) {
          try {
            const relativeKey = path.relative(resolvedPath, itemPath).replace(/\\/g, '/');
            const content = fs.readFileSync(itemPath, 'utf8');
            
            // Simple check to ensure file is not binary (check for null characters)
            if (!content.includes('\u0000')) {
              files[relativeKey] = content;
              fileCount++;
            }
          } catch (e) {
            // Skip unreadable files
          }
        }
      }
    }
  };

  traverse(resolvedPath);
  return files;
};

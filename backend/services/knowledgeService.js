import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.resolve(__dirname, '../knowledge-base');

/**
 * Clean markdown content of link URLs, images, and HTML/noisy tags
 * to keep the prompt context as clean and compact as possible.
 */
const cleanMarkdown = (text) => {
  return text
    // Strip HTML image/pixel tags
    .replace(/<img[^>]*>/gi, '')
    // Strip markdown images
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // Replace markdown links with just their text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Remove multiple empty lines
    .replace(/\n\s*\n/g, '\n')
    .trim();
};

/**
 * Service to dynamically load and filter markdown documentation based on analysis.
 */
export const loadRelevantDocumentation = async (analysis) => {
  const documents = [];
  const loadedPaths = new Set();

  const addDoc = (subfolder, filename) => {
    const filePath = path.join(KB_DIR, subfolder, filename);
    if (fs.existsSync(filePath) && !loadedPaths.has(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Dynamically strip navigation boilerplate (lines before the first level-1 markdown heading)
        const lines = content.split('\n');
        const firstHeadingIdx = lines.findIndex(line => line.trim().startsWith('# '));
        if (firstHeadingIdx !== -1) {
          content = lines.slice(firstHeadingIdx).join('\n');
        }

        // Strip common footer boilerplate to keep context compact and prevent Ollama timeouts
        const footerKeywords = [
          'Rate this page',
          'On this page',
          'Did this page help?',
          '© 2026',
          '© Render',
          '[Back ',
          '###### [Deploy'
        ];
        const strippedLines = content.split('\n');
        const footerIdx = strippedLines.findIndex(line => 
          footerKeywords.some(keyword => line.includes(keyword))
        );
        if (footerIdx !== -1) {
          content = strippedLines.slice(0, footerIdx).join('\n');
        }

        // Clean markdown formatting/HTML noise
        content = cleanMarkdown(content);

        // Truncate to optimize prompt size for local model prompt processing
        const maxDocLength = 1500;
        if (content.length > maxDocLength) {
          content = content.substring(0, maxDocLength) + '\n... [Remaining documentation truncated for context optimization]';
        }

        documents.push({
          title: filename.replace('.md', ''),
          platform: subfolder,
          content: content.trim()
        });
        loadedPaths.add(filePath);
      } catch (err) {
        console.error(`[KnowledgeService] Error reading doc ${filePath}: ${err.message}`);
      }
    }
  };

  const framework = (analysis.framework || '').toLowerCase();
  const database = (analysis.database || '').toLowerCase();
  const dockerized = !!analysis.dockerized;

  // Frontend Documentation
  if (framework.includes('vite')) {
    addDoc('vercel', 'vite-on-vercel.md');
    addDoc('vercel', 'deployments.md');
    addDoc('vercel', 'project-config.md');
  }
  if (framework.includes('react')) {
    addDoc('vercel', 'react-on-vercel.md');
    addDoc('vercel', 'deployments.md');
  }
  if (framework.includes('next')) {
    addDoc('vercel', 'deployments.md');
    addDoc('vercel', 'project-config.md');
    addDoc('vercel', 'monorepos.md');
  }

  // Backend Documentation
  if (
    framework.includes('express') || 
    framework.includes('node') || 
    framework.includes('nestjs') || 
    framework.includes('fastify')
  ) {
    addDoc('render', 'nodejs-deployment.md');
    addDoc('render', 'web-services.md');
    addDoc('render', 'env-vars.md');
  }

  // Database Documentation
  if (database.includes('mongo')) {
    addDoc('mongodb', 'connection-strings.md');
    addDoc('mongodb', 'network-access.md');
    addDoc('mongodb', 'cluster-setup.md');
    
    // Add vector search if dependencies include Vector DB features or AI features
    const hasAiDeps = analysis.dependencies && analysis.dependencies.some(d => 
      d.includes('openai') || d.includes('langchain') || d.includes('vector')
    );
    if (hasAiDeps) {
      addDoc('mongodb', 'vector-search.md');
      addDoc('mongodb', 'atlas-search.md');
    }
  }

  // Docker Documentation
  if (dockerized) {
    addDoc('render', 'docker.md');
  }

  // Common/General Configurations
  addDoc('vercel', 'env-vars.md');

  return documents;
};

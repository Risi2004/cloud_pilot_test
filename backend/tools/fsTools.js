import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { scanLocalDirectory } from '../services/localScanService.js';

export const analyzeDirectoryTool = new FunctionTool({
  name: 'analyzeDirectory',
  description: 'Scans a local directory on the server filesystem to analyze framework structure, dependencies, and configuration sheets.',
  parameters: z.object({
    directoryPath: z.string().describe('Absolute directory path to scan')
  }),
  execute: async ({ directoryPath }) => {
    try {
      const scanResult = await scanLocalDirectory(directoryPath);
      return { success: true, metadata: scanResult };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

export const patchFileTool = new FunctionTool({
  name: 'patchFile',
  description: 'Applies patches or full replacements of configuration files (e.g. package.json, requirements.txt) to fix deployment/build failures.',
  parameters: z.object({
    filePath: z.string().describe('Absolute file path on local filesystem'),
    newContent: z.string().describe('Complete replacement file content string')
  }),
  execute: async ({ filePath, newContent }) => {
    try {
      const resolved = path.resolve(filePath);
      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(resolved, newContent, 'utf8');
      return { success: true, filePath: resolved };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

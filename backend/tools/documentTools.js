import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export const retrieveKnowledgeTool = new FunctionTool({
  name: 'retrieveKnowledge',
  description: 'Searches local Markdown documentation for deployment guidelines, limits, pricing, and configurations.',
  parameters: z.object({
    provider: z.enum(['vercel', 'render', 'mongodb']).describe('Target cloud hosting provider platform'),
    keyword: z.string().describe('Search term or keyword to match inside documents (e.g. env-vars, pricing, build commands)')
  }),
  execute: async ({ provider, keyword }) => {
    try {
      const kbPath = path.resolve('backend', 'knowledge-base', provider);
      if (!fs.existsSync(kbPath)) {
        return { success: false, error: `Knowledge base for provider ${provider} does not exist.` };
      }

      const files = fs.readdirSync(kbPath);
      const matchedSegments = [];

      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const filePath = path.join(kbPath, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Simple text scanning: split into paragraphs or lines to find matches
        const lines = content.split('\n');
        let matchedSnippet = '';
        let matchCount = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.toLowerCase().includes(keyword.toLowerCase())) {
            // Take the surrounding 10 lines of context
            const start = Math.max(0, i - 4);
            const end = Math.min(lines.length, i + 6);
            matchedSnippet = lines.slice(start, end).join('\n');
            matchCount++;
            break; // take first match per file for brevity
          }
        }

        if (matchedSnippet) {
          matchedSegments.push({
            file: file,
            matches: matchCount,
            snippet: matchedSnippet
          });
        }
      }

      if (matchedSegments.length === 0) {
        // Fallback: list files in the category to help the agent discover
        return {
          success: true,
          message: `No matching text for '${keyword}' was found. Available documentation files in ${provider}: ${files.join(', ')}`
        };
      }

      return {
        success: true,
        results: matchedSegments
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

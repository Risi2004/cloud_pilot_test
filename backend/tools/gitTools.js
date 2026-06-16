import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { gitAdd, gitCommit, gitPush } from '../services/gitService.js';

export const gitCommitTool = new FunctionTool({
  name: 'gitCommitAndPush',
  description: 'Stages changes, commits configuration fixes, and pushes to remote repositories.',
  parameters: z.object({
    repoPath: z.string().describe('Absolute local directory path of the cloned repository'),
    commitMessage: z.string().describe('Commit summary descriptive of the fix applied'),
    branch: z.string().default('main').describe('Target git branch to receive changes')
  }),
  execute: async ({ repoPath, commitMessage, branch }) => {
    try {
      await gitAdd(repoPath);
      const commitRes = await gitCommit(commitMessage, repoPath);
      const pushRes = await gitPush(branch, repoPath);
      return { success: true, commit: commitRes, push: pushRes };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

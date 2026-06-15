import { exec } from 'child_process';
import path from 'path';

const getRepoRoot = () => {
  // backend is in <root>/backend, process.cwd() is backend dir
  return path.dirname(process.cwd());
};

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    const cwd = getRepoRoot();
    console.log(`[GitService] Running: "${command}" in ${cwd}`);
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[GitService] Command failed: ${command}. Error: ${stderr || error.message}`);
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout.trim());
    });
  });
};

export const gitAdd = async () => {
  return runCommand('git add .');
};

export const gitCommit = async (message = 'fix(deploy): resolve build issues') => {
  try {
    return await runCommand(`git commit -m "${message}"`);
  } catch (err) {
    // If nothing to commit, it's not a fatal error
    if (err.message.includes('nothing to commit') || err.message.includes('no changes added to commit')) {
      return 'Nothing to commit';
    }
    throw err;
  }
};

export const gitPush = async (branch = 'main') => {
  // Push origin main
  try {
    return await runCommand(`git push origin ${branch}`);
  } catch (err) {
    // Fallback if main branch doesn't exist, try master
    if (err.message.includes('does not match any') || err.message.includes('src refspec')) {
      console.log(`[GitService] Branch '${branch}' failed. Attempting master fallback.`);
      return await runCommand('git push origin master');
    }
    throw err;
  }
};

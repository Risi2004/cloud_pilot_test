import { exec } from 'child_process';
import path from 'path';



const runCommand = (command, repoPath) => {
  return new Promise((resolve, reject) => {
    const cwd = repoPath || path.dirname(process.cwd());
    console.log(`[GitService] Running: "${command}" in ${cwd}`);
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        const fullErr = `${stdout}\n${stderr}`.trim() || error.message;
        console.error(`[GitService] Command failed: ${command}. Error: ${fullErr}`);
        return reject(new Error(fullErr));
      }
      resolve(stdout.trim());
    });
  });
};

export const gitAdd = async (repoPath) => {
  return runCommand('git add .', repoPath);
};

export const gitCommit = async (message = 'fix(deploy): resolve build issues', repoPath) => {
  try {
    return await runCommand(`git commit -m "${message}"`, repoPath);
  } catch (err) {
    // If nothing to commit, it's not a fatal error
    if (err.message.includes('nothing to commit') || err.message.includes('no changes added to commit') || err.message.includes('nothing added to commit')) {
      return 'Nothing to commit';
    }
    throw err;
  }
};

export const gitPush = async (branch = 'main', repoPath) => {
  // Push origin main
  try {
    return await runCommand(`git push origin ${branch}`, repoPath);
  } catch (err) {
    // Fallback if main branch doesn't exist, try master
    if (err.message.includes('does not match any') || err.message.includes('src refspec')) {
      console.log(`[GitService] Branch '${branch}' failed. Attempting master fallback.`);
      return await runCommand('git push origin master', repoPath);
    }
    throw err;
  }
};

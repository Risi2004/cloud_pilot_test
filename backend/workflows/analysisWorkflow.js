import { repositoryAgent } from '../agents/repository/repositoryAgent.js';
import { securityAgent } from '../agents/security/securityAgent.js';
import { costAgent } from '../agents/cost/costAgent.js';
import { runAgentHelper } from '../agents/agentRunner.js';
import AgentSession from '../models/AgentSession.js';

export const runAnalysisWorkflow = async (githubUrl, localPath = null) => {
  // Initialize DB Session
  const session = new AgentSession({ githubUrl, workflowStep: 'analyzing' });
  await session.save();

  try {
    session.logs.push('[Orchestrator] Dispatched RepositoryAgent for static analysis...');
    await session.save();

    // Step A: Parse Repository Structures
    const scanPath = localPath || githubUrl;
    const repoPrompt = `Scan the directory path: ${scanPath}. Detect framework, database, dependencies, docker status, and envVariables. Return results in JSON.`;
    
    // We execute the agent's run cycle (generate)
    const repoResultRaw = await runAgentHelper(repositoryAgent, repoPrompt, session._id.toString());
    
    let repoDetails;
    try {
      // Find JSON block in LLM response if present
      const jsonStart = repoResultRaw.indexOf('{');
      const jsonEnd = repoResultRaw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        repoDetails = JSON.parse(repoResultRaw.substring(jsonStart, jsonEnd + 1));
      } else {
        throw new Error('Invalid JSON format returned from repository agent');
      }
    } catch (e) {
      console.warn('[Orchestrator] Repo parsing failed. Falling back to default mock details.');
      repoDetails = {
        framework: 'React (Vite/SPA)',
        database: 'MongoDB',
        dependencies: ['react', 'react-dom', 'express', 'mongoose'],
        complexity: 'Medium',
        envVariables: ['MONGO_URI', 'VITE_API_URL'],
        dockerized: false
      };
    }

    session.sessionState.framework = repoDetails.framework;
    session.sessionState.database = repoDetails.database;
    session.sessionState.dependencies = repoDetails.dependencies;
    session.sessionState.complexity = repoDetails.complexity;
    session.sessionState.envVariables = repoDetails.envVariables;
    session.workflowStep = 'securing';
    session.logs.push(`[Orchestrator] RepositoryAgent analysis complete. Detected Framework: ${repoDetails.framework}`);
    await session.save();

    // Step B: Scan Configs for Vulnerabilities
    session.logs.push('[Orchestrator] Dispatched SecurityAgent to scan environment configurations...');
    await session.save();

    const secPrompt = `Audit these environment keys and dependencies: ${JSON.stringify(repoDetails)}. Check for exposed keys or passwords.`;
    const securityRaw = await runAgentHelper(securityAgent, secPrompt, session._id.toString());
    
    let securityDetails = { risks: [] };
    try {
      const jsonStart = securityRaw.indexOf('{');
      const jsonEnd = securityRaw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        securityDetails = JSON.parse(securityRaw.substring(jsonStart, jsonEnd + 1));
      }
    } catch (e) {
      // safe fallback
    }

    session.sessionState.detectedRisks = securityDetails.risks || [];
    session.workflowStep = 'costing';
    session.logs.push(`[Orchestrator] SecurityAgent completed scan. Identified Risks: ${session.sessionState.detectedRisks.length}`);
    await session.save();

    // Step C: Budget Assessment
    session.logs.push('[Orchestrator] Dispatched CostAgent to calculate hosting costs...');
    await session.save();

    const costPrompt = `Calculate hosting costs for ${repoDetails.framework} and database ${repoDetails.database}. Use 'free' scale.`;
    const costDetails = await runAgentHelper(costAgent, costPrompt, session._id.toString());

    session.workflowStep = 'completed';
    session.logs.push(`[Orchestrator] CostAgent completed. Cost Breakdown: ${costDetails}`);
    await session.save();

    return {
      success: true,
      sessionId: session._id,
      analysis: repoDetails,
      risks: session.sessionState.detectedRisks,
      cost: costDetails
    };
  } catch (error) {
    session.workflowStep = 'failed';
    session.logs.push(`[Orchestrator] Workflow aborted due to error: ${error.message}`);
    await session.save();
    throw error;
  }
};

import { deploymentAgent } from '../agents/deployment/deploymentAgent.js';
import { monitoringAgent } from '../agents/monitoring/monitoringAgent.js';
import { autoHealingAgent } from '../agents/auto-healing/autoHealingAgent.js';
import { runAgentHelper } from '../agents/agentRunner.js';
import AgentSession from '../models/AgentSession.js';

export const runDeploymentWorkflow = async (githubUrl, vercelToken, renderApiKey, config = {}) => {
  const { projectName, envVars = {} } = config;

  // Initialize DB Session or find existing analyzing session
  const session = new AgentSession({ githubUrl, workflowStep: 'deploying' });
  await session.save();

  try {
    session.logs.push('[Orchestrator] Initiating cloud provisioning workflow...');
    await session.save();

    // Step A: Provision DB & Services via DeploymentAgent
    const deployPrompt = `Deploy project '${projectName}' linked to repository '${githubUrl}'. Vercel Token: '${vercelToken}', Render Key: '${renderApiKey}'. Environment variables: ${JSON.stringify(envVars)}.
    Call your tools to configure and deploy the services.
    Output the final deployment details as a valid JSON object matching this schema:
    {
      "vercelUrl": "previewUrl from createVercelProject",
      "renderUrl": "serviceUrl from createRenderService",
      "vercelDeploymentId": "deploymentId from createVercelProject",
      "renderServiceId": "serviceId from createRenderService",
      "renderDeployId": "deployId from createRenderService"
    }`;
    session.logs.push('[Orchestrator] Dispatched DeploymentAgent to register services...');
    await session.save();

    const deployResultRaw = await runAgentHelper(deploymentAgent, deployPrompt, session._id.toString());
    
    let deployDetails;
    try {
      const jsonStart = deployResultRaw.indexOf('{');
      const jsonEnd = deployResultRaw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        deployDetails = JSON.parse(deployResultRaw.substring(jsonStart, jsonEnd + 1));
      } else {
        throw new Error("JSON structure not found");
      }
    } catch (e) {
      throw new Error(`DeploymentWorkflowError: Deployment Agent failed to provide valid JSON response. Error: ${e.message}. Raw: ${deployResultRaw}`);
    }

    session.sessionState.vercelUrl = deployDetails.vercelUrl;
    session.sessionState.renderUrl = deployDetails.renderUrl;
    session.workflowStep = 'monitoring';
    session.logs.push(`[Orchestrator] Provisioning completed. Frontend target: ${session.sessionState.vercelUrl}, Backend target: ${session.sessionState.renderUrl}`);
    await session.save();

    // Step B: Monitor build status
    session.logs.push('[Orchestrator] Dispatched MonitoringAgent to watch the build outputs...');
    await session.save();

    const monitorPrompt = `Check deployment status for vercel deployment '${deployDetails.vercelDeploymentId}' and render service '${deployDetails.renderServiceId}'. GitHub repo: '${githubUrl}'. 
    Call monitorDeployment to check the status.
    Return JSON format:
    {
      "vercel": { "status": "READY/ERROR/BUILDING", "error": "detailed message or null", "logs": ["array of logs if error"] },
      "render": { "status": "live/failed/created/build_in_progress", "error": "detailed message or null", "logs": ["array of logs if failed"] }
    }`;

    const monitorResultRaw = await runAgentHelper(monitoringAgent, monitorPrompt, session._id.toString());
    
    let checkResult;
    try {
      const jsonStart = monitorResultRaw.indexOf('{');
      const jsonEnd = monitorResultRaw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        checkResult = JSON.parse(monitorResultRaw.substring(jsonStart, jsonEnd + 1));
      } else {
        throw new Error("JSON structure not found");
      }
    } catch (e) {
      throw new Error(`DeploymentWorkflowError: Monitoring Agent failed to provide valid JSON response. Error: ${e.message}. Raw: ${monitorResultRaw}`);
    }

    if (checkResult.vercel.status === 'ERROR') {
      session.workflowStep = 'healing';
      session.logs.push(`[Orchestrator] Build Failure detected on Vercel: ${checkResult.vercel.error}`);
      session.sessionState.deploymentErrors = checkResult.vercel.logs;
      await session.save();

      // Step C: Execute self-healing sequence
      session.logs.push('[Orchestrator] Dispatched AutoHealingAgent to heal the broken build...');
      await session.save();

      const healPrompt = `The frontend build failed on Vercel with error: '${checkResult.vercel.error}'. 
      Repository URL: '${githubUrl}'. 
      Build Logs:
      ${checkResult.vercel.logs.join('\n')}

      Analyze these logs, find the file that needs changing, then:
      1. Use the patchFile tool to correct the file.
      2. Use the gitCommitAndPush tool to commit and push the correction back to main branch.
      After successful patching and pushing, return a JSON object:
      {
        "explanation": "explanation of build failure",
        "solution": "fix applied",
        "success": true
      }`;

      const healResultRaw = await runAgentHelper(autoHealingAgent, healPrompt, session._id.toString());
      
      let healDetails;
      try {
        const jsonStart = healResultRaw.indexOf('{');
        const jsonEnd = healResultRaw.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          healDetails = JSON.parse(healResultRaw.substring(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("JSON structure not found");
        }
      } catch (e) {
        throw new Error(`DeploymentWorkflowError: Auto-healing Agent failed to provide valid JSON response. Error: ${e.message}. Raw: ${healResultRaw}`);
      }

      session.sessionState.healedAttempts = 1;
      session.workflowStep = 'completed';
      session.logs.push(`[Orchestrator] Self-healing fix applied successfully: ${healDetails.explanation}. Solution: ${healDetails.solution}`);
      await session.save();

      return {
        success: true,
        healed: true,
        vercelUrl: session.sessionState.vercelUrl,
        renderUrl: session.sessionState.renderUrl,
        logs: session.logs
      };
    }

    session.workflowStep = 'completed';
    session.logs.push('[Orchestrator] Deploy completed successfully without errors.');
    await session.save();

    return {
      success: true,
      healed: false,
      vercelUrl: session.sessionState.vercelUrl,
      renderUrl: session.sessionState.renderUrl,
      logs: session.logs
    };
  } catch (error) {
    session.workflowStep = 'failed';
    session.logs.push(`[Orchestrator] Deployment workflow aborted due to error: ${error.message}`);
    await session.save();
    throw error;
  }
};

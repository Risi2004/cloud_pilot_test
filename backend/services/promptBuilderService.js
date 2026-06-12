/**
 * Service to build a structured context-rich prompt for Ollama/Qwen.
 */
export const buildArchitectPrompt = (analysis, docContents, readiness, risks) => {
  const docsText = docContents.length > 0 
    ? docContents.map(doc => `--- DOCUMENT: ${doc.platform}/${doc.title} ---\n${doc.content}`).join('\n\n')
    : 'No relevant platform documentation found.';

  return `You are CloudPilot, an Autonomous Cloud Architect.
Your task is to analyze the repository telemetry, readiness levels, and risk checks, and recommend a concrete hosting design.
You MUST read and reference the platform documentation provided in the context below to build your recommendations.

--- PLATFORM DOCUMENTATION CONTEXT ---
${docsText}

--- REPOSITORY TELEMETRY ---
- Framework/Technology: ${analysis.framework || 'Unknown'}
- Database: ${analysis.database || 'None'}
- Dependencies: ${JSON.stringify(analysis.dependencies || [])}
- Complexity Score: ${analysis.complexityScore || 50}
- Containerized: ${analysis.dockerized || false}
- Declared Env Variables: ${JSON.stringify(analysis.envVariables || [])}

--- READINESS SCORE ---
- Score: ${readiness.score}/100
- Level: ${readiness.readinessLevel}
- Missing Items: ${JSON.stringify(readiness.missingItems || [])}

--- DETECTED RISKS ---
- Overall Severity: ${risks.severity}
- Risks: ${JSON.stringify(risks.risks.map(r => `${r.metric}: ${r.details}`) || [])}

Your output MUST be a valid JSON object matching the following structure EXACTLY:
{
  "platformRecommendations": {
    "frontend": "Vercel | Render | None",
    "backend": "Vercel | Render | None",
    "reason": "Detailed architectural explanation incorporating rules and documentation findings."
  },
  "costEstimate": {
    "frontend": "$X/month (Specify tier, e.g. Free Tier or Pro)",
    "backend": "$X/month (Specify tier, e.g. Free Tier or Hobby)",
    "database": "$X/month (Specify tier, e.g. Shared Atlas Free)",
    "total": "$X/month (Combined monthly cost estimate)"
  },
  "deploymentPlan": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ..."
  ],
  "risks": [
    "Risk 1: ...",
    "Risk 2: ..."
  ],
  "confidence": 95
}

Do not include markdown blocks, fences (\`\`\`json), thinking blocks (<think>...</think>), or extra explanations. Only return the raw JSON object.`;
};

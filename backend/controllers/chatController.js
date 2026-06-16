import { runAgentHelper } from '../agents/agentRunner.js';
import { orchestratorAgent } from '../agents/orchestrator/orchestratorAgent.js';

export const handleChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const chatPrompt = `You are CloudPilot, an Autonomous Cloud Engineer.
Your task is to help developers deploy web applications.
You only support Vercel and Render for deployment recommendations.
You do NOT support AWS, Terraform, Kubernetes, advanced monitoring, or incident response. Keep responses focused entirely on lightweight hosting (Vercel, Render) and standard setups (MongoDB Atlas, Node.js, Express, Vite, Python, etc.).
Keep answers concise, clear, and helpful. Use markdown code snippets for environment configurations or CLI commands if needed.

Message history:
${(history || []).map(turn => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`).join('\n')}

User message: ${message}
Assistant:`;

    const reply = await runAgentHelper(orchestratorAgent, chatPrompt, `chat-${Date.now()}`);
    return res.status(200).json({ reply });
  } catch (error) {
    console.error(`Chat Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Chat operation failed: ${error.message}` });
  }
};

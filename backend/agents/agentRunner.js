import { InMemoryRunner, stringifyContent } from '@google/adk';

/**
 * Runs an ADK agent in memory and returns its complete aggregated text response.
 */
export const runAgentHelper = async (agent, prompt, sessionId = 'default-session') => {
  const runner = new InMemoryRunner({ agent });
  
  // Pre-create the session to avoid "Session not found" errors
  await runner.sessionService.createSession({
    appName: runner.appName,
    userId: 'developer',
    sessionId: sessionId
  });

  const eventStream = runner.runAsync({
    userId: 'developer',
    sessionId: sessionId,
    newMessage: {
      role: 'user',
      parts: [{ text: prompt }]
    }
  });

  let fullResponse = '';
  for await (const event of eventStream) {
    const text = stringifyContent(event);
    if (text) {
      fullResponse += text;
    }
  }
  
  return fullResponse.trim();
};

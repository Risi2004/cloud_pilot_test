import { aiChat } from '../services/ollamaService.js';

export const handleChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const reply = await aiChat(message, history || []);
    return res.status(200).json({ reply });
  } catch (error) {
    console.error(`Chat Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Chat operation failed: ${error.message}` });
  }
};

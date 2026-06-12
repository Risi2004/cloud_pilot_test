import React, { useState } from 'react';
import { sendChatMessage } from '../services/api';
import ChatBox from '../components/ChatBox';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am CloudPilot, your Autonomous Cloud Engineer. I specialize in deploying static or SPA frontends to Vercel and backend APIs/web services to Render.\n\nAsk me how to partition your architecture, configure build settings, hook up MongoDB Atlas, or calculate monthly running costs!"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendMessage = async (text) => {
    // Optimistic UI updates
    const newUserMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setLoading(true);
    setError('');

    try {
      // Pass conversational history to keep thread context
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(text, chatHistory);
      
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.reply }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to communicate with AI chat engine.');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I encountered an error querying the model. Please make sure that the backend Express process and your local Ollama server are both fully running." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>AI Chat Assistant</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
          Consult CloudPilot about build setups, env variables, or custom scaling plans.
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-md)', color: '#f43f5e', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <ChatBox 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        isLoading={loading} 
      />
    </div>
  );
};

export default ChatAssistant;

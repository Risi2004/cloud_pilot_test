import React, { useState, useEffect, useRef } from 'react';
import '../styles/chat.css';

const ChatBox = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const suggestionPrompts = [
    'How should I deploy a Vite React app?',
    'What are the free tier limitations on Render?',
    'How do I hook up MongoDB Atlas to Express?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleSuggestionClick = (promptText) => {
    if (isLoading) return;
    onSendMessage(promptText);
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6, textAlign: 'center', padding: '2rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Ask CloudPilot anything</h3>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', maxWidth: '360px' }}>
              Inquire about Vercel frontend configurations, Render node parameters, environment setups, or costing scales.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              <div className="chat-message-avatar">
                {msg.role === 'user' ? 'U' : 'CP'}
              </div>
              <div className="chat-message-bubble">
                {msg.content.split('\n\n').map((para, pIdx) => {
                  // Basic markdown code block formatter helper
                  if (para.startsWith('```')) {
                    const cleanCode = para.replace(/^```[a-zA-Z]*/, '').replace(/```$/, '').trim();
                    return (
                      <pre key={pIdx}>
                        <code>{cleanCode}</code>
                      </pre>
                    );
                  }
                  
                  // Inline code formatter
                  const parts = para.split(/(`[^`]+`)/);
                  return (
                    <p key={pIdx}>
                      {parts.map((part, partIdx) => {
                        if (part.startsWith('`') && part.endsWith('`')) {
                          return <code key={partIdx}>{part.slice(1, -1)}</code>;
                        }
                        return part;
                      })}
                    </p>
                  );
                })}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="chat-message assistant">
            <div className="chat-message-avatar">CP</div>
            <div className="chat-message-bubble" style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.25rem' }}>
              <span className="dot" style={{ animation: 'blink 1.4s infinite both', width: '6px', height: '6px', background: 'white', borderRadius: '50%' }}></span>
              <span className="dot" style={{ animation: 'blink 1.4s infinite both 0.2s', width: '6px', height: '6px', background: 'white', borderRadius: '50%' }}></span>
              <span className="dot" style={{ animation: 'blink 1.4s infinite both 0.4s', width: '6px', height: '6px', background: 'white', borderRadius: '50%' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="chat-suggestions">
        {suggestionPrompts.map((promptText, idx) => (
          <div 
            key={idx} 
            className="suggestion-chip"
            onClick={() => handleSuggestionClick(promptText)}
          >
            {promptText}
          </div>
        ))}
      </div>

      {/* Input controls */}
      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            className="form-input"
            placeholder="Type a message to discuss cloud options..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
      
      {/* CSS blinking dot animation */}
      {typeof document !== 'undefined' && !document.getElementById('chat-blink-styles') && (
        <style id="chat-blink-styles">
          {`
            @keyframes blink {
              0% { opacity: .2; }
              20% { opacity: 1; }
              100% { opacity: .2; }
            }
          `}
        </style>
      )}
    </div>
  );
};

export default ChatBox;

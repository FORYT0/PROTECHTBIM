import React, { useState, useEffect, useRef } from 'react';
import { useAIStore, ChatMessage } from '../../stores/useAIStore';

/**
 * AIBrain Component
 * 
 * An "almost sentient" chat interface acting as a Senior Project Manager / Risk Consultant.
 * Features a typewriter effect for AI responses and a glassmorphism design.
 */
export const AIBrain: React.FC = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isOpen,
    messages,
    isTyping,
    closeAIBrain,
    addMessage,
    setTyping,
  } = useAIStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // Initial greeting if empty
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: 'I am your AI Project Manager. I monitor the project pulse. How can I assist you with scheduling, risk analysis, or daily reporting today?'
      });
    }
  }, [isOpen, messages.length, addMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMsg });
    setTyping(true);

    try {
      // Get auth token - assuming it's stored in localStorage in this project
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          // Send the history so the AI has context
          messages: [...messages, { role: 'user', content: userMsg }].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }

      const data = await response.json();
      
      addMessage({
        role: 'assistant',
        content: data.response
      });
    } catch (error) {
      console.error('Error communicating with AI Brain:', error);
      addMessage({
        role: 'assistant',
        content: '⚠️ I encountered an error analyzing your request. Please ensure the backend and API keys are configured correctly.'
      });
    } finally {
      setTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeAIBrain}
      />
      
      {/* Chat Window */}
      <div className="relative w-full max-w-2xl h-[80vh] ai-glass rounded-2xl flex flex-col shadow-2xl elevation-5 overflow-hidden animate-slide-in-up border border-blue-500/20">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-ai-pulse" />
            </div>
            <h2 className="text-lg font-medium text-white tracking-wide">AI Project Brain</h2>
          </div>
          <button 
            onClick={closeAIBrain}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg: ChatMessage, idx: number) => (
            <div 
              key={idx} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="text-xs text-gray-500 mb-1 ml-1 mr-1">
                {msg.role === 'user' ? 'You' : 'AI Copilot'}
              </div>
              <div 
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600/80 text-white rounded-tr-sm' 
                    : 'surface-tertiary text-gray-100 rounded-tl-sm border border-white/5'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="animate-typewriter leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex flex-col items-start">
              <div className="text-xs text-gray-500 mb-1 ml-1">AI Copilot is analyzing...</div>
              <div className="surface-tertiary rounded-2xl rounded-tl-sm px-5 py-3 border border-white/5 flex space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about schedule delays, risk, or request a daily report..."
              className="w-full bg-black/50 text-white rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-white/10 placeholder-gray-500"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
          <div className="text-center mt-2">
             <span className="text-[10px] text-gray-500 font-medium tracking-wide text-center w-full block">POWERED BY Llama-3.3-70b-versatile</span>
          </div>
        </div>
      </div>
    </div>
  );
};

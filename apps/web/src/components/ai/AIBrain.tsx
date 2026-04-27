import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, Loader2, Bot, User, Trash2, Minimize2, Maximize2, AlertCircle } from 'lucide-react';
import { useAIStore } from '../../stores/useAIStore';
import aiService, { ChatMessage } from '../../services/aiService';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  { label: '⚠️ Risk Analysis', prompt: 'Analyze the main risks on my current project and recommend mitigation strategies.' },
  { label: '📊 Progress Check', prompt: 'Based on the current project status, what should I focus on this week?' },
  { label: '📝 Change Order Help', prompt: 'Help me write a justification for a change order due to unforeseen ground conditions.' },
  { label: '🔍 Snag Priority', prompt: 'How should I prioritize resolving snags? Which categories should I address first?' },
  { label: '💰 Budget Alert', prompt: 'My project is 70% through time but 85% through budget. What corrective actions should I take?' },
  { label: '🦺 Safety Checklist', prompt: 'Generate a daily safety inspection checklist for a high-rise construction site in Kenya.' },
];

export function AIBrain() {
  const { isOpen, closeAIBrain } = useAIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: "Hi! I'm **ARIA**, your AI construction project assistant powered by Groq.\n\nI can help you with:\n- 📊 **Risk assessment** and mitigation strategies\n- 💰 **Cost control** and budget analysis\n- 📋 **Change order** review and justification\n- 🔍 **Snag prioritisation** and defect management\n- 📅 **Schedule analysis** and delay management\n- 📝 **Report writing** and documentation\n\nWhat would you like help with today?",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && isAvailable === null) {
      aiService.getStatus().then(s => setIsAvailable(s.available)).catch(() => setIsAvailable(false));
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;

    setInput('');
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].slice(-12);
      const response = await aiService.chat(history);
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Chat cleared. How can I help you?", timestamp: new Date() }]);
    setError(null);
  };

  if (!isOpen) return null;

  const levelColor = (level?: string) => ({ Low: 'text-green-400', Medium: 'text-yellow-400', High: 'text-orange-400', Critical: 'text-red-400' }[level || ''] || 'text-gray-400');

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={closeAIBrain} />
      <div className={`fixed right-4 bottom-4 z-50 flex flex-col rounded-2xl border border-gray-800 bg-[#0A0A0A] shadow-2xl shadow-blue-900/20 transition-all duration-300 ${isMinimized ? 'h-14 w-80' : 'h-[680px] w-[420px] max-h-[85vh]'}`}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A] ${isAvailable === true ? 'bg-green-400 animate-pulse' : isAvailable === false ? 'bg-red-400' : 'bg-yellow-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">ARIA</h3>
              <p className="text-[10px] text-gray-500">{isAvailable === true ? '🟢 Groq · llama-3.3-70b' : isAvailable === false ? '🔴 Not configured' : '⏳ Checking...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors" title="Clear chat"><Trash2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">{isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}</button>
            <button onClick={closeAIBrain} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {isAvailable === false && (
              <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 shrink-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Set <code className="bg-red-900/30 px-1 rounded">GROQ_API_KEY</code> in Railway → Variables to enable ARIA.</span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gray-700'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm ${msg.role === 'assistant' ? 'bg-[#111] border border-gray-800 text-gray-200' : 'bg-blue-600 text-white'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-blue-300">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                    <p className="text-[10px] opacity-30 mt-1.5 text-right">{msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-[#111] border border-gray-800 rounded-xl px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts — shown only at start */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 shrink-0">
                <p className="text-[10px] text-gray-600 mb-2 font-medium uppercase tracking-widest">Quick Actions</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_PROMPTS.map(qp => (
                    <button key={qp.label} onClick={() => sendMessage(qp.prompt)}
                      disabled={isLoading || isAvailable === false}
                      className="px-2.5 py-1.5 text-[11px] bg-[#111] border border-gray-800 rounded-lg text-gray-400 hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left disabled:opacity-40 truncate">
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-800 p-3 shrink-0">
              <div className="flex items-end gap-2 bg-[#111] border border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={isAvailable === false ? 'ARIA not configured...' : 'Ask ARIA anything about your project...'}
                  disabled={isLoading || isAvailable === false}
                  rows={1} className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none focus:outline-none min-h-[20px] max-h-[100px] disabled:opacity-50 leading-relaxed"
                  onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 100) + 'px'; }} />
                <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading || isAvailable === false}
                  className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-blue-500/20">
                  {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default AIBrain;

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Sparkles, Loader2, Bot, User, Trash2, Minimize2, Maximize2,
  AlertCircle, AlertTriangle, BarChart2, FileText, CheckSquare,
  TrendingDown, ShieldCheck, BarChart3, DollarSign, ClipboardList,
  Calendar, BookOpen, Circle,
} from 'lucide-react';
import { useAIStore } from '../../stores/useAIStore';
import aiService, { ChatMessage } from '../../services/aiService';
import ReactMarkdown from 'react-markdown';

/* ─── Quick-action chips ─────────────────────────────────────── */
const QUICK_PROMPTS = [
  { Icon: AlertTriangle,  label: 'Risk Analysis',     prompt: 'Analyze the main risks on my current project and recommend mitigation strategies.' },
  { Icon: BarChart2,      label: 'Progress Check',    prompt: 'Based on the current project status, what should I focus on this week?' },
  { Icon: FileText,       label: 'Change Order Help', prompt: 'Help me write a justification for a change order due to unforeseen ground conditions.' },
  { Icon: CheckSquare,    label: 'Snag Priority',     prompt: 'How should I prioritize resolving snags? Which categories should I address first?' },
  { Icon: TrendingDown,   label: 'Budget Alert',      prompt: 'My project is 70% through time but 85% through budget. What corrective actions should I take?' },
  { Icon: ShieldCheck,    label: 'Safety Checklist',  prompt: 'Generate a daily safety inspection checklist for a high-rise construction site in Kenya.' },
];

/* ─── Welcome capability list ────────────────────────────────── */
const CAPABILITIES = [
  { Icon: BarChart3,     text: 'Risk assessment and mitigation strategies' },
  { Icon: DollarSign,    text: 'Cost control and budget analysis' },
  { Icon: ClipboardList, text: 'Change order review and justification' },
  { Icon: CheckSquare,   text: 'Snag prioritisation and defect management' },
  { Icon: Calendar,      text: 'Schedule analysis and delay management' },
  { Icon: BookOpen,      text: 'Report writing and documentation' },
];

/* ─── Status indicator ───────────────────────────────────────── */
function StatusLabel({ available }: { available: boolean | null }) {
  if (available === true)
    return <><Circle className="w-2 h-2 fill-green-400 text-green-400" /><span>Groq · llama-3.3-70b</span></>;
  if (available === false)
    return <><Circle className="w-2 h-2 fill-red-400 text-red-400" /><span>Not configured</span></>;
  return <><Circle className="w-2 h-2 fill-yellow-400 text-yellow-400 animate-pulse" /><span>Checking…</span></>;
}

/* ─── Welcome message (no emojis) ───────────────────────────── */
function WelcomeMessage() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-200 leading-relaxed">
        Hi! I'm <strong className="text-white">ARIA</strong>, your AI construction project assistant powered by Groq.
      </p>
      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">I can help you with</p>
      <ul className="space-y-1.5">
        {CAPABILITIES.map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-2 text-sm text-gray-300">
            <span className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Icon className="w-3 h-3 text-blue-400" />
            </span>
            {text}
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-400 pt-1">What would you like help with today?</p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export function AIBrain() {
  const { isOpen, closeAIBrain } = useAIStore();

  const WELCOME: ChatMessage = {
    role: 'assistant',
    content: '__welcome__',
    timestamp: new Date(),
  };

  const [messages, setMessages]       = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

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
      const history = [...messages.filter(m => m.content !== '__welcome__'), userMsg].slice(-12);
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
    setMessages([{ ...WELCOME, timestamp: new Date() }]);
    setError(null);
  };

  if (!isOpen) return null;

  const isInitialState = messages.length === 1 && messages[0].content === '__welcome__';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={closeAIBrain} />
      <div className={`fixed right-4 bottom-4 z-50 flex flex-col rounded-2xl border border-gray-800 bg-[#0A0A0A] shadow-2xl shadow-blue-900/20 transition-all duration-300 ${isMinimized ? 'h-14 w-80' : 'h-[680px] w-[420px] max-h-[85vh]'}`}>

        {/* ── Header ─────────────────────────────────────────────── */}
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
              <p className="flex items-center gap-1 text-[10px] text-gray-500">
                <StatusLabel available={isAvailable} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} title="Clear chat"
              className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={closeAIBrain}
              className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {isAvailable === false && (
              <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 shrink-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Set <code className="bg-red-900/30 px-1 rounded">GROQ_API_KEY</code> in Vercel → Environment Variables to enable ARIA.</span>
              </div>
            )}

            {/* ── Messages ───────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gray-700'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm ${msg.role === 'assistant' ? 'bg-[#111] border border-gray-800 text-gray-200' : 'bg-blue-600 text-white'}`}>
                    {msg.role === 'assistant' ? (
                      msg.content === '__welcome__' ? (
                        <WelcomeMessage />
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-blue-300">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                    {msg.content !== '__welcome__' && (
                      <p className="text-[10px] opacity-30 mt-1.5 text-right">
                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
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

            {/* ── Quick actions ───────────────────────────────────── */}
            {isInitialState && (
              <div className="px-3 pb-2 shrink-0">
                <p className="text-[10px] text-gray-600 mb-2 font-medium uppercase tracking-widest">Quick Actions</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_PROMPTS.map(({ Icon, label, prompt }) => (
                    <button key={label} onClick={() => sendMessage(prompt)}
                      disabled={isLoading || isAvailable === false}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] bg-[#111] border border-gray-800 rounded-lg text-gray-400 hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all disabled:opacity-40">
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input ──────────────────────────────────────────── */}
            <div className="border-t border-gray-800 p-3 shrink-0">
              <div className="flex items-end gap-2 bg-[#111] border border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={isAvailable === false ? 'ARIA not configured…' : 'Ask ARIA anything about your project…'}
                  disabled={isLoading || isAvailable === false}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none focus:outline-none min-h-[20px] max-h-[100px] disabled:opacity-50 leading-relaxed"
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

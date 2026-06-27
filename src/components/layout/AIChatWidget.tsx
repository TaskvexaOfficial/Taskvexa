import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Image as ImageIcon, Mic, Sparkles, Loader2, Plus, ArrowLeft, Languages, Info, HelpCircle, Wallet, Settings, MoreVertical, History, Mail, Youtube, ExternalLink, ChevronRight, Bug, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ar', name: 'Arabic', native: 'العربية' }
];

const QUICK_OPTIONS = [
  { id: 'tasks', label: { en: 'Tasks Help', ur: 'کام کی مدد', hi: 'कार्य सहायता', bn: 'কাজ সাহায্য', ar: 'مساعدة المهام' }, icon: Sparkles },
  { id: 'withdrawals', label: { en: 'Withdrawals', ur: 'رقم نکالنا', hi: 'निकासी', bn: 'টাকা তোলা', ar: 'السحب' }, icon: Wallet },
  { id: 'referrals', label: { en: 'Referrals', ur: 'ریفرل', hi: 'रेफरल', bn: 'রেফারাল', ar: 'الإحالات' }, icon: Plus },
  { id: 'support', label: { en: 'Human Support', ur: 'انسانی مدد', hi: 'मानव सहायता', bn: 'মানবিক সাহায্য', ar: 'الدعم البشري' }, icon: HelpCircle },
];

export function AIChatWidget() {
  const { isChatOpen, setChatOpen } = useStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'agent', content: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatStep, setChatStep] = useState<'language' | 'options' | 'chat'>('language');
  const [selectedLang, setSelectedLang] = useState<string>('en');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Reset chat step when closed
    if (!isChatOpen) {
      setChatStep('language');
    }
  }, [isChatOpen]);

  // Persists chat messages in localStorage whenever they change
  useEffect(() => {
    if (messages && messages.length > 0) {
      localStorage.setItem('taskvexa_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    // Initialize Speech Recognition
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
          if (!event.results || event.results.length === 0) return;
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript) {
            setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
          }
          setIsRecording(false);
        };

        recognitionRef.current.onerror = () => setIsRecording(false);
        recognitionRef.current.onend = () => setIsRecording(false);
      }
    } catch (err) {
      console.warn("Speech recognition initialization failed:", err);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage = { 
      role: 'user' as const, 
      content: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.concat(userMessage),
          language: LANGUAGES.find(l => l.code === selectedLang)?.name || 'English'
        })
      });
      
      if (!response.ok) {
        throw new Error('AI Server responded with an error');
      }

      const data = await response.json();
      if (data && data.reply) {
        setMessages(prev => [...prev, { role: 'agent', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'agent', content: "Sorry, I encountered an error. Please try again." }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'agent', content: "Network error. Please check your connection." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isChatOpen]);

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 w-[320px] sm:w-[360px] mb-4 flex flex-col overflow-hidden"
              style={{ height: '520px', maxHeight: '75vh' }}
            >
              {/* Header */}
              <div className="p-4 bg-indigo-600 flex items-center justify-between text-white shrink-0 shadow-lg relative z-10">
                <div className="flex items-center gap-3">
                  {chatStep !== 'language' && (
                    <button 
                      onClick={() => {
                        setChatStep(chatStep === 'chat' ? 'options' : 'language');
                        setIsMenuOpen(false);
                      }}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner overflow-hidden relative group">
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] leading-tight">Vexa AI</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest text-indigo-100">Premium Support</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {/* Modern 3-dot dropdown menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)} 
                      className={`p-2 rounded-full transition-colors active:scale-95 relative hover:bg-white/10 ${isMenuOpen ? 'bg-white/10 text-white' : 'text-indigo-100'}`}
                      id="vexa-chat-menu-btn"
                    >
                      <MoreVertical className="w-5 h-5 pointer-events-none" />
                    </button>
                    
                    {/* Dropdown UI */}
                    <AnimatePresence>
                      {isMenuOpen && (
                        <>
                          {/* Close blanket */}
                          <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-2 z-20 text-slate-800 dark:text-slate-200 text-left overflow-hidden"
                            style={{ top: '100%' }}
                          >
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/30 mb-1 leading-none mt-1">
                              Quick Controls
                            </div>
                            
                            {/* Option 1: Chat History */}
                            <button
                              onClick={() => {
                                setIsMenuOpen(false);
                                const saved = localStorage.getItem('taskvexa_chat_history');
                                if (saved) {
                                  try {
                                    setMessages(JSON.parse(saved));
                                  } catch (e) {
                                    setMessages([{ role: 'agent', content: 'Welcome back! How can Vexa AI assist you on taskvexa.xyz today?' }]);
                                  }
                                } else {
                                  setMessages([{ role: 'agent', content: 'Welcome! How can Vexa AI assist you on taskvexa.xyz today?' }]);
                                }
                                setChatStep('chat');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-xs font-bold text-slate-700 dark:text-slate-300"
                            >
                              <History className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Chat History</span>
                            </button>

                            {/* Option 2: Withdrawals / Wallet */}
                            <button
                              onClick={() => {
                                setIsMenuOpen(false);
                                navigate('/dashboard/wallet');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-xs font-bold text-slate-700 dark:text-slate-300"
                            >
                              <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>My Wallet / Payouts</span>
                            </button>

                            {/* Option 3: Support Channels */}
                            <button
                              onClick={() => {
                                setIsMenuOpen(false);
                                setShowSupportModal(true);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors text-xs font-black text-indigo-600 dark:text-indigo-400 animate-pulse"
                            >
                              <HelpCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>Support Center</span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    onClick={() => {
                      setChatOpen(false);
                      setIsMenuOpen(false);
                    }} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90 text-indigo-100 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 relative">
                <AnimatePresence mode="wait">
                  {chatStep === 'language' && (
                    <motion.div 
                      key="lang"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-6 flex flex-col items-center justify-center h-full space-y-6"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-indigo-200 dark:border-indigo-800 shadow-inner">
                          <Languages className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white">Choose Language</h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">AI will respond in your language</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 w-full">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setSelectedLang(lang.code);
                              setChatStep('options');
                            }}
                            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all flex flex-col items-center group active:scale-[0.98]"
                          >
                            <span className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {lang.native}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {lang.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {chatStep === 'options' && (
                    <motion.div 
                      key="options"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-6 flex flex-col items-center justify-center h-full space-y-6"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800 shadow-inner">
                          <Plus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white">Quick Access</h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Select a topic to start chat</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 w-full">
                        {QUICK_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              const welcomeMsg = { 
                                role: 'agent' as const, 
                                content: `Hello! I'm ready to help you with ${opt.label.en}. What specifically do you need?` 
                              };
                              setMessages([welcomeMsg]);
                              setChatStep('chat');
                            }}
                            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all flex items-center gap-4 group active:scale-[0.98]"
                          >
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                              <opt.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-left">
                              <span className="block text-[15px] font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {(opt.label as any)[selectedLang] || opt.label.en}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {chatStep === 'chat' && (
                    <motion.div 
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 space-y-4 h-full"
                    >
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-[20px] p-3 text-[13px] font-medium leading-relaxed shadow-sm transition-all ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white rounded-br-sm shadow-indigo-600/20' 
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50 rounded-bl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          
                          {/* Suggested Options after Agent Message removed to keep UI premium and clean */}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm p-3 shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                            <div className="flex gap-1">
                              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 italic uppercase tracking-widest">Typing</span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              {chatStep === 'chat' && (
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] dark:shadow-none">

                
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={isRecording ? "Listening..." : "Ask anything..."}
                      disabled={isRecording}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-full py-3 px-10 focus:ring-1 focus:ring-indigo-500 text-[13px] font-medium text-slate-900 dark:text-white"
                    />
                    <button 
                      onClick={toggleRecording}
                      className={`absolute right-2 p-1.5 rounded-full transition-all ${isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
                    >
                      <Mic className={`w-4 h-4 ${isRecording ? 'scale-110' : ''}`} />
                    </button>
                    <div className="absolute left-3 p-1.5 text-slate-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-full hover:brightness-105 active:scale-95 disabled:opacity-30 transition-all shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* Support Center modal inside chat widget */}
            <AnimatePresence>
              {showSupportModal && (
                <motion.div
                  initial={{ opacity: 0, y: '100%' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: '100%' }}
                  className="absolute inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col p-5"
                  style={{ height: '100%', top: 0, left: 0 }}
                >
                  {/* Modal Support Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <HelpCircle className="w-4.5 h-4.5" />
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Support Center</h3>
                    </div>
                    <button 
                      onClick={() => setShowSupportModal(false)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Support Links Container */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin text-left">
                    <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">
                      Official Contact & Broadcast Channels
                    </p>

                    {/* Link 1: Official Email contact */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-900/30 transition-all">
                      <div className="flex gap-3 items-center">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none mb-1">Send Email</span>
                          <a href="mailto:taskvexa.official@gmail.com" className="text-xs font-black text-slate-800 dark:text-white hover:underline truncate block">
                            taskvexa.official@gmail.com
                          </a>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-none block mt-1">Admin email - response in 24h</span>
                        </div>
                      </div>
                    </div>

                    {/* Link 2: WhatsApp Channel 1 (Withdraw & Daily Updates) */}
                    <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/15 rounded-2xl border border-emerald-100/50 dark:border-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800/40 transition-all">
                      <div className="flex gap-3 items-center">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                          <MessageCircle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">WhatsApp Channel 1</span>
                          <a 
                            href="https://whatsapp.com/channel/0029Vb8U3toIHphBlB0llP47" 
                            target="_blank"  
                            rel="noopener noreferrer"
                            className="text-xs font-black text-slate-800 dark:text-white hover:underline flex items-center gap-1"
                          >
                            Daily Tasks & Updates
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                          </a>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block leading-none mt-1">Tasks details and support channel</span>
                        </div>
                      </div>
                    </div>

                    {/* Link 3: WhatsApp Channel 2 (Community & Earnings Tips) */}
                    <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/15 rounded-2xl border border-emerald-100/50 dark:border-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800/40 transition-all">
                      <div className="flex gap-3 items-center">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">WhatsApp Channel 2</span>
                          <a 
                            href="https://whatsapp.com/channel/0029VbCrizq4inoi8IA9T92i" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-black text-slate-800 dark:text-white hover:underline flex items-center gap-1"
                          >
                            Official Broadcast
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                          </a>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block leading-none mt-1">Payment proofs & earnings tips</span>
                        </div>
                      </div>
                    </div>

                    {/* Link 4: YouTube channel for guides */}
                    <div className="p-3 bg-rose-50/40 dark:bg-rose-950/10 rounded-2xl border border-rose-100/40 dark:border-rose-950/30 hover:border-rose-300 dark:hover:border-rose-900/30 transition-all">
                      <div className="flex gap-3 items-center">
                        <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                          <Youtube className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none mb-1">YouTube Channel</span>
                          <a 
                            href="https://www.youtube.com/@Taskvexa-xyz" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-black text-slate-800 dark:text-white hover:underline flex items-center gap-1"
                          >
                            TaskVexa Guides
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                          </a>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block leading-none mt-1">Step-by-step video tutorials</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                      Need anything else? Feel free to ask Vexa AI chatbot directly in any language!
                    </div>
                  </div>

                  <div className="pt-3 shrink-0">
                    <button
                      onClick={() => setShowSupportModal(false)}
                      className="w-full h-11 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/10"
                    >
                      Back to Chat
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Trigger Button */}
        <button
          onClick={() => setChatOpen(!isChatOpen)}
          className="group relative"
        >
          <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-[22px] scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Main button frame - custom, smaller, premium squircle */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-slate-950 rounded-[22px] p-[1.5px] shadow-[0_12px_35px_rgba(79,70,229,0.25)] hover:shadow-[0_15px_45px_rgba(79,70,229,0.35)] transform group-hover:translate-y-[-3px] active:scale-95 transition-all duration-300 overflow-hidden border border-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-rose-500 rounded-[20px] opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative h-full w-full rounded-[20px] bg-slate-950/85 group-hover:bg-slate-950/75 flex items-center justify-center overflow-hidden transition-colors">
              <AnimatePresence mode="wait">
                {isChatOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <X className="w-5 h-5 text-indigo-200" />
                  </motion.div>
                ) : (
                  <motion.div key="open" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex flex-col items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-amber-300 group-hover:scale-115 transition-all duration-300 animate-pulse" />
                      <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-sm scale-75 group-hover:scale-110 transition-transform" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Premium Rotating Diagonal Shine */}
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 transform translate-y-full group-hover:translate-y-[-100%] transition-transform duration-1000" />
            </div>
          </div>
          
          {/* Small customized Live badge */}
          {!isChatOpen && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.3)] border border-white dark:border-slate-950 z-10 tracking-wider uppercase"
            >
              AI
            </motion.div>
          )}
        </button>
      </div>
    </>
  );
}

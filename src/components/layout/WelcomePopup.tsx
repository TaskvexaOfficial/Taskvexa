import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, ShieldCheck, ChevronRight, X, User } from 'lucide-react';
import { useStore } from '@/store';

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const navigate = useNavigate();
  const { cachedProfile } = useStore();

  useEffect(() => {
    // Check if the user opted out for today
    const lastHiddenDate = localStorage.getItem('welcomePopupHiddenDate');
    const today = new Date().toISOString().split('T')[0];

    // Show popup if they didn't check the box today
    if (lastHiddenDate !== today) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowToday) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('welcomePopupHiddenDate', today);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 overflow-hidden rounded-[24px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="shrink-0 p-5 pb-3 relative">
            <button 
              onClick={handleClose}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="pr-10">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">👋</span> Welcome Back!
              </h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                Hi {cachedProfile?.full_name?.split(' ')[0] || 'there'}, ready to earn more today?
              </p>
            </div>
          </div>

          {/* Body Cards Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 no-scrollbar">
            
            {/* Card 1 - WhatsApp */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    📢 Join Official WhatsApp Channel
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Latest updates, announcements aur important news sab se pehle hasil karne ke liye hamara official WhatsApp Channel join karein.
                  </p>
                  <a 
                    href="https://whatsapp.com/channel/0029VbCrizq4inoi8IA9T92i" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl transition-colors gap-1.5"
                  >
                    Join Now
                  </a>
                </div>
              </div>
            </div>

            {/* Card 2 - Referral Competition */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 hover:border-amber-200 dark:hover:border-amber-900/50 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    🏆 Referral Competition Live
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Top Referral Earners ko special rewards diye jayenge. Apna referral link share karein aur zyada earnings hasil karke leaderboard me top position jeetin.
                  </p>
                  <button 
                    onClick={() => {
                      handleClose();
                      navigate('/dashboard/referral-competition');
                    }}
                    className="mt-3 inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors gap-1.5"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3 - Important Rules */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    📋 Important Rules
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Website use karne se pehle Rules & Regulations zaroor parhein. Multiple accounts ya fake activity par account ban ho sakta hai.
                  </p>
                  <button 
                    onClick={() => {
                      handleClose();
                      navigate('/dashboard/rules');
                    }}
                    className="mt-3 inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors gap-1.5"
                  >
                    Read Rules
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="shrink-0 p-5 pt-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 mt-2">
            <div className="flex items-center justify-center mb-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={dontShowToday}
                  onChange={(e) => setDontShowToday(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  Don't show again today
                </span>
              </label>
            </div>
            
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Continue to Dashboard
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

export default function SuggestionsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData(e.target as HTMLFormElement);

      const { error } = await supabase.from('user_feedback').insert({
        user_id: session.user.id,
        type: 'suggestion',
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        status: 'pending'
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting suggestion:', error);
      if (error.message?.includes('JWT expired')) {
        alert('Your session has expired. Please log in again.');
        useStore.getState().clearCache();
        window.location.href = '/auth';
      } else {
        alert('Failed to submit suggestion. ' + (error.message || ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-20 px-2 lg:px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div className="space-y-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-4 group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Settings
          </button>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[16px] bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 mb-2 shadow-sm">
            <Lightbulb className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feature Request</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Feature Suggestions</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
            Have an idea for a new feature? We'd love to hear it. Guide the future of Taskvexa by suggesting improvements.
          </p>
        </div>
      </div>

      <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 overflow-hidden text-left transition-colors relative group border border-slate-100 dark:border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-colors duration-700"></div>
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 lg:p-12 relative z-10"
            >
               <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Type of Suggestion</label>
                     <select name="category" className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-6 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all font-bold text-base text-slate-900 dark:text-white appearance-none shadow-inner">
                        <option>New Feature Idea</option>
                        <option>UI/UX Improvement</option>
                        <option>Task Request</option>
                        <option>Other</option>
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Title</label>
                     <input 
                       type="text"
                       name="title"
                       required
                       placeholder="Summarize your idea (e.g., Add dark mode)"
                       className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-6 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all font-bold text-base text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-inner"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Details & Use Case</label>
                     <textarea 
                       name="description"
                       rows={6}
                       required
                       placeholder="Explain your idea. Why would this be a great addition? How would it work?"
                       className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[24px] py-4 px-6 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all font-bold text-base text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none shadow-inner"
                     />
                  </div>

                  <Button 
                    variant="primary"
                    type="submit" 
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-black shadow-xl shadow-blue-600/20 transition-all border-none flex items-center justify-center gap-3 text-lg mt-8 hover:-translate-y-1"
                    isLoading={isSubmitting}
                  >
                     {isSubmitting ? 'Sending...' : (
                       <>
                         <Send className="w-5 h-5" />
                         Submit Suggestion
                       </>
                     )}
                  </Button>
               </form>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 md:p-20 text-center flex flex-col items-center justify-center relative z-10"
            >
               <div className="w-32 h-32 bg-emerald-50 dark:bg-emerald-500/10 rounded-[32px] flex items-center justify-center mb-8 shadow-inner shadow-emerald-500/20 relative group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 rounded-[32px] border-[6px] border-emerald-100 opacity-20 dark:border-emerald-500/20 animate-ping"></div>
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
               </div>
               <div className="space-y-4 mb-10">
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Idea Submitted!</h3>
                  <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                    Thanks for your suggestion. We regularly review these ideas and prioritize those that bring the most value.
                  </p>
               </div>
               <Button 
                 onClick={() => setSubmitted(false)}
                 className="rounded-[20px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-black h-16 text-lg px-12 transition-colors border-none text-slate-900 dark:text-white"
               >
                  Suggest Another Idea
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

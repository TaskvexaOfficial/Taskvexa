import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

export default function WebsiteReviewPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setIsSubmitting(true);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData(e.target as HTMLFormElement);

      const { error } = await supabase.from('user_feedback').insert({
        user_id: session.user.id,
        type: 'review',
        rating: rating,
        description: `Recommend: ${formData.get('recommend')}\n\nReview: ${formData.get('review')}`,
        status: 'pending'
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error.message?.includes('JWT expired')) {
        alert('Your session has expired. Please log in again.');
        useStore.getState().clearCache();
        window.location.href = '/auth';
      } else {
        alert('Failed to submit review. ' + (error.message || ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-20 px-2 lg:px-4">
      <div className="flex flex-col gap-4 text-center items-center px-4 mb-8">
        <div className="w-full flex justify-start mb-2">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Settings
          </button>
        </div>
        <div className="w-20 h-20 rounded-[20px] bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-500 flex items-center justify-center mb-2 shadow-sm rotate-[-4deg] group-hover:rotate-0 transition-transform">
          <Star className="w-10 h-10 fill-current" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Review Taskvexa</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
          Your feedback is critical to our continuous improvement. Let us know how you feel about using our platform.
        </p>
      </div>

      <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 overflow-hidden transition-colors relative group border border-slate-100 dark:border-slate-800 mx-auto max-w-3xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 dark:bg-amber-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-colors duration-700"></div>
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 lg:p-12 space-y-10 relative z-10"
            >
               <div className="flex flex-col items-center gap-4 sm:gap-6 bg-slate-50 dark:bg-slate-900/50 rounded-[24px] p-6 sm:p-8 shadow-inner border border-slate-100 dark:border-slate-800">
                 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">Select Rating</p>
                 <div className="flex items-center gap-1 sm:gap-2">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <button
                       key={star}
                       type="button"
                       onClick={() => setRating(star)}
                       onMouseEnter={() => setHoverRating(star)}
                       onMouseLeave={() => setHoverRating(0)}
                       className="p-1 sm:p-2 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                     >
                       <Star 
                         className={`w-8 h-8 sm:w-12 sm:h-12 transition-colors ${
                           star <= (hoverRating || rating) 
                             ? 'fill-amber-400 text-amber-400 drop-shadow-md' 
                             : 'fill-slate-200/50 text-slate-300 dark:fill-slate-800 dark:text-slate-700'
                         }`} 
                       />
                     </button>
                   ))}
                 </div>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Would you recommend us?</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <label className="flex items-center gap-3 p-4 sm:p-6 rounded-[20px] border-none bg-slate-50 dark:bg-slate-900/50 cursor-pointer shadow-inner hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                           <input type="radio" name="recommend" value="Yes" className="w-5 h-5 text-amber-500 focus:ring-amber-500 border-slate-300 pointer-events-none" defaultChecked />
                           <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Yes, absolutely</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 sm:p-6 rounded-[20px] border-none bg-slate-50 dark:bg-slate-900/50 cursor-pointer shadow-inner hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                           <input type="radio" name="recommend" value="Not sure" className="w-5 h-5 text-amber-500 focus:ring-amber-500 border-slate-300 pointer-events-none" />
                           <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Not sure yet</span>
                        </label>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Your Review</label>
                     <textarea 
                        name="review"
                        rows={6}
                        required
                        placeholder="Tell us what you liked and what we can improve..."
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[24px] py-4 px-6 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-bold text-base text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none shadow-inner"
                      />
                  </div>

                  <Button 
                    variant="primary"
                    type="submit" 
                    disabled={rating === 0}
                    className="w-full h-16 bg-amber-500 hover:bg-amber-600 text-white rounded-[20px] font-black shadow-xl shadow-amber-500/20 transition-all border-none flex items-center justify-center gap-3 text-lg mt-8 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                    isLoading={isSubmitting}
                  >
                     {isSubmitting ? 'Submitting Review...' : (
                       <>
                         <Send className="w-5 h-5" />
                         Submit Feedback
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
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Review Submitted!</h3>
                  <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                    Thank you immensely for your feedback. We read every review carefully!
                  </p>
               </div>
               <Button 
                 onClick={() => { setSubmitted(false); setRating(0); }}
                 className="rounded-[20px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-black h-16 text-lg px-12 transition-colors border-none text-slate-900 dark:text-white"
               >
                  Back to Dashboard
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

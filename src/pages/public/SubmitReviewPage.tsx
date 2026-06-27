import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSEO } from '@/hooks/useSEO';

export default function SubmitReviewPage() {
  useSEO({
    title: "Write a Review - TaskVexa Earning Platform",
    description: "Submit a review about your TaskVexa experience. Share your feedback, rate our tasks and withdrawal efficiency, and help us improve.",
    canonicalPath: "/submit-review"
  });

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-20 px-6 pt-32">
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Rate Your Experience</h1>
          <p className="text-lg text-slate-600">Your feedback helps us make Taskvexa better for everyone.</p>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div 
              key="form"
              initial={{opacity:0, y:20}} 
              animate={{opacity:1, y:0}} 
              exit={{opacity:0, scale:0.95}}
              className="bg-white p-8 md:p-12 rounded-[32px] shadow-xl border border-slate-100"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="text-center space-y-4">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest">Overall Rating</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star className={`w-10 h-10 ${star <= (hoveredRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 fill-transparent'} transition-colors`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">Write your review</label>
                  <textarea 
                    required
                    rows={5}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-[#4F46E5] focus:outline-none transition-all resize-none text-slate-700"
                    placeholder="Tell us what you loved, or what we can improve..."
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">Your Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#4F46E5] focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">Role / Title</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#4F46E5] focus:outline-none"
                      placeholder="e.g. Freelancer"
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full h-14 bg-[#4F46E5] text-white text-lg rounded-xl" disabled={rating === 0}>
                  Submit Review
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{opacity:0, scale:0.95}} 
              animate={{opacity:1, scale:1}} 
              className="bg-white p-12 text-center rounded-[32px] shadow-xl border border-slate-100 flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Thank You!</h2>
              <p className="text-slate-600 mb-8 max-w-sm">Your review has been submitted successfully and is pending approval from our moderation team.</p>
              <Button onClick={() => window.history.back()} variant="outline" className="rounded-xl px-8">Return Back</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

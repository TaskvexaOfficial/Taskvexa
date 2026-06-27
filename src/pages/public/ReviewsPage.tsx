import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "Student",
    content: "Taskvexa helped me pay for my college textbooks this semester. The tasks are super easy and payouts are actually fast. I've tried many platforms, but this one is the most reliable.",
    rating: 5,
    date: "May 2026"
  },
  {
    name: "Michael Chen",
    role: "Freelancer",
    content: "I've tried a dozen reward apps, but this one has the highest payout rates. I do it during my commute and earn about $50 a week.",
    rating: 5,
    date: "April 2026"
  },
  {
    name: "Ayesha Noor",
    role: "Stay-at-home Mom",
    content: "Very reliable platform. The customer support is quick, and I love the survey tasks.",
    rating: 4,
    date: "March 2026"
  },
  {
    name: "David Roberts",
    role: "Gamer",
    content: "The app testing tasks are my favorite. I basically get paid to play new unreleased games. Withdrawal to crypto is seamless and exactly what I needed.",
    rating: 5,
    date: "March 2026"
  },
  {
    name: "Elena Rodriguez",
    role: "Designer",
    content: "Clean interface and straightforward earnings. Sometimes the tasks run out quickly, but overall a solid 4/5 experience.",
    rating: 4,
    date: "Feb 2026"
  },
  {
    name: "James Wilson",
    role: "Student",
    content: "The referral system here is extremely lucrative. I invited my gaming clan and now I make passive income every week.",
    rating: 5,
    date: "Jan 2026"
  }
];

export default function ReviewsPage() {
  useSEO({
    title: "Reviews - TaskVexa Earning Platform",
    description: "Read reviews and success stories from the TaskVexa community. Learn how thousands of users worldwide complete tasks and receive daily payouts.",
    canonicalPath: "/reviews"
  });

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="bg-[#0F172A] text-white pt-32 pb-20 px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Community Reviews</h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl">Read what thousands of earners are saying about their experience with Taskvexa.</p>
          <div className="flex items-center gap-6 bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10 mb-10">
             <div className="text-5xl font-bold text-white">4.8</div>
             <div>
                <div className="flex gap-1 mb-1">
                   {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-slate-300 font-medium">Based on 12,450+ reviews</p>
             </div>
          </div>
          <Link to="/submit-review">
            <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-full h-14 px-8 font-bold">Write a Review</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {TESTIMONIALS.map((t, idx) => (
           <motion.div 
             key={idx} 
             initial={{opacity: 0, y: 20}}
             whileInView={{opacity: 1, y: 0}}
             viewport={{once: true}}
             transition={{delay: idx * 0.1}}
             className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col"
           >
             <div className="flex justify-between items-start mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < t.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase">{t.date}</span>
             </div>
             <p className="text-slate-700 text-lg mb-8 leading-relaxed flex-1">"{t.content}"</p>
             <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-lg">
                   {t.name[0]}
                </div>
                <div>
                   <p className="font-bold text-slate-900">{t.name}</p>
                   <p className="text-sm text-slate-500">{t.role}</p>
                </div>
             </div>
           </motion.div>
         ))}
      </div>
    </div>
  );
}

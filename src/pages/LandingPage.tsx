import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { 
  ArrowRight, CheckCircle2, Zap, Shield, TrendingUp, Star, ChevronDown, Globe, Wallet, Check, Menu, X, UserPlus, CheckSquare as CheckSquare2, Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { BannerAd } from '@/components/BannerAd';
import { useSEO } from '@/hooks/useSEO';

const FAQs = [
  {
    question: "How do I start earning?",
    answer: "Simply create an account, browse the available tasks in your dashboard, and start completing them. Once a task is verified, coins are credited to your wallet instantly."
  },
  {
    question: "When can I withdraw my earnings?",
    answer: "You can request a withdrawal as soon as you hit the minimum threshold of 5,000 coins ($5 equivalent). Withdrawals are processed within 24 hours."
  },
  {
    question: "What payment methods are supported?",
    answer: "We support direct Bank Transfers, Crypto (USDT, BTC), PayPal, and various local e-wallets like JazzCash and Easypaisa depending on your region."
  },
  {
    question: "Is there a limit to how much I can earn?",
    answer: "Absolutely not! The more tasks you complete, the more you earn. Our top earners make over $500 monthly."
  }
];

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "Student",
    content: "Taskvexa helped me pay for my college textbooks this semester. The tasks are super easy and payouts are actually fast.",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Freelancer",
    content: "I've tried a dozen reward apps, but this one has the highest payout rates. I do it during my commute and earn about $50 a week.",
    rating: 5
  },
  {
    name: "Ayesha Noor",
    role: "Stay-at-home Mom",
    content: "Very reliable platform. The customer support is quick, and I love the survey tasks. Easy money for spare time.",
    rating: 4
  }
];

export default function LandingPage() {
  useSEO({
    title: "TaskVexa - Earn Money Online with Simple Tasks",
    description: "TaskVexa is a free task-based earning platform where users complete simple online tasks and earn real money. Daily tasks, fast verification, quick withdrawals, and a beginner-friendly earning experience.",
    canonicalPath: "/",
    keywords: "TaskVexa, online earning, earn money online, task based earning, daily earning, simple tasks, online tasks Pakistan, free earning platform, task rewards, earn money from home"
  });

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-slate-200 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* HERO SECTION */}
      <main className="relative min-h-[100svh] flex flex-col justify-center pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-[#F8FAFC] dark:bg-[#020617] relative z-10">
        {/* Soft Premium Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-[120px] -z-10 pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-full max-w-[800px] h-[600px] bg-gradient-to-t from-cyan-500/10 to-transparent blur-[120px] -z-10 pointer-events-none rounded-full"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start text-left relative z-20"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-10 shadow-xl shadow-slate-200/20 dark:shadow-none backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
              The Next Era of Earning
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[100px] font-black tracking-tighter leading-[0.9] text-slate-900 dark:text-white mb-10 drop-shadow-sm">
              Earn with <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500">
                Precision.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-14 max-w-xl leading-relaxed font-medium">
              Join the most refined platform for monetizing your spare time. High-payout tasks, instant verifications, and professional scale.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 w-full sm:w-auto">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto h-16 sm:h-20 px-8 sm:px-14 text-lg sm:text-xl rounded-[24px] sm:rounded-[28px] shadow-2xl shadow-indigo-600/30 transition-all duration-300 font-black border-none group hover:-translate-y-1">
                  Start Earning Free
                  <span className="ml-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </span>
                </Button>
              </Link>
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-4 mb-0">
                    {[1,2,3,4].map(i => <div key={i} className={`w-12 h-12 rounded-full border-4 border-[#F8FAFC] dark:border-[#020617] bg-slate-200 dark:bg-slate-700 z-${5-i} relative shadow-sm`} />)}
                 </div>
                 <div className="flex flex-col items-start">
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">50K+</p>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Active Earners</p>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Premium UI Component Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
             <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-none relative z-10 w-full max-w-md mx-auto transform group hover:-translate-y-2 transition-transform duration-500 flex border border-slate-100 dark:border-slate-700/50">
               {/* Left Gradient Sidebar */}
               <div className="w-16 sm:w-20 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-l-[32px] shrink-0 relative overflow-hidden">
                 <div className="absolute top-6 left-1/2 -translate-x-1/2">
                   <Logo className="w-8 h-8 text-white opacity-80" />
                 </div>
               </div>
               
               {/* Right Content */}
               <div className="flex-1 p-8 pb-10 bg-white dark:bg-slate-800 rounded-r-[32px]">
                 <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-8 tracking-tight">
                   My tasks <span className="text-2xl">🎉</span>
                 </h3>
                 
                 <div className="space-y-4">
                   {/* Task 1 */}
                   <div className="bg-white dark:bg-slate-800/50 rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 relative hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all group/task">
                     <div className="flex items-center gap-2 mb-1.5">
                       <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-emerald-400 bg-transparent"></div>
                       <span className="text-emerald-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">New</span>
                     </div>
                     <h4 className="text-slate-900 dark:text-white font-black text-base sm:text-lg leading-tight mb-0.5">Launch website</h4>
                     <p className="text-slate-400 text-xs font-medium">Mark &bull; You</p>
                     
                     <div className="absolute top-4 right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-100 border-[2.5px] border-white dark:border-slate-800 shadow-sm group-hover/task:scale-110 transition-transform">
                       <img src="https://i.pravatar.cc/100?img=1" alt="Avatar" className="w-full h-full object-cover" />
                     </div>
                   </div>
                   
                   {/* Task 2 */}
                   <div className="bg-white dark:bg-slate-800/50 rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 relative hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all group/task">
                     <div className="flex items-center gap-2 mb-1.5">
                       <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-indigo-400 bg-transparent"></div>
                       <span className="text-indigo-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">In progress</span>
                     </div>
                     <h4 className="text-slate-900 dark:text-white font-black text-base sm:text-lg leading-tight mb-0.5">Send info pack</h4>
                     <p className="text-slate-400 text-xs font-medium">Mark &bull; You</p>
                     
                     <div className="absolute top-4 right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-100 border-[2.5px] border-white dark:border-slate-800 shadow-sm group-hover/task:scale-110 transition-transform">
                       <img src="https://i.pravatar.cc/100?img=5" alt="Avatar" className="w-full h-full object-cover" />
                     </div>
                   </div>
                   
                   {/* Task 3 */}
                   <div className="bg-white dark:bg-slate-800/50 rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 relative hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all group/task">
                     <div className="flex items-center gap-2 mb-1.5">
                       <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-indigo-400 bg-transparent"></div>
                       <span className="text-indigo-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">In progress</span>
                     </div>
                     <h4 className="text-slate-900 dark:text-white font-black text-base sm:text-lg leading-tight mb-0.5">Hire intern</h4>
                     <p className="text-slate-400 text-xs font-medium">May 4 &bull; 3:00PM</p>
                     
                     <div className="absolute top-4 right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-100 border-[2.5px] border-white dark:border-slate-800 shadow-sm group-hover/task:scale-110 transition-transform">
                       <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" className="w-full h-full object-cover" />
                     </div>
                   </div>
                 </div>
               </div>

               {/* Overlapping Avatars/Badges */}
               <div className="absolute top-16 -left-12 sm:-left-16 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-3 py-4 gap-2.5 border border-slate-100 dark:border-slate-700 z-20 animate-[bounce_6s_infinite] hover:scale-105 transition-transform">
                 <div className="w-12 h-12 rounded-full overflow-hidden border-[3px] border-white dark:border-slate-800 shadow-md">
                   <img src="https://i.pravatar.cc/150?img=32" alt="Avatar" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex flex-col items-center gap-1">
                   <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center text-white shadow-sm shadow-emerald-400/40">
                     <Check className="w-4 h-4" />
                   </div>
                   <span className="text-[9px] font-black tracking-[0.2em] text-emerald-500">DONE</span>
                 </div>
               </div>
               
               <div className="absolute bottom-16 -left-8 sm:-left-12 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-3 py-4 gap-2.5 border border-slate-100 dark:border-slate-700 z-20 animate-[bounce_7s_infinite_reverse] hover:scale-105 transition-transform">
                 <div className="w-12 h-12 rounded-full overflow-hidden border-[3px] border-white dark:border-slate-800 shadow-md">
                   <img src="https://i.pravatar.cc/150?img=12" alt="Avatar" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex flex-col items-center gap-1">
                   <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center text-white shadow-sm shadow-emerald-400/40">
                     <Check className="w-4 h-4" />
                   </div>
                   <span className="text-[9px] font-black tracking-[0.2em] text-emerald-500">DONE</span>
                 </div>
               </div>
             </div>
             {/* Dynamic Glow */}
             <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 blur-[80px] rounded-full -z-10 animate-pulse"></div>
          </motion.div>
        </div>
      </main>

      {/* STATS SECTION */}
      <section className="border-y border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap justify-center lg:justify-between items-center gap-12 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[11px]">
           <div className="flex items-center gap-3"><Globe className="w-5 h-5 text-indigo-500 opacity-50"/> Global Exchange</div>
           <div className="flex items-center gap-3"><Wallet className="w-5 h-5 text-indigo-500 opacity-50"/> Wallet Secure</div>
           <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-indigo-500 opacity-50"/> Data Privacy</div>
           <div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-indigo-500 opacity-50"/> High Liquidity</div>
        </div>
      </section>

      {/* AD POSITION 1: Below Hero (and Stats) */}
      <section className="relative z-20 bg-white dark:bg-[#020617] pt-12">
        <BannerAd />
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">The Path to Payouts</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Three sophisticated steps between you and your earnings. We removed the complex processes so you can focus on accumulating value.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
             <div className="hidden md:block absolute top-24 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
             
             {[
               { title: "Registration", desc: "Create your workspace in seconds. High-end encryption protects every detail.", icon: UserPlus },
               { title: "Engagement", desc: "Select tasks curated for your profile. Complete with precision and speed.", icon: CheckSquare2 },
               { title: "Redemption", desc: "Convert your effort into real capital. Instant bank and crypto transfers.", icon: Banknote }
             ].map((item, idx) => (
                <div key={idx} className="group relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[32px] bg-white dark:bg-slate-800 border-none shadow-2xl shadow-slate-200/40 dark:shadow-none flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-10 group-hover:-translate-y-4 transition-all duration-500 ease-out relative ring-1 ring-slate-100 dark:ring-slate-700">
                     <div className="absolute inset-0 bg-indigo-500/5 rounded-[32px] group-hover:bg-indigo-500/10 transition-colors"></div>
                     <item.icon className="w-10 h-10 relative z-10" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">{item.title}</h3>
                  <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-sm">{item.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      {/* AD POSITION 2: Below middle content (How it works) */}
      <section className="bg-slate-900 dark:bg-black py-12 border-b border-white/5 relative z-20">
        <BannerAd />
      </section>

      <section className="py-40 bg-slate-900 dark:bg-black text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-600/10 dark:bg-indigo-600/20 blur-[200px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
             <div>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-white/5 border border-white/10 text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] mb-10 backdrop-blur-md">
                   Infrastructure
                </div>
                <h2 className="text-6xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter">Built for the <br/><span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400">Top 1%</span></h2>
                <p className="text-2xl text-slate-400 mb-16 leading-relaxed font-medium max-w-lg">We've eliminated the friction found on legacy platforms. Experience the world's most responsive task verification engine.</p>
                
                <div className="space-y-6">
                   {[
                     { t: "Neural Verification", d: "Tasks are verified in under 1.2 seconds automatically." },
                     { t: "Global Payouts", d: "Withdraw in over 120 currencies effortlessly." }
                   ].map((f, i) => (
                     <div key={i} className="flex gap-6 items-start p-8 bg-white/5 rounded-[32px] border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
                        <div className="w-14 h-14 rounded-[20px] bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                           <Zap className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                           <h4 className="font-black text-2xl text-white mb-2 tracking-tight">{f.t}</h4>
                           <p className="text-slate-400 font-medium text-lg">{f.d}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-40 bg-[#F8FAFC] dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
             <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Proven Results</h2>
             <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">Don't just take our word for it. See what top earners are saying about their experience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
               <div key={idx} className="bg-white dark:bg-slate-800 p-10 rounded-[40px] border border-slate-100 dark:border-slate-700/50 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-2 transition-transform duration-500">
                 <div className="flex gap-1.5 mb-8">
                    {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400 drop-shadow-sm" />)}
                 </div>
                 <p className="text-slate-700 dark:text-slate-300 text-xl font-medium mb-12 leading-relaxed">"{t.content}"</p>
                 <div className="flex items-center gap-5 border-t border-slate-100 dark:border-slate-700/50 pt-8">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[20px] flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-2xl">
                       {t.name[0]}
                    </div>
                    <div>
                       <p className="font-black text-slate-900 dark:text-white text-lg">{t.name}</p>
                       <p className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-[10px] mt-1">{t.role}</p>
                    </div>
                 </div>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
           <div className="bg-slate-900 dark:bg-black rounded-[40px] md:rounded-[64px] p-8 sm:p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-transparent to-cyan-500/20"></div>
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>
              
              <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter relative z-10 leading-none">Start your <br/>journey.</h2>
              <p className="text-lg md:text-2xl text-slate-400 dark:text-slate-500 mb-8 md:mb-14 max-w-2xl mx-auto relative z-10 font-medium">Join the elite earning community today. Registration takes exactly 30 seconds.</p>
              
              <Link to="/auth" className="relative z-10 block sm:inline-block w-full sm:w-auto">
                <Button variant="primary" className="h-16 md:h-24 px-8 md:px-16 text-lg md:text-2xl rounded-[24px] md:rounded-[32px] font-black transition-all shadow-2xl hover:scale-105 active:scale-95 border-none w-full sm:w-auto">
                   Initialize Workspace
                </Button>
              </Link>
           </div>
        </div>
      </section>

      {/* AD POSITION 3: Directly Above Footer */}
      <section className="bg-white dark:bg-slate-900 py-12 relative z-20">
        <BannerAd />
      </section>


    </div>
  );
}

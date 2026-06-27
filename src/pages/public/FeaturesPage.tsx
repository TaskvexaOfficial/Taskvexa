import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

const PageHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="bg-[#020617] text-white pt-32 pb-24 px-6 overflow-hidden relative border-b border-[#1E293B]">
    {/* Premium Subscene Elements */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] pointer-events-none rounded-full"></div>
    <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-purple-600/10 blur-[100px] pointer-events-none rounded-full"></div>
    
    {/* Subtle Grid Pattern overlay */}
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay"></div>

    <div className="max-w-4xl mx-auto text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 shadow-xl mb-8 backdrop-blur-xl"
      >
        <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-inner"></div>
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1, duration: 0.6 }}
        className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
      >
        {title}
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2, duration: 0.6 }} 
        className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
      >
        {subtitle}
      </motion.p>
    </div>
  </div>
);

export default function FeaturesPage() {
  useSEO({
    title: "Platform Features - TaskVexa Earning Platform",
    description: "Explore the advanced features of TaskVexa, including real-time automatic task verification, bank-grade secure payouts, multiplier bonuses, and premium tasks.",
    canonicalPath: "/features"
  });

  return (
    <div className="bg-[#F8FAFC] pb-24">
      <PageHeader title="Platform Features" subtitle="Everything you need to maximize your earning potential in one powerful platform." />
      <div className="max-w-7xl mx-auto px-6 py-24">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[32px] p-10 md:p-12 shadow-sm border border-slate-200 hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-8 border border-indigo-100 group-hover:scale-110 transition-transform">
                <Zap className="text-indigo-600 w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Instant Verifications</h2>
              <p className="text-lg text-slate-600 leading-relaxed">Our proprietary auto-verification engine processes your task submissions in real-time. Say goodbye to the 48-hour waiting period found on other platforms. Earn and withdraw on the same day.</p>
            </div>
            
            <div className="bg-[#0A0F24] rounded-[32px] p-10 md:p-12 shadow-2xl border border-slate-800 hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 blur-[80px] pointer-events-none"></div>
              <div className="relative z-10">
                 <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md group-hover:scale-110 transition-transform">
                   <Shield className="text-green-400 w-8 h-8" />
                 </div>
                 <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Bank-Grade Security</h2>
                 <p className="text-lg text-slate-400 leading-relaxed">Your personal data and earnings are secured with end-to-end encryption. We partner with industry-leading payment gateways to ensure your withdrawals are safe and reliable.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-[32px] p-10 md:p-12 shadow-sm border border-slate-200 hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mb-8 border border-yellow-100 group-hover:scale-110 transition-transform">
                <TrendingUp className="text-yellow-600 w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Dynamic Multipliers</h2>
              <p className="text-lg text-slate-600 leading-relaxed">Unlock earning multipliers based on your daily streak and task accuracy. The more consistent you are, the higher your base payout for every task you complete.</p>
            </div>
            
            <div className="bg-white rounded-[32px] p-10 md:p-12 shadow-sm border border-slate-200 hover:shadow-xl transition-shadow duration-300 group">
               <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-8 border border-purple-100 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="text-purple-600 w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Premium Tasks</h2>
              <p className="text-lg text-slate-600 leading-relaxed">Gain access to our exclusive tier of high-paying premium tasks. From detailed software reviews to focused group surveys, elevate your earning ceiling.</p>
            </div>
         </div>
      </div>
    </div>
  );
}

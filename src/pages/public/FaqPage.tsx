import React from 'react';
import { motion } from 'motion/react';
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

export default function FaqPage() {
  useSEO({
    title: "FAQ - TaskVexa Earning Platform",
    description: "Got questions? Find answers to frequently asked questions about TaskVexa, our simple tasks, coin withdrawal methods, verification, and guidelines.",
    canonicalPath: "/faq"
  });

  return (
    <div className="bg-[#F8FAFC] pb-24">
      <PageHeader title="Frequently Asked Questions" subtitle="Find answers to common questions about accounts, tasks, and payouts." />
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="grid gap-6">
           <div className="bg-white p-8 md:p-10 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xl">Q</div>
                <div>
                   <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Is Taskvexa really free?</h3>
                   <p className="text-xl text-slate-600 leading-relaxed">Yes, completely. We will never ask you for money or a credit card to complete tasks. You are here to earn, not spend.</p>
                </div>
             </div>
           </div>
           
           <div className="bg-white p-8 md:p-10 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xl">Q</div>
                <div>
                   <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">How does the coin conversion work?</h3>
                   <p className="text-xl text-slate-600 leading-relaxed">Every task rewards you in Taskvexa Coins. Currently, 1,000 Coins are equivalent to $1.00 USD. Rates for local currencies (like PKR or INR) are updated daily based on global exchange rates.</p>
                </div>
             </div>
           </div>
           
           <div className="bg-white p-8 md:p-10 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xl">Q</div>
                <div>
                   <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Why did my task get rejected?</h3>
                   <p className="text-xl text-slate-600 leading-relaxed">Tasks are typically rejected if the provided proof (screenshot) does not match the advertiser's requirements, or if the system detects the use of a VPN/Proxy to spoof your location.</p>
                </div>
             </div>
           </div>
           
           <div className="bg-[#0A0F24] p-8 md:p-10 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none"></div>
             <div className="flex gap-6 items-start relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 font-bold text-xl border border-white/20">Q</div>
                <div>
                   <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">How many accounts can I have?</h3>
                   <p className="text-xl text-slate-400 leading-relaxed">Strictly one account per person and per device. Multiple accounts will result in a permanent ban and forfeiture of all earnings to protect our advertisers.</p>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

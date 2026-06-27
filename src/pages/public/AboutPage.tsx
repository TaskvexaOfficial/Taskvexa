import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { 
  Shield, Compass, Award, Users, FileText, CheckCircle, ArrowRight, Activity, HelpCircle, Heart, Target, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
  const seoTitle = "About TaskVexa | Our Mission and Platform Integrity";
  const seoDescription = "Learn how TaskVexa provides user empowerment and advertising transparency. Explore our operational history, vision, and micro-task verification standard.";
  
  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/about',
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About TaskVexa",
      "description": seoDescription,
      "publisher": {
        "@type": "Organization",
        "name": "TaskVexa Inc.",
        "logo": {
          "@type": "ImageObject",
          "url": "https://taskvexa.com/favicon.svg"
        }
      }
    }
  });

  return (
    <div className="bg-[#F8FAFC] pb-24">
      {/* Premium Header */}
      <div className="bg-[#020617] text-white pt-32 pb-24 px-6 overflow-hidden relative border-b border-[#1E293B]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-purple-600/10 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 shadow-xl mb-8 backdrop-blur-xl"
          >
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
          >
            About TaskVexa & Our Mission
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.6 }} 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold animate-fade-in"
          >
            Bridging the gap between active global freelancers and digital micro-campaign sponsors through premium security and verified micro-evaluations.
          </motion.p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-16">
        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Editorial Content */}
          <div className="lg:col-span-8 space-y-12 bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-12 shadow-sm">
            
            {/* Section 1: Introduction */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Compass className="w-6 h-6 text-indigo-600 shrink-0" />
                1. The Genesis of TaskVexa
              </h2>
              <p className="text-slate-650 leading-relaxed">
                TaskVexa was established on the simple premise that human-centric feedback and micro-evaluations represent some of the most critical resources for modern digital businesses. In an online environment saturated with automated bots and simulated clicks, authentic human interactions carry immense strategic weight. Whether an emerging publisher is looking to run feedback surveys, an application vendor is seeking diagnostic user testers, or a creator needs real-world focus-group polling, TaskVexa acts as the secure, ethical connective tissue.
              </p>
              <p className="text-slate-650 leading-relaxed">
                For far too long, the crowdsourced reward ecosystem was fractured by transparency issues, unfair payment terms, and arbitrary account actions. Many platforms operated under opaque guidelines, making users guess why claims were declined or payouts withheld. TaskVexa is explicitly built to counter those deficiencies by introducing a high-contrast, fully audited platform that values the participant's time equally with the sponsor's promotional outcome.
              </p>
            </section>

            {/* Section 2: Core Philosophy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Target className="w-6 h-6 text-indigo-600 shrink-0" />
                2. Our Core Principles & Vision
              </h2>
              <p className="text-slate-650 leading-relaxed">
                Our vision is to facilitate a sustainable micro-digital economy accessible from any digital handset, totally free of barrier costs. Over the coming years, we are scaling TaskVexa to empower contributors in emerging regions by introducing regional localized settlement gateways like EasyPaisa and JazzCash, ensuring everyone has the path to convert their spare focus into real-world utility assets. We operate strictly around three core corporate values:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <h4 className="font-extrabold text-slate-900 text-sm mb-2">Absolute Transparency</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    We disclose specific, legible criteria for every task. Users will always know the exact checklist, evaluation rules, and reward amounts before initiating any action.
                  </p>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <h4 className="font-extrabold text-slate-900 text-sm mb-2">Zero Ingress Costs</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    TaskVexa is 100% free. We will never ask users to fund accounts or purchase virtual items to unlock higher-tier campaigns.
                  </p>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <h4 className="font-extrabold text-slate-900 text-sm mb-2">Strict Bot Separation</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    By protecting sponsors from automated traffic, we ensure genuine participants receive a premium inventory of continuous campaigns.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Value Triad */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Users className="w-6 h-6 text-indigo-600 shrink-0" />
                3. The Triad of Value
              </h2>
              <p className="text-slate-650 leading-relaxed">
                Our platform functions harmoniously by continuously servicing three distinct ecosystem stakeholders:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-slate-650 text-sm">
                <li>
                  <strong className="text-slate-950">For Global Freelancing Contributors:</strong> TaskVexa serves as a reliable portal for supplementary digital tasks. We configure tasks that can be performed in minor spare blocks of time—during transit, waiting lines, or lunch breaks—translating quiet time into genuine, low-friction balance rewards.
                </li>
                <li>
                  <strong className="text-slate-950">For Brand & Media Advertisers:</strong> We supply deep-grained validation that guarantees actual humans are reviewing visual and informational layouts. This results in reliable metrics, feedback logs, and promotional statistics that are free from the noise of emulated test suites.
                </li>
                <li>
                  <strong className="text-slate-950">For our Partner Ecosystem:</strong> We handle user payouts, geographic screening, compliance checks, and secure infrastructure. Our partner brands can list native feedback criteria directly into our dynamic task module through secure proxy interfaces.
                </li>
              </ul>
            </section>

            {/* Section 4: Operational History */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Activity className="w-6 h-6 text-indigo-600 shrink-0" />
                4. Operational History and Safety Standards
              </h2>
              <p className="text-slate-650 leading-relaxed">
                TaskVexa operates as an independent web application. To prevent any structural misunderstandings for Google Search indexing and compliance audits: <strong>TaskVexa has absolutely no affiliation, relationship, endorsement, or partner agreement with major institutional networks such as Google, YouTube, Meta, Facebook, TikTok, ByteDance, or federal regulatory entities.</strong> Any reference to trademarked platforms relates purely to standard web navigation directions or public campaign environments where user micro-evaluations occur.
              </p>
              <p className="text-slate-650 leading-relaxed">
                To keep our operations safe, our software utilizes high-level hardware-fingerprint algorithms to track duplicate account farming. Users can review our comprehensive <Link to="/privacy-policy" className="text-indigo-600 hover:underline">Privacy Policy</Link> to check details on cookie retention, or browse our <Link to="/withdrawal-policy" className="text-indigo-600 hover:underline">Withdrawal Policy</Link> to understand our rigorous 24-48 hours review SLA.
              </p>
            </section>

            {/* Section 5: About Core FAQ */}
            <section className="space-y-4 pt-6 border-t border-slate-100">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                About Us — Common Inquiries
              </h3>
              
              <div className="space-y-4 pt-3">
                <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl">
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1.5">Who operates TaskVexa?</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    TaskVexa is run by an agile team of application developers, network security analysts, and crowd-performance coordinators who believe that personal data and human attention deserve proper reward transparency.
                  </p>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl">
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1.5">Why does TaskVexa require screenshots for proof?</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sponsors pay genuine coin rewards only when tasks are fully completed to their exact specifications. Image submissions and verified code proof provide independent, audited evidence that the user successfully achieved those conditions, protecting the sponsor budget.
                  </p>
                </div>
              </div>
            </section>

          </div>

          {/* Sticky Sidebar Right */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 sticky top-30 shadow-sm space-y-5">
              <div className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] px-2 border-b border-slate-50 pb-3">More Information</div>
              
              <nav className="flex flex-col gap-2">
                <Link to="/how-it-works" className="flex items-center justify-between p-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/50">
                  <span>How It Works</span> <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link to="/terms-and-conditions" className="flex items-center justify-between p-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/50">
                  <span>Terms Of Service</span> <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link to="/privacy-policy" className="flex items-center justify-between p-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/50">
                  <span>Privacy Policy</span> <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link to="/withdrawal-policy" className="flex items-center justify-between p-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-indigo-50/50 text-indigo-700 border border-indigo-100/50 hover:bg-indigo-50 transition-all">
                  <span>Withdrawal Rules</span> <ArrowRight className="w-4 h-4 text-indigo-500" />
                </Link>
                <Link to="/referral-rules" className="flex items-center justify-between p-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/50">
                  <span>Referral Rules</span> <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link to="/contact" className="flex items-center justify-between p-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/50">
                  <span>Contact Support</span> <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </nav>

              <div className="pt-4 border-t border-slate-100">
                <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Audit Verified</span>
                  <div className="text-[11px] font-bold text-slate-500 leading-relaxed">
                    TaskVexa structures campaign verification through randomized human quality assessments. Multi-sessions or suspicious activities result in account removal.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { 
  Users, ArrowRight, ShieldCheck, HelpCircle, FileText, Scale, Wallet, Info, Sparkles, AlertTriangle, Coins, Ban, Award
} from 'lucide-react';

export default function ReferralRulesPage() {
  const seoTitle = "Referral Program Rules | Affiliate Tracking & Commissions Guidelines - TaskVexa";
  const seoDescription = "Review the official TaskVexa Referral Guidelines. Understand our 10% commission structure, tracking eligibility controls, bonus triggers, and anti-abuse regulations.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/referral-rules',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Referral Guidelines",
      "description": seoDescription,
      "url": "https://taskvexa.com/referral-rules"
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
            <Users className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
          >
            Referral Program Rules
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.6 }} 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold animate-fade-in"
          >
            Help grow the TaskVexa network ethically. Earn dynamic, transparent commissions on verified micro-campaigns completed by referred users.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row gap-12">
        {/* Sticky Directory Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 sticky top-32 shadow-sm space-y-4">
            <div className="text-xs font-black text-slate-400 uppercase tracking-[0.14em] px-3">Legal & Policy Directory</div>
            <nav className="flex flex-col gap-1.5">
              <Link to="/terms-and-conditions" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <Scale className="w-4.5 h-4.5 text-slate-400" /> Terms of Service
              </Link>
              <Link to="/privacy-policy" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <ShieldCheck className="w-4.5 h-4.5 text-slate-400" /> Privacy Policy
              </Link>
              <Link to="/withdrawal-policy" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <Wallet className="w-4.5 h-4.5 text-slate-400" /> Withdrawal Policy
              </Link>
              <Link to="/referral-rules" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-indigo-50 text-indigo-700 transition-all">
                <Users className="w-4.5 h-4.5" /> Referral Program Rules
              </Link>
            </nav>
            <div className="pt-4 border-t border-slate-100 px-3">
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                TaskVexa tracks direct referrers to expand community outreach safely without multi-level marketing structures.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Referral Copy Area */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-12 shadow-sm space-y-8 text-slate-600 leading-relaxed text-base">
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Referrer & Affiliate Regulations</h2>
            <p className="text-slate-400 font-bold text-sm">Effective Date: June 15, 2026</p>
          </div>

          <div className="bg-indigo-50/40 border border-indigo-200/60 rounded-2xl p-5 text-sm font-semibold text-indigo-900 flex gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-indigo-950 block mb-1">Affiliate Compensation Standard</span>
              Referral commissions are funded directly through TaskVexa's system advertising budgets. Your referred friends keep 100% of their earned coin rewards.
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-600 animate-pulse" />
              1. Commission Breakdown & Tracking Model
            </h3>
            <p>
              To encourage healthy community growth and incentivize authentic product outreach, TaskVexa rewards referrers with a flat, premium commission of <span className="text-slate-950 font-black">20% on verified coins</span> accumulated by direct referees:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm font-bold text-slate-700">
              <li><strong className="text-slate-900">Standard Tier:</strong> Earn a baseline of <span className="text-slate-950">20% commission</span> on all tasks completed by invitees, paid immediately when task submissions clear advertiser audits.</li>
              <li><strong className="text-slate-900">VIP Promoter Tier:</strong> Earn an escalation of <span className="text-slate-950">20% commission</span> plus periodic leader bonuses, open exclusively to social publishers, web administrators, and active media drivers.</li>
              <li><strong className="text-slate-900">Sign Up Bonus:</strong> New users registering through solid referral pointers can receive a starting visual coin balance, depending on temporary seasonal campaigns.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Ban className="w-5 h-5 text-indigo-600" />
              2. Prohibited Abuse & Referral Looting
            </h3>
            <p>
              To protect the capital limits of our advertiser partners, we maintain a defensive posture against artificial registration structures. Any attempt to exploit commission triggers will result in immediate permanent banning. Banned activities include:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-xl space-y-1">
                <span className="font-extrabold text-rose-950 block">🚫 Self-Referral Farming</span>
                <p className="text-slate-500 font-bold leading-relaxed">
                  Creating multiple shadow accounts under your own primary referral link using fake emails, temporary aliases, or cloned hardware signatures.
                </p>
              </div>
              <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-xl space-y-1">
                <span className="font-extrabold text-rose-955 block">🚫 Financial Kickback Offers</span>
                <p className="text-slate-500 font-bold leading-relaxed">
                  Paying physical currency to stranger networks strictly to compel volume registrations for registration bonus looting.
                </p>
              </div>
              <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-xl space-y-1">
                <span className="font-extrabold text-rose-955 block">🚫 Spambot Commenting</span>
                <p className="text-slate-500 font-bold leading-relaxed">
                  Unsolicited spamming of alphanumeric referral strings in community chat boards, email groups, or advertiser reviews.
                </p>
              </div>
              <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-xl space-y-1">
                <span className="font-extrabold text-rose-750 block">🚫 Duplicate IP Matching</span>
                <p className="text-slate-500 font-bold leading-relaxed">
                  Logging into multiple referee profiles and completing task actions under the same local Wi-Fi router to inflate referral percentages.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              3. Monthly Commission Ceilings & Controls
            </h3>
            <p>
              To preserve system liquidity and lock out bot exploits, standard members operate under a monthly referral earning ceiling: <strong>Standard referrers can earn a maximum of 50,000 Referral Coins ($50.00 equivalent value) in a single calendar month.</strong> Any referral commission beyond this ceiling is paused and capped. If you run a YouTube channel, popular blog, or active local group and expect to exceed this threshold, write to support to request white-listing under our VIP Promoter framework.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              4. Referral Tracking Lifetime & Audits
            </h3>
            <p>
              Referral relations are parsed and marked in our secure cloud ledger via custom referral cookies valid for 30 days. Payout requests derived entirely from referral commission lines undergo comprehensive review checks. If referee accounts are audited and flagged for VPN farming, their referrer's matching pending commission coins will be safely backed out of the master available registry.
            </p>
          </section>

          {/* Section 5: FAQ */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              Referral Rules — Common Promoter Questions
            </h3>
            
            <div className="space-y-4 pt-2">
              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">Do I receive commission on my friend's subsequent referrals?</h4>
                <p className="text-slate-600 leading-relaxed font-semibold">
                  No, TaskVexa is a clean, modern single-level affiliate reward system. We do not support multi-level marketing (MLM) or matrix pyramids, which guarantees a highly secure, sustainable promotional environment.
                </p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">How long does my link cookie remain active during signups?</h4>
                <p className="text-slate-600 leading-relaxed font-semibold">
                  When a new user clicks your referral link, we store a secure cookie identifier in their browser for up to 30 days. As long as they return and complete registration within this period, they are mapped to your team.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

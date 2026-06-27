import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { 
  Wallet, ArrowRight, ShieldCheck, HelpCircle, FileText, Scale, Users, Info, Banknote, Landmark, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

export default function WithdrawalPolicyPage() {
  const seoTitle = "Withdrawal Policy | Reward Verification Requirements & Limits - TaskVexa";
  const seoDescription = "Review the certified TaskVexa Withdrawal Policy. Understand minimum coin balances, regional payment schedules (EasyPaisa, JazzCash, PayPal), and anti-fraud review steps.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/withdrawal-policy',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Withdrawal Policy",
      "description": seoDescription,
      "url": "https://taskvexa.com/withdrawal-policy"
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
            <Wallet className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
          >
            Withdrawal Policy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.6 }} 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold animate-fade-in"
          >
            Detailed specifications regarding transfer limitations, minimum account milestones, safety verification timelines, and compliant payment gateways.
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
              <Link to="/withdrawal-policy" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-indigo-50 text-indigo-700 transition-all">
                <Wallet className="w-4.5 h-4.5" /> Withdrawal Policy
              </Link>
              <Link to="/referral-rules" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <Users className="w-4.5 h-4.5 text-slate-400" /> Referral Program Rules
              </Link>
            </nav>
            <div className="pt-4 border-t border-slate-100 px-3">
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                TaskVexa enforces transparent audits to guarantee advertiser value and user payouts.
              </p>
            </div>
          </div>
        </div>

        {/* Withdrawal Policy Body */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-12 shadow-sm space-y-8 text-slate-600 leading-relaxed text-base">
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Payout Compliance Policies</h2>
            <p className="text-slate-400 font-bold text-sm">Effective Date: June 15, 2026</p>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-200/50 rounded-2xl p-5 text-sm font-semibold text-indigo-900 space-y-1">
            <span className="font-extrabold text-indigo-950 block">Audit SLA Promise</span>
            <p className="leading-snug">
              Every single withdrawal queue entry undergoes human verification checks to prevent fraudulent submissions. Verification, approval, and digital routing are resolved in 24 to 48 hours.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              1. Withdrawal Minimum thresholds & Ratios
            </h3>
            <p>
              Contributors can trigger active transfer payouts as soon as their confirmed available balances meet or exceed the required system milestone. Coin scales are locked as follows:
            </p>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-center text-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Minimum milestone</span>
                <span className="text-xl font-bold text-slate-900 block leading-none">5,000 Verified Coins</span>
                <span className="text-xs text-slate-500 font-semibold block">$5.00 USD Equivalent Monetary Value</span>
              </div>
              <div className="text-xs text-slate-500 font-bold max-w-sm md:text-right leading-relaxed">
                Coin rewards undergo regular adjustments to match inflation indexations. Approved balances will be translated to regional currencies during routing checks automatically.
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Banknote className="w-5 h-5 text-indigo-600" />
              2. Supported Gateway Networks
            </h3>
            <p>
              TaskVexa supports a flexible mix of local mobile ecosystems and worldwide digital banking pipelines to assist users across various regional territories:
            </p>
            <ul className="list-disc pl-6 space-y-3.5 text-sm font-bold text-slate-700">
              <li>
                <strong className="text-slate-900">Ecosystem Pakistan:</strong> We support high-speed direct transfers to <span className="text-slate-950">EasyPaisa and JazzCash</span> mobile wallets. Payouts are routed through country banking brokers, with processing speeds under 24 hours.
              </li>
              <li>
                <strong className="text-slate-900">Global Digital Channels:</strong> For visitors from other international areas, we support <span className="text-slate-950">PayPal and direct Crypto (Tether USDT on TRC20)</span> wallet transfers. Ensure you use stable networks when pasting deposit strings.
              </li>
              <li>
                <strong className="text-slate-900">Direct Bank Settlements:</strong> Local direct wire routing is available in major jurisdictions. Bank verification typically takes an extra 24 hours depending on central banking schedules.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 font-bold text-sm bg-slate-50 p-6 rounded-2xl border border-slate-150">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              3. Verification & Payout Rejections
            </h3>
            <p className="leading-relaxed">
              We run a sustainable platform model funded exclusively by the verification value provided to promoters. Direct grounds for transaction delays, queue locks, or permanent bans include:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 bg-white rounded-xl border border-rose-100">
                <span className="text-red-750 font-black block mb-1">❌ Inaccurate Account Details</span>
                Spelling mistakes, wrong phone numbers, or pasting non-matching account holder profiles.
              </div>
              <div className="p-4 bg-white rounded-xl border border-rose-100">
                <span className="text-red-750 font-black block mb-1">❌ Screen Scraping & Fake Proofs</span>
                Using photo editing tools to manufacture completed task indicators or recycled screenshots.
              </div>
              <div className="p-4 bg-white rounded-xl border border-rose-100">
                <span className="text-red-750 font-black block mb-1">❌ Device Farming / Duplicates</span>
                Gathering coins across different cloned profiles on the same physical handset to avoid limits.
              </div>
              <div className="p-4 bg-white rounded-xl border border-rose-100">
                <span className="text-red-750 font-black block mb-1">❌ VPN Usage in High-Value Offers</span>
                Flashed browser connections trying to spoof target geofenced premium payout fields.
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-600" />
              4. Anti-Money Laundering & Identity Checks
            </h3>
            <p>
              To protect TaskVexa against regional laundering rules and digital exploitation, we enforce a strict mapping rule on withdrawal destinations: <strong>Under no circumstance can multiple registered accounts withdraw their pending coin values into a single payment wallet address.</strong> For example, three family members in the same residence must possess separate, verified EasyPaisa numbers. Sending value to the same destination triggers an automatic farming flag, resulting in account suspension.
            </p>
          </section>

          {/* Section 5: FAQ */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              Withdrawal Policy — Frequently Asked Questions
            </h3>
            
            <div className="space-y-4 pt-2">
              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">Why did my coin balance decrease while requesting a payout?</h4>
                <p className="text-slate-600 leading-relaxed font-semibold">
                  If an advertiser flags a completed task as non-compliant or proves that your uploaded screenshot was invalid, those matching coin points are backed out and deducted from your available ledger, ensuring quality.
                </p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">Are there processing charges for withdrawals?</h4>
                <p className="text-slate-600 leading-relaxed font-semibold">
                  TaskVexa does not apply internal withdrawal commissions. However, regional payment handlers (e.g., EasyPaisa agents, PayPal networks) can deduct standard settlement fees from the routed transfer value.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

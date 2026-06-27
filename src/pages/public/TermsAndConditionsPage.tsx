import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { 
  Scale, ArrowRight, ShieldAlert, AlertTriangle, Hammer, Ban, HelpCircle, FileText, ShieldCheck, Wallet, Users, Info
} from 'lucide-react';

export default function TermsAndConditionsPage() {
  const seoTitle = "Terms and Conditions | Platform User Agreement - TaskVexa";
  const seoDescription = "Review the official Terms of Service of TaskVexa. Understand acceptable platform rules, membership policies, anti-fraud standards, and virtual coin reward criteria.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/terms-and-conditions',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Terms and Conditions",
      "description": seoDescription,
      "url": "https://taskvexa.com/terms-and-conditions"
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
            <Scale className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
          >
            Terms & Conditions
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.6 }} 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold animate-fade-in"
          >
            Acceptable use regulations, system eligibility benchmarks, and legal parameters governing member account participation and coin verification.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row gap-12">
        {/* Sticky Directory Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 sticky top-32 shadow-sm space-y-4">
            <div className="text-xs font-black text-slate-400 uppercase tracking-[0.14em] px-3">Legal & Policy Directory</div>
            <nav className="flex flex-col gap-1.5">
              <Link to="/terms-and-conditions" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-indigo-50 text-indigo-700 transition-all">
                <Scale className="w-4.5 h-4.5" /> Terms of Service
              </Link>
              <Link to="/privacy-policy" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <ShieldCheck className="w-4.5 h-4.5 text-slate-400" /> Privacy Policy
              </Link>
              <Link to="/withdrawal-policy" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <Wallet className="w-4.5 h-4.5 text-slate-400" /> Withdrawal Policy
              </Link>
              <Link to="/referral-rules" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <Users className="w-4.5 h-4.5 text-slate-400" /> Referral Program Rules
              </Link>
            </nav>
            <div className="pt-4 border-t border-slate-100 px-3">
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                By maintaining an account, you affirm compliance with our global crowdsourcing guidelines.
              </p>
            </div>
          </div>
        </div>

        {/* Legal content */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-12 shadow-sm space-y-8 text-slate-600 leading-relaxed text-base">
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Terms of Service Agreement</h2>
            <p className="text-slate-400 font-bold text-sm">Effective Date: June 15, 2026</p>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 text-sm font-semibold text-amber-850 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-amber-900 block mb-1">Corporate Affiliation & Independent Brand Disclaimer</span>
              TaskVexa is a fully independent visual platform. TaskVexa is not affiliated, associated, authorized, endorsed, sponsored by, or in any way officially or unofficially connected with Google, YouTube, Facebook, TikTok, Meta, ByteDance, or any federal, state, municipal government or tax agency. All registered trademarks and logos belong to their respective corporate entities.
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600 animate-pulse" />
              1. Onboarding and User Eligibility
            </h3>
            <p>
              By accessing the TaskVexa portal or establishing an electronic profile, you confirm and warrant that you are at least 18 years of age and possess full legal capacity to enter into binding digital contracts. If you are under 18 years of age or reside in an international jurisdiction that prohibits participation in online digital reward networks, you must immediately close this website and refrain from registering.
            </p>
            <p>
              Membership is entirely voluntary and is offered on an "as-is" and "as-available" basis. We reserve the right to limit access to specific portal features or terminate registrations in any geographic region if local regulatory frameworks or advertiser constraints require a suspension of service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Hammer className="w-5 h-5 text-indigo-600" />
              2. Acceptable Use and Promotional Reality
            </h3>
            <p>
              TaskVexa is designed to connect global crowdsourcing participants with active sponsors who require authentic human focus, digital diagnostics, and feedback surveys. The points and reward coins accumulated through completed tasks are visual tokens of our internal promotional ledger.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm font-bold text-slate-700">
              <li><strong className="text-slate-900">Task-Specific Availability:</strong> The selection, volume, and compensation ratios of listed tasks are highly volatile and depend completely on advertiser demand, regional requirements, and geographic filters.</li>
              <li><strong className="text-slate-900">Truthfulness Rule:</strong> Tasks must be completed honestly, in precise accordance with specified checklist guides. Submitting incomplete, false, or copy-pasted details will result in coin rejection.</li>
              <li><strong className="text-slate-900">No Compensation Warranties:</strong> TaskVexa never promises or guarantees fixed daily, hourly, or weekly compensation levels. The platform is designed for supplemental rewards, not primary income.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Ban className="w-5 h-5 text-indigo-600" />
              3. Strict Anti-Fraud Prohibitions
            </h3>
            <p>
              To maintain absolute transparency and secure advertiser trust, our software suite deploys automated background defense logs that monitor device parameters. We enforce an unyielding, zero-tolerance policy against manipulative and artificial behavior. The following activities are strictly prohibited:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-xl space-y-1">
                <span className="font-extrabold text-rose-900 text-xs uppercase">🚫 Proxy & VPN Prohibitions</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Executing campaigns while routing through virtual private networks, premium spoofed proxy ranges, or TOR routing nodes is strictly banned.
                </p>
              </div>
              <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-xl space-y-1">
                <span className="font-extrabold text-rose-900 text-xs uppercase">🚫 Device Farming & Multi-Accounts</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Establishing duplicate logins or running virtual space-cloners to double-claim registration values per device will trigger immediate IP blocks.
                </p>
              </div>
              <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-xl space-y-1">
                <span className="font-extrabold text-rose-900 text-xs uppercase">🚫 Automated Scripts & Emulators</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Deploying visual screen scripts, click bots, emulators, or headless browsers to cycle through feedback lists will be reported to security boards.
                </p>
              </div>
              <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-xl space-y-1">
                <span className="font-extrabold text-rose-900 text-xs uppercase">🚫 Forged Screenshot Proof</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Modifying visual metrics or uploading recycled image files belonging to other contributors will result in permanent ledger wiping.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              4. Account Closures and Reward Forfeiture
            </h3>
            <p>
              If our system administrators or automated tracking processes detect an infraction of the Anti-Fraud policy laid out in Section 3, we reserve the right to suspend or permanently block your associated profile immediately without notice.
            </p>
            <p className="font-bold text-sm bg-slate-50 p-4 border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
              Upon account blocking or closure, all pending review balances, verified available balances, active referral hierarchies, and historic coin logs are completely and irreversibly forfeited. TaskVexa will not enter into arbitration or review claims for accounts flagged and shut down due to VPN farming or image spoofing.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              5. Liability Limits and Indemnification
            </h3>
            <p>
              TaskVexa, its founders, and network administrators will not be held liable for any direct, indirect, random, or logical damages related to your portal usage, including data loss, hardware overheating, system lockups, or delayed network transitions. You agree to hold harmless and insulate TaskVexa against any legal claims arising from your failure to comply with local regional licensing rules.
            </p>
          </section>

          {/* Section 6: FAQ */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              Terms — Common Regulatory Questions
            </h3>
            
            <div className="space-y-4 pt-2">
              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">Can I log in to my account from public Wi-Fi?</h4>
                <p className="text-slate-600 leading-relaxed font-semibold">
                  Yes, public access systems are fine as long as you do not use dynamic proxy tunneling software or local VPN applications that hide your standard geographic region.
                </p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">Are reward coin values stable?</h4>
                <p className="text-slate-600 leading-relaxed font-semibold">
                  To assure platform sustainability against global cost-of-living fluctuations, TaskVexa reserves the right to calibrate reward coin values and minimum payout scales dynamically without prior warning.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

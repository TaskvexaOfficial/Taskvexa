import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { 
  ShieldCheck, ArrowRight, Eye, Database, Globe, Key, Trash2, HelpCircle, FileText, Scale, Wallet, Users, Info
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const seoTitle = "Privacy Policy | Personal Data Protection and Transparency Standards - TaskVexa";
  const seoDescription = "Official Privacy Policy of TaskVexa. Review detailed guidelines regarding our technical device tracking, account cookie retention, and digital verification methods.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/privacy-policy',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Privacy Policy",
      "description": seoDescription,
      "url": "https://taskvexa.com/privacy-policy"
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
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
          >
            Privacy Policy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.6 }} 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold animate-fade-in"
          >
            Operational clarity on how TaskVexa collects, manages, stores, and securely processes personal profiles and technical device information.
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
              <Link to="/privacy-policy" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-indigo-50 text-indigo-700 transition-all">
                <ShieldCheck className="w-4.5 h-4.5" /> Privacy Policy
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
                TaskVexa complies with global privacy architectures to guarantee data remains securely sealed.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Professional Document Content Area */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-12 shadow-sm space-y-8 text-slate-600 leading-relaxed text-base">
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Platform Privacy Regulations</h2>
            <p className="text-slate-400 font-bold text-sm">Effective Date: June 15, 2026</p>
          </div>

          <div className="bg-blue-50/40 border border-blue-200/60 rounded-2xl p-5 text-sm font-semibold text-blue-900 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-blue-950 block mb-1">Our Privacy Commitment</span>
              TaskVexa structures all user data collection purely around the active verification of digital campaigns and anti-abuse protocols. Your data is never sold to outside brokers.
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              1. The Indicators We Retrieve
            </h3>
            <p>
              To maintain account integrity and authorize valid coin allocations, we collect several indicators directly linked to your interactions. For the comfort of our community, we implement "data-minimization" philosophies, pulling only what is required to execute verified campaigns:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm font-bold text-slate-700">
              <li><strong className="text-slate-900">Registration Indicators:</strong> Your name, a verified electronic email address, self-declared demographic geographic area (country of residence), and contact numbers.</li>
              <li><strong className="text-slate-900">Micro-Campaign Proof:</strong> Screenshot file uploads, copy-pasted textual codes, or diagnostic verification data you submit as evidence.</li>
              <li><strong className="text-slate-900">Network Identifiers:</strong> Internet Protocol (IP) range, browser agent type, system language, operating screen coordinates, and cryptographic hardware device hashes.</li>
              <li><strong className="text-slate-900">Disbursement Information:</strong> Local billing parameters (e.g., EasyPaisa or JazzCash account details), or generic electronic wallet parameters (PayPal handle or USDT deposit string) to execute requested withdrawals.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              2. How These Indicators Are Processed
            </h3>
            <p>
              Your personal information remains strictly in-house, used specifically under clear operational scenarios:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-sm font-bold text-slate-700">
              <li><strong className="text-slate-900">Task Audit:</strong> Ensuring that your profile completed the listed requirements honestly prior to allocating coin rewards.</li>
              <li><strong className="text-slate-900">Fraud Control:</strong> Cross-checking hardware fingerprints to detect multi-account farming, dual registrations, or emulated virtual machines trying to recycle codes.</li>
              <li><strong className="text-slate-900">Disbursement Fulfillment:</strong> Routing approved withdrawals securely through associated Regional or Global banking networks in 24-48 hours.</li>
              <li><strong className="text-slate-900">Diagnostic Metrics:</strong> Debugging software errors, system latency, server overload events, or user-interface friction.</li>
            </ol>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              3. Data Security & Storage Lifetime
            </h3>
            <p>
              We compile and seal all transit parameters in database structures that use modern RSA-2048 encryption protocols. Our web systems employ Secure Sockets Layer (SSL/TLS) tunnels for all data transmissions, preventing interception. Technical details of inactive profiles or rejected verification screenshots are purged from our live memory storage boards every 60 days to keep databases compact.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 font-bold text-sm bg-slate-50 border border-slate-100 p-6 rounded-2xl">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              4. Regional Privacy Compliance (GDPR, CCPA)
            </h3>
            <p className="leading-relaxed">
              For contributors participating from the European Economic Area (EEA) and global territories, we strictly maintain your statutory digital rights:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-950 font-black block mb-1">Right to Access</span>
                You can write to us to ask for a direct export of all indicators associated with your email login history free of charge.
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-950 font-black block mb-1">Right to Erasure</span>
                You can request the permanent removal of your account, demographic logs, and device coordinate files from our systems.
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-indigo-600" />
              5. Profile Erasure Requests
            </h3>
            <p>
              If you decide to delete your active TaskVexa account, please write a direct request from your validated account email to <a href="mailto:taskvexa.offical@gmail.com" className="text-indigo-600 hover:underline">taskvexa.offical@gmail.com</a>. Upon receiving your compliance ticket, our administrators will completely purge your device fingerprints, registered password strings, email profiles, and pending queue stats from our primary servers. This step is irreversible.
            </p>
          </section>

          {/* Section 6: FAQ */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              Privacy — Common Questions
            </h3>
            
            <div className="space-y-4 pt-2">
              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">Do you share screenshots with advertisers?</h4>
                <p className="text-slate-600 leading-relaxed font-semibold">
                  Yes, we share proof screenshots with specific campaigns sponsors so they can audit completed actions prior to approving rewards. However, our interface strips registration emails or device profiles to maintain complete individual anonymity.
                </p>
              </div>
              
              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">Does TaskVexa track physical location?</h4>
                <p className="text-slate-600 leading-relaxed font-semibold">
                  No, we do not access or collect physical GPS coordinates on your device. We use standard, anonymous region identifiers derived from IP ranges strictly to confirm regional campaign availability and match country eligibility.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

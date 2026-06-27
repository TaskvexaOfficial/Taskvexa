import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { 
  UserPlus, ClipboardList, ShieldCheck, Coins, Banknote, 
  HelpCircle, AlertTriangle, ArrowRight, CheckCircle, Info, Sparkles, Server, Eye, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HowItWorksPage() {
  const seoTitle = "How It Works | Step-by-Step Task and Reward Process - TaskVexa";
  const seoDescription = "Understand the official TaskVexa workflow from free registration, micro-campaign eligibility completion, manual screenshot verification, to secure 24h payouts.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/how-it-works',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "How It Works",
      "description": seoDescription,
      "url": "https://taskvexa.com/how-it-works"
    }
  });

  const steps = [
    {
      id: 1,
      title: "1. Create Your Free Member Profile",
      icon: UserPlus,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900/50",
      description: "Onboarding is entirely free and takes less than 60 seconds of your focus. Provide your verified email, enter a secure password, and save your regional location attributes. We will immediately instantiate your protected member dashboard, populated with real-time campaign listings filtered specifically to perform optimally on your device environment."
    },
    {
      id: 2,
      title: "2. Explore Available Micro-Campaigns",
      icon: ClipboardList,
      color: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900/50",
      description: "Log in to browse our dynamic, clean task boards. We structure micro-promotional assignments supplied directly by verified sponsors. Available campaigns can involve rating informational websites, analyzing mobile app layouts, validating display advertisements, executing focus surveys, or reviewing digital user interfaces."
    },
    {
      id: 3,
      title: "3. Complete criteria and Upload Proof",
      icon: ShieldCheck,
      color: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900/50",
      description: "Every campaign includes explicit, bulleted requirements. You must read all criteria carefully, carry out the actions honestly, and upload verification proof—typically verified coupon codes, correct responses, or clean screenshot uploads. Submission logs are securely dispatched to our manual audit desks for verification."
    },
    {
      id: 4,
      title: "4. Earn Verified Reward Coins",
      icon: Coins,
      color: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900/50",
      description: "As soon as task submissions pass dynamic safety checks and clear sponsor manual validations, specified reward coins are credited to your dashboard wallet ledger. Track approvals, historic task statistics, and referral bonus points in your real-time analytics panels, maintaining absolute digital transparency."
    },
    {
      id: 5,
      title: "5. Withdraw to Preferred Gateways",
      icon: Banknote,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900/50",
      description: "When your verified ledger hits the minimum milestone of just 5,000 Coins ($5.00 equivalent value), request an account cash-out. Select EasyPaisa or JazzCash local mobile wallets for Pakistan, or PayPal and Crypto addresses for global coverage. Payouts undergo manual validation reviews and resolve inside our 24-48 hours SLA."
    }
  ];

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
            <Layers className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
          >
            How TaskVexa Works
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.6 }} 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold animate-fade-in"
          >
            A high-contrast breakdown of our crowd-performing journey. Complete task structures, qualify with real proof, and claim auditable digital cash.
          </motion.p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-16">
        
        {/* Compliance Reminder Card */}
        <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-[28px] mb-16 flex flex-col md:flex-row gap-5 items-start text-sm">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-700 shrink-0 shadow-sm">
            <Info className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 uppercase tracking-wide">Crowdsourcing Operational Realities</h4>
            <p className="text-slate-650 leading-relaxed font-semibold">
              The micro-promotional campaigns visible inside TaskVexa remain funded entirely by active commercial sponsors. Coin rewards are dependent upon task availability, referee geographic locations, device operating setups, and manual evaluation verification checks. <strong>Account registration is 100% free with no deposit requirements. TaskVexa does not guarantee fixed daily compensation or stable hourly wages.</strong>
            </p>
            <p className="text-slate-400 text-xs font-bold leading-normal">
              Disclaimer: TaskVexa operates independently. We are not associated, endorsed, authorized, or partners of YouTube, Google, Meta, Facebook, TikTok, ByteDance, or government tax organizations.
            </p>
          </div>
        </div>

        {/* Step Breakdown Headline */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Our 5-Step Earning Pathway</h2>
          <p className="text-slate-500 font-bold text-sm">Follow these straightforward checkpoints to progress seamlessly toward withdrawals.</p>
        </div>

        {/* Responsive Timeline container */}
        <div className="space-y-12">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={step.id} 
                className="bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-10 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden"
              >
                {/* Decorator Step Badge */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-full blur-[40px] pointer-events-none"></div>
                
                {/* Node representation icon */}
                <div className={`w-16 h-16 shrink-0 rounded-[22px] border flex items-center justify-center shadow-sm ${step.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <div className="space-y-3 flex-1">
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Verification Section */}
        <section className="mt-20 border-t border-slate-200 pt-16 space-y-6">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase">Task Verification & Anti-Spam Protocols</h3>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              We employ dual automated and manual validation rules to protect advertisers and preserve liquidity. All task claims undergo randomized quality assessments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Stage 1</span>
              <h4 className="font-extrabold text-slate-900 text-sm">Algorithmic Tracking</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Our background software checks browser metadata, system geofences, and submission times to automatically flag emulated or bot-script patterns.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Stage 2</span>
              <h4 className="font-extrabold text-slate-900 text-sm">Visual Verification</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Advertiser sponsors and administrative staff review uploaded screenshot images to confirm user profiles completed instructions.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Stage 3</span>
              <h4 className="font-extrabold text-slate-900 text-sm">Secure Disbursements</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Verified disponible accounts are routed to your designated EasyPaisa, JazzCash, PayPal, or Crypto wallets within 24-48 hours.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Page FAQ */}
        <section className="mt-24 space-y-8 bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-12 shadow-sm">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-2xl font-black text-slate-900 uppercase">Process — Frequently Asked Questions</h3>
            <p className="text-xs text-slate-500 font-bold">Quick help for navigating your micro-campaign journey.</p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="p-5 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <h4 className="font-extrabold text-slate-900 text-sm mb-1.5">How much money can I reasonably expect to earn on TaskVexa?</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                TaskVexa is designed to provide modest secondary rewards during spare leisure moments. Earning scales fluctuate based on your location, task availability, and sponsor pricing. We strongly counsel users that TaskVexa cannot substitute regular jobs or act as full-time employment.
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <h4 className="font-extrabold text-slate-900 text-sm mb-1.5">Why does my completed task say "Under Review"?</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                This state implies that your screenshot proof or verification coupon code is in the manual appraisal queue. Administrative agents typically audit these claims in 24 hours, updating your ledger as soon as sponsor validation criteria pass.
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <h4 className="font-extrabold text-slate-900 text-sm mb-1.5">Is my personal payment profile information safe?</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Yes, our system encrypts all billing accounts, PayPal emails, and EasyPaisa variables. Review our comprehensive <Link to="/privacy-policy" className="text-indigo-600 underline">Privacy Policy</Link> to check details on technical security encryption structures we enforce continuously.
              </p>
            </div>
          </div>
        </section>

        {/* Premium Call to Action */}
        <div className="bg-[#020617] text-white p-8 md:p-12 rounded-[40px] text-center relative overflow-hidden mt-20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-2xl mx-auto relative z-10 space-y-6">
            <h3 className="text-3xl font-black tracking-tight uppercase leading-none">Access The Free Earning Portal</h3>
            <p className="text-slate-400 font-semibold text-sm leading-relaxed">
              Activate your completely free, zero-capital freelancer profile today. Review regional campaigns, upload honest task results, and experience auditable payouts with direct support.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button className="rounded-full shadow-lg h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs">
                  Register Free Member Account
                </Button>
              </Link>
              <Link to="/withdrawal-policy">
                <span className="text-slate-400 hover:text-white font-bold text-xs transition duration-200">
                  Read Payout Guidelines &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

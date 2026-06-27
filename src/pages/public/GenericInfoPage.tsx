import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Mail, MapPin, Scale, ShieldCheck, FileText, HelpCircle, 
  Wallet, Users, CheckCircle, Info, ShieldAlert, Clock, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSEO } from '@/hooks/useSEO';

const PageHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div id="info-page-header" className="bg-[#020617] text-white pt-32 pb-24 px-6 overflow-hidden relative border-b border-[#1E293B]">
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
        className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
      >
        {title}
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2, duration: 0.6 }} 
        className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium"
      >
        {subtitle}
      </motion.p>
    </div>
  </div>
);

export default function GenericInfoPage({ title }: { title?: string }) {
  const pageTitle = title || 'Information Page';
  
  // States and Page definitions
  const isAbout = pageTitle === 'About Us';
  const isContact = pageTitle === 'Contact Us';
  const isTerms = pageTitle === 'Terms of Service';
  const isPrivacy = pageTitle === 'Privacy Policy';
  const isCookies = pageTitle === 'Cookie Policy';
  const isWithdrawal = pageTitle === 'Withdrawal Policy';
  const isReferralRules = pageTitle === 'Referral Program Rules';
  const isLegal = isTerms || isPrivacy || isCookies || isWithdrawal || isReferralRules;

  // Contact form state
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // SEO Configurations
  let seoTitle = "TaskVexa Informational Hub";
  let seoDescription = "Earn digital rewards with transparency on TaskVexa. Read our compliant guidelines, policies, and program rules.";

  if (isAbout) {
    seoTitle = "About TaskVexa - Task Earning Platform Mission & Transparency";
    seoDescription = "Learn about TaskVexa, our mission to provide a transparent, fair task-based reward platform, and how participating users receive genuine value.";
  } else if (isContact) {
    seoTitle = "Contact TaskVexa Support - Get Help & Customer Care";
    seoDescription = "Have questions about TaskVexa tasks or rewards? Contact our 24/7 client support desk. Typical response time is under 12 hours.";
  } else if (isPrivacy) {
    seoTitle = "Privacy Policy - How TaskVexa Stores and Protects Your Data";
    seoDescription = "Read the official TaskVexa Privacy Policy. Understand how we collect, secure, and clear user demographic data without sharing with third parties.";
  } else if (isTerms) {
    seoTitle = "Terms & Conditions - TaskVexa Platform User Agreement & Rules";
    seoDescription = "Official Terms of Service for TaskVexa. Review acceptable platform rules, reward verification eligibility policies, and anti-fraud guidelines.";
  } else if (isCookies) {
    seoTitle = "Cookie Policy - TaskVexa Web Storage & Analytics Usage";
    seoDescription = "Understand how TaskVexa uses local storage and cookies to securely maintain sessions and prevent multiple account exploits.";
  } else if (isWithdrawal) {
    seoTitle = "Withdrawal Policy - TaskVexa Minimum Balance & Payout Terms";
    seoDescription = "Detailed withdrawal policies for TaskVexa. Learn about our verification procedures, fraud prevention checks, and standard payout timelines.";
  } else if (isReferralRules) {
    seoTitle = "Referral Program Rules - Invite Neighbors & Earn Commission Safely";
    seoDescription = "Review the TaskVexa Referral Program Guidelines. Understand commission structures, anti-abuse regulations, and referral rewards.";
  }

  // Determine dynamic canonical path based on active view title
  const getCanonicalPath = (t: string) => {
    switch (t) {
      case 'Community': return '/community';
      case 'Cookie Policy': return '/legal/cookies';
      case 'Rewards Catalog': return '/rewards';
      case 'Global Leaderboard': return '/leaderboard';
      case 'About Us': return '/about';
      case 'Contact Us': return '/contact';
      case 'Terms of Service': return '/terms-and-conditions';
      case 'Privacy Policy': return '/privacy-policy';
      case 'Withdrawal Policy': return '/withdrawal-policy';
      case 'Referral Program Rules': return '/referral-rules';
      default: return '/' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
  };

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: getCanonicalPath(pageTitle)
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setFormSubmitted(true);
    setFirstName('');
    setLastName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="bg-[#F8FAFC]">
      <PageHeader 
        title={pageTitle} 
        subtitle={
          isTerms ? "User agreement, acceptable use rules, and rewards eligibility regulations." :
          isPrivacy ? "Transparency in how your digital data is managed and secured." :
          isCookies ? "How we use web identifiers to protect account sessions." :
          isWithdrawal ? "Payout minimum thresholds, verification timelines, and compliance audits." :
          isReferralRules ? "Invite other motivated users and receive transparent commissions." :
          isAbout ? "The team behind a transparent, trustworthy task reward ecosystem." :
          "We are available to clarify your questions and support your progress."
        } 
      />

      {/* CORE LEGAL LAYOUT WITH STICKY DIRECTORY SIDEBAR */}
      {isLegal && (
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 sticky top-32 shadow-sm space-y-4">
              <div className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] px-3">Legal & Policy Directory</div>
              <nav className="flex flex-col gap-1.5">
                <Link to="/legal/terms" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isTerms ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <Scale className="w-4.5 h-4.5" /> Terms of Service
                </Link>
                <Link to="/legal/privacy" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isPrivacy ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <ShieldCheck className="w-4.5 h-4.5" /> Privacy Policy
                </Link>
                <Link to="/legal/cookies" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isCookies ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <FileText className="w-4.5 h-4.5" /> Cookie Policy
                </Link>
                <Link to="/legal/withdrawal-policy" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isWithdrawal ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <Wallet className="w-4.5 h-4.5" /> Withdrawal Policy
                </Link>
                <Link to="/legal/referral-rules" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isReferralRules ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <Users className="w-4.5 h-4.5" /> Referral Program Rules
                </Link>
              </nav>
              <div className="pt-4 border-t border-slate-100 px-3">
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                  Compliance and truthfulness represent our highest values at TaskVexa.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Content container */}
          <div className="flex-1 bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-12 shadow-sm">
            
            {/* TERMS & CONDITIONS POLICY */}
            {isTerms && (
              <div className="space-y-8 text-slate-600 leading-relaxed text-base">
                <div className="border-b border-slate-100 pb-6">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Terms of Service</h2>
                  <p className="text-slate-400 font-bold text-sm">Last updated: June 15, 2026</p>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 text-sm font-semibold text-amber-850 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-amber-900 block mb-1">Affiliation & Platform Disclaimer</span>
                    TaskVexa is an independent platform. TaskVexa is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Google, YouTube, Facebook, TikTok, Meta, ByteDance, or any government organization or municipal agency. All trademarked names remain the sole property of their respective owners.
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">1. Acceptance of Terms</h3>
                  <p>By creating an account, logging in, or completing task submissions on TaskVexa, you confirm that you are at least 18 years old and agree to follow these Terms & Conditions. If you disagree, you must stop using our website.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">2. Earning Realism & Availability Disclaimer</h3>
                  <p>TaskVexa is a premium crowdsourced promotional rewards platform. Points and reward coins accumulated inside our software reflect virtual token items.</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm font-bold text-slate-555">
                    <li>Rewards depend entirely on task availability, geographic locations, and system demand.</li>
                    <li>Not all users will qualify for or have access to the same selection or volume of campaigns.</li>
                    <li>Rewards are conditional upon complete advertiser eligibility matching, strict user verification checks, and final approval by our promotional partners.</li>
                    <li>There are absolutely no guarantees of fixed periodic earnings or consistent hourly values.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">3. Prohibited Activities & Account Fraud</h3>
                  <p>To preserve integrity for our advertisers, TaskVexa enforces a strict zero-tolerance anti-fraud policy. Prohibited actions include:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 font-bold text-sm">
                    <div className="p-3 bg-rose-50/30 rounded-xl border border-rose-100">🚫 Multiple accounts per single device/person</div>
                    <div className="p-3 bg-rose-50/30 rounded-xl border border-rose-100">🚫 Utilization of VPNs, Proxies, or VPS servers</div>
                    <div className="p-3 bg-rose-50/30 rounded-xl border border-rose-100">🚫 Software emulators, automated bots, or scripts</div>
                    <div className="p-3 bg-rose-50/30 rounded-xl border border-rose-100">🚫 Fake screenshots or manipulative verification proof</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">4. Account Suspension & Reward Forfeiture</h3>
                  <p>Any account detected violating our fraud prevention standards will be immediately suspended without warning. Upon termination or suspension, all pending coins, referral balances, and available balances are completely forfeited. Suspended users will be permanently blocked from future registrations.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">5. Updates and Modifications</h3>
                  <p>We reserve the right to modify these rules and reward ratios at any time to guarantee platform sustainability. We advise users to check this page periodically for updates.</p>
                </div>
              </div>
            )}

            {/* PRIVACY POLICY */}
            {isPrivacy && (
              <div className="space-y-8 text-slate-600 leading-relaxed text-base">
                <div className="border-b border-slate-100 pb-6">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Privacy Policy</h2>
                  <p className="text-slate-400 font-bold text-sm">Last updated: June 15, 2026</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">1. Information We Collect</h3>
                  <p>We prioritize your privacy and minimize physical collection of personalized data. We collect specifically:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm font-bold">
                    <li><span className="text-slate-950">Registration Details</span>: Full name, verified email address, phone number, and self@selected country location.</li>
                    <li><span className="text-slate-950">Verification Evidence</span>: User-submitted screenshots or codes for task validation.</li>
                    <li><span className="text-slate-950">Device Identifiers</span>: Device fingerprints, operating system type, and IP address range strictly to identify multi-account fraud.</li>
                    <li><span className="text-slate-950">Payout Addresses</span>: EasyPaisa numbers, PayPal emails, or wallet addresses needed to complete requested transfers.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">2. Why Data is Collected</h3>
                  <p>Your data is processed solely for the following purposes:</p>
                  <ol className="list-decimal pl-6 space-y-2 text-sm font-bold">
                    <li>Verifying that task criteria were met accurately before issuing coin rewards.</li>
                    <li>Processing secure withdrawals back to your preferred payment account.</li>
                    <li>Analyzing structural device similarities to flag multiple accounts trying to exploit the network.</li>
                    <li>Anonymously measuring system analytics, loading speeds, and overall page performance.</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">3. How Your Data is Protected</h3>
                  <p>All transmitted parameters remain protected using end-to-end SSL/TLS encryption tunnels. We host our database on premium secure cloud servers managed under strict access-control layers. We will never sell, lease, or distribute your email or physical profile data to any external marketing firms.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">4. Cookie & Storage Usage</h3>
                  <p>We make use of primary first-party functional session cookies and local storage tokens. These persistent components are essential to keep you securely signed in to your member panel, and to prevent robotic, emulated logins.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">5. Your Digital Rights</h3>
                  <p>Under global data privacy architectures, you have complete rights to request an exported copy of the indicators we hold about you, or ask for complete deletion of your profile history from our active database. You can initiate this by writing to our privacy team at <a href="mailto:taskvexa.offical@gmail.com" className="text-indigo-600 hover:underline">taskvexa.offical@gmail.com</a>.</p>
                </div>
              </div>
            )}

            {/* COOKIE POLICY */}
            {isCookies && (
              <div className="space-y-8 text-slate-600 leading-relaxed text-base">
                <div className="border-b border-slate-100 pb-6">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Cookie Policy</h2>
                  <p className="text-slate-400 font-bold text-sm">Last updated: June 15, 2026</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">1. What are Cookies?</h3>
                  <p>Cookies are modest files saved to your browser on a computer or active handset. They allow servers to recognize returning accounts, keep you signed in, and track technical task sessions without forcing you to log in repeatedly.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">2. Essential Cookies</h3>
                  <p>These cookies are strictly required to let you navigate the protected dashboard pages. They load during login state and clear automatically when you request a log out or close a closed session. Disabling essential cookies will block access to the dashboard.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">3. Fraud Prevention and Analytical Cookies</h3>
                  <p>We deploy special device fingerprint tracking scripts that function as security cookies. They compare machine metadata across account sessions to flag when a single physical user is running multiple browser instances to double-claim the same promotional campaign.</p>
                </div>
              </div>
            )}

            {/* WITHDRAWAL POLICY */}
            {isWithdrawal && (
              <div className="space-y-8 text-slate-600 leading-relaxed text-base">
                <div className="border-b border-slate-100 pb-6">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Withdrawal Policy</h2>
                  <p className="text-slate-400 font-bold text-sm">Last updated: June 15, 2026</p>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-150 rounded-2xl p-5 text-sm font-semibold text-indigo-850 space-y-1">
                  <span className="font-extrabold text-indigo-950 block">Standard Processing Times</span>
                  <p>All verified withdrawals are processed and processed within 24 to 48 hours. We audit every queue request to guarantee advertiser validity.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">1. Minimum Withdrawal Threshold</h3>
                  <p>You can request a withdrawal once you have accumulated the minimum eligible coin threshold corresponding to your account type:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm font-bold">
                    <li>Minimum Standard payout threshold: <span className="text-slate-950">5,000 Coins ($5.00 equivalent value)</span>.</li>
                    <li>EasyPaisa and JazzCash local mobile wallets are fully supported in Pakistan.</li>
                    <li>Global users can select PayPal, Crypto (USDT), or Direct Bank Transfer.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">2. Verification and Task Validation</h3>
                  <p>Before any transfer occurs, our manual audit team checks the submitted proof of the tasks behind those coins. Every task must represent real, accurate human actions adhering to instructions. If an advertiser flags a submission as fake or invalid, those matching coins will be immediately deducted, which might cause your balance to drop below the threshold.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">3. Reasons a Withdrawal May Be Delayed or Rejected</h3>
                  <p>A withdrawal request will be delayed, permanently locked, or rejected if the audit logs point to any of these events:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700 font-bold text-xs mt-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-red-650 block mb-1">❌ Incomplete Payment Details</span>
                      Entering spelling typos, incorrect wallet numbers, or expired bank accounts.
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-red-650 block mb-1">❌ Fraudulent Proof Submissions</span>
                      Uploading recycled screenshots belonging to other members, or edited image files.
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-red-650 block mb-1">❌ VPN/Proxy Detection</span>
                      Accessing matching high-yield campaigns through spoofed premium IP ranges.
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-red-650 block mb-1">❌ Multi-Account Farming</span>
                      Deploying virtual machines or space-cloning apps to withdraw to multiple duplicate emails.
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">4. Anti-Money Laundering & Hardware Fingerprint Checks</h3>
                  <p>We track unique device IDs to ensure secure disbursements. Attempting to withdraw funds accumulated across separate accounts into a single payment wallet address is treated as software farming, resulting in system bans for all associated profiles.</p>
                </div>
              </div>
            )}

            {/* REFERRAL PROGRAM RULES */}
            {isReferralRules && (
              <div className="space-y-8 text-slate-600 leading-relaxed text-base">
                <div className="border-b border-slate-100 pb-6">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Referral Program Rules</h2>
                  <p className="text-slate-400 font-bold text-sm">Last updated: June 15, 2026</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">1. How Referral Earning Works</h3>
                  <p>The TaskVexa Referral program is structured to reward members who help onboard genuine, motivated advocates onto our network:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm font-bold">
                    <li>Share your unique referral URL or alphanumeric invite code from your dashboard settings.</li>
                    <li>Your referral must complete registration, log in, and fulfill task requirements.</li>
                    <li>You will receive a transparent commission of up to <span className="text-slate-950">10% on coins</span> earned by your referral, paid dynamically as soon as their task submissions are successfully verified and approved by the advertisers.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">2. Referral Commission Eligibility</h3>
                  <p>Commissions are paid directly from TaskVexa's network budget and are never deducted from your friend's original rewards. For commissions to trigger, both accounts must maintain a compliant "Active" status without any security flags. Self-referrals (referring your own secondary emails or duplicate phones) are strictly fraudulent.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">3. Anti-Abuse Policies & Cloned App Restrictions</h3>
                  <p>Any referrer or referral found with duplicate hardware signatures or linking IP addresses will be immediately flagged by our security auditor. Prohibited activities include:</p>
                  <div className="space-y-2.5 text-slate-700 font-bold text-sm">
                    <p className="p-3 bg-[#FFFBF0] border border-amber-200 rounded-xl">⚠️ Creating "fake shadow profiles" to complete registration steps for the bonus coins.</p>
                    <p className="p-3 bg-[#FFFBF0] border border-amber-200 rounded-xl">⚠️ Offering monetary kickbacks or financial incentives to strangers to sign up strictly to claim the registration bonus.</p>
                    <p className="p-3 bg-[#FFFBF0] border border-amber-200 rounded-xl">⚠️ spamming invite codes in comment boxes or sending bulk unsolicited messages.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">4. Commission Ceilings</h3>
                  <p>To preserve liquidity, referral earnings might be maxed out or suspended at a ceiling of 50,000 Referral Coins per single device per calendar month, unless your account is white-listed under our VIP Promoter framework. Contact support if you run large social channels.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* DETAILED ABOUT US PAGE DISPLAY */}
      {isAbout && (
        <div className="max-w-7xl mx-auto px-6 py-20">
          {/* Vision section */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">Transparent, Secure <br/>Task Rewards</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-semibold">
              TaskVexa was conceptualized to solve the trust deficit between crowdsourced participants and micro-promoters. We prioritize transparency, rigorous software validation, and safe payout methods.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-center">
            <div className="bg-white p-8 rounded-[32px] border border-slate-200/80 shadow-sm">
              <div className="text-4xl font-extrabold text-indigo-600 mb-3">100% Free</div>
              <div className="font-black text-slate-900 text-sm uppercase tracking-wider">No Investment Ever</div>
              <p className="text-slate-550 text-xs font-semibold mt-2">Participation is fully voluntary and carries zero financial charges or deposit requirements.</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-200/80 shadow-sm">
              <div className="text-4xl font-extrabold text-blue-600 mb-3">24-Hr SLA</div>
              <div className="font-black text-slate-900 text-sm uppercase tracking-wider">Responsive Payout Audit</div>
              <p className="text-slate-550 text-xs font-semibold mt-2">Verified task records are reviewed and processed within established 24-hour cycles.</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-200/80 shadow-sm">
              <div className="text-4xl font-extrabold text-emerald-600 mb-3">Transparency</div>
              <div className="font-black text-slate-900 text-sm uppercase tracking-wider">Ad-Shield Controls</div>
              <p className="text-slate-550 text-xs font-semibold mt-2">All tasks and rewards relate directly to genuine promotional campaigns hosted by active sponsors.</p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Our Core Mission</h3>
              <p className="text-slate-600 font-medium leading-relaxed text-sm">
                Our mission is to empower motivated users worldwide with supplementary rewards in exchange for micro-evaluations, app testing, and digital feedback. We provide sponsors with genuine human interactions, while providing users with a robust dashboard, precise tracking tools, and secure, auditable payments.
              </p>
              <div className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Fair reward distributions representing honest engagement.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Strict anti-bot filters to secure platform sustainability.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>24/7 client care support with high response guarantees.</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-[28px] space-y-4">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Trust & Compliance Focus</span>
              <h4 className="text-lg font-black text-slate-900 leading-tight">Secured Data & Clear Expectations</h4>
              <p className="text-slate-500 font-bold text-xs leading-relaxed">
                TaskVexa complies strictly with modern advertising rules and regional data guidelines. We build trust by stating clearly what users can expect, and enforcing transparent rules that guarantee security. Your personal dashboard remains protected with multi-layered credential architectures.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200/80 flex justify-between items-center text-xs font-bold text-slate-400">
                <span>TaskVexa Platform v2.4</span>
                <Link to="/legal/privacy" className="text-indigo-600 hover:underline">Read Privacy Rules &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED CONTACT US PAGE DISPLAY */}
      {isContact && (
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 relative z-10">
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Get in Touch</h2>
              <p className="text-slate-600 font-semibold text-base mt-2">Have a question or run into trouble? Our support team is here to help you solve system issues.</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Customer Care Email</h4>
                  <p className="text-xs text-slate-400 font-bold">Standard response time is under 12 hours</p>
                  <a href="mailto:taskvexa.offical@gmail.com" className="font-black text-indigo-600 hover:text-indigo-700 text-sm mt-1 block">taskvexa.offical@gmail.com</a>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Self-Help Support Center</h4>
                  <p className="text-xs text-slate-400 font-bold">Browse answers to popular payout answers</p>
                  <Link to="/faq" className="font-black text-indigo-600 hover:text-indigo-700 text-sm mt-1 block flex items-center gap-1">
                    Visit Support FAQ Page <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-slate-500 font-bold text-xs leading-relaxed">
                  <span className="font-black text-slate-700 block mb-1 uppercase tracking-wide">💡 Quick Reminders before Messaging Support:</span>
                  1. Have your verified registration email ready. <br/>
                  2. For withdrawal queries, please review our <Link to="/legal/withdrawal-policy" className="text-indigo-600 underline">Withdrawal Policy</Link> to check details. <br/>
                  3. If reporting task issues, provide matching screenshot proof and campaign IDs.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 bg-white p-8 md:p-10 rounded-[32px] shadow-sm border border-slate-200/80">
            {formSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Support Ticket Submitted!</h3>
                <p className="text-slate-500 font-semibold text-sm max-w-sm mx-auto leading-relaxed">
                  Thank you for contacting TaskVexa. A friendly care representative will verify your issue and reply to your email within 12 hours.
                </p>
                <Button onClick={() => setFormSubmitted(false)} className="rounded-full bg-slate-900 text-white mt-4 h-11 text-xs font-black uppercase tracking-wider px-8 cursor-pointer">
                  Send Another Message
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Open Help Inquiry</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                      placeholder="e.g. John" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                      placeholder="e.g. Doe" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Verification Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="name@example.com" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Help Request Details <span className="text-red-500">*</span></label>
                  <textarea 
                    rows={4} 
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" 
                    placeholder="Please specify account details or task IDs if reporting submission delays..."
                  ></textarea>
                </div>
                <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer">
                  Submit Help Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FALLBACK FOR UNEXPECTED CONFIG PATHS */}
      {!isLegal && !isAbout && !isContact && (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-[32px] border border-slate-200 p-16 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">{pageTitle}</h2>
            <p className="text-slate-550 font-semibold mb-6 max-w-md mx-auto text-sm leading-relaxed">
              This informational folder is presently undergoing compliance synchronization. Explore other transparent policies in our footer directory.
            </p>
            <Link to="/">
              <Button className="rounded-full bg-slate-900 hover:bg-black text-white px-8 h-11 text-xs font-black uppercase tracking-wide">Return to Home</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

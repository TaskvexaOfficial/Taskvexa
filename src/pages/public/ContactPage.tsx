import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { 
  Mail, MapPin, Phone, HelpCircle, FileText, CheckCircle, Clock, AlertTriangle, ArrowRight, ShieldCheck, Landmark, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  const seoTitle = "Contact TaskVexa Support | Get Help & Customer Care";
  const seoDescription = "Connect with the TaskVexa support desk. Browse our escalation channels, submit certified account tickets, or track task verification delays with our 24/7 client care team.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/contact',
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact TaskVexa",
      "description": seoDescription,
      "url": "https://taskvexa.com/contact"
    }
  });

  // Contact Form States
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('payout');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setFormSubmitted(true);
    setFirstName('');
    setLastName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

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
            <MessageSquare className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
          >
            Contact TaskVexa Assistance
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.6 }} 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold"
          >
            Our specialized client care representatives review and resolve system queries and payout requests on a committed 24-hour response SLA.
          </motion.p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Inquiry Area Left - Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-12 shadow-sm space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">1. Open Support Ticket</h2>
              <p className="text-slate-500 font-bold text-sm">Please fill out our official entry form below. All marked fields are mandatory.</p>
            </div>

            {formSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Support Escalation Logged!</h3>
                <p className="text-slate-500 font-semibold text-sm max-w-md mx-auto leading-relaxed">
                  Your ticket has been recorded in our user service queue. A support manager is verifying your credentials and will send a detailed follow-up email in under 12 hours.
                </p>
                <Button onClick={() => setFormSubmitted(false)} className="rounded-full bg-slate-900 text-white mt-4 h-11 text-xs font-black uppercase tracking-wider px-8 cursor-pointer">
                  Submit New Ticket
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 font-bold">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                      placeholder="e.g. John" 
                    />
                  </div>
                  <div className="space-y-1.5 font-bold">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                      placeholder="e.g. Doe" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5 font-bold">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Verified Account Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                    placeholder="name@example.com" 
                  />
                  <p className="text-[11px] text-slate-400 font-semibold leading-none">Use your TaskVexa login email to secure immediate history access.</p>
                </div>

                <div className="space-y-1.5 font-bold">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Inquiry Topic</label>
                  <select 
                    value={inquiryType}
                    onChange={e => setInquiryType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="payout">Withdrawal & Coin Inquiries</option>
                    <option value="verification">Task Submission Feedback & Audit</option>
                    <option value="abuse">Report Fraud or Multi-Account Issues</option>
                    <option value="corporate">Advertiser Proposal & Media Sponsor</option>
                    <option value="other">General Platform Questions</option>
                  </select>
                </div>

                <div className="space-y-1.5 font-bold">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Subject Line</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                    placeholder="Brief summary of your question" 
                  />
                </div>

                <div className="space-y-1.5 font-bold">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Support Description Details <span className="text-red-500">*</span></label>
                  <textarea 
                    rows={5} 
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all" 
                    placeholder="Please specify specific campaign IDs, precise error codes, or your exact local wallet configurations."
                  ></textarea>
                </div>

                <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer">
                  File Ticket and Submit Inquiry
                </Button>
              </form>
            )}
          </div>

          {/* Sidebar Column Right - Contact Details & FAQs */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
              <div className="text-xs font-black text-slate-400 uppercase tracking-[0.14em] px-1 border-b border-slate-50 pb-3">2. Escalation Channels</div>
              
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Direct Customer Care Email</h4>
                    <p className="text-xs text-slate-400 font-bold mb-1">Send a direct message 24/7</p>
                    <a href="mailto:taskvexa.offical@gmail.com" className="font-black text-indigo-600 hover:text-indigo-700 text-xs break-all block">taskvexa.offical@gmail.com</a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Standard Working SLA</h4>
                    <p className="text-xs text-slate-400 font-bold">Inquiries Queue Dispatching</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">Monday - Sunday (24/7/365)</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Self-Help Support Center</h4>
                    <p className="text-xs text-slate-400 font-bold">Frequently Asked Payout Questions</p>
                    <Link to="/faq" className="font-black text-indigo-600 hover:text-indigo-700 text-xs mt-1 inline-flex items-center gap-1">Browse Platform FAQs <ArrowRight className="w-3" /></Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Note */}
            <div className="bg-slate-50 rounded-[24px] border border-slate-200/60 p-6 md:p-8 space-y-4">
              <div className="flex gap-3 items-start text-xs text-slate-700">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <span className="font-black text-slate-900 block uppercase tracking-wide">3. Important Message Validation Rules</span>
                  <p className="leading-relaxed font-semibold">
                    Before hitting submit, ensure your problem complies with standard regional tracking agreements. If writing to report payout suspension:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500 font-bold">
                    <li>Withdrawals default to a rigorous 24-48 hours safety validation cycle.</li>
                    <li>Referral commissions require verified account validation to prevent referral loop exploitation.</li>
                    <li>VPN or space-cloning tools on duplicate devices trigger instant IP suspension logs.</li>
                  </ul>
                  <p className="text-[11px] text-slate-400 leading-normal font-medium">
                    Review our structural <Link to="/withdrawal-policy" className="text-indigo-600 underline">Withdrawal Policy</Link> and <Link to="/referral-rules" className="text-indigo-600 underline">Referral Rules</Link> before requesting a ticket escalation.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Detailed FAQ section with proper spacing */}
        <section className="mt-20 border-t border-slate-200 pt-16 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase">Contact Us — Answers to Popular Desk Inquiries</h3>
            <p className="text-sm text-slate-500 font-semibold">Verify these typical issues first to eliminate your escalation delay.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm">How long does custom verification take for each campaign?</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Most micro-promotional actions utilize dynamic real-time validation checks and credit coins instantly. For high-reward manual campaigns, advertising sponsors require up to 24 hours to check visual screenshots, matching geographic boundaries, and complete actions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm">Why was my inquiry marked as invalid or ignored?</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                To keep our support desks active for authentic accounts, our auto-filters ignore spam messages, emails lacking valid associated account profiles, or user tickets loaded with abusive or offensive language.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

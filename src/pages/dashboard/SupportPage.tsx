import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowLeft, 
  Share2,
  Headset,
  Star,
  Bug,
  MessageSquare,
  PlusCircle,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Search,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { SiWhatsapp, SiTiktok, SiYoutube } from 'react-icons/si';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';

const FAQ_ITEMS = [
  {
    category: "Withdrawals & Payments",
    question: "How do I withdraw my earnings?",
    answer: "You can withdraw your earnings once you reach the minimum payout threshold. Navigate to the Withdraw area in the wallet page, choose your payout method (e.g., PayPal, bank transfers, or cryptocurrency), enter your details, and submit. Most support withdrawals are audited and dispatched securely within 24 hours.",
    keywords: ["withdraw", "earnings", "payout", "paypal", "crypto", "bank", "wallet", "payments"]
  },
  {
    category: "Tasks & Coins",
    question: "Why is my task submission marked as pending?",
    answer: "Every task submission is double checked either through automated system integrity logs or manual admin verification. This process typically completes within 12 hours. High reward projects may require up to 24 hours to post. If your proof is valid, your coins are guaranteed.",
    keywords: ["pending", "task", "coins", "submission", "approved", "review", "payout"]
  },
  {
    category: "Account Security",
    question: "Is multiple account usage permitted?",
    answer: "No. To maintain system fairness, our security systems monitor device signatures, multi-IP routing, and registration patterns. Logging in with up to two of your own devices is permitted, but using VPNs, proxies, or creating multiple accounts will result in automatic status bans.",
    keywords: ["devices", "multiple", "login", "account", "vpn", "proxy", "security", "ban"]
  },
  {
    category: "Referral Program",
    question: "How do referral bonuses accumulate?",
    answer: "When friends register using your unique referral link, you receive a recurring bonus equal to a portion of all verified coins they earn. Your team stats, active referral leaders, and ongoing referral competition events are visible on the Referral Competition tab.",
    keywords: ["referral", "bonus", "invite", "link", "friends", "leaderboard", "commission"]
  },
  {
    category: "Task Slot Audits",
    question: "What is a 'Dynamic Task' reset schedule?",
    answer: "Dynamic tasks have specific completion limits per active cycle (e.g. Daily/24h, Weekly/7d). After the cycle is completed or reset by the system, you can submit proofs again to earn new rewards! If task slots are currently full, check again after the scheduled UTC midnight reset.",
    keywords: ["dynamic", "reset", "limit", "slot", "schedule", "repeat", "claim", "midnight"]
  }
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'portal' | 'ticket'>('portal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('user_feedback')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (!error && data) {
          setTickets(data);
        }
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredFAQs = FAQ_ITEMS.filter(faq => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query) ||
      faq.keywords.some(kw => kw.includes(query))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData(e.target as HTMLFormElement);

      const { error } = await supabase.from('user_feedback').insert({
        user_id: session.user.id,
        type: 'support',
        title: formData.get('subject'),
        description: `Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\n\nMessage:\n${formData.get('message')}`,
        status: 'pending'
      });

      if (error) throw error;
      setSubmitted(true);
      fetchTickets();
    } catch (error: any) {
      console.error('Error submitting support ticket:', error);
      if (error.message?.includes('JWT expired')) {
        alert('Your session has expired. Please log in again.');
        useStore.getState().clearCache();
        window.location.href = '/auth';
      } else {
        alert('Failed to send message. ' + (error.message || ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportCards = [
    {
      id: 'support-center',
      title: 'Support Center',
      desc: 'Contact our support team for account and payment assistance.',
      icon: Headset,
      color: 'indigo',
      action: () => setActiveTab('ticket')
    },
    {
      id: 'review',
      title: 'Website Review',
      desc: 'Tell us how we are doing.',
      icon: Star,
      color: 'amber',
      action: () => navigate('/dashboard/review')
    },
    {
      id: 'bug',
      title: 'Report a Bug',
      desc: 'Report technical issues and platform errors.',
      icon: Bug,
      color: 'rose',
      action: () => navigate('/dashboard/bug')
    },
    {
      id: 'suggestions',
      title: 'Suggestions',
      desc: 'Share ideas and feature requests.',
      icon: MessageSquare,
      color: 'emerald',
      action: () => navigate('/dashboard/suggestions')
    },
    {
      id: 'request-task',
      title: 'Request a Task',
      desc: 'Request custom tasks for workers.',
      icon: PlusCircle,
      color: 'teal',
      action: () => navigate('/dashboard/request-task')
    }
  ];

  return (
    <div className="w-full space-y-8 pb-20 font-sans">
      <AnimatePresence mode="wait">
        {activeTab === 'portal' ? (
          <motion.div
            key="portal-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header / Hero Panel */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-600/10 dark:via-purple-600/5 dark:to-transparent rounded-[32px] p-8 md:p-12 border border-slate-150/40 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
              <div className="space-y-4 text-left max-w-lg relative z-10">
                <button 
                  onClick={() => navigate('/dashboard/settings')} 
                  className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors mb-2 group cursor-pointer tracking-wider"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Settings
                </button>
                
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Help & Support
                </h2>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  How can we help you today? Select an option below to submit a ticket, report technical bugs, or leave feedback.
                </p>

                {/* Navigation Search bar */}
                <div id="support-search-container" className="relative mt-4 max-w-md w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    id="support-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search FAQs, withdrawal issues, task limits..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-2xl py-3.5 pl-11 pr-16 focus:ring-2 focus:ring-indigo-550/20 outline-none transition-all font-bold text-xs text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      id="support-search-clear"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Decorative Support Agent Widget illustration */}
              <div className="relative w-40 h-40 shrink-0 select-none flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-32 h-32 rounded-[24px] border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/85 flex items-center justify-center shadow-xl">
                  <div className="absolute -top-1 -right-1 w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm animate-bounce duration-1000">
                    <MessageSquare className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-9 h-9 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-100 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-500/20" />
                  </div>
                  <Headset className="w-14 h-14 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Menu options grid */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Support Channels & Systems</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supportCards.map((card, idx) => {
                  const IconComponent = card.icon;
                  let colorClasses = '';
                  
                  switch (card.color) {
                    case 'indigo':
                      colorClasses = 'bg-indigo-50 text-indigo-600 border-indigo-100/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
                      break;
                    case 'amber':
                      colorClasses = 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
                      break;
                    case 'rose':
                      colorClasses = 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
                      break;
                    case 'emerald':
                      colorClasses = 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
                      break;
                    case 'teal':
                      colorClasses = 'bg-teal-50 text-teal-600 border-teal-100/50 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20';
                      break;
                    default:
                      colorClasses = 'bg-slate-50 text-slate-650 border-slate-100/50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
                  }

                  return (
                    <motion.div
                      key={card.id}
                      whileHover={{ y: -4, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.04 }}
                      onClick={card.action}
                      className="group relative bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-white/5 rounded-[24px] p-6 shadow-md hover:shadow-xl dark:shadow-none transition-all cursor-pointer flex flex-col justify-between h-[215px] text-left"
                    >
                      <div>
                        {/* Elegant Icon Box */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorClasses} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        
                        <h4 className="text-base font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                          {card.title}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                      
                      {/* Interactive Bottom Bar */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-white/5">
                        <span className="text-[9px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0">
                          {card.id === 'support-center' ? 'Open Form' : 'Access Service'}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/80 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 flex items-center justify-center transition-all">
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Grid for FAQs and System Status / Tickets */}
            <div id="support-grid-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
              {/* FAQs Section */}
              <div id="faq-section" className="lg:col-span-7 space-y-6 text-left">
                <div className="flex justify-between items-center px-1">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-500" />
                      Frequently Asked Questions
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                      Find answers quickly before submitting a support request.
                    </p>
                  </div>
                  {searchQuery && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/10 shadow-sm animate-pulse">
                      {filteredFAQs.length} Matched
                    </span>
                  )}
                </div>

                {filteredFAQs.length === 0 ? (
                  <div id="faq-empty-state" className="p-10 text-center rounded-[24px] bg-slate-50 dark:bg-slate-850/30 border border-dashed border-slate-150 dark:border-white/5 space-y-3">
                    <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-650 mx-auto" />
                    <p className="text-xs font-black text-slate-555 dark:text-slate-450">No matching questions found</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
                      We couldn't find any FAQs matching your query "{searchQuery}". Try searching other keywords, or open a support ticket to describe your query directly.
                    </p>
                    <Button
                      id="faq-open-ticket-fallback"
                      onClick={() => setActiveTab('ticket')}
                      variant="primary"
                      className="rounded-xl h-11 text-xs px-6 font-black cursor-pointer shadow-sm mt-2"
                    >
                      Open Support Ticket
                    </Button>
                  </div>
                ) : (
                  <div id="faq-accordion-list" className="space-y-4">
                    {filteredFAQs.map((faq, index) => {
                      const isExpanded = expandedFaq === index || (searchQuery !== '' && filteredFAQs.length < 4);
                      return (
                        <div
                          id={`faq-item-container-${index}`}
                          key={index}
                          className="bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-white/5 rounded-[22px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <button
                            id={`faq-item-trigger-${index}`}
                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                            className="w-full flex justify-between items-center p-5 text-left font-bold text-slate-900 dark:text-white hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                          >
                            <div className="space-y-1 pr-4">
                              <span className="text-[9px] font-black uppercase text-indigo-650 dark:text-indigo-400 tracking-wider">
                                {faq.category}
                              </span>
                              <h4 className="text-sm font-extrabold leading-tight tracking-tight">
                                {faq.question}
                              </h4>
                            </div>
                            <div className={`w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                id={`faq-item-content-${index}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                              >
                                <div className="px-5 pb-5 pt-1 text-xs font-medium text-slate-550 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-white/5">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status and Tickets Side Panel */}
              <div id="status-and-tickets-section" className="lg:col-span-5 space-y-6">
                
                {/* Recent Tickets Widget */}
                <Card id="recent-tickets-card" className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 p-6 flex flex-col gap-4 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center relative z-10">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5 text-indigo-500" />
                      Recent Tickets
                    </h3>
                    <button
                      id="tickets-refresh-btn"
                      onClick={fetchTickets}
                      disabled={isLoadingTickets}
                      className="text-[10px] font-black uppercase text-indigo-650 dark:text-indigo-400 hover:underline tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingTickets ? 'Syncing...' : 'Refresh'}
                    </button>
                  </div>

                  {isLoadingTickets ? (
                    <div id="tickets-loading-container" className="py-10 text-center space-y-2 relative z-10">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Synchronizing issues...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div id="tickets-empty-container" className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-850/30 border border-dashed border-slate-150 dark:border-white/5 relative z-10">
                      <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-black text-slate-505 dark:text-slate-450">No tickets found</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 leading-relaxed max-w-xs mx-auto">
                        If you have active issues, open a ticket above and our team will get in touch!
                      </p>
                    </div>
                  ) : (
                    <div id="tickets-list-container" className="space-y-3 relative z-10 max-h-[380px] overflow-y-auto pr-1">
                      {tickets.map((ticket, index) => {
                        let statusColor = '';
                        switch (ticket.status) {
                          case 'pending':
                            statusColor = 'bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
                            break;
                          case 'resolved':
                          case 'reviewed':
                          case 'approved':
                            statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
                            break;
                          case 'rejected':
                            statusColor = 'bg-rose-50 text-rose-600 border border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
                            break;
                          default:
                            statusColor = 'bg-slate-50 text-slate-500 border border-slate-100 dark:bg-slate-550/10 dark:text-slate-400 dark:border-white/5';
                        }

                        // Parse name and message details carefully
                        let textDesc = ticket.description || '';
                        if (textDesc.includes('\n\nMessage:\n')) {
                          textDesc = textDesc.split('\n\nMessage:\n')[1];
                        }

                        return (
                          <div
                            id={`ticket-item-${index}`}
                            key={ticket.id}
                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100/50 dark:border-white/5 flex flex-col gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform text-left"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                  {ticket.type || 'Support'} &bull; {new Date(ticket.created_at).toLocaleDateString()}
                                </span>
                                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250 leading-tight line-clamp-1">
                                  {ticket.title}
                                </h4>
                              </div>
                              <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${statusColor}`}>
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed">
                              {textDesc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ticket-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
              <div className="space-y-2 text-left">
                <button 
                  onClick={() => setActiveTab('portal')} 
                  className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-4 group cursor-pointer tracking-wider"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  Back to Help & Support
                </button>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2 shadow-sm shadow-emerald-500/10 text-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Support Team Online</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Support Center</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-xl leading-relaxed mt-2">
                  Need assistance? Our dedicated support team is here to help resolve your issues quickly and efficiently.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Contact info (Left column) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 p-8 flex flex-col gap-8 transition-colors relative overflow-hidden group h-full text-left">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-800/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/5 transition-colors duration-700"></div>
                  
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10">Direct Contact Details</h3>
                  
                  <div className="space-y-8 relative z-10">
                    <div className="flex items-start gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-300 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                          <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                       </div>
                       <div className="space-y-1 mt-1">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Support</p>
                          <p className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight select-all">taskvexa.official@gmail.com</p>
                       </div>
                    </div>

                    <div className="flex items-start gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-300 shadow-sm border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
                          <Share2 className="w-5 h-5" />
                       </div>
                       <div className="space-y-1 mt-1">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Social Media</p>
                          <div className="flex gap-4 mt-2">
                            <a href="https://whatsapp.com/channel/0029Vb8U3toIHphBlB0llP47" target="_blank" rel="noopener noreferrer" title="WhatsApp Channel 1" className="text-[#25D366] hover:scale-110 transition-transform">
                              <SiWhatsapp size={22} />
                            </a>
                            <a href="https://whatsapp.com/channel/0029VbCrizq4inoi8IA9T92i" target="_blank" rel="noopener noreferrer" title="WhatsApp Channel 2" className="text-[#25D366] opacity-80 hover:scale-110 transition-transform">
                              <SiWhatsapp size={22} />
                            </a>
                            <a href="https://www.youtube.com/@Taskvexa-xyz" target="_blank" rel="noopener noreferrer" title="YouTube Channel" className="text-[#FF0000] hover:scale-110 transition-transform">
                              <SiYoutube size={22} />
                            </a>
                            <a href="https://tiktok.com/@taskvexa.official" target="_blank" rel="noopener noreferrer" title="TikTok Profile" className="text-slate-900 dark:text-white hover:scale-110 transition-transform">
                              <SiTiktok size={20} />
                            </a>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-start gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-300 shadow-sm border border-amber-100 dark:border-amber-500/20">
                          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                       </div>
                       <div className="space-y-1 mt-1">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Response Time</p>
                          <p className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">&lt; 60 Minutes Avg.</p>
                       </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Message form (Right column) */}
              <div className="lg:col-span-7">
                <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden h-full flex flex-col transition-colors relative">
                  <AnimatePresence mode="wait">
                    {!submitted ? (
                      <motion.div 
                        key="support-ticket-form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-8 lg:p-10 flex-1 flex flex-col relative z-10 text-left"
                      >
                         <div className="mb-8">
                           <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                               <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                             </div>
                             Submit a Ticket
                           </h3>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold">Fill out the form below and we'll get back to you shortly.</p>
                         </div>

                         <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Your Name</label>
                                  <input 
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="John Doe"
                                    className="w-full bg-slate-50 border-none dark:bg-slate-800/40 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Your Email</label>
                                  <input 
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="taskvexa.official@gmail.com"
                                    className="w-full bg-slate-50 border-none dark:bg-slate-800/40 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                  />
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Subject</label>
                               <input 
                                 type="text"
                                 name="subject"
                                 required
                                 placeholder="e.g. Issue with withdrawal"
                                 className="w-full bg-slate-50 border-none dark:bg-slate-800/40 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                               />
                            </div>

                            <div className="space-y-2 flex-1 flex flex-col">
                               <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Message Detail</label>
                               <textarea 
                                 name="message"
                                 required
                                 placeholder="Please provide as much detail as possible..."
                                 className="w-full flex-1 min-h-[160px] bg-slate-50 border-none dark:bg-slate-800/40 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner resize-none mb-4"
                               />
                            </div>

                            <div className="pt-4 mt-auto">
                              <Button 
                                variant="primary"
                                type="submit" 
                                className="w-full h-16 rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all border-none flex items-center justify-center gap-2 text-base group cursor-pointer"
                                isLoading={isSubmitting}
                              >
                                 {isSubmitting ? 'Processing request...' : (
                                   <>
                                     <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                     Submit Support Ticket
                                   </>
                                 )}
                              </Button>
                            </div>
                         </form>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="ticket-submission-success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-10 text-center flex flex-col items-center justify-center flex-1 min-h-[500px]"
                      >
                         <div className="w-32 h-32 bg-emerald-50 dark:bg-emerald-500/10 rounded-[32px] flex items-center justify-center mb-8 border-2 border-emerald-100 dark:border-emerald-500/20 relative shadow-2xl shadow-emerald-500/20 rotate-[-10deg]">
                            <div className="absolute inset-0 rounded-[32px] animate-ping bg-emerald-400 opacity-20"></div>
                            <CheckCircle2 className="w-14 h-14 text-emerald-500 rotate-[10deg]" />
                         </div>
                         <div className="space-y-4 mb-10 max-w-sm">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Ticket Received</h3>
                            <p className="text-base text-slate-500 dark:text-slate-400 font-bold">
                              Our support team will review your request and reach out to your email shortly.
                            </p>
                         </div>
                         <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                           <Button 
                             onClick={() => setSubmitted(false)}
                             variant="outline" 
                             className="rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold h-14 text-sm px-10 dark:text-slate-200 cursor-pointer"
                           >
                              Create Another Ticket
                           </Button>
                           <Button 
                             onClick={() => {
                               setSubmitted(false);
                               setActiveTab('portal');
                             }}
                             variant="primary" 
                             className="rounded-2xl h-14 text-sm px-10 font-black cursor-pointer shadow-md"
                           >
                              Return to Support Center
                           </Button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

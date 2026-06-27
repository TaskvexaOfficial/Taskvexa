import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  PlusCircle, 
  Send, 
  CheckCircle2, 
  XSquare, 
  Clock, 
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Hash,
  Coins,
  ShieldCheck,
  User,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

interface TaskRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  contact_platform: string;
  contact_info: string;
  notes: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string;
}

const CATEGORIES = [
  'Social Media (YouTube / TikTok / Insta)',
  'App Download & Review',
  'Website Signup & Verification',
  'Telegram Bot / Channel Join',
  'Content Writing & Marketing',
  'Survey & Quiz completion',
  'Other Tasks'
];

const CONTACT_PLATFORMS = [
  'WhatsApp',
  'Telegram',
  'Discord',
  'Facebook',
  'Instagram',
  'Other'
];

export default function RequestTaskPage() {
  const { cachedProfile } = useStore();
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [useFallbackTable, setUseFallbackTable] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState('');
  const [contactPlatform, setContactPlatform] = useState(CONTACT_PLATFORMS[0]);
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');

  // Anti-spam submission throttle timestamp
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  const fetchUserRequests = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Try querying from the primary dedicated task_requests table first
      const { data, error } = await supabase
        .from('task_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table does not exist (PGRST205) - fallback to user_feedback table
        if (error.code === 'PGRST205') {
          setUseFallbackTable(true);
          const { data: fallbackData, error: fbError } = await supabase
            .from('user_feedback')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('type', 'task_request')
            .order('created_at', { ascending: false });

          if (fbError) throw fbError;

          if (fallbackData) {
            const parsedData: TaskRequest[] = fallbackData.map((item: any) => {
              let parsedDesc = item.description;
              let budgetVal = 0;
              let platformVal = 'WhatsApp';
              let infoVal = '';
              let notesVal = '';

              try {
                const json = JSON.parse(item.description);
                parsedDesc = json.description || item.description;
                budgetVal = json.budget || 0;
                platformVal = json.contact_platform || 'WhatsApp';
                infoVal = json.contact_info || '';
                notesVal = json.notes || '';
              } catch (e) {
                // If it wasn't a valid JSON string
              }

              return {
                id: item.id,
                title: item.title,
                description: parsedDesc,
                category: item.category || 'Other Tasks',
                budget: budgetVal,
                contact_platform: platformVal,
                contact_info: infoVal,
                notes: notesVal,
                status: item.status || 'pending',
                created_at: item.created_at
              };
            });
            setRequests(parsedData);
          }
        } else {
          throw error;
        }
      } else if (data) {
        setRequests(data as TaskRequest[]);
      }
    } catch (err: any) {
      console.error('Error loading task requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, []);

  // Form sanitization and anti-spam validation (SQLi and XSS defenses requested)
  const sanitizeInput = (val: string) => {
    return val
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSuccess(false);

    // 1. Session control
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorMsg('You must be logged in to submit a request.');
      return;
    }

    // 2. Anti-spam throttle (maximum 1 task request submission per 30 seconds)
    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      const remaining = Math.ceil((30000 - (now - lastSubmitTime)) / 1000);
      setErrorMsg(`Anti-spam: Please wait ${remaining} seconds before submitting again.`);
      return;
    }

    // 3. Validation
    const cleanTitle = sanitizeInput(title);
    const cleanDescription = sanitizeInput(description);
    const cleanCategory = sanitizeInput(category);
    const budgetAmount = parseFloat(budget);
    const cleanContactPlatform = sanitizeInput(contactPlatform);
    const cleanContactInfo = sanitizeInput(contactInfo);
    const cleanNotes = sanitizeInput(notes);

    if (!cleanTitle || !cleanDescription || !cleanContactInfo || isNaN(budgetAmount) || budgetAmount <= 0) {
      setErrorMsg('Please supply valid details for all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (useFallbackTable) {
        // Fallback store to user_feedback standard table
        const combinedDescription = JSON.stringify({
          description: cleanDescription,
          budget: budgetAmount,
          contact_platform: cleanContactPlatform,
          contact_info: cleanContactInfo,
          notes: cleanNotes
        });

        const { error } = await supabase.from('user_feedback').insert({
          user_id: session.user.id,
          type: 'task_request',
          title: cleanTitle,
          description: combinedDescription,
          category: cleanCategory,
          status: 'pending'
        });

        if (error) throw error;
      } else {
        // Store inside preferred dedicated task_requests table
        const { error } = await supabase.from('task_requests').insert({
          user_id: session.user.id,
          title: cleanTitle,
          description: cleanDescription,
          category: cleanCategory,
          budget: budgetAmount,
          contact_platform: cleanContactPlatform,
          contact_info: cleanContactInfo,
          notes: cleanNotes,
          status: 'pending'
        });

        if (error) {
          // Double check if RLS or schema caused it, if it's schema, gracefully write to user_feedback fallback
          if (error.code === 'PGRST205') {
            setUseFallbackTable(true);
            const combinedDescription = JSON.stringify({
              description: cleanDescription,
              budget: budgetAmount,
              contact_platform: cleanContactPlatform,
              contact_info: cleanContactInfo,
              notes: cleanNotes
            });

            const { error: fallbackErr } = await supabase.from('user_feedback').insert({
              user_id: session.user.id,
              type: 'task_request',
              title: cleanTitle,
              description: combinedDescription,
              category: cleanCategory,
              status: 'pending'
            });
            if (fallbackErr) throw fallbackErr;
          } else {
            throw error;
          }
        }
      }

      // Success setup
      setLastSubmitTime(now);
      setIsSuccess(true);
      
      // Clear inputs
      setTitle('');
      setDescription('');
      setBudget('');
      setContactInfo('');
      setNotes('');
      
      // Refresh requests list
      await fetchUserRequests();

    } catch (err: any) {
      console.error('Request submission aborted:', err);
      setErrorMsg(err.message || 'An unexpected database writing error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.trim().toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
            <XSquare className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 animate-pulse">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-8 px-2 sm:px-4 pb-20 select-none">
      
      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/5">
          <PlusCircle className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Request a Task</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Request a Custom Task</h2>
        <p className="text-base text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
          Need custom action, signups, reviews, or social engagement? Submit your target task specifications, allocate a budget, and we will get it live for our global worker community.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* 1. MY REQUESTS HISTORY SECTION (Requirement 10) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Hash className="w-5 h-5 text-indigo-500" />
              My Requests History
            </h3>
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500">
              Total: {requests.length}
            </span>
          </div>

          {isLoading ? (
            <Card className="p-10 text-center flex flex-col items-center justify-center border-none shadow-sm dark:bg-slate-900">
              <div className="w-10 h-10 rounded-full border-[3px] border-indigo-100 dark:border-slate-800 border-t-indigo-600 animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading your request history...</p>
            </Card>
          ) : requests.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-600 mb-3">
                <HelpCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">No requests submitted yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">Fill out the new task request form below to submit your very first custom campaign request!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => (
                <Card key={req.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-all border-none bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden rounded-[24px]">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md uppercase tracking-wider block w-max mb-1.5">
                          {req.category}
                        </span>
                        <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight line-clamp-1">{req.title}</h4>
                      </div>
                      <div className="shrink-0">{getStatusBadge(req.status)}</div>
                    </div>

                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed h-8">
                      {req.description}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-slate-800 dark:text-slate-200 font-black">{req.budget.toLocaleString()} COINS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Platform: <span className="text-slate-800 dark:text-slate-250">{req.contact_platform || 'N/A'}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-2 right-4 text-[9px] font-black text-slate-350 dark:text-slate-650">
                    ID: {req.id.slice(0, 8)} • {new Date(req.created_at).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 2. NEW TASK REQUEST FORM SECTION */}
        <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-indigo-600" />
              </div>
              New Task Request Form
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Please enter your campaign requirements carefully. Our moderation team manually reviews every campaign submission within 24 hours.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error & Success Messages */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-2xl border border-rose-100 dark:border-rose-900/40 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm font-bold">{errorMsg}</div>
                </motion.div>
              )}

              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-3"
                >
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm font-bold">Awesome! Your task request has been successfully submitted and is pending review. You can track progress in the list above.</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5 text-left">
              
              {/* Task Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-[0.15em] ml-1 flex items-center gap-1">
                  Task Title <span className="text-rose-500 font-extrabold">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Subscribe to YouTube Channel & Comment"
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Task Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-[0.15em] ml-1 flex items-center gap-1">
                  Task Description <span className="text-rose-500 font-extrabold">*</span>
                </label>
                <textarea 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide step-by-step instructions for workers (what link to visit, what proof is required, e.g. screenshot of sub or email address)."
                  className="w-full min-h-[120px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>

              {/* Grid 1: Category & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-[0.15em] ml-1 flex items-center gap-1">
                    Task Category <span className="text-rose-500 font-extrabold">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-900"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="dark:bg-slate-900 font-bold">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-[0.15em] ml-1 flex items-center gap-1">
                    Budget Amount (Coins) <span className="text-rose-500 font-extrabold">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      min="100"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g., 5000"
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Grid 2: Contact Platform & Username */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-[0.15em] ml-1 flex items-center gap-1">
                    Contact Platform <span className="text-rose-500 font-extrabold">*</span>
                  </label>
                  <select
                    value={contactPlatform}
                    onChange={(e) => setContactPlatform(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-900"
                  >
                    {CONTACT_PLATFORMS.map((plat) => (
                      <option key={plat} value={plat} className="dark:bg-slate-900 font-bold">{plat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-[0.15em] ml-1 flex items-center gap-1">
                    Contact ID / Username / Link <span className="text-rose-500 font-extrabold">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g. +12345678 or @mytelegram_id"
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-[0.15em] ml-1">
                  Additional Notes (Optional)
                </label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any bonus information, promo codes or special target demographics..."
                  className="w-full min-h-[80px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* Submission triggers */}
            <div className="pt-4">
              <Button 
                variant="primary"
                type="submit" 
                className="w-full h-16 rounded-2xl font-black shadow-lg shadow-indigo-600/15 border-none flex items-center justify-center gap-2 text-base active:scale-95 cursor-pointer"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Submitting Task Campaign...' : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Task Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

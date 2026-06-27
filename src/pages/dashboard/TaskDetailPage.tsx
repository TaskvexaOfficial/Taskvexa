import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Clock, AlertCircle, Play, CheckCircle2, FileText, Image, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCompactNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cachedUserTasks, cachedProfile } = useStore();
  
  const [taskState, setTaskState] = useState<'details' | 'started' | 'submitting' | 'submitted'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskLink, setTaskLink] = useState('');
  const [message, setMessage] = useState('');
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  
  const cachedTask = cachedUserTasks?.find((t: any) => t.id === id);
  const [task, setTask] = useState<any>(cachedTask || null);
  const [isLoading, setIsLoading] = useState(!cachedTask);
  const [showDetailPageAlert, setShowDetailPageAlert] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    if (task && !alertDismissed) {
      const hasAlert = task.alert_message_roman_urdu || task.alert_message_urdu || task.alert_message_english;
      if (hasAlert) {
        setShowDetailPageAlert(true);
      }
    }
  }, [task, alertDismissed]);

  const youtubeId = task?.video_url ? (() => {
    const match = task.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  })() : null;

  // Scroll to top on page load and on state change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const scrollContainer = document.getElementById('dashboard-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [taskState, id]);

  const [submissionsCount, setSubmissionsCount] = useState<number>(0);

  useEffect(() => {
    async function loadTask() {
      setIsLoading(true);
      if (id) {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            task_categories ( name )
          `)
          .eq('id', id)
          .single();
          
        if (data) {
          setTask(data);
        }
      }
      setIsLoading(false);
    }
    loadTask();
  }, [id]);

  useEffect(() => {
    async function checkCompletions() {
      if (id && cachedProfile?.id) {
        const { data } = await supabase
          .from('task_submissions')
          .select('status')
          .eq('task_id', id)
          .eq('user_id', cachedProfile.id);
        
        if (data) {
          const approvedCount = data.filter(s => s.status === 'approved').length;
          const pendingCount = data.filter(s => s.status === 'pending').length;
          const rejectedCount = data.filter(s => s.status === 'rejected').length;
          const totalConsumed = approvedCount + pendingCount + Math.floor(rejectedCount / 2);
          setSubmissionsCount(totalConsumed);
        } else {
          setSubmissionsCount(0);
        }
      }
    }
    checkCompletions();
  }, [id, cachedProfile?.id]);

  // Claim System state and actions
  const [claimStatus, setClaimStatus] = useState<{
    isClaimedByMe: boolean;
    isClaimedByOther: boolean;
    expiresAt: string | null;
    message: string;
  }>({
    isClaimedByMe: false,
    isClaimedByOther: false,
    expiresAt: null,
    message: '',
  });

  const [isClaimChecking, setIsClaimChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Check active claim on load or refetch of task
  useEffect(() => {
    async function checkClaim() {
      if (!task || !task.claim_enabled || !cachedProfile?.id) return;
      
      const expiresAtDate = task.claim_expires_at ? new Date(task.claim_expires_at) : null;
      const now = new Date();
      const hasActiveClaim = task.current_claim_user_id && expiresAtDate && expiresAtDate > now;

      if (hasActiveClaim) {
        if (task.current_claim_user_id === cachedProfile.id) {
          setClaimStatus({
            isClaimedByMe: true,
            isClaimedByOther: false,
            expiresAt: task.claim_expires_at,
            message: 'Claim is active by you.'
          });
        } else {
          setClaimStatus({
            isClaimedByMe: false,
            isClaimedByOther: true,
            expiresAt: task.claim_expires_at,
            message: 'This task is currently being completed by another member.'
          });
        }
      } else {
        // No active claim or expired
        setClaimStatus({
          isClaimedByMe: false,
          isClaimedByOther: false,
          expiresAt: null,
          message: 'No active claim on this task.'
        });
      }
    }

    checkClaim();
  }, [task, cachedProfile?.id]);

  // Reservation countdown ticker
  useEffect(() => {
    if (!claimStatus.expiresAt) return;

    const calculateTimeLeft = () => {
      const difference = new Date(claimStatus.expiresAt!).getTime() - Date.now();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        if (claimStatus.isClaimedByMe) {
          alert('Your claim session has expired. This task is now unlocked for other users.');
          navigate('/dashboard/tasks');
        } else if (claimStatus.isClaimedByOther) {
          window.location.reload();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [claimStatus.expiresAt, claimStatus.isClaimedByMe, claimStatus.isClaimedByOther, navigate]);

  // Release claim on exit
  useEffect(() => {
    return () => {
      if (id && cachedProfile?.id && claimStatus.isClaimedByMe && task?.claim_enabled) {
        supabase.rpc('cancel_task_claim', {
          p_task_id: id,
          p_user_id: cachedProfile.id
        }).then(({ error }) => {
          if (error) console.error("Error releasing claim on exit:", error);
        });
      }
    };
  }, [id, cachedProfile?.id, claimStatus.isClaimedByMe, task?.claim_enabled]);

  const handleManualCancelClaim = async () => {
    if (!id || !cachedProfile?.id) return;
    const { error } = await supabase.rpc('cancel_task_claim', {
      p_task_id: id,
      p_user_id: cachedProfile.id
    });
    if (!error) {
      setClaimStatus({
        isClaimedByMe: false,
        isClaimedByOther: false,
        expiresAt: null,
        message: ''
      });
      navigate('/dashboard/tasks');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskLink && !message) {
      alert('Please provide proof.');
      return;
    }
    
    setIsSubmitting(true);
    if (!cachedProfile?.id) return;

    const { error } = await supabase
      .from('task_submissions')
      .insert([
        {
          task_id: id,
          user_id: cachedProfile.id,
          link: taskLink.trim() || null,
          message: message.trim() || null,
          status: 'pending'
        }
      ]);

      if (!error) {
         // handle claim winner increments and closures
         if (task?.claim_enabled) {
           const nextCount = (task.completed_count || 0) + 1;
           const newStatus = nextCount >= (task.max_winners || 1) ? 'closed' : task.status;
           
           await supabase.from('tasks').update({
             completed_count: nextCount,
             status: newStatus,
             current_claim_user_id: null,
             claim_started_at: null,
             claim_expires_at: null
           }).eq('id', id);
         }

         // increase pending tasks
         const { data: profile } = await supabase.from('profiles').select('total_tasks_pending').eq('id', cachedProfile.id).single();
         if (profile) {
             await supabase.from('profiles').update({ total_tasks_pending: (profile.total_tasks_pending || 0) + 1 }).eq('id', cachedProfile.id);
         }
         // Clear cached tasks to force reload and filter on the listing page
         useStore.getState().setCachedUserTasks([]);
      }

    setIsSubmitting(false);
    if (!error) {
      setTaskState('submitted');
    } else {
      if (error.message && error.message.includes('Task limit reached')) {
        alert('Task limit reached! All slots for this task are already occupied.');
      } else {
        alert('Error submitting task: ' + error.message);
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Task not found</h2>
        <Button onClick={() => navigate('/dashboard/tasks')} className="mt-6 border-none">Back to Tasks</Button>
      </div>
    );
  }

  if (task.status === 'inactive') {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Task Unavailable</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">This task has been paused or disabled by the administrator. Please check back later or explore other available tasks.</p>
        <Button variant="primary" onClick={() => navigate('/dashboard/tasks')} className="px-8 h-12 shadow-xl shadow-indigo-500/20">Explore Other Tasks</Button>
      </div>
    );
  }

  const isGlobalLimitReached = task.global_completion_limit !== undefined && 
                               task.global_completion_limit !== null && 
                               task.global_completion_limit > 0 && 
                               (task.occupied_slots || 0) >= task.global_completion_limit;

  if (isGlobalLimitReached) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Task Limit Reached</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">This task has reached its global completion limit. No more submissions are allowed at this time.</p>
        <Button variant="primary" onClick={() => navigate('/dashboard/tasks')} className="px-8 h-12 shadow-xl shadow-indigo-500/20">Explore Other Tasks</Button>
      </div>
    );
  }

  if (task.max_completions && submissionsCount >= task.max_completions) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Completion Limit Reached</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">You have already completed this task the maximum allowed number of times ({task.max_completions}). Great job!</p>
        <Button variant="primary" onClick={() => navigate('/dashboard/tasks')} className="px-8 h-12 shadow-xl shadow-indigo-500/20">Explore Other Tasks</Button>
      </div>
    );
  }

  if (task.claim_enabled && claimStatus.isClaimedByOther) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div className="bg-white dark:bg-slate-800 w-[92%] sm:w-full max-w-[350px] rounded-[24px] p-6 text-center shadow-2xl shadow-indigo-950/20 border border-slate-100 dark:border-slate-700/50">
          <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 animate-pulse">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Slot Currently Claimed</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-xs leading-relaxed font-bold">
            This task is currently being completed by another member. Please wait until the current claim expires.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-900/55 py-3 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 text-center">
            <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Available In</p>
            <p className="text-amber-700 dark:text-amber-400 font-mono font-black text-2xl mt-0.5 tracking-tight">
              {timeLeft > 0 ? `${formatTime(timeLeft)} remaining` : "Checking..."}
            </p>
          </div>

          {/* WhatsApp Broadcast Channel Card */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3.5 mb-5 text-left">
            <div className="flex gap-2.5 items-start">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">Daily Task Details</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                  Join our official WhatsApp channel to get daily task details, tips, and instant updates!
                </p>
                <a 
                  href="https://whatsapp.com/channel/0029Vb8U3toIHphBlB0llP47" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Join Channel Now
                  <span className="text-[9px]">→</span>
                </a>
              </div>
            </div>
          </div>
          
          <Button 
            variant="primary" 
            onClick={() => navigate('/dashboard/tasks')} 
            className="w-full h-11 rounded-xl shadow-md border-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider"
          >
            Back to Task Board
          </Button>
        </div>
      </div>
    );
  }

  if (task.claim_enabled && !claimStatus.isClaimedByMe && !claimStatus.isClaimedByOther) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[32px] p-8 md:p-10 text-center shadow-2xl shadow-black/20 border border-slate-100 dark:border-slate-700/50">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500 animate-pulse">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Claim Task</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed font-bold">
            You must complete this task within {task.claim_timer_minutes || 5} minutes. If you do not submit within the timer, the task will automatically become available to another member.
          </p>
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard/tasks')} 
              className="flex-1 h-12 rounded-[16px] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={async () => {
                if (!cachedProfile?.id) return;
                setIsClaimChecking(true);
                try {
                  const { data: claimData, error: claimErr } = await supabase.rpc('claim_task', {
                    p_task_id: task.id,
                    p_user_id: cachedProfile.id,
                    p_timer_minutes: task.claim_timer_minutes || 5
                  });

                  if (claimErr) {
                    alert("Error claiming task: " + claimErr.message);
                  } else if (claimData && claimData.length > 0) {
                    const result = claimData[0];
                    if (result.success) {
                      setClaimStatus({
                        isClaimedByMe: true,
                        isClaimedByOther: false,
                        expiresAt: result.claim_expires_at,
                        message: result.message
                      });
                      // Refresh task to update details
                      const { data: updatedTask } = await supabase.from('tasks').select('*, task_categories(name)').eq('id', task.id).single();
                      if (updatedTask) setTask(updatedTask);
                    } else {
                      alert(result.message || "Claim attempt failed.");
                      window.location.reload();
                    }
                  }
                } catch (err) {
                  console.error("Manual detail page claim failed:", err);
                } finally {
                  setIsClaimChecking(false);
                }
              }} 
              isLoading={isClaimChecking}
              className="flex-1 h-12 rounded-[16px] shadow-lg shadow-indigo-500/10 border-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Claim Task
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const rules = task.mistakes_to_avoid ? task.mistakes_to_avoid.split('\n').filter((r:string) => r.trim() !== '') : [];

  return (
    <div className="w-full pb-12">
      <div className="flex items-center justify-between px-2 mb-8">
        <Link to="/dashboard/tasks" className="p-3 border-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[16px] transition-all group">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none px-3 py-1.5 sm:px-4 sm:py-2 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] shrink-0 truncate max-w-[120px] sm:max-w-none">{task.task_categories?.name || 'Task'}</Badge>
          <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-xs sm:text-sm rounded-full border border-indigo-100 dark:border-indigo-500/20 shadow-sm flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="shrink-0">+</span>
            <span className="shrink-0">{formatCompactNumber(task.coins || 0)}</span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-indigo-400 shrink-0">Coins</span>
          </div>
        </div>
      </div>

      <div className="px-2">
        {taskState === 'details' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 max-w-2xl mx-auto"
          >
            {/* Centered Image/Logo and Name */}
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="w-32 h-32 rounded-[32px] bg-white dark:bg-slate-800 border-none flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-6xl shadow-2xl shadow-indigo-600/10 relative overflow-hidden">
                  <div className="absolute inset-0 rounded-[32px] border border-slate-100 dark:border-slate-700/50"></div>
                  {task.image_url ? (
                    <img src={task.image_url} alt={task.title} className="w-full h-full object-cover" />
                  ) : (
                    task.title[0]
                  )}
               </div>
               <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight px-4">{task.title}</h1>
               </div>
            </div>

            <div className="space-y-6 pt-10">
               {task.claim_enabled && claimStatus.isClaimedByMe && timeLeft > 0 && (
                 <div className="bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 p-4 rounded-2xl border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold text-sm w-full relative z-10">
                   <span className="flex items-center gap-2">
                     <Clock className="w-4 h-4 animate-pulse shrink-0" />
                     Your slot is reserved! Complete and submit before timeout.
                   </span>
                   <div className="flex items-center gap-3 shrink-0">
                     <span className="font-mono bg-amber-500/15 dark:bg-amber-400/10 px-3 py-1.5 rounded-xl tracking-wider text-amber-700 dark:text-amber-400 font-extrabold text-base border border-amber-400/20">
                       {formatTime(timeLeft)}
                     </span>
                     <button 
                       type="button"
                       onClick={handleManualCancelClaim}
                       className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/10 transition-all cursor-pointer"
                     >
                       Cancel Claim
                     </button>
                   </div>
                 </div>
               )}
               <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-700/50 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors duration-700 pointer-events-none"></div>
                 <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-500/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Task Instructions</h3>
                 </div>
                 <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium relative z-10 whitespace-pre-wrap">
                   {task.instructions?.split(/(https?:\/\/[^\s]+)/g).map((part: string, index: number) => 
                      part.match(/(https?:\/\/[^\s]+)/g) ? (
                        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-words">
                          {part}
                        </a>
                      ) : part
                    )}
                 </p>
               </div>

               {rules.length > 0 && (
                 <div className="bg-rose-50 dark:bg-rose-500/5 p-8 rounded-[32px] border border-rose-100 dark:border-rose-500/10 shadow-sm relative overflow-hidden">
                   <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black text-rose-900 dark:text-rose-400 tracking-tight">Mistakes to Avoid</h3>
                   </div>
                   <ul className="space-y-4 relative z-10">
                     {rules.map((rule:string, i:number) => (
                       <li key={i} className="flex gap-4 items-start">
                         <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0 mt-1.5 shadow-[0_0_12px_rgba(251,113,133,0.6)]"></span>
                         <span className="text-rose-800 dark:text-rose-300 font-medium text-sm leading-relaxed">{rule}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
            </div>

            <Button 
              onClick={() => setTaskState('started')}
              variant="primary"
              className="w-full h-16 text-lg rounded-[24px] shadow-xl shadow-indigo-600/20 transition-all font-black border-none mt-10 hover:-translate-y-1" 
            >
              Start Task Now
            </Button>
          </motion.div>
        )}

        {(taskState === 'started' || taskState === 'submitting' || taskState === 'submitted') && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-3xl mx-auto"
          >
            {task.claim_enabled && claimStatus.isClaimedByMe && timeLeft > 0 && taskState !== 'submitted' && (
              <div className="bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 p-4 rounded-2xl border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold text-sm w-full relative z-10">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-pulse shrink-0" />
                  Your claim reservation is active. Submit before timer hits zero!
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono bg-amber-500/15 dark:bg-amber-400/10 px-3 py-1.5 rounded-xl tracking-wider text-amber-700 dark:text-amber-400 font-extrabold text-base border border-amber-400/20">
                    {formatTime(timeLeft)}
                  </span>
                  <button 
                    type="button"
                    onClick={handleManualCancelClaim}
                    className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-455 dark:hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/10 transition-all cursor-pointer"
                  >
                    Cancel Claim
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-5 mb-8">
               <div className="w-16 h-16 rounded-[20px] bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-3xl shadow-lg shadow-indigo-600/10 shrink-0 border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                  {task.image_url ? (
                    <img src={task.image_url} alt={task.title} className="w-full h-full object-cover" />
                  ) : (
                    task.title[0]
                  )}
               </div>
               <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{task.title}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 tracking-tight">Follow instructions carefully and submit proof below.</p>
               </div>
            </div>

            {/* Tutorial Video Section */}
            {task.video_url && (
              <div className="rounded-[32px] overflow-hidden bg-slate-900 aspect-video shadow-2xl relative group w-full border border-slate-800/50 ring-4 ring-slate-100/50 dark:ring-slate-800/50">
                {youtubeId && !isIframeLoaded && (
                  <div className="absolute inset-0 w-full h-full z-10 flex flex-col items-center justify-center bg-slate-950">
                    <img 
                      src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} 
                      alt="Video Thumbnail" 
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-80" 
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>
                    {/* Centered Play Button overlay */}
                    <div className="relative w-16 h-16 bg-red-650 dark:bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-20">
                      <Play className="w-8 h-8 fill-current translate-x-0.5" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-center z-20">
                      <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        Loading Video Player...
                      </span>
                    </div>
                  </div>
                )}
                <iframe 
                  className={cn(
                    "w-full h-full transition-opacity duration-300",
                    isIframeLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setIsIframeLoaded(true)}
                  src={(() => {
                    let url = task.video_url;
                    if (!url) return '';
                    
                    try {
                      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
                      if (match && match[1]) {
                        return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
                      }
                    } catch (e) {
                      return url;
                    }
                    
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                      return 'https://' + url;
                    }
                    return url;
                  })()} 
                  title="Tutorial" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-700/50 rounded-full blur-[80px] -mr-20 -mt-20"></div>
               <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                     <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Active Task Instructions</h3>
               </div>
               <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-10 relative z-10 whitespace-pre-wrap">
                 {task.instructions?.split(/(https?:\/\/[^\s]+)/g).map((part: string, index: number) => 
                    part.match(/(https?:\/\/[^\s]+)/g) ? (
                      <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-words">
                        {part}
                      </a>
                    ) : part
                  )}
               </p>

               {rules.length > 0 && (
                 <div className="bg-rose-50 dark:bg-rose-500/5 p-6 rounded-[24px] border border-rose-100 dark:border-rose-500/10 mb-10 relative z-10">
                   <h4 className="text-[10px] font-black text-rose-900 dark:text-rose-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Reminder
                   </h4>
                   <ul className="space-y-3">
                     {rules.map((rule:string, i:number) => (
                       <li key={i} className="flex gap-3 items-start">
                         <span className="text-rose-500 font-black mt-0.5">•</span>
                         <span className="text-rose-800 dark:text-rose-300 font-medium text-sm leading-relaxed">{rule}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               )}

                <Button 
                  onClick={() => setTaskState('submitting')}
                  className="w-full h-16 text-base bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-[24px] shadow-2xl transition-all font-black border-none relative z-10 hover:-translate-y-1" 
                >
                  Confirm & Submit Task
                </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Submit Popup Modal */}
      <AnimatePresence>
        {(taskState === 'submitting' || taskState === 'submitted') && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 md:p-10 shadow-2xl shadow-black/20 border border-slate-100 dark:border-slate-700/50 relative overflow-hidden"
            >
               {taskState === 'submitting' && (
                 <>
                   <button onClick={() => setTaskState('started')} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 sm:p-2.5 rounded-full transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                   </button>
                   <div className="mb-4 sm:mb-6">
                     <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 border border-indigo-100 dark:border-indigo-500/20">
                        <Image className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
                     </div>
                     <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Submit Proof</h3>
                     <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Provide evidence for automated verification.</p>
                   </div>
                   
                   <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Proof Link (Required)</label>
                        <input 
                          type="url" 
                          required 
                          value={taskLink}
                          onChange={(e) => setTaskLink(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[14px] sm:rounded-[20px] py-2.5 px-4 sm:py-3.5 sm:px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 font-bold text-sm sm:text-base text-slate-900 dark:text-white shadow-inner"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Notes (Optional)</label>
                        <textarea 
                          rows={2}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Add any extra information..."
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[14px] sm:rounded-[20px] py-2.5 px-4 sm:py-3.5 sm:px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 font-medium text-sm sm:text-base text-slate-900 dark:text-white shadow-inner resize-none"
                        />
                      </div>
                      <Button 
                        variant="primary"
                        type="submit" 
                        className="w-full h-11 sm:h-14 md:h-16 text-sm sm:text-base rounded-[14px] sm:rounded-[20px] shadow-xl shadow-indigo-600/20 transition-all font-black border-none mt-2 hover:-translate-y-0.5" 
                        isLoading={isSubmitting}
                      >
                        Submit for Verification
                      </Button>
                   </form>
                 </>
               )}

               {taskState === 'submitted' && (
                 <div className="text-center space-y-4 sm:space-y-6 py-2 sm:py-4">
                   <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl sm:rounded-[28px] flex items-center justify-center mx-auto text-emerald-500 shadow-xl shadow-emerald-500/10 relative rotate-[-10deg]">
                     <div className="absolute inset-0 border-[4px] border-emerald-100 dark:border-emerald-500/20 rounded-2xl sm:rounded-[28px] animate-ping opacity-20"></div>
                     <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 rotate-[10deg]" />
                   </div>
                   <div className="space-y-1.5">
                     <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Thank You!</h3>
                     <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium px-2 sm:px-4 leading-relaxed">
                       Your submission has been securely logged and is pending review.
                     </p>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-900/50 py-3 px-4 sm:py-4 sm:px-6 rounded-xl sm:rounded-[20px] border-none inline-block min-w-[160px] sm:min-w-[200px] shadow-inner">
                      <p className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Estimated Approval</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg sm:text-2xl mt-0.5 tracking-tight">12 - 24 Hrs</p>
                   </div>
                   <Button 
                     onClick={() => navigate('/dashboard/tasks')}
                     className="w-full h-11 sm:h-14 md:h-16 text-sm sm:text-base bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-[14px] sm:rounded-[20px] shadow-xl transition-all font-black border-none mt-2" 
                   >
                     Back to Tasks
                   </Button>
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showDetailPageAlert && task && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col relative max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="text-xl text-rose-500 font-extrabold animate-pulse">⚠</span>
                <h3 className="text-lg font-black text-rose-600 dark:text-rose-400">Important Message</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowDetailPageAlert(false);
                  setAlertDismissed(true);
                }} 
                className="w-10 h-10 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <TaskAlertPopupContent 
              task={task} 
              onClose={() => {
                setShowDetailPageAlert(false);
                setAlertDismissed(true);
              }} 
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Separate component for task alert popup inner contents to manage select state seamlessly
function TaskAlertPopupContent({ task, onClose }: { task: any; onClose: () => void }) {
  const [selectedLanguage, setSelectedLanguage] = useState<'roman_urdu' | 'urdu' | 'english'>('roman_urdu');

  const getActiveMessage = () => {
    if (selectedLanguage === 'urdu') {
      return task.alert_message_urdu || task.alert_message_roman_urdu || task.alert_message_english || '';
    }
    if (selectedLanguage === 'english') {
      return task.alert_message_english || task.alert_message_roman_urdu || task.alert_message_urdu || '';
    }
    return task.alert_message_roman_urdu || task.alert_message_english || task.alert_message_urdu || '';
  };

  const currentMessage = getActiveMessage();
  const isUrduFont = selectedLanguage === 'urdu';

  return (
    <div className="p-6 space-y-5 overflow-y-auto flex-1 flex flex-col text-left">
      {/* Dropdown for languages */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Select Language / زبان منتخب کریں</span>
        <select 
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as any)}
          className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
        >
          <option value="roman_urdu">Roman Urdu (Default)</option>
          <option value="urdu">Urdu (اردو)</option>
          <option value="english">English</option>
        </select>
      </div>

      {/* Message Box */}
      <div 
        className={cn(
          "p-6 rounded-2xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/20 dark:bg-rose-950/5 text-slate-800 dark:text-slate-200 font-bold whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto min-h-[140px] shadow-inner",
          isUrduFont ? "text-right font-medium text-lg leading-loose" : "text-left text-sm"
        )}
        dir={isUrduFont ? "rtl" : "ltr"}
      >
        {currentMessage ? currentMessage : (
          <span className="text-slate-400 dark:text-slate-500 italic font-medium">No warning message in this language.</span>
        )}
      </div>

      {/* Action button */}
      <div className="pt-2">
        <Button 
          variant="primary" 
          onClick={onClose} 
          className="w-full h-12 rounded-xl shadow-lg shadow-indigo-600/10 border-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider"
        >
          Proceed / آگے بڑھیں
        </Button>
      </div>
    </div>
  );
}

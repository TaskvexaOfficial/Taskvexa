import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, Clock, AlertCircle, Play, CheckCircle2, 
  FileText, Image as ImageIcon, ExternalLink, Globe, Code, X, PlayCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCompactNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

interface HtmlCodeRendererProps {
  code: string;
}

function HtmlCodeRenderer({ code }: HtmlCodeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !code) return;

    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create a shadow document to parse the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'text/html');
    
    // Find all script tags anywhere inside the parsed HTML
    const scriptNodes = Array.from(doc.querySelectorAll('script'));
    
    // Remove scripts from the document tree to prevent static/duplicate evaluation issues
    scriptNodes.forEach((s) => s.parentNode?.removeChild(s));
    
    // Move remaining styled element and structure nodes (banners, iframes, etc.) to container
    Array.from(doc.body.childNodes).forEach((node) => {
      const cloned = node.cloneNode(true);
      containerRef.current?.appendChild(cloned);
    });

    // Track dynamic scripts for clean-up
    const appendedScripts: HTMLScriptElement[] = [];

    // Run scripts in order so options variables get set correctly before external scripts run
    const executeScripts = async () => {
      for (const script of scriptNodes) {
        await new Promise<void>((resolve) => {
          const newScript = document.createElement('script');
          
          // Copy all attributes
          Array.from(script.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          // Set script content
          if (script.innerHTML) {
            newScript.innerHTML = script.innerHTML;
          } else if (script.textContent) {
            newScript.textContent = script.textContent;
          }

          if (script.src) {
            newScript.onload = () => resolve();
            newScript.onerror = () => resolve();
            document.body.appendChild(newScript);
            appendedScripts.push(newScript);
            // Safety timeout of 2000ms if script is blocked or network times out
            setTimeout(resolve, 2000);
          } else {
            document.body.appendChild(newScript);
            appendedScripts.push(newScript);
            // Non-deferred micro-pause
            setTimeout(resolve, 50);
          }
        });
      }
    };

    executeScripts();

    return () => {
      // Clean up appended dynamic scripts
      appendedScripts.forEach((s) => {
        try {
          if (document.body.contains(s)) {
            document.body.removeChild(s);
          }
        } catch (e) {
          console.error('Error cleaning up script tag:', e);
        }
      });
    };
  }, [code]);

  return (
    <div 
      ref={containerRef} 
      className="w-full text-left text-xs bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-auto"
      style={{ minHeight: '100px', maxHeight: '350px' }}
      id="html-paste-container"
    />
  );
}

export default function DynamicTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cachedProfile } = useStore();
  
  const [taskState, setTaskState] = useState<'details' | 'started' | 'action' | 'submitting' | 'submitted'>('details');
  const [sessionStatus, setSessionStatus] = useState<'pending' | 'viewing' | 'verified' | 'claimed'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskLink, setTaskLink] = useState('');
  const [message, setMessage] = useState('');
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isHtmlLoaded, setIsHtmlLoaded] = useState(false);
  
  // Anti-cheat state for new_tab direct links
  const [adState, setAdState] = useState<'idle' | 'clicked' | 'waiting_return' | 'failed' | 'passed'>('idle');
  const [adError, setAdError] = useState('');
  const adOpenedAtRef = useRef<number>(0);

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const youtubeId = task?.video_url ? (() => {
    const match = task.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  })() : null;

  // New Popup validation states
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [actionError, setActionError] = useState('');
  const backgroundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Timer states
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isIframeOpen, setIsIframeOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset scroll to top on step transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    document.documentElement.scrollTo({ top: 0, behavior: 'instant' as any });
    document.body.scrollTo({ top: 0, behavior: 'instant' as any });
    const scrollContainers = document.querySelectorAll('.overflow-y-auto, [class*="overflow-y-scroll"]');
    scrollContainers.forEach(container => {
      container.scrollTo({ top: 0, behavior: 'instant' as any });
    });
  }, [taskState, isIframeOpen, id]);

  // Reset/Prevent stale verification data from previous completed/unclaimed sessions
  useEffect(() => {
    if (!id) return;
    console.log(`[Timer-DEBUG] Initializing fresh session for task ID: ${id}`);
    localStorage.removeItem(`task_click_time_${id}`);
    localStorage.removeItem(`task_session_status_${id}`);
    setSessionStatus('pending');
    setTimerState('idle');
    setTimerCompleted(false);
    setActionError('');
    setIsHtmlLoaded(false);
  }, [id]);

  // Load Task
  useEffect(() => {
    async function loadTask() {
      setIsLoading(true);
      if (id) {
        const { data, error } = await supabase
          .from('dynamic_tasks')
          .select('*')
          .eq('id', id)
          .single();
          
        if (data) {
          setTask(data);

          let currentUserId = cachedProfile?.id;
          if (!currentUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              currentUserId = user.id;
            }
          }

          if (currentUserId) {
            // Check if user has already met completion limit within the task's CURRENT cycle
            const currentCycle = data.current_cycle || 1;
            let subsData = null;
            const { data: withCycle, error: cylErr } = await supabase
              .from('dynamic_task_submissions')
              .select('id, status, cycle')
              .eq('task_id', id)
              .eq('user_id', currentUserId)
              .eq('cycle', currentCycle);
              
            if (cylErr && (cylErr.code === 'PGRST100' || cylErr.message?.includes('column') || cylErr.message?.includes('does not exist'))) {
              const { data: withoutCycle } = await supabase
                .from('dynamic_task_submissions')
                .select('id, status')
                .eq('task_id', id)
                .eq('user_id', currentUserId);
              subsData = withoutCycle;
            } else {
              subsData = withCycle;
            }

            if (subsData) {
              const limit = data.complete_limit !== undefined && data.complete_limit !== null ? data.complete_limit : 1;
              const approvedCount = subsData.filter(s => s.status === 'approved').length;
              const pendingCount = subsData.filter(s => s.status === 'pending').length;
              const rejectedCount = subsData.filter(s => s.status === 'rejected').length;
              const totalConsumed = approvedCount + pendingCount + Math.floor(rejectedCount / 2);
              if (totalConsumed >= limit) {
                alert('You have already completed this task the maximum number of times allowed in the current cycle!');
                navigate('/dashboard/tasks');
                return;
              }
            }
          }

          if (data.timer_enabled) {
            setTimerLeft(data.timer_seconds || 30);
          } else {
            setTimerCompleted(true);
          }
        } else {
          console.error(error);
        }
      }
      setIsLoading(false);
    }
    loadTask();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, cachedProfile?.id, navigate]);

  // Robust, Visibility-Aware Unified Timestamp Timer system
  useEffect(() => {
    if (taskState !== 'action' || !task || !id) return;

    const syncTimerState = () => {
      // If timer is disabled, make sure they are instantly verified
      if (!task.timer_enabled || task.timer_seconds <= 0) {
        setTimerLeft(0);
        setTimerCompleted(true);
        setTimerState('completed');
        setSessionStatus('verified');
        localStorage.setItem(`task_session_status_${id}`, 'verified');
        setActionError('');
        return;
      }

      const startTimeStr = localStorage.getItem(`task_click_time_${id}`);
      if (!startTimeStr) {
        // They haven't clicked yet! Start with "Click to View" state
        setTimerLeft(task.timer_seconds);
        setTimerCompleted(false);
        setTimerState('idle');
        setSessionStatus('pending');
        setActionError('');
        return;
      }

      const startTime = parseInt(startTimeStr, 10);
      const required = task.timer_seconds;
      const actual_duration = Math.floor((Date.now() - startTime) / 1000);

      console.log(`[Timer-DEBUG] syncTimerState: startTime=${startTime}, actual_duration=${actual_duration}s, required=${required}s, visibility=${document.visibilityState}`);

      if (actual_duration >= required) {
        // Stayed on advertiser page long enough! Focus back allows claiming reward
        setTimerLeft(0);
        setTimerCompleted(true);
        setTimerState('completed');
        setSessionStatus('verified');
        localStorage.setItem(`task_session_status_${id}`, 'verified');
        setActionError('');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // They returned BEFORE completing the required viewing duration!
        if (document.visibilityState === 'visible') {
          // If they are looking at our website, the timer must NOT continue running on the task popup!
          // We immediately mark verification as failed and pause/stop the timer.
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setTimerCompleted(false);
          setTimerState('paused');
          setSessionStatus('viewing');
          setTimerLeft(required - actual_duration);
          setActionError(`You returned before the required waiting time. Please click 'Click to View' again and wait until the timer completes.`);
        } else {
          // They are currently hidden (i.e. away on the advertiser page or on the newly opened tab).
          // We can let it remain in 'running' state and calculate how much time they have left
          setTimerLeft(required - actual_duration);
          setTimerCompleted(false);
          setTimerState('running');
          setSessionStatus('viewing');
        }
      }
    };

    // Run synchronization immediately
    syncTimerState();

    // Setup visibility and focus event handlers
    const handleFocusCheck = () => {
      console.log('[Timer-DEBUG] focus / visibilitychange triggered. Re-synchronizing...');
      syncTimerState();
    };

    document.addEventListener('visibilitychange', handleFocusCheck);
    window.addEventListener('focus', handleFocusCheck);

    return () => {
      document.removeEventListener('visibilitychange', handleFocusCheck);
      window.removeEventListener('focus', handleFocusCheck);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [taskState, task, id]);

  // Cleanup timers on destroy
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleStartTask = () => {
    setTaskState('started');
  };

  const handleContinueTask = () => {
    setTaskState('action');
    setTimerState('idle');
    setTimerCompleted(false);
    setActionError('');
    setSessionStatus('pending');
    
    if (task?.timer_enabled && task?.timer_seconds > 0) {
      const startTimeStr = localStorage.getItem(`task_click_time_${id}`);
      if (startTimeStr) {
        const startTime = parseInt(startTimeStr, 10);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed < task.timer_seconds) {
          setTimerLeft(task.timer_seconds - elapsed);
          setTimerState('paused');
          setSessionStatus('viewing');
          setActionError(`Verification Failed! You returned before completing the required viewing time. Please visit the advertiser page again and stay for the full duration.`);
          return;
        } else {
          setTimerLeft(0);
          setTimerCompleted(true);
          setTimerState('completed');
          setSessionStatus('verified');
          return;
        }
      }
      setTimerLeft(task.timer_seconds);
    } else {
      setTimerCompleted(true);
      setTimerState('completed');
      setSessionStatus('verified');
    }
  };

  const handleLaunchButton = () => {
    setActionError('');
    if (!id || !task) return;

    // Open in a new tab - for html, open our custom API route that serves the raw HTML
    if (task.website_link_type !== 'html') {
      window.open(task.website_link, '_blank');
    } else {
      window.open(`/api/dynamic-tasks/${id}/html`, '_blank');
    }
    
    if (task.timer_enabled && task.timer_seconds > 0) {
      const clickTime = Date.now();
      localStorage.setItem(`task_click_time_${id}`, clickTime.toString());
      localStorage.setItem(`task_session_status_${id}`, 'viewing');
      
      setTimerState('running');
      setTimerLeft(task.timer_seconds);
      setTimerCompleted(false);
      setSessionStatus('viewing');

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        // Only tick/update when tab is hidden. If it becomes visible or is html type, execute normally.
        if (document.visibilityState === 'visible') {
          const startTimeStr = localStorage.getItem(`task_click_time_${id}`);
          if (startTimeStr) {
            const startTime = parseInt(startTimeStr, 10);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            if (elapsed < task.timer_seconds) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setTimerState('paused');
              setTimerCompleted(false);
              setSessionStatus('viewing');
              setTimerLeft(task.timer_seconds - elapsed);
              setActionError(`You returned before the required waiting time. Please click 'Click to View' again and wait until the timer completes.`);
            } else {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setTimerLeft(0);
              setTimerCompleted(true);
              setTimerState('completed');
              setSessionStatus('verified');
              localStorage.setItem(`task_session_status_${id}`, 'verified');
              setActionError('');
            }
          }
          return;
        }

        // Ticking down when tab is hidden
        const startTimeStr = localStorage.getItem(`task_click_time_${id}`);
        if (startTimeStr) {
          const startTime = parseInt(startTimeStr, 10);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, task.timer_seconds - elapsed);
          setTimerLeft(remaining);
          if (remaining === 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setTimerCompleted(true);
            setTimerState('completed');
            setSessionStatus('verified');
            localStorage.setItem(`task_session_status_${id}`, 'verified');
          }
        }
      }, 500);
    } else {
      setTimerCompleted(true);
      setTimerState('completed');
      setSessionStatus('verified');
      localStorage.setItem(`task_session_status_${id}`, 'verified');
    }
  };

  const handleFinishAction = async () => {
    if (!id || !task) return;

    // Strict Double Check duration spent in seconds to prevent custom UI bypasses:
    if (task.timer_enabled && task.timer_seconds > 0) {
      const startTimeStr = localStorage.getItem(`task_click_time_${id}`);
      if (!startTimeStr) {
        setActionError(`Please click "Click to View" to visit the sponsor site first to activate the timer.`);
        setTimerState('paused');
        setSessionStatus('pending');
        return;
      }

      const clickTime = parseInt(startTimeStr, 10);
      const returnTime = Date.now();
      const durationInSeconds = (returnTime - clickTime) / 1000;

      console.log(`[Timer-DEBUG] handleFinishAction clickTime: ${clickTime}, returnTime: ${returnTime}, duration: ${durationInSeconds}s, required: ${task.timer_seconds}s`);

      if (durationInSeconds < task.timer_seconds) {
        const remaining = Math.ceil(task.timer_seconds - durationInSeconds);
        setActionError(`You returned before the required waiting time. Please click 'Click to View' again and wait until the timer completes.`);
        setTimerLeft(remaining);
        setTimerCompleted(false);
        setTimerState('paused');
        setSessionStatus('viewing');
        return;
      }
    }

    setSessionStatus('verified');
    localStorage.setItem(`task_session_status_${id}`, 'verified');

    if (task.submit_type === 'off') {
      await handleAutoCredit();
    } else {
      setTaskState('submitting');
    }
  };

  // Direct Auto Credit Implementation
  const handleAutoCredit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!cachedProfile?.id) {
      alert('Authentication error. Please re-login.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert('Active session not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/tasks/claim-dynamic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId: id
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Server error claiming reward.');
      }

      // Sync the Client Zustand State
      if (result.profile) {
        useStore.getState().setCachedProfile(result.profile);
      } else {
        // Fallback sync
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cachedProfile.id)
          .single();

        if (updatedProfile) {
          useStore.getState().setCachedProfile(updatedProfile);
        }
      }

      // Clear cached tasks to force reload and filter on the listing page
      useStore.getState().setCachedUserTasks([]);

      // Reset and clear all task session verification state completely!
      localStorage.removeItem(`task_click_time_${id}`);
      localStorage.removeItem(`task_session_status_${id}`);
      setSessionStatus('claimed');
      setTimerCompleted(false);
      setTimerState('idle');

      setTaskState('submitted');
    } catch (err: any) {
      console.error(err);
      alert('Error finalizing auto reward payout: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Standard Proof Form submission logic (Pends Admin approval or Auto-approves if secret code matches)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check validation based on setup type
    if (task.submit_type === 'link' && !taskLink.trim()) {
      alert('Please provide a valid action website proof link.');
      return;
    }
    if (task.submit_type === 'message' && !message.trim()) {
      alert('Please provide comment proof information.');
      return;
    }
    if (task.submit_type === 'link_message' && (!taskLink.trim() || !message.trim())) {
      alert('Please fill both Link and Note proof details.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!cachedProfile?.id) {
      alert('Authentication error. Please re-login.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert('Authentication error. Please re-login.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/tasks/claim-dynamic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId: id,
          taskLink: task.submit_type === 'link' || task.submit_type === 'link_message' ? taskLink.trim() : null,
          message: task.submit_type === 'message' || task.submit_type === 'link_message' ? message.trim() : null
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error processing claim.');
      }

      // Sync the Client Zustand State
      if (result.profile) {
        useStore.getState().setCachedProfile(result.profile);
      } else {
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cachedProfile.id)
          .single();

        if (updatedProfile) {
          useStore.getState().setCachedProfile(updatedProfile);
        }
      }

      // Clear cached tasks to force reload and filter on the listing page
      useStore.getState().setCachedUserTasks([]);

      // Reset and clear all task session verification state completely!
      localStorage.removeItem(`task_click_time_${id}`);
      localStorage.removeItem(`task_session_status_${id}`);
      setSessionStatus('claimed');
      setTimerCompleted(false);
      setTimerState('idle');

      setTaskState('submitted');
    } catch (err: any) {
      console.error(err);
      alert('Error completing task submission: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Dynamic Task not found</h2>
        <Button onClick={() => navigate('/dashboard/tasks')} className="mt-6 border-none">Back to Tasks</Button>
      </div>
    );
  }

  // (Action state handled in beautiful modal pop-up instead of full screen)

  return (
    <div className="w-full pb-12">
      {/* Top Header Controls bar */}
      <div className="flex items-center justify-between px-2 mb-8 gap-4">
        <Link to="/dashboard/tasks" className="p-3 border-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[16px] transition-all group shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none px-3 py-1.5 sm:px-4 sm:py-2 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] shrink-0 truncate">Dynamic Task</Badge>
          <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-black text-xs sm:text-sm rounded-full border border-indigo-100 dark:border-indigo-500/20 shadow-sm flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="shrink-0">+</span>
            <span className="shrink-0">{formatCompactNumber(task.coins || 0)}</span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-indigo-400 shrink-0">Coins</span>
          </div>
        </div>
      </div>

      <div className="px-2">
        {/* ==================== VIEW 1: DETAILS PANEL ==================== */}
        {taskState === 'details' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="space-y-10 max-w-2xl mx-auto"
          >
            {/* Logo at the Top */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-28 h-28 rounded-[32px] bg-white dark:bg-slate-800 border-none flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-5xl shadow-2xl shadow-indigo-600/10 relative overflow-hidden">
                <div className="absolute inset-0 rounded-[32px] border border-slate-100 dark:border-slate-700/50"></div>
                {task.logo_url ? (
                  <img src={task.logo_url} alt={task.name} className="w-full h-full object-cover" />
                ) : (
                  task.name[0]
                )}
              </div>
              
              {/* Name below Logo */}
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight px-4">{task.name}</h1>
                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/20 px-4 py-1.5 rounded-full inline-block">
                  Earn {formatCompactNumber(task.coins)} coins {task.submit_type === 'off' ? 'Instantly' : 'upon approval'}
                </p>
              </div>
            </div>

            {/* Description below Name */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Campaign Brief</h3>
              </div>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap">
                {(task.description || 'Follow standard step-by-step interactive flows to qualify for coins reward.').split(/(https?:\/\/[^\s]+)/g).map((part: string, index: number) => 
                  part.match(/(https?:\/\/[^\s]+)/g) ? (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-words">
                      {part}
                    </a>
                  ) : part
                )}
              </p>
              {task.timer_enabled && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-950/40 w-fit">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Requires staying active on client site for {task.timer_seconds} seconds.</span>
                </div>
              )}
            </div>

            {/* Start Task Button at the very bottom */}
            <Button 
              onClick={handleStartTask}
              variant="primary"
              className="w-full h-16 text-lg rounded-[24px] shadow-xl shadow-indigo-600/20 transition-all font-black border-none mt-10 hover:-translate-y-0.5 cursor-pointer" 
            >
              Start Task
            </Button>
          </motion.div>
        )}

        {/* ==================== VIEW 2: STARTED / TUTORIAL PANEL ==================== */}
        {taskState === 'started' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-2xl mx-auto"
          >
            <div className="text-center space-y-2 mb-6">
              <span className="text-xs font-black uppercase text-indigo-600 tracking-widest">Step 2: Tutorial Guideline</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Learn to complete perfectly</h2>
            </div>

            {/* Tutorial Video at the Top of block */}
            {task.video_url ? (
              <div className="rounded-[32px] overflow-hidden bg-slate-900 aspect-video shadow-2xl relative group w-full border border-slate-800/10 ring-4 ring-slate-100/50 dark:ring-slate-800/50">
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
                    <div className="relative w-16 h-16 bg-red-655 dark:bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-20">
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
                  title="Tutorial Video Guideline" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] text-center border border-dashed border-slate-150 flex flex-col items-center">
                <PlayCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-bold text-slate-400">No tutorial video included for this campaign.</p>
              </div>
            )}

            {/* Instructions below Video */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50 shadow-lg space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Completion Instructions:</span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold whitespace-pre-wrap">
                {(task.description || 'Carefully finish all actions configured on the advertiser web app link. Once finished, submit proof screenshot or comments to earn your cash coins.').split(/(https?:\/\/[^\s]+)/g).map((part: string, index: number) => 
                  part.match(/(https?:\/\/[^\s]+)/g) ? (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-words">
                      {part}
                    </a>
                  ) : part
                )}
              </p>
            </div>

            {/* Continue Task Button at the bottom */}
            <Button 
              onClick={handleContinueTask}
              className="w-full h-16 text-lg rounded-[24px] shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black border-none mt-6 cursor-pointer"
            >
              Continue Task
            </Button>
          </motion.div>
        )}
      </div>

      {/* ==================== SUBMIT PROOF SPECIFIC MODAL OVERLAY ==================== */}
      <AnimatePresence>
        {(taskState === 'submitting' || taskState === 'submitted') && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-850 w-full max-w-md rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 md:p-10 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
            >
              {taskState === 'submitting' && (
                <>
                  <button 
                    onClick={() => setTaskState('action')} 
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-800 p-2 sm:p-2.5 rounded-full border-none cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 border border-indigo-100">
                      <ImageIcon className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Submit Evidence</h3>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Fields set by advertiser</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    {(task.submit_type === 'link' || task.submit_type === 'link_message') && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] sm:text-xs font-black uppercase text-slate-500 dark:text-slate-355 tracking-wide">Completion Proof Link URL *</label>
                        <input 
                          type="url" 
                          required
                          value={taskLink} 
                          onChange={(e) => setTaskLink(e.target.value)}
                          placeholder="https://example.com/screenshot-url-or-username..."
                          className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-2.5 sm:py-3.5 border-none rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    )}

                    {(task.submit_type === 'message' || task.submit_type === 'link_message') && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] sm:text-xs font-black uppercase text-slate-500 dark:text-slate-355 tracking-wide">Note / Comment proof Details *</label>
                        <textarea 
                          rows={2}
                          required
                          value={message} 
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Write action usernames, transaction code, or note here..."
                          className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-2.5 sm:py-3.5 border-none rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-11 sm:h-14 md:h-16 bg-indigo-600 dark:bg-indigo-550 text-white rounded-[14px] sm:rounded-[24px] shadow-lg border-none font-black uppercase text-xs sm:text-sm tracking-wider mt-2 sm:mt-4 cursor-pointer"
                    >
                      {isSubmitting ? 'Submitting evidence...' : 'Submit Evidence'}
                    </Button>
                  </form>
                </>
              )}

              {taskState === 'submitted' && (
                <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 py-2 sm:py-4 font-sans">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl sm:rounded-full flex items-center justify-center border border-emerald-100 shadow-sm animate-bounce">
                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Success! Finished</h3>
                    {task.submit_type === 'off' ? (
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 px-2 leading-relaxed">
                        Task autoverified properly! <span className="text-emerald-600 font-extrabold">+{formatCompactNumber(task.coins)} coins</span> credited instantly to your dashboard wallet balance!
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 px-2 leading-relaxed">
                        Your proof submission for <span className="text-indigo-600 font-extrabold">+{formatCompactNumber(task.coins)} coins</span> has been successfully queued for Administrator approval!
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => navigate('/dashboard/tasks')}
                    className="w-full h-11 sm:h-14 bg-indigo-600 hover:bg-indigo-700 text-white border-none font-black uppercase tracking-wider text-xs rounded-xl shadow-xl mt-2 sm:mt-4 cursor-pointer"
                  >
                    Back to Tasks list
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
        {taskState === 'action' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] sm:rounded-[32px] p-5 sm:p-7 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col"
            >
              {/* Top Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 sm:pb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">Task Campaign</h3>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{task.name}</p>
                  </div>
                </div>
                {/* Close/Back Button */}
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to go back? Your current campaign progress will be lost.")) {
                      localStorage.removeItem(`task_click_time_${id}`);
                      localStorage.removeItem(`task_session_status_${id}`);
                      setSessionStatus('pending');
                      setTimerCompleted(false);
                      setTimerState('idle');
                      setTaskState('started');
                      setIsHtmlLoaded(false);
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-800 p-1.5 sm:p-2 rounded-full border-none cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Timer / Progress Bar at the top of the content */}
              {task.timer_enabled && (
                <div className="mb-4 sm:mb-6">
                  {timerState === 'idle' && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 m-0">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>Timer: <b className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">{task.timer_seconds}s</b> (Starts when you click below)</span>
                      </p>
                    </div>
                  )}

                  {timerState === 'running' && (
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-3 sm:p-4 rounded-2xl border border-indigo-150 dark:border-indigo-900/40 text-center animate-pulse">
                      <p className="text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center justify-center gap-2 m-0">
                        <Clock className="w-4 h-4 text-indigo-500 animate-spin" />
                        <span>Timer Active: <b className="text-base sm:text-lg font-black">{timerLeft} seconds</b> remaining</span>
                      </p>
                      <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">Please stay on the opened advertiser page!</span>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                        <div 
                          className="bg-indigo-600 h-full transition-all duration-1000" 
                          style={{ width: `${(timerLeft / task.timer_seconds) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {timerState === 'paused' && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-3 sm:p-4 rounded-2xl border border-red-200 dark:border-red-900/40 text-center">
                      <p className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-2 m-0">
                        <AlertCircle className="w-4 h-4 text-red-500 animate-bounce" />
                        <span>Verification Failed!</span>
                      </p>
                      <p className="text-[11px] font-semibold text-red-500/90 leading-relaxed mt-1 sm:mt-2 m-0">
                        {actionError || "You returned too early! You must remain on the advertiser's page for the full duration."}
                      </p>
                    </div>
                  )}

                  {timerState === 'completed' && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 sm:p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 text-center">
                      <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 m-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                        <span>Timer complete! Click 'Claim' below.</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Center Content / Description */}
              <div className="text-center py-2 sm:py-4 space-y-3 sm:space-y-4">
                <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-400/50 mx-auto" />
                <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Visit Sponsor Website
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                  {task.instructions || 'Click below to visit the advertised website and complete any actions on screen.'}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                {/* 1. Click to View / launch button */}
                {timerState !== 'completed' && (
                  <Button 
                    onClick={handleLaunchButton}
                    className="w-full h-11 sm:h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs sm:text-sm tracking-wider rounded-2xl border-none shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    {timerState === 'paused' ? 'Retry Click to View' : 'Click to View'}
                  </Button>
                )}

                {/* 2. Top level Claim Button when timer completes / immediately complete if no timer */}
                {timerState === 'completed' && (
                  <Button 
                    onClick={handleFinishAction}
                    disabled={isSubmitting}
                    className="w-full h-11 sm:h-14 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-black uppercase text-xs sm:text-sm tracking-wider rounded-2xl border-none shadow-lg shadow-emerald-600/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Claiming Reward...
                      </>
                    ) : (
                      'Claim Reward'
                    )}
                  </Button>
                )}

                <p className="text-[10px] text-center text-slate-400 font-semibold tracking-wide">
                  Earnings: <span className="text-emerald-500 font-black">+{formatCompactNumber(task.coins)} Coins</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

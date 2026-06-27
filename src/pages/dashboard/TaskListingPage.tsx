import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatCompactNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { usePersistedState } from '@/hooks/usePersistedState';
import { 
  ClipboardList, 
  Gift, 
  Play, 
  Smartphone, 
  Users, 
  Clock, 
  Search, 
  ChevronRight, 
  MessageCircle, 
  X 
} from 'lucide-react';

export default function TaskListingPage() {
  const { cachedUserTasks, setCachedUserTasks, cachedCategories, setCachedCategories, cachedProfile } = useStore();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = usePersistedState<string>('user_tasks_activeCategory', 'all');
  const [searchQuery, setSearchQuery] = usePersistedState('user_tasks_searchQuery', '');
  
  const [categories, setCategories] = useState<any[]>(() => {
    return cachedCategories && cachedCategories.length > 0 
      ? [{ id: 'all', name: 'All Tasks' }, ...cachedCategories] 
      : [{ id: 'all', name: 'All Tasks' }];
  });
  const [tasks, setTasks] = useState<any[]>(cachedUserTasks || []);
  const [dynamicTasks, setDynamicTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!cachedUserTasks || cachedUserTasks.length === 0);
  const [isDynamicLoading, setIsDynamicLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [approvedSubmissions, setApprovedSubmissions] = useState<{created_at: string; coins: number}[]>([]);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 15000); // Check / re-render every 15 seconds to automatically dynamic reset at midnight
    return () => clearInterval(interval);
  }, []);

  // Claim State variables
  const [selectedTaskForClaim, setSelectedTaskForClaim] = usePersistedState<any>('user_tasks_claimed_task', null);
  const [showClaimConfirmModal, setShowClaimConfirmModal] = usePersistedState('user_tasks_showConfirmClaim', false);
  const [showClaimedByOtherModal, setShowClaimedByOtherModal] = usePersistedState('user_tasks_showClaimedByOther', false);
  const [otherClaimExpiresAt, setOtherClaimExpiresAt] = usePersistedState<string | null>('user_tasks_otherClaimExpiresAt', null);
  const [claimedByOtherTimeLeft, setClaimedByOtherTimeLeft] = useState<number>(0);
  const [isClaimSaving, setIsClaimSaving] = useState(false);
  const [currentAlertTask, setCurrentAlertTask] = usePersistedState<any>('user_tasks_currentAlertTask', null);

  // 1. Calculate and update Claim cooldown countdown
  useEffect(() => {
    if (!otherClaimExpiresAt) return;

    const calculateTimeLeft = () => {
      const difference = new Date(otherClaimExpiresAt).getTime() - Date.now();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    setClaimedByOtherTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setClaimedByOtherTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        setShowClaimedByOtherModal(false);
        // Refresh standard tasks
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otherClaimExpiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 2. Claim flow execution
  const proceedWithTaskFlow = async (clickedTask: any) => {
    if (!clickedTask.claim_enabled) {
      navigate(`/dashboard/tasks/${clickedTask.id}`);
      return;
    }

    try {
      // Release expired claims globally first to ensure precise database representation
      await supabase.rpc('release_expired_claims_global');

      const { data: latestTask, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', clickedTask.id)
        .single();

      if (error || !latestTask) {
        alert("Error loading latest claim status. Please try again.");
        return;
      }

      // Check if task is closed (completions limit reached)
      if ((latestTask.completed_count || 0) >= (latestTask.max_winners || 1)) {
        alert("This task has reached its maximum completions and is now closed.");
        window.location.reload();
        return;
      }

      const currentUserId = cachedProfile?.id;
      const now = new Date();
      const expiresAt = latestTask.claim_expires_at ? new Date(latestTask.claim_expires_at) : null;
      const hasActiveClaim = latestTask.current_claim_user_id && expiresAt && expiresAt > now;

      if (hasActiveClaim) {
        if (latestTask.current_claim_user_id === currentUserId) {
          // Already claimed by current user, proceed directly
          navigate(`/dashboard/tasks/${latestTask.id}`);
        } else {
          // Claimed by another user, show waiting popup
          setSelectedTaskForClaim(latestTask);
          setOtherClaimExpiresAt(latestTask.claim_expires_at);
          setShowClaimedByOtherModal(true);
        }
      } else {
        // Unclaimed or claim expired, show claim confirm modal
        setSelectedTaskForClaim(latestTask);
        setShowClaimConfirmModal(true);
      }
    } catch (err) {
      console.error("Task click handling failed:", err);
    }
  };

  const handleTaskClick = async (clickedTask: any, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check instantly if the task has an alert message
    const hasAlert = clickedTask.alert_message_roman_urdu || clickedTask.alert_message_urdu || clickedTask.alert_message_english;
    if (hasAlert) {
      setCurrentAlertTask(clickedTask);
      return;
    }

    await proceedWithTaskFlow(clickedTask);
  };

  const handleConfirmClaim = async () => {
    if (!selectedTaskForClaim || !cachedProfile?.id || isClaimSaving) return;

    setIsClaimSaving(true);
    try {
      const { data: claimData, error: claimErr } = await supabase.rpc('claim_task', {
        p_task_id: selectedTaskForClaim.id,
        p_user_id: cachedProfile.id,
        p_timer_minutes: selectedTaskForClaim.claim_timer_minutes || 5
      });

      if (claimErr) {
        alert("Error claiming task: " + claimErr.message);
      } else if (claimData && claimData.length > 0) {
        const result = claimData[0];
        if (result.success) {
          setShowClaimConfirmModal(false);
          navigate(`/dashboard/tasks/${selectedTaskForClaim.id}`);
        } else {
          setShowClaimConfirmModal(false);
          // If claimed by other
          if (result.message?.includes("currently being completed by another member")) {
            setOtherClaimExpiresAt(result.claim_expires_at);
            setShowClaimedByOtherModal(true);
          } else {
            alert(result.message || "Claim attempt failed.");
            window.location.reload();
          }
        }
      }
    } catch (err) {
      console.error("Claiming transaction exception:", err);
      alert("Claiming transaction failed. Please try again.");
    } finally {
      setIsClaimSaving(false);
    }
  };

  // 3. Load Tasks & Dynamic Tasks & Calculate Total Earned
  useEffect(() => {
    async function fetchData() {
      // Release expired claims globally first to keep available listings 100% active and fresh
      try {
        await supabase.rpc('release_expired_claims_global');
      } catch (err) {
        console.error("Global release exception:", err);
      }

      // Fetch standard categories
      const { data: catsData } = await supabase.from('task_categories').select('*');
      if (catsData) {
        setCategories([{ id: 'all', name: 'All Tasks' }, ...catsData]);
        setCachedCategories(catsData);
      }

      let currentUserId = cachedProfile?.id;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          currentUserId = user.id;
        }
      }

      // Fetch standard task submissions
      let myStdSubmissions: any[] = [];
      if (currentUserId) {
        const { data: stdSubsData } = await supabase
          .from('task_submissions')
          .select('task_id, status')
          .eq('user_id', currentUserId);
        if (stdSubsData) {
          myStdSubmissions = stdSubsData;
        }
      }

      // Fetch tasks alongside category info
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          task_categories ( id, name, icon_name )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (tasksData) {
        // Filter out completed standard tasks, those that hit completed claim limit, or hit global completion limit
        const filteredStdByLimit = tasksData.filter(task => {
          if (task.global_completion_limit !== undefined && task.global_completion_limit !== null && task.global_completion_limit > 0) {
            const occupied = task.occupied_slots || 0;
            if (occupied >= task.global_completion_limit) {
              return false; // Hide from list instantly
            }
          }

          if (task.claim_enabled) {
            return (task.completed_count || 0) < (task.max_winners || 1);
          }
          const limit = task.max_completions !== undefined && task.max_completions !== null ? task.max_completions : 1;
          const taskSubs = myStdSubmissions.filter(s => s.task_id === task.id);
          const approvedCount = taskSubs.filter(s => s.status === 'approved').length;
          const pendingCount = taskSubs.filter(s => s.status === 'pending').length;
          const rejectedCount = taskSubs.filter(s => s.status === 'rejected').length;
          const totalConsumed = approvedCount + pendingCount + Math.floor(rejectedCount / 2);
          return totalConsumed < limit;
        });
        setTasks(filteredStdByLimit);
        setCachedUserTasks(filteredStdByLimit);
      }
      setIsLoading(false);

      // Fetch dynamic tasks
      setIsDynamicLoading(true);
      const { data: dTasksData } = await supabase
        .from('dynamic_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      let mySubmissions: any[] = [];
      if (currentUserId) {
        let subsData = null;
        const { data: withCycle, error: cylErr } = await supabase
          .from('dynamic_task_submissions')
          .select('task_id, status, cycle')
          .eq('user_id', currentUserId);
          
        if (cylErr && (cylErr.code === 'PGRST100' || cylErr.message?.includes('column') || cylErr.message?.includes('does not exist'))) {
          // Fallback if 'cycle' column does not exist on dynamic_task_submissions, fetch all
          const { data: withoutCycle } = await supabase
            .from('dynamic_task_submissions')
            .select('task_id, status')
            .eq('user_id', currentUserId);
          subsData = withoutCycle;
        } else {
          subsData = withCycle;
        }

        if (subsData) {
          mySubmissions = subsData;
        }
      }

      if (dTasksData) {
        // Filter out dynamic tasks that have exceeded complete_limit for the CURRENT cycle
        const filteredByLimit = dTasksData.filter(dTask => {
          const limit = dTask.complete_limit !== undefined && dTask.complete_limit !== null ? dTask.complete_limit : 1;
          const currentCycle = dTask.current_cycle || 1;
          
          // Only filter by current cycle submissions. If s.cycle is undefined / null (older submission) it falls back to matching currentCycle or being counted of legacy
          const taskSubs = mySubmissions.filter(s => {
            if (s.task_id !== dTask.id) return false;
            if (s.cycle === undefined || s.cycle === null) return true; // Legacy fallback
            return s.cycle === currentCycle;
          });
          
          const approvedCount = taskSubs.filter(s => s.status === 'approved').length;
          const pendingCount = taskSubs.filter(s => s.status === 'pending').length;
          const rejectedCount = taskSubs.filter(s => s.status === 'rejected').length;
          const totalConsumed = approvedCount + pendingCount + Math.floor(rejectedCount / 2);
          return totalConsumed < limit;
        });
        setDynamicTasks(filteredByLimit);
      }
      setIsDynamicLoading(false);

      // 4. Calculate live "Total Earned" coins and "Today Earned" by summarizing approved tasks
      if (currentUserId) {
        let stdEarnedCoins = 0;
        let dynEarnedCoins = 0;
        const allApprovedSubs: {created_at: string; coins: number}[] = [];

        const { data: approvedStd } = await supabase
          .from('task_submissions')
          .select('created_at, tasks(coins)')
          .eq('user_id', currentUserId)
          .eq('status', 'approved');
        
        if (approvedStd) {
          approvedStd.forEach((curr: any) => {
            const coins = curr.tasks?.coins || 0;
            stdEarnedCoins += coins;
            allApprovedSubs.push({ created_at: curr.created_at, coins });
          });
        }

        const { data: approvedDyn } = await supabase
          .from('dynamic_task_submissions')
          .select('created_at, dynamic_tasks(coins)')
          .eq('user_id', currentUserId)
          .eq('status', 'approved');
        
        if (approvedDyn) {
          approvedDyn.forEach((curr: any) => {
            const coins = curr.dynamic_tasks?.coins || 0;
            dynEarnedCoins += coins;
            allApprovedSubs.push({ created_at: curr.created_at, coins });
          });
        }

        const referralEarnings = cachedProfile?.total_referral_earnings || 0;
        setTotalEarned(stdEarnedCoins + dynEarnedCoins + referralEarnings);
        setApprovedSubmissions(allApprovedSubs);
      }
    }
    fetchData();
  }, [setCachedUserTasks, setCachedCategories, cachedProfile]);

  // Classified helper to organize tasks into key-bracket categories for seamless filtering
  const getCategoryNameForDynamic = (task: any) => {
    const nameLower = task.name?.toLowerCase() || '';
    const descLower = task.description?.toLowerCase() || '';
    
    if (nameLower.includes('video') || nameLower.includes('watch') || nameLower.includes('youtube') || descLower.includes('video')) return 'Video';
    if (nameLower.includes('survey') || nameLower.includes('quiz') || nameLower.includes('question') || descLower.includes('survey')) return 'Survey';
    if (nameLower.includes('refer') || nameLower.includes('friend') || nameLower.includes('invite') || descLower.includes('refer')) return 'Refer';
    if (nameLower.includes('install') || nameLower.includes('app') || nameLower.includes('download') || descLower.includes('app')) return 'App';
    
    return 'Offer';
  };

  // Convert categories from database context into uniform category indicators
  const getCategoryStyling = (categoryName: string) => {
    const term = categoryName?.toLowerCase() || 'offer';
    if (term.includes('survey')) {
      return {
        icon: ClipboardList,
        text: 'Survey',
        colors: 'bg-[#E6F9F0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400',
        badge: 'text-[#10B981] bg-[#E6F9F0] dark:bg-emerald-950/20'
      };
    }
    if (term.includes('offer')) {
      return {
        icon: Gift,
        text: 'Offer',
        colors: 'bg-[#FFF3E6] text-[#FA8C16] dark:bg-orange-950/20 dark:text-orange-400',
        badge: 'text-[#FA8C16] bg-[#FFF3E6] dark:bg-orange-950/20'
      };
    }
    if (term.includes('video')) {
      return {
        icon: Play,
        text: 'Video',
        colors: 'bg-[#E6F4FF] text-[#1890FF] dark:bg-sky-950/20 dark:text-sky-400',
        badge: 'text-[#1890FF] bg-[#E6F4FF] dark:bg-sky-950/20'
      };
    }
    if (term.includes('app') || term.includes('download') || term.includes('install')) {
      return {
        icon: Smartphone,
        text: 'App',
        colors: 'bg-[#FFF0F6] text-[#EB2F96] dark:bg-rose-950/20 dark:text-rose-400',
        badge: 'text-[#EB2F96] bg-[#FFF0F6] dark:bg-rose-950/20'
      };
    }
    if (term.includes('refer')) {
      return {
        icon: Users,
        text: 'Refer',
        colors: 'bg-[#F0EEFF] text-[#722ED1] dark:bg-indigo-950/20 dark:text-indigo-400',
        badge: 'text-[#722ED1] bg-[#F0EEFF] dark:bg-indigo-950/20'
      };
    }
    return {
      icon: Gift,
      text: 'Offer',
      colors: 'bg-[#FFF3E6] text-[#FA8C16] dark:bg-orange-950/20 dark:text-orange-400',
      badge: 'text-[#FA8C16] bg-[#FFF3E6] dark:bg-orange-950/20'
    };
  };

  // Harmonize all Standard & Dynamic Tasks into one integrated list array
  const unifiedTasks = [
    ...tasks.map(t => {
      const catName = t.task_categories?.name || 'Offer';
      const styles = getCategoryStyling(catName);
      return {
        id: t.id,
        isDynamic: false,
        title: t.title,
        instructions: t.instructions,
        coins: t.coins,
        image_url: t.image_url,
        categoryName: styles.text,
        categoryId: t.category_id || 'offer',
        raw: t
      };
    }),
    ...dynamicTasks.map(dt => {
      const catName = getCategoryNameForDynamic(dt);
      const styles = getCategoryStyling(catName);
      // Map back standard corresponding category IDs if exists to make pills fully function
      const matchedCat = categories.find(c => c.name.toLowerCase().includes(catName.toLowerCase()));
      return {
        id: dt.id,
        isDynamic: true,
        title: dt.name,
        instructions: dt.description || 'Action tasks',
        coins: dt.coins,
        image_url: dt.logo_url,
        categoryName: styles.text,
        categoryId: matchedCat?.id || 'dynamic-offer',
        raw: dt
      };
    })
  ];

  // Active Category Filtering block
  const activeCategoryName = categories.find(c => c.id === activeCategory)?.name?.toLowerCase() || 'all';

  const filteredUnifiedTasks = unifiedTasks.filter(task => {
    let matchesCategory = true;
    if (activeCategory !== 'all') {
      matchesCategory = (
        task.categoryId === activeCategory || 
        task.categoryName.toLowerCase() === activeCategoryName || 
        task.categoryName.toLowerCase().includes(activeCategoryName) ||
        (activeCategoryName === 'all tasks')
      );
    }
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.instructions.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const onUnifiedTaskClick = (taskItem: any, e: React.MouseEvent) => {
    if (taskItem.isDynamic) {
      navigate(`/dashboard/dynamic-tasks/${taskItem.id}`);
    } else {
      handleTaskClick(taskItem.raw, e);
    }
  };

  // Compute Today Earned dynamically on every render
  const todayEarned = approvedSubmissions.reduce((acc, sub) => {
    const subDate = new Date(sub.created_at);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (subDate >= startOfToday) {
      return acc + sub.coins;
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6 w-full px-1.5 sm:px-4 pb-12 bg-transparent select-none">
      
      {/* Scope-contained custom style injector to completely hide scrollbars from horizontal scrollable elements */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .hide-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      
      {/* Premium Fintech Multi-part Balance & Earnings Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: -10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#774DFF] via-[#592BFF] to-[#3D14D9] text-white rounded-[26px] p-6 sm:p-7 shadow-xl shadow-indigo-600/25 border border-indigo-400/20"
      >
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-fuchsia-400/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="grid grid-cols-2 divide-x divide-white/20 flex-1 items-center">
            {/* Your Balance Column */}
            <div className="pr-4 py-2">
              <p className="text-[10px] sm:text-[11px] font-black text-indigo-200/90 uppercase tracking-widest">Your Balance</p>
              <div className="text-2xl sm:text-[32px] font-black text-white mt-1.5 flex items-center gap-1.5 leading-none">
                <span className="tracking-tight">{formatCompactNumber(cachedProfile?.wallet_balance || 0)}</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-b from-[#FFF886] via-[#FFD000] to-[#E28000] rounded-full flex items-center justify-center border border-white/30 shadow-md font-black text-[#6C3E00] text-xs sm:text-sm select-none shrink-0 leading-none">
                  $
                </div>
              </div>
            </div>

            {/* Today Earned Column */}
            <div className="pl-4.5 py-2">
              <p className="text-[10px] sm:text-[11px] font-black text-indigo-200/90 uppercase tracking-widest">Today Earned</p>
              <div className="text-2xl sm:text-[32px] font-black text-white mt-1.5 flex items-center gap-1.5 leading-none">
                <span className="tracking-tight">{formatCompactNumber(todayEarned)}</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-b from-[#FFF584] via-[#FACC15] to-[#D97706] rounded-full flex items-center justify-center border border-white/20 shadow-md font-black text-[#5C3400] text-xs select-none shrink-0 leading-none">
                  $
                </div>
              </div>
            </div>
          </div>

          {/* Premium Wallet & Coin Stack SVG Asset */}
          <div className="shrink-0 pl-1 transform translate-x-1.5">
            <svg className="w-18 h-18 sm:w-20 sm:h-20 opacity-95 shrink-0 select-none drop-shadow-lg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="walletGrad" x1="10" y1="40" x2="110" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4FB3FF" />
                  <stop offset="100%" stopColor="#0066FF" />
                </linearGradient>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFE15D" />
                  <stop offset="100%" stopColor="#FFA600" />
                </linearGradient>
              </defs>
              {/* Soft surrounding shadow */}
              <rect x="25" y="42" width="72" height="52" rx="16" fill="#000" opacity="0.15" filter="blur(4px)" />
              
              {/* Green Money sheets protruding */}
              <rect x="44" y="24" width="32" height="42" rx="5" transform="rotate(-18 44 24)" fill="#34D399" stroke="#059669" strokeWidth="1.5" />
              <rect x="49" y="27" width="22" height="34" rx="3" transform="rotate(-18 44 24)" fill="#10B981" opacity="0.4" />
              <path d="M 48 34 Q 58 30 68 36" stroke="#047857" strokeWidth="1.2" fill="none" transform="rotate(-18 44 24)" />
              
              <rect x="56" y="22" width="32" height="42" rx="5" transform="rotate(10 56 22)" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
              <rect x="60" y="25" width="22" height="34" rx="3" transform="rotate(10 56 22)" fill="#059669" opacity="0.35" />
              
              {/* Main Wallet Shape */}
              <rect x="30" y="44" width="60" height="48" rx="14" fill="url(#walletGrad)" stroke="#1D4ED8" strokeWidth="1.5" />
              {/* Wallet Opening Flap */}
              <path d="M 30 46 L 90 46 L 80 63 C 78 65 74 65 72 63 L 48 46" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />
              {/* Wallet Button */}
              <circle cx="58" cy="54" r="5" fill="#FFA600" stroke="#FFF" strokeWidth="1" />
              <circle cx="58" cy="54" r="2" fill="#FDE047" />

              {/* Gold Stacking Coins near Wallet */}
              <g transform="translate(76, 68)">
                {/* Coin 1 Bottom */}
                <ellipse cx="14" cy="18" rx="9" ry="4" fill="#CA8A04" />
                <rect x="5" y="14" width="18" height="4" fill="#CA8A04" />
                <ellipse cx="14" cy="14" rx="9" ry="4" fill="#EAB308" />
                {/* Coin 2 */}
                <rect x="5" y="10" width="18" height="4" fill="#CA8A04" />
                <ellipse cx="14" cy="10" rx="9" ry="4" fill="#FACC15" />
                {/* Coin 3 Top */}
                <rect x="5" y="6" width="18" height="4" fill="#D97706" />
                <ellipse cx="14" cy="6" rx="9" ry="4" fill="url(#goldGrad)" stroke="#FFF" strokeWidth="0.5" />
              </g>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Categories header bar */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Categories</h2>
      </div>

      {/* Category Pills Slider - Completely Hidden Scrollbar */}
      <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar py-1">
        {categories.map(category => {
          const isSelected = activeCategory === category.id;
          const cleanName = category.name === 'All Tasks' ? 'All Tasks' : category.name;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "rounded-[22px] transition-all px-4.5 py-2.5 text-xs sm:text-[13px] font-black select-none border shrink-0",
                isSelected
                  ? "bg-gradient-to-r from-[#774DFF] to-[#592BFF] text-white border-transparent shadow-lg shadow-indigo-500/15"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-slate-200/80 dark:border-slate-800"
              )}
            >
              {cleanName}
            </button>
          );
        })}
      </div>

      {/* Selected Task List Header bar */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize tracking-tight flex items-center gap-2">
          {activeCategoryName === 'all' || activeCategoryName === 'all tasks' ? 'All Tasks' : activeCategoryName}
          <span className="w-1.5 h-1.5 rounded-full bg-[#592BFF]" />
        </h3>
        <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-[#592BFF] dark:text-indigo-400 px-3 py-1 rounded-full">
          {filteredUnifiedTasks.length} {filteredUnifiedTasks.length === 1 ? 'Task' : 'Tasks'} Available
        </span>
      </div>

      {/* Loading Spinners */}
      {isLoading || isDynamicLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-3 border-[#592BFF] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Unified Tasks Premium Cards List - Min Height 100-120px */}
          {filteredUnifiedTasks.map((taskItem) => {
            const styles = getCategoryStyling(taskItem.categoryName);
            const IconComponent = styles.icon;

            return (
              <motion.div
                key={`${taskItem.isDynamic ? 'dyn' : 'std'}_${taskItem.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div
                  onClick={(e) => onUnifiedTaskClick(taskItem, e)}
                  style={{ contentVisibility: 'auto' }}
                  className="w-full text-left cursor-pointer group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[24px] p-3.5 sm:p-5 flex items-center justify-between gap-2.5 sm:gap-4 shadow-sm hover:shadow-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all active:scale-[0.98] min-h-[110px]"
                >
                  {/* Left Side: Brand Icon (shrink-0) */}
                  <div className={cn(
                    "w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-[14px] sm:rounded-[18px] flex items-center justify-center transform group-hover:scale-105 transition-transform shadow-sm border border-slate-100 dark:border-slate-800",
                    styles.colors
                  )}>
                    {taskItem.image_url ? (
                      <img 
                        src={taskItem.image_url} 
                        alt={taskItem.title} 
                        className="w-full h-full object-cover rounded-[14px] sm:rounded-[18px]" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <IconComponent className="w-5.5 h-5.5 sm:w-7.5 sm:h-7.5" />
                    )}
                  </div>

                  {/* Middle Content Area (Expanded / flex-1 min-w-0 / taking up all available space) */}
                  <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5 py-0.5">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white leading-snug whitespace-normal break-normal group-hover:text-[#592BFF] dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {taskItem.title}
                    </h4>
                    
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 break-normal leading-relaxed line-clamp-2">
                      {taskItem.instructions}
                    </p>

                    {/* Pill Badge align perfectly below description */}
                    <div className="pt-0.5 sm:pt-1 flex">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[6px] sm:rounded-[8px] leading-none shrink-0", styles.badge)}>
                        {taskItem.categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Far Right: Reward amount with large text + gold coin and chevron (shrink-0) */}
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <div className="flex items-center gap-1 sm:gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 py-1 px-2 sm:py-1.5 sm:px-3 rounded-xl sm:rounded-2xl">
                      <span className="text-[13px] sm:text-lg font-black text-[#10B981] leading-none">
                        +{taskItem.coins}
                      </span>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-b from-[#FFF584] to-[#EE9B00] rounded-full flex items-center justify-center border border-white/25 shadow font-black text-white text-[8px] sm:text-[9.5px] select-none shrink-0 leading-none">
                        $
                      </div>
                    </div>
                    
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredUnifiedTasks.length === 0 && (
            <div className="py-16 text-center flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 mb-4">
                <Search className="w-7 h-7 text-slate-300 dark:text-slate-600 animate-pulse" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">No tasks available</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[200px]">We couldn't find any tasks fitting this category.</p>
            </div>
          )}
        </div>
      )}

      {/* Complete Tasks Bottom celebrate card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-gradient-to-r from-[#4E39F9] to-[#7352FD] text-white rounded-[26px] p-5.5 mt-2.5 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
        <div className="absolute bottom-0 right-10 w-24 h-24 bg-[#EAB308]/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex justify-between items-center relative z-10">
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-extrabold text-white">Complete Tasks & Earn Rewards</h4>
            <p className="text-[11px] sm:text-xs text-white/85 font-medium">More tasks coming soon! ✨</p>
          </div>
          
          <div className="hidden sm:block shrink-0 pr-2">
            <svg className="w-14 h-14 animate-bounce" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="40" width="50" height="40" rx="4" fill="#FACC15" />
              <path d="M 20 35 L 80 35 L 80 43 L 20 43 Z" fill="#EAB308" />
              <rect x="47" y="32" width="6" height="48" fill="#EF4444" />
              <path d="M 40 35 C 40 25 48 25 48 35 Z" fill="#EF4444" />
              <path d="M 60 35 C 60 25 52 25 52 35 Z" fill="#EF4444" />
              <circle cx="15" cy="20" r="2" fill="#EAB308" />
              <circle cx="85" cy="15" r="3" fill="#A855F7" />
              <path d="M 85 55 L 90 53 L 85 51 Z" fill="#3B82F6" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Claim System Confirmation Popup Modal */}
      <AnimatePresence>
        {showClaimConfirmModal && selectedTaskForClaim && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-850 w-full max-w-sm rounded-[24px] p-6 text-center shadow-2xl shadow-black/20 border border-slate-100 dark:border-slate-800"
            >
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#4536F2] animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Claim Task</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs leading-relaxed font-semibold">
                You must complete this task within {selectedTaskForClaim.claim_timer_minutes || 5} minutes. If you do not submit within the timer, the task will automatically become available to another member.
              </p>
              
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowClaimConfirmModal(false);
                    setSelectedTaskForClaim(null);
                  }}
                  className="flex-1 h-11 rounded-[14px] text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleConfirmClaim} 
                  isLoading={isClaimSaving}
                  className="flex-1 h-11 rounded-[14px] bg-[#4536F2] hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Claim Task
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Claim System Waiting/Blocked Popup Modal */}
      <AnimatePresence>
        {showClaimedByOtherModal && selectedTaskForClaim && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-850 w-full max-w-sm rounded-[24px] p-6 text-center shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500 animate-pulse">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">Slot Claimed</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4 text-xs font-semibold leading-relaxed">
                This task is currently being completed by another member. Please wait until the current claim expires.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-900/60 py-3 px-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Time Remaining</p>
                <p className="text-amber-700 dark:text-amber-400 font-mono font-black text-xl mt-0.5 tracking-tight">
                  {claimedByOtherTimeLeft > 0 ? `${formatTime(claimedByOtherTimeLeft)} remaining` : "Checking..."}
                </p>
              </div>

              {/* WhatsApp broadcast channel card details */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-920 rounded-2xl p-3.5 mb-4 text-left">
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
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
                      className="inline-flex items-center gap-1 mt-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
                    >
                      Join Channel Now →
                    </a>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="primary" 
                onClick={() => {
                  setShowClaimedByOtherModal(false);
                  setSelectedTaskForClaim(null);
                }} 
                className="w-full h-11 rounded-xl bg-[#4536F2] hover:bg-indigo-700 text-white font-bold text-xs uppercase"
              >
                Close
              </Button>
            </motion.div>
          </div>
        )}

        {currentAlertTask && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col relative max-h-[80vh]"
            >
              {/* Alert Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg text-rose-500 font-extrabold animate-pulse">⚠</span>
                  <h3 className="text-sm font-extrabold text-rose-600 dark:text-rose-450">Important Message</h3>
                </div>
                <button 
                  type="button"
                  onClick={async () => {
                    const t = currentAlertTask;
                    setCurrentAlertTask(null);
                    await proceedWithTaskFlow(t);
                  }} 
                  className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alert Body */}
              <TaskAlertPopupContent 
                task={currentAlertTask} 
                onClose={async () => {
                  const t = currentAlertTask;
                  setCurrentAlertTask(null);
                  await proceedWithTaskFlow(t);
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
    <div className="p-4 space-y-4 overflow-y-auto flex-1 flex flex-col">
      {/* Dropdown for languages */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Language</span>
        <select 
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as any)}
          className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 text-[11px] font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4536F2] cursor-pointer"
        >
          <option value="roman_urdu">Roman Urdu</option>
          <option value="urdu">Urdu (اردو)</option>
          <option value="english">English</option>
        </select>
      </div>

      {/* Message Box */}
      <div 
        className={cn(
          "p-4 rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/20 dark:bg-rose-950/5 text-slate-800 dark:text-slate-200 font-semibold whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto min-h-[120px] shadow-inner",
          isUrduFont ? "text-right font-medium text-base leading-loose" : "text-left text-xs"
        )}
        dir={isUrduFont ? "rtl" : "ltr"}
      >
        {currentMessage ? currentMessage : (
          <span className="text-slate-400 dark:text-slate-500 italic font-medium">No warning message in this language.</span>
        )}
      </div>

      {/* Action button */}
      <div className="pt-1">
        <Button 
          variant="primary" 
          onClick={onClose} 
          className="w-full h-11 rounded-xl bg-[#4536F2] hover:bg-indigo-700 text-white font-bold text-xs uppercase"
        >
          Proceed / آگے بڑھیں
        </Button>
      </div>
    </div>
  );
}

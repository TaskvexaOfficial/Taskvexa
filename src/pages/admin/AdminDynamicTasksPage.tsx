import React, { useState, useEffect } from 'react';
import { triggerPushNotification } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { formatCompactNumber, cn } from '@/lib/utils';
import { 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Settings2, 
  Globe, 
  Code, 
  Clock, 
  Video, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ListChecks, 
  History, 
  ArrowUpRight, 
  CheckSquare, 
  ExternalLink,
  Search,
  Filter,
  Calendar as CalendarIcon,
  User,
  Wallet,
  Coins,
  ArrowRight,
  TrendingUp,
  Sliders,
  Eye,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDynamicTasksPage() {
  const [activeTab, setActiveTab] = useState<'dynamic_submissions' | 'history' | 'campaigns'>('dynamic_submissions');
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);

  // Form Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState<any | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Add Task Form values
  const [formData, setFormData] = useState({
    logo_url: '',
    name: '',
    description: '',
    coins: 100,
    video_url: '',
    timer_enabled: false,
    timer_seconds: 30,
    website_link_type: 'link', // 'link' | 'html'
    website_link: '',
    submit_type: 'link', // 'link' | 'link_message' | 'message' | 'off'
    complete_limit: 1,
    auto_reset: 'manual'
  });

  useEffect(() => {
    fetchTasks();
    fetchSubmissions();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dynamic_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setTasks(data);
      }
      if (error) console.error('Error fetching dynamic tasks:', error);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setIsSubmissionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dynamic_task_submissions')
        .select(`
          *,
          dynamic_tasks ( name, coins ),
          profiles ( id, full_name, email, wallet_balance, total_tasks_completed, total_tasks_pending )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setSubmissions(data);
      }
      if (error) console.error('Error fetching dynamic submissions:', error);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name: 'timer_enabled') => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const resetForm = () => {
    setEditingTaskId(null);
    setFormData({
      logo_url: '',
      name: '',
      description: '',
      coins: 100,
      video_url: '',
      timer_enabled: false,
      timer_seconds: 30,
      website_link_type: 'link',
      website_link: '',
      submit_type: 'link',
      complete_limit: 1,
      auto_reset: 'manual'
    });
  };

  const handleEditClick = (task: any) => {
    setEditingTaskId(task.id);
    setFormData({
      logo_url: task.logo_url || '',
      name: task.name || '',
      description: task.description || '',
      coins: task.coins || 100,
      video_url: task.video_url || '',
      timer_enabled: !!task.timer_enabled,
      timer_seconds: task.timer_seconds || 30,
      website_link_type: task.website_link_type || 'link',
      website_link: task.website_link || '',
      submit_type: task.submit_type || 'link',
      complete_limit: task.complete_limit || 1,
      auto_reset: task.auto_reset || 'manual'
    });
    setShowTaskModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please fill in task name');
      return;
    }
    setIsActionLoading(true);
    try {
      const taskPayload = {
        logo_url: formData.logo_url || null,
        name: formData.name,
        description: formData.description,
        coins: Number(formData.coins),
        video_url: formData.video_url || null,
        timer_enabled: formData.timer_enabled,
        timer_seconds: formData.timer_enabled ? Number(formData.timer_seconds) : 0,
        website_link_type: formData.website_link_type,
        website_link: formData.website_link || null,
        submit_type: formData.submit_type,
        complete_limit: Number(formData.complete_limit || 1),
        status: 'active',
        auto_reset: formData.auto_reset || 'manual'
      };

      let error;
      if (editingTaskId) {
        const { error: updateError } = await supabase
          .from('dynamic_tasks')
          .update(taskPayload)
          .eq('id', editingTaskId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('dynamic_tasks')
          .insert([taskPayload]);
        error = insertError;
      }

      if (error) {
        alert('Error saving dynamic task: ' + error.message);
      } else {
        setShowTaskModal(false);
        resetForm();
        fetchTasks();
      }
    } catch (err: any) {
      alert('An expected error occurred: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetUserProgress = async (task: any) => {
    if (!confirm(`Are you sure you want to reactivate the task "${task.name}" for all users? This starts a brand new completion cycle/round. All previous user earnings, history, and statistics will remain completely safe and untouched. This action is safe.`)) {
      return;
    }
    
    setIsActionLoading(true);
    try {
      const nextCycle = (task.current_cycle || 1) + 1;
      const { error } = await supabase
        .from('dynamic_tasks')
        .update({ 
          current_cycle: nextCycle,
          last_reset_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) {
        alert('Failed to reactivate task for all users: ' + error.message);
      } else {
        alert(`Successfully reactivated "${task.name}". A new completion cycle (Round ${nextCycle}) has started safely! Previous user history and rewards are completely untouched.`);
        fetchTasks();
      }
    } catch (err: any) {
      alert('Error during reset operation: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dynamic task? This will also delete all associated user submissions.')) {
      return;
    }
    try {
      const { error } = await supabase.from('dynamic_tasks').delete().eq('id', id);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        fetchTasks();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveSubmission = async (sub: any) => {
    if (!sub) return;
    if (!confirm(`Are you sure you want to APPROVED this submission and award ${formatCompactNumber(sub.dynamic_tasks?.coins || 0)} coins to ${sub.profiles?.full_name || 'user'}?`)) {
      return;
    }
    setIsActionLoading(true);
    try {
      const coinsToAward = sub.dynamic_tasks?.coins || 0;
      const userId = sub.user_id;

      // 1. Fetch live profile stats
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (pError || !profile) {
        throw new Error('Could not find user profile: ' + (pError?.message || 'Empty'));
      }

      // 2. Calculate values
      const newWalletBalance = (profile.wallet_balance || 0) + coinsToAward;
      const newCompleted = (profile.total_tasks_completed || 0) + 1;
      const newPending = Math.max(0, (profile.total_tasks_pending || 0) - 1);

      // 3. Update Profile
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: newWalletBalance,
          total_tasks_completed: newCompleted,
          total_tasks_pending: newPending
        })
        .eq('id', userId);

      if (profileUpdateError) throw profileUpdateError;

      // 4. Update Dynamic Task Submission Status
      const { error: subUpdateError } = await supabase
        .from('dynamic_task_submissions')
        .update({ status: 'approved' })
        .eq('id', sub.id);

      if (subUpdateError) throw subUpdateError;

      // 5. Check and handle referrals (20%)
      if (profile.referred_by) {
        const commissionAmount = Math.floor(coinsToAward * 0.20);
        if (commissionAmount > 0) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('wallet_balance, total_referral_earnings')
            .eq('id', profile.referred_by)
            .single();

          if (referrer) {
            await supabase
              .from('profiles')
              .update({
                wallet_balance: (referrer.wallet_balance || 0) + commissionAmount,
                total_referral_earnings: (referrer.total_referral_earnings || 0) + commissionAmount
              })
              .eq('id', profile.referred_by);

            // Check for duplicate ledger entry
            const { data: existingEarning } = await supabase
              .from('referral_earnings')
              .select('id')
              .eq('task_completion_id', sub.id)
              .maybeSingle();

            if (!existingEarning) {
              // Log referral earings (use submission UUID as task completion ID proxy)
              const { error: ledgerError } = await supabase
                .from('referral_earnings')
                .insert([{
                  referrer_user_id: profile.referred_by,
                  referred_user_id: userId,
                  task_completion_id: sub.id, // submission ID
                  commission_percentage: 20,
                  commission_amount: commissionAmount
                }]);

              if (ledgerError) {
                console.error("[DYNAMIC TASK REFERRAL ERROR] Failed to insert referral_earnings row:", ledgerError);
              }
            } else {
              console.log("[DYNAMIC TASK REFERRAL] Referral earning row already exists for submission:", sub.id);
            }

            // Create notification for referrer
            await supabase.from('notifications').insert([{
              user_id: profile.referred_by,
              title: 'Dynamic Task Commission! 💸',
              message: `You earned ${formatCompactNumber(commissionAmount)} Coins from a dynamic task completed by your referral.`,
              type: 'success'
            }]);

            triggerPushNotification(
              profile.referred_by,
              'Dynamic Task Commission! 💸',
              `You earned ${formatCompactNumber(commissionAmount)} Coins from a dynamic task completed by your referral.`
            ).catch(err => console.error('[FCM] Referral push failed', err));
          }
        }
      }

      // 6. Create Notification for main user
      await supabase.from('notifications').insert([{
        user_id: userId,
        title: 'Dynamic Task Approved! 🎉',
        message: `Your proof for "${sub.dynamic_tasks?.name}" was approved. ${formatCompactNumber(coinsToAward)} Coins credited.`,
        type: 'success'
      }]);

      triggerPushNotification(
        userId,
        'Dynamic Task Approved! 🎉',
        `Your proof for "${sub.dynamic_tasks?.name}" was approved. ${formatCompactNumber(coinsToAward)} Coins credited.`
      ).catch(err => console.error('[FCM] Task approved push failed', err));

      alert('Submission approved and coins awarded successfully!');
      setShowSubModal(null);
      fetchSubmissions();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectSubmission = async () => {
    if (!showSubModal) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setIsActionLoading(true);
    try {
      const userId = showSubModal.user_id;

      // 1. Fetch and decrease pending count
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_tasks_pending')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_tasks_pending: Math.max(0, (profile.total_tasks_pending || 0) - 1)
          })
          .eq('id', userId);
      }

      // 2. Reject submission
      const { error: rejectError } = await supabase
        .from('dynamic_task_submissions')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', showSubModal.id);

      if (rejectError) throw rejectError;

      // 3. Create failure notification
      await supabase.from('notifications').insert([{
        user_id: userId,
        title: 'Dynamic Task Rejected ❌',
        message: `Your proof for "${showSubModal.dynamic_tasks?.name}" was rejected. Reason: ${reason}`,
        type: 'error'
      }]);

      triggerPushNotification(
        userId,
        'Dynamic Task Rejected ❌',
        `Your proof for "${showSubModal.dynamic_tasks?.name}" was rejected. Reason: ${reason}`
      ).catch(err => console.error('[FCM] Task rejected push failed', err));

      alert('Submission rejected successfully.');
      setIsRejecting(false);
      setRejectionReason('');
      setShowSubModal(null);
      fetchSubmissions();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter dynamic submissions
  const filteredSubmissions = submissions.filter(sub => {
    // 1. Tab filtering
    if (activeTab === 'dynamic_submissions') {
      if (sub.status !== 'pending') return false;
    } else if (activeTab === 'history') {
      if (sub.status === 'pending') return false;
    } else {
      return true; // Manage Campaigns doesn't use standard submission filtering
    }

    // 2. Search query filtering
    if (searchQuery && 
        !sub.dynamic_tasks?.name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !sub.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 3. Status filtering (Only for History Tab)
    if (activeTab === 'history' && statusFilter !== 'all' && sub.status !== statusFilter) {
      return false;
    }

    // 4. Date filtering (Only for History Tab)
    if (activeTab === 'history' && timeFilter !== 'all') {
      const subDate = new Date(sub.created_at);
      const now = new Date();
      if (timeFilter === 'today') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        if (subDate < startOfDay) return false;
      } else if (timeFilter === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - 7));
        if (subDate < startOfWeek) return false;
      } else if (timeFilter === 'month') {
        const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));
        if (subDate < startOfMonth) return false;
      } else if (timeFilter === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (subDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (subDate > end) return false;
        }
      }
    }

    return true;
  });

  const activeTasksCount = tasks.filter(t => t.status === 'active').length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  const getHistoryStats = () => {
    const historySubs = submissions.filter(s => s.status !== 'pending');
    let filteredHistory = historySubs;

    if (timeFilter !== 'all') {
      const now = new Date();
      if (timeFilter === 'today') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        filteredHistory = historySubs.filter(s => new Date(s.created_at) >= startOfDay);
      } else if (timeFilter === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - 7));
        filteredHistory = historySubs.filter(s => new Date(s.created_at) >= startOfWeek);
      } else if (timeFilter === 'month') {
        const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));
        filteredHistory = historySubs.filter(s => new Date(s.created_at) >= startOfMonth);
      } else if (timeFilter === 'custom') {
        filteredHistory = historySubs.filter(s => {
          const subDate = new Date(s.created_at);
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (subDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (subDate > end) return false;
          }
          return true;
        });
      }
    }

    return {
      accepted: filteredHistory.filter(s => s.status === 'approved').length,
      rejected: filteredHistory.filter(s => s.status === 'rejected').length,
      total: filteredHistory.length
    };
  };

  const historyStats = getHistoryStats();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-4 lg:px-8">
      
      {/* Redesigned Clean Header matching Submission layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dynamic Task Manager
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
            Build specialized in-app user engagements with circular timers, frames, and code insertion.
          </p>
        </div>

        {/* Top level Navigation matching Submissions design */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900/85 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800 self-start md:self-auto w-full md:w-auto gap-0.5">
          <button
            id="tab-dynamic-submissions"
            onClick={() => {
              setActiveTab('dynamic_submissions');
              setSearchQuery('');
            }}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === 'dynamic_submissions'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-[1.02]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <ListChecks className="w-3.5 h-3.5" />
            Dynamic Tasks
          </button>
          
          <button
            id="tab-history"
            onClick={() => {
              setActiveTab('history');
              setSearchQuery('');
            }}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === 'history'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-[1.02]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200"
            )}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>

          <button
            id="tab-campaign-manage"
            onClick={() => setActiveTab('campaigns')}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === 'campaigns'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-[1.02]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            Manage Campaigns ({tasks.length})
          </button>
        </div>
      </div>

      {/* DYNAMIC TASKS TAB CONTENT */}
      {activeTab === 'dynamic_submissions' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top stats card - Total Pending Dynamic Tasks */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="relative overflow-hidden p-6 sm:p-8 border-none bg-gradient-to-r from-indigo-50 leading-none to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 rounded-[28px] shadow-sm">
              <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
                <CheckSquare className="w-56 h-56 text-indigo-900 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Dynamic Review</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Total Pending Dynamic Tasks
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md">
                    Custom web action evidence submissions requiring verification and coin payouts.
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-sm border border-indigo-100/40 dark:border-indigo-950 self-start sm:self-auto shrink-0 animate-pulse">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Pending Actions</span>
                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{pendingCount}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Search for Dynamic queue */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search pending dynamic tasks by applicant or campaign name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>

          {/* Horizontal Row styled records */}
          <div className="space-y-2.5 pb-10">
            {/* Horizontal Headings */}
            <div className="hidden md:grid grid-cols-[260px_1fr_120px_120px_120px] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              <span>Applicant User</span>
              <span>Dynamic Campaign Title</span>
              <span className="text-center">Coins Reward</span>
              <span className="text-center">Created Timestamp</span>
              <span className="text-right pr-4">Details</span>
            </div>

            {isSubmissionsLoading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing records...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <Card className="p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/80 bg-transparent flex flex-col items-center justify-center rounded-[32px]">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                  <CheckSquare className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-extrabold text-sm uppercase tracking-wider">No Pending Dynamic Task Submissions</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">All student evidence has been audited successfully.</p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {filteredSubmissions.map((sub: any) => (
                  <Card key={sub.id} className="p-0 border-none bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300 overflow-hidden rounded-2xl">
                    <div className="flex flex-col md:grid md:grid-cols-[260px_1fr_120px_120px_120px] items-center gap-3 p-4 md:py-3 md:px-6">
                      
                      {/* 1. Identity */}
                      <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm shrink-0 border border-indigo-100/35">
                          {sub.profiles?.full_name?.charAt(0) || 'D'}
                        </div>
                        <div className="min-w-0 flex-1 md:flex-none">
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {sub.profiles?.full_name || 'Anonymous User'}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                            {sub.profiles?.email || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* 2. Dynamic Task Name */}
                      <div className="w-full md:w-auto min-w-0 py-1.5 md:py-0 border-y md:border-none border-slate-100 dark:border-slate-800/50">
                        <div className="flex flex-col">
                          <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Campaign Name</span>
                          <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 truncate">
                            {sub.dynamic_tasks?.name || 'Unknown Dynamic Task'}
                          </p>
                        </div>
                      </div>

                      {/* 3. Reward Coins Payout */}
                      <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                        <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider">Reward</span>
                        <div className="flex flex-col md:items-center">
                          <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                            +{formatCompactNumber(sub.dynamic_tasks?.coins || 0)} <span className="text-[9px] uppercase font-bold text-slate-400">Coins</span>
                          </p>
                        </div>
                      </div>

                      {/* 4. Submission Date */}
                      <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                        <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider">Submitted On</span>
                        <div className="flex flex-col md:items-center text-left md:text-center mt-0.5 md:mt-0">
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {new Date(sub.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 tracking-tight mt-0.5">
                            {new Date(sub.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      </div>

                      {/* 5. View Actions */}
                      <div className="w-full md:w-auto mt-2 md:mt-0">
                        <button
                          onClick={() => {
                            setShowSubModal(sub);
                            setIsRejecting(false);
                            setRejectionReason('');
                          }}
                          className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-505 text-white transition-all rounded-xl h-10 md:h-8.5 px-4 font-black text-[10px] uppercase tracking-wider shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>

                    </div>
                  </Card>
                ))}
              </div>
            )}

          </div>
        </motion.div>
      )}

      {/* HISTORY TAB CONTENT WITH SAME STATS & 2 DROPDOWN FILTERS AS SUBMISSIONS */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Approved vs Rejected Dynamic Task Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Approved Dynamic Tasks', value: historyStats.accepted, color: 'emerald', icon: CheckCircle2 },
              { label: 'Rejected Dynamic Tasks', value: historyStats.rejected, color: 'rose', icon: XCircle }
            ].map((stat) => (
              <Card key={stat.label} className="p-6 border-none bg-white dark:bg-slate-900 rounded-[28px] shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-2xl bg-${stat.color}-500/10 dark:bg-${stat.color}-500/15 shrink-0`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">{stat.label}</span>
                    <p className="text-3xl font-black text-slate-950 dark:text-white leading-none tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 2 Dropdowns & Search Filter Area */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Filter 1: Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">
                  Status
                </label>
                <div className="relative">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 select-arrow"
                  >
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Filter 2: Date */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">
                  Date Range
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={timeFilter}
                    onChange={(e: any) => setTimeFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 select-arrow"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Custom Date Inputs */}
            <AnimatePresence>
              {timeFilter === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-150 dark:border-slate-800 overflow-hidden"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase block pl-1">Start Date</span>
                    <input 
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase block pl-1">End Date</span>
                    <input 
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* In-History Search box */}
            <div className="relative pt-2">
              <Search className="absolute left-3.5 top-[58%] -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search processed history by task or applicant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* History Row Records */}
          <div className="space-y-2.5 pb-10">
            {/* Table Header Row on desktops */}
            <div className="hidden md:grid grid-cols-[260px_1fr_120px_120px_120px] gap-4 px-6 py-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              <span>Applicant User</span>
              <span>Dynamic Campaign Title</span>
              <span className="text-center">Coins Reward</span>
              <span className="text-center">Process Status</span>
              <span className="text-right pr-4">Details</span>
            </div>

            {isSubmissionsLoading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading dynamic history...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <Card className="p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/80 bg-transparent flex flex-col items-center justify-center rounded-[32px]">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                  <History className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-extrabold text-sm uppercase tracking-wider">No History Records Available</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Try modifying the status or range parameters.</p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {filteredSubmissions.map((sub: any) => (
                  <Card key={sub.id} className="p-0 border-none bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300 overflow-hidden rounded-2xl">
                    <div className="flex flex-col md:grid md:grid-cols-[260px_1fr_120px_120px_120px] items-center gap-3 p-4 md:py-3 md:px-6">
                      
                      {/* Identity Row */}
                      <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-black text-sm shrink-0 border border-slate-200/40">
                          {sub.profiles?.full_name?.charAt(0) || 'D'}
                        </div>
                        <div className="min-w-0 flex-1 md:flex-none">
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {sub.profiles?.full_name || 'Anonymous User'}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                            {sub.profiles?.email || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Campaign Title Row */}
                      <div className="w-full md:w-auto min-w-0 py-1.5 md:py-0 border-y md:border-none border-slate-100 dark:border-slate-800/50">
                        <div className="flex flex-col">
                          <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Campaign Name</span>
                          <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 truncate">
                            {sub.dynamic_tasks?.name || 'Unknown Dynamic Task'}
                          </p>
                        </div>
                      </div>

                      {/* Coins Reward */}
                      <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                        <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider">Reward</span>
                        <div className="flex flex-col md:items-center">
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">
                            +{formatCompactNumber(sub.dynamic_tasks?.coins || 0)} <span className="text-[9px] uppercase font-bold text-slate-400">Coins</span>
                          </p>
                        </div>
                      </div>

                      {/* Process Status */}
                      <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                        <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider">Status</span>
                        <div className="flex flex-col md:items-center">
                          <Badge 
                            className={cn(
                              "text-[9px] uppercase px-2.5 py-1 font-black border-none tracking-wider rounded-lg shrink-0",
                              sub.status === 'approved' 
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-450"
                            )}
                          >
                            {sub.status === 'approved' ? 'Approved' : 'Rejected'}
                          </Badge>
                        </div>
                      </div>

                      {/* View Action */}
                      <div className="w-full md:w-auto mt-1 md:mt-0">
                        <button
                          onClick={() => {
                            setShowSubModal(sub);
                            setIsRejecting(false);
                            setRejectionReason('');
                          }}
                          className="w-full md:w-auto flex items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-755 text-slate-750 dark:text-slate-300 transition-all rounded-xl h-10 md:h-8.5 px-4 font-black text-[10px] uppercase tracking-wider shadow-sm border border-slate-200/50 dark:border-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>

                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* MANAGE DYNAMIC CAMPAIGNS (PRESERVED EXCELLENT CRUD CONTROLS) */}
      {activeTab === 'campaigns' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Header Action cards for CRUD managing */}
          <Card className="p-6 bg-slate-900 border-none rounded-[28px] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xl font-black tracking-tight">Active Dynamic Campaigns</h4>
              <p className="text-xs text-slate-400 font-medium">Establish user actions, circular site scripts or timer constraints dynamically.</p>
            </div>
            <Button
              onClick={() => { resetForm(); setShowTaskModal(true); }}
              className="px-5 py-3 h-11 text-xs font-black tracking-wider uppercase bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 border-none shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Dynamic Task
            </Button>
          </Card>

          {/* Cards collection */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-[28px] border border-dashed border-slate-200 dark:border-slate-800 p-8">
              <CheckSquare className="w-12 h-12 text-slate-300/80 mx-auto mb-4" />
              <h4 className="text-md font-black text-slate-900 dark:text-white">No campaigns established</h4>
              <p className="text-xs text-slate-400 mt-2 mb-4">Click Add Dynamic Task above to introduce new user campaigns.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map(task => (
                <Card key={task.id} className="p-6 relative border-none bg-white dark:bg-slate-900 shadow-sm rounded-[24px]">
                  <div className="absolute top-4 right-4 z-10 flex gap-1.5">
                    <button 
                      onClick={() => handleEditClick(task)} 
                      className="w-8 h-8 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-full hover:bg-slate-100 cursor-pointer shadow-sm border border-indigo-100/10"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)} 
                      className="w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full hover:bg-rose-100 cursor-pointer shadow-sm border border-rose-100/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-150/50 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        {task.logo_url ? (
                          <img src={task.logo_url} alt={task.name} className="w-full h-full object-cover" />
                        ) : (
                          <CheckSquare className="w-5 h-5 text-indigo-500" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 pr-16">{task.name}</h4>
                        <span className="text-emerald-500 font-black text-xs">
                          +{formatCompactNumber(task.coins)} Coins payout
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed flex-1">
                      {task.description || "No instructions supplied."}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-805/50">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider">Timer constraints</span>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                          {task.timer_enabled ? `${task.timer_seconds}s` : 'Disabled'}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider">Action frame</span>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                          {task.website_link_type === 'link' ? 'Web IFrame' : task.website_link_type === 'new_tab' ? 'Direct URL' : 'Embedded HTML'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                        <span>Current Active Cycle:</span>
                        <span className="font-extrabold text-emerald-500 dark:text-emerald-400 uppercase tracking-wide bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Round {task.current_cycle || 1}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                        <span>Auto Reset:</span>
                        <span className="font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">
                          {task.auto_reset === '24h' ? 'Daily (24h)' : 
                           task.auto_reset === '7d' ? 'Weekly (7d)' : 
                           task.auto_reset === '30d' ? 'Monthly (30d)' : 'Manual Only'}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleResetUserProgress(task)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reactivate Task (New Cycle)
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* THE POPUP DIALOGS - TASK CREATION MODAL */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 w-full max-w-2xl rounded-[32px] p-6 md:p-8 shadow-2xl overflow-y-auto no-scrollbar max-h-[90vh] border border-slate-100 dark:border-slate-850"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/50 mb-6 font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600"><CheckSquare className="w-4 h-4" /></span>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">{editingTaskId ? 'Edit Dynamic Task' : 'Create Dynamic Task'}</h3>
                </div>
                <button 
                  onClick={() => setShowTaskModal(false)} 
                  className="p-2 border-none bg-slate-50 hover:bg-slate-105 dark:bg-slate-800 text-slate-500 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Logo Image URL</label>
                    <input 
                      type="text" 
                      name="logo_url" 
                      value={formData.logo_url} 
                      onChange={handleInputChange}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Task Title *</label>
                    <input 
                      type="text" 
                      name="name" 
                      required
                      value={formData.name} 
                      onChange={handleInputChange}
                      placeholder="E.g., Complete Survey, Watch Teaser"
                      className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Coin Reward *</label>
                    <input 
                      type="number" 
                      name="coins" 
                      required
                      min={1}
                      value={formData.coins} 
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Task Description / Instructions</label>
                    <textarea 
                      name="description" 
                      rows={3}
                      value={formData.description} 
                      onChange={handleInputChange}
                      placeholder="Provide step-by-step description or instructions for the user..."
                      className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3 border-none rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Tutorial Video URL (YouTube Link)</label>
                    <input 
                      type="text" 
                      name="video_url" 
                      value={formData.video_url} 
                      onChange={handleInputChange}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>

                  {/* Timer settings */}
                  <div className="col-span-1 md:col-span-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">Time Countdown Constraint</p>
                      <p className="text-xs text-slate-500 font-medium">Forced user timeline on the screen before approval completes.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        type="button" 
                        onClick={() => handleToggleChange('timer_enabled')}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer",
                          formData.timer_enabled 
                            ? "bg-indigo-600 text-white shadow-sm" 
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        )}
                      >
                        {formData.timer_enabled ? 'ON' : 'OFF'}
                      </button>

                      {formData.timer_enabled && (
                        <div className="flex items-center gap-2 animate-fadeIn">
                          <select 
                            name="timer_seconds" 
                            value={formData.timer_seconds} 
                            onChange={handleInputChange}
                            className="bg-white dark:bg-slate-800 px-3 py-2 border-none rounded-lg text-xs font-extrabold text-indigo-600 select-arrow pr-6 focus:ring-2 focus:ring-indigo-500 transition-all"
                          >
                            <option value={5}>5 Secs</option>
                            <option value={10}>10 Secs</option>
                            <option value={15}>15 Secs</option>
                            <option value={30}>30 Secs</option>
                            <option value={45}>45 Secs</option>
                            <option value={60}>60 Secs</option>
                            <option value={120}>120 Secs</option>
                            <option value={180}>180 Secs</option>
                            <option value={300}>300 Secs</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Website Setup */}
                  <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/40 pb-3">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">Action Site / Script Settings</p>
                      <select 
                        name="website_link_type" 
                        value={formData.website_link_type}
                        onChange={handleInputChange}
                        className="bg-white dark:bg-slate-800 px-3 py-1.5 border-none rounded-lg text-xs font-black text-indigo-600"
                      >
                        <option value="link">🌐 Open URL IFrame</option>
                        <option value="new_tab">🔗 Open in New Tab</option>
                        <option value="html">💻 HTML Code Paste</option>
                      </select>
                    </div>

                    <div className="space-y-1.55">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        {formData.website_link_type === 'link' || formData.website_link_type === 'new_tab' ? 'Website URL Address' : 'Raw Embedded Script Code'}
                      </label>
                      {formData.website_link_type === 'link' || formData.website_link_type === 'new_tab' ? (
                        <input 
                          type="text" 
                          name="website_link" 
                          value={formData.website_link} 
                          onChange={handleInputChange}
                          placeholder="https://example.com/action-target"
                          className="w-full bg-white dark:bg-slate-800 px-4 py-2.5 border-none rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                      ) : (
                        <textarea 
                          name="website_link" 
                          rows={3}
                          value={formData.website_link} 
                          onChange={handleInputChange}
                          placeholder="<script type='text/javascript' src='https://...'></script>"
                          className="w-full bg-white dark:bg-slate-800 px-4 py-2.5 border-none rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Submission Fields */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Required User Submission Field</label>
                    <select 
                      name="submit_type" 
                      value={formData.submit_type} 
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3 border-none rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="link">Only Link Submission (Proof Link Box Only)</option>
                      <option value="message">Only Text Submission (Comment Box Only)</option>
                      <option value="link_message">Both (Proof Link + Comment Box)</option>
                      <option value="off">No Submission Required (Auto Approved)</option>
                    </select>
                  </div>

                  {/* Limit setups */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Task Completion Limit</label>
                    <input 
                      type="number" 
                      name="complete_limit" 
                      min={1}
                      required
                      value={formData.complete_limit} 
                      onChange={handleInputChange}
                      placeholder="E.g. 1"
                      className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3 border-none rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>

                  {/* Auto Reset setups */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Auto Reset Schedule</label>
                    <select
                      name="auto_reset"
                      value={formData.auto_reset || 'manual'}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3 border-none rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    >
                      <option value="manual">Manual Only (Default)</option>
                      <option value="24h">Every 24 Hours</option>
                      <option value="7d">Every 7 Days</option>
                      <option value="30d">Every 30 Days</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium">If enabled, user progress for this task gets cleared automatically based on this schedule.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    onClick={() => setShowTaskModal(false)}
                    className="px-5 py-2.5 bg-slate-150 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider border-none"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isActionLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase bg-indigo-600 text-white border-none shadow-md"
                  >
                    {isActionLoading ? 'Saving...' : editingTaskId ? 'Save Changes' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMISSION ACTION AND DETAILS REVIEW MODAL FOR DYNAMIC SUBMISSIONS */}
      <AnimatePresence>
        {showSubModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/40 backdrop-blur-md font-sans">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if(!isRejecting) setShowSubModal(null); }}
              className="absolute inset-0 bg-slate-950/30"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 150 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-850 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col mt-auto sm:mt-0 border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Dynamic Task Review
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest break-all">
                      SUBMISSION ID: {showSubModal.id}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowSubModal(null)} 
                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 rounded-full cursor-pointer transition-transform duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Account Metadata Detail */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block pl-1">
                      Applicant Profile
                    </span>
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                        {showSubModal.profiles?.full_name}
                      </p>
                      <p className="text-[11px] font-bold text-slate-505 truncate mt-0.5">
                        {showSubModal.profiles?.email}
                      </p>
                      <div className="h-px bg-slate-200/50 dark:bg-slate-800 my-3" />
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl">
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" /> Balance:
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">
                          {formatCompactNumber(showSubModal.profiles?.wallet_balance || 0)} Pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Task Metadata Detail */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block pl-1">
                      Dynamic Task Payload
                    </span>
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight line-clamp-2">
                        {showSubModal.dynamic_tasks?.name}
                      </p>
                      <div className="h-px bg-slate-200/50 dark:bg-slate-800 my-3 hidden sm:block" />
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" /> Payout:
                        </span>
                        <span className="text-sm font-black text-emerald-500">
                          +{formatCompactNumber(showSubModal.dynamic_tasks?.coins || 0)} Pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timelines block */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-[20px] grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Submission Date</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {new Date(showSubModal.created_at).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Submission Time</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {new Date(showSubModal.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>

                {/* Submitted Proof Payload Area (Link, Msg, Text details) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block pl-1">
                    Provided Verification Evidence
                  </span>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/50 dark:border-slate-800 space-y-4">
                    {/* Submitted Link */}
                    {showSubModal.link && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Submitted Reference Link:</span>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={showSubModal.link} 
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-850 border border-slate-150 rounded-xl text-xs font-mono text-slate-500 focus:outline-none"
                          />
                          <a 
                            href={showSubModal.link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Link
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Submitted Message */}
                    {showSubModal.message && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Audited Comments Message:</span>
                        <blockquote className="text-xs font-semibold text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-850 p-4 border border-slate-100 rounded-xl leading-relaxed">
                          "{showSubModal.message}"
                        </blockquote>
                      </div>
                    )}

                    {!showSubModal.link && !showSubModal.message && (
                      <div className="p-4 text-center text-slate-450 italic text-xs">
                        Direct execution complete. No link or comments validation fields configured.
                      </div>
                    )}
                  </div>
                </div>

                {/* If already completed history show the process details */}
                {showSubModal.status !== 'pending' && (
                  <div className={cn(
                    "p-4 rounded-2xl border text-xs font-bold leading-relaxed flex items-start gap-2.5",
                    showSubModal.status === 'approved' 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" 
                      : "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-450"
                  )}>
                    {showSubModal.status === 'approved' ? (
                      <>
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-700 dark:text-emerald-400">Audited Result: Approved</p>
                          <p className="mt-1 font-medium select-none">This dynamic task submission was approved and coins credited to user balance.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold uppercase text-[10px] tracking-wider text-rose-700 dark:text-rose-400">Audited Result: Rejected</p>
                          <p className="mt-1 font-medium">This dynamic task submission was rejected by the admin.</p>
                          {showSubModal.rejection_reason && (
                            <p className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-450 bg-white dark:bg-slate-800 p-2 rounded-lg border border-rose-150/10">
                              Reason: "{showSubModal.rejection_reason}"
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Detailed rejection dialog */}
                <AnimatePresence>
                  {isRejecting && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-5 bg-rose-50/50 dark:bg-rose-500/5 rounded-2xl border border-rose-150 dark:border-rose-500/20 space-y-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">
                          Provide Rejection Reason
                        </span>
                        <button 
                          onClick={() => {
                            setIsRejecting(false);
                            setRejectionReason('');
                          }} 
                          className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider py-0.5 px-2 bg-slate-100 dark:bg-slate-800 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea 
                        placeholder="State clearly why this proof is invalid so the user can fix and resubmit..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl text-xs sm:text-sm border-none shadow-sm text-slate-700 dark:text-slate-200 font-semibold focus:ring-1 focus:ring-rose-500 resize-none outline-none"
                      />
                      <Button 
                        type="button"
                        isLoading={isActionLoading}
                        onClick={handleRejectSubmission}
                        className="w-full bg-rose-600 hover:bg-rose-750 text-white rounded-xl h-11 text-xs font-black uppercase tracking-wider shadow-md"
                      >
                        Submit rejection Reason
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Action Buttons Footer (sticky inside bottom bounds) */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 shrink-0">
                <Button 
                  type="button" 
                  onClick={() => setShowSubModal(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider border-none h-11 sm:h-auto font-sans"
                >
                  Close Panel
                </Button>

                {showSubModal.status === 'pending' && !isRejecting && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button 
                      disabled={isActionLoading}
                      onClick={() => setIsRejecting(true)}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-black uppercase tracking-wider border-none h-11 sm:h-auto shrink-0"
                    >
                      <XCircle className="w-4 h-4 mr-1.5 inline" />
                      Reject
                    </Button>
                    <Button 
                      isLoading={isActionLoading}
                      onClick={() => handleApproveSubmission(showSubModal)}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider border-none h-11 sm:h-auto shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                      Approve & Pay
                    </Button>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

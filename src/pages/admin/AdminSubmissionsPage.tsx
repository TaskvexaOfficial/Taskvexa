import React, { useState, useEffect } from 'react';
import { triggerPushNotification } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatCompactNumber, cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  X, 
  ImageIcon, 
  MessageSquare, 
  ExternalLink, 
  Search, 
  History, 
  ListChecks, 
  Filter, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  User, 
  Wallet,
  Coins,
  FileText
} from 'lucide-react';
import { useStore } from '@/store';
import { motion, AnimatePresence } from 'motion/react';
import { usePersistedState } from '@/hooks/usePersistedState';

export default function AdminSubmissionsPage() {
  const { cachedAdminSubmissions, setCachedAdminSubmissions } = useStore();
  const [allSubmissions, setAllSubmissions] = useState<any[]>(cachedAdminSubmissions || []);
  const [isLoading, setIsLoading] = useState(!cachedAdminSubmissions || cachedAdminSubmissions.length === 0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab ] = usePersistedState<'submissions' | 'history'>('admin_subs_activeTab', 'submissions');
  
  // Filter states
  const [searchQuery, setSearchQuery] = usePersistedState('admin_subs_searchQuery', '');
  const [statusFilter, setStatusFilter] = usePersistedState<'all' | 'approved' | 'rejected'>('admin_subs_statusFilter', 'all');
  const [timeFilter, setTimeFilter] = usePersistedState<'all' | 'today' | 'week' | 'month' | 'custom'>('admin_subs_timeFilter', 'all');
  const [customStartDate, setCustomStartDate] = usePersistedState('admin_subs_customStartDate', '');
  const [customEndDate, setCustomEndDate] = usePersistedState('admin_subs_customEndDate', '');
  
  // Modal states
  const [selectedSub, setSelectedSub] = usePersistedState<any | null>('admin_subs_selectedSub', null);
  const [isRejecting, setIsRejecting] = usePersistedState('admin_subs_isRejecting', false);
  const [rejectionData, setRejectionData] = usePersistedState('admin_subs_rejectionData', { image: '', message: '' });
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [setCachedAdminSubmissions]);

  async function fetchSubmissions() {
    setFetchError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      let parsedData: any[] = [];

      if (data) {
        const taskIds = [...new Set(data.filter(s => s.task_id).map(s => s.task_id))];
        const userIds = [...new Set(data.filter(s => s.user_id).map(s => s.user_id))];
        
        let tasksMap: any = {};
        let profilesMap: any = {};

        if (taskIds.length > 0) {
          const { data: tasksData } = await supabase.from('tasks').select('id, title, coins').in('id', taskIds);
          if (tasksData) tasksData.forEach(t => tasksMap[t.id] = t);
        }
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase.from('profiles').select('id, full_name, email, wallet_balance').in('id', userIds);
          if (profilesData) profilesData.forEach(p => profilesMap[p.id] = p);
        }

        parsedData = data.map(sub => ({
          ...sub,
          isDynamic: false,
          tasks: tasksMap[sub.task_id] || { title: 'Unknown Task', coins: 0 },
          profiles: profilesMap[sub.user_id] || { full_name: 'Deleted User', email: 'N/A', id: sub.user_id || 'deleted', wallet_balance: 0, is_deleted: true }
        }));
      }

      parsedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAllSubmissions(parsedData);
      setCachedAdminSubmissions(parsedData);

      if (error) console.error('Error fetching standard submissions:', error);

    } catch (err: any) {
      console.error('Unified load error:', err);
      setFetchError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  // Filter Logic
  const filteredSubmissions = allSubmissions.filter(sub => {
    // Tab filtering
    if (activeTab === 'submissions') {
      if (sub.status !== 'pending') return false;
    } else {
      if (sub.status === 'pending') return false;
    }

    // Search filtering
    if (searchQuery && !sub.tasks?.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !sub.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filtering (only for history)
    if (activeTab === 'history' && statusFilter !== 'all' && sub.status !== statusFilter) {
      return false;
    }

    // Time filtering (only for history)
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

  const pendingCount = allSubmissions.filter(s => s.status === 'pending').length;

  // History stats based on time filter
  const getHistoryStats = () => {
    const historySubs = allSubmissions.filter(s => s.status !== 'pending');
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

  const handleApprove = async () => {
    if (!selectedSub) return;
    setIsActionLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/admin/approve-standard-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submission_id: selectedSub.id })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Server approval failed');
      }
      
      alert('Task Approved & User Paid Successfully!');
      setSelectedSub(null);
      await fetchSubmissions();
    } catch (error: any) {
      console.error('CRITICAL Approving error:', error);
      alert('Action FAILED: ' + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSub) {
      alert('Selected submission not found');
      return;
    }
    
    const reason = (rejectionData.message || '').trim();
    if (!reason) {
      alert('Please provide a reason for rejection.');
      return;
    }
    
    setIsActionLoading(true);
    
    try {
      // 1. Fetch current profile
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('total_tasks_pending')
        .eq('id', selectedSub.user_id)
        .single();
        
      if (profileFetchError) {
        console.error('Error fetching profile for rejection:', profileFetchError);
        throw new Error('Could not find user profile');
      }

      // 2. Update Profile Stats (Decrease pending count)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          total_tasks_pending: Math.max(0, (profile.total_tasks_pending || 0) - 1) 
        })
        .eq('id', selectedSub.user_id);
      
      if (profileUpdateError) {
        console.error('Error updating profile pending count:', profileUpdateError);
        throw new Error('Failed to update profile statistics');
      }

      // 3. Update Submission Status
      const submissionsTable = selectedSub.isDynamic ? 'dynamic_task_submissions' : 'task_submissions';
      const updatePayload: any = { status: 'rejected' };
      if (selectedSub.isDynamic) {
        updatePayload.rejection_reason = reason;
      } else {
        updatePayload.reject_reason = reason;
      }

      const { error: submissionError } = await supabase
        .from(submissionsTable)
        .update(updatePayload)
        .eq('id', selectedSub.id);

      if (submissionError) {
        console.error('Error updating submission to rejected:', submissionError);
        throw new Error('Failed to update submission status');
      }
      
      // 4. Create Notification
      await supabase.from('notifications').insert([{
        user_id: selectedSub.user_id,
        title: 'Task Rejected ❌',
        message: `Your proof for "${selectedSub.tasks?.title}" was rejected. Reason: ${reason}`,
        type: 'error'
      }]);

      triggerPushNotification(
        selectedSub.user_id,
        'Task Rejected ❌',
        `Your proof for "${selectedSub.tasks?.title}" was rejected. Reason: ${reason}`
      ).catch(err => console.error('[FCM] Task rejected push failed', err));
      
      alert('Task Rejected Successfully!');
      
      // Cleanup
      setIsRejecting(false);
      setRejectionData({ image: '', message: '' });
      setSelectedSub(null);
      await fetchSubmissions();
      
    } catch (error: any) {
      console.error('Rejection error:', error);
      alert('Error rejecting task: ' + (error.message || 'Unknown error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-4 lg:px-8">
      {/* Header & Subheader Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Submission Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
            Redesigned verification portal for standard and dynamic workflow approvals.
          </p>
        </div>

        {/* Global tab Switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800 self-start md:self-auto w-full md:w-auto">
          <button
            id="tab-submissions"
            onClick={() => {
              setActiveTab('submissions');
              setSearchQuery('');
            }}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === 'submissions'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-[1.02]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <ListChecks className="w-3.5 h-3.5" />
            Submissions
          </button>
          <button
            id="tab-history"
            onClick={() => {
              setActiveTab('history');
              setSearchQuery('');
            }}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === 'history'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-[1.02]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>

      {/* SUBMISSIONS TAB CONTENT */}
      {activeTab === 'submissions' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Level Custom Stat Card - Total Pending Submissions */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="relative overflow-hidden p-6 sm:p-8 border-none bg-gradient-to-r from-indigo-50 leading-none to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 rounded-[28px] shadow-sm">
              <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
                <ListChecks className="w-56 h-56 text-indigo-900 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Verification Queue</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Total Pending Submissions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md">
                    Waiting for approval. Verify submitted proof links and message logs before crediting rewards.
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-sm border border-indigo-100/40 dark:border-indigo-950 self-start sm:self-auto shrink-0">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Pending Requests</span>
                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{pendingCount}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Search for queue */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search current submissions by user or task name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>

          {/* Pending Submissions Horizontal Row Layout */}
          <div className="space-y-3 pb-10">
            {/* Table Header Row on desktops */}
            <div className="hidden md:grid grid-cols-[260px_1fr_120px_120px_120px] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              <span>Identity</span>
              <span>Task Campaign / Action</span>
              <span className="text-center">Coins Payout</span>
              <span className="text-center">Submitted Date</span>
              <span className="text-right pr-4">Action</span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div id="loading" className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <Card className="p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/80 bg-transparent flex flex-col items-center justify-center rounded-[32px]">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-extrabold text-sm uppercase tracking-wider">No Pending Items Found</p>
                <p className="text-xs text-slate-400 mt-1">All submissions have been fully audited and completed!</p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {filteredSubmissions.map((sub: any) => (
                  <Card key={sub.id} className="p-0 border-none bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300 overflow-hidden rounded-2xl">
                    <div className="flex flex-col md:grid md:grid-cols-[260px_1fr_120px_120px_120px] items-center gap-3 p-4 md:py-3 md:px-6">
                      
                      {/* 1. Identity Column (Left-to-Right structure) */}
                      <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm shrink-0 border border-indigo-100/30">
                          {sub.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1 md:flex-none">
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {sub.profiles?.full_name || 'Anonymous'}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                            {sub.profiles?.email || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* 2. Task Title Column */}
                      <div className="w-full md:w-auto min-w-0 py-1.5 md:py-0 border-y md:border-none border-slate-50 dark:border-slate-800/50">
                        <div className="flex flex-col">
                          <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Task Name</span>
                          <div className="flex items-center gap-2">
                            {sub.isDynamic && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-none px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0 rounded-md">
                                DYNAMIC
                              </Badge>
                            )}
                            <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 truncate">
                              {sub.tasks?.title || 'Unknown Task'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 3. Reward Coins */}
                      <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                        <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider">Reward</span>
                        <div className="flex flex-col md:items-center">
                          <p className="text-sm font-black text-emerald-500 tracking-tight flex items-center gap-1">
                            +{formatCompactNumber(sub.tasks?.coins || 0)}
                            <span className="text-[9px] uppercase font-bold text-slate-400">Coins</span>
                          </p>
                        </div>
                      </div>

                      {/* 4. Submission Date */}
                      <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                        <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider">Submitted On</span>
                        <div className="flex flex-col md:items-center text-left md:text-center mt-0.5 md:mt-0">
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {new Date(sub.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 tracking-tight mt-0.5">
                            {new Date(sub.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      </div>

                      {/* 5. Actions */}
                      <div className="w-full md:w-auto mt-2 md:mt-0">
                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setIsRejecting(false);
                            setRejectionData({ image: '', message: '' });
                          }}
                          className="w-full md:w-auto flex items-center justify-center gap-1 bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white transition-all rounded-xl h-10 md:h-8.5 px-4 font-black text-[10px] uppercase tracking-wider shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Verify
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

      {/* HISTORY TAB CONTENT */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* History Upper Stats Panel: Total Approved vs Rejected Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Approved Submissions', value: historyStats.accepted, color: 'emerald', icon: CheckCircle2, gradient: 'from-emerald-50 to-emerald-100/30 dark:from-emerald-950/20' },
              { label: 'Rejected Submissions', value: historyStats.rejected, color: 'rose', icon: XCircle, gradient: 'from-rose-50 to-rose-100/30 dark:from-rose-950/20' }
            ].map((stat) => (
              <Card key={stat.label} className={cn("p-6 border-none bg-gradient-to-br bg-white dark:bg-slate-900 rounded-[28px] shadow-sm relative overflow-hidden")}>
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

          {/* Redesigned 2 Dropdown Filters Side-by-Side as Required */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Filter 1: Dropdown - Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">
                  Filter 1: Status
                </label>
                <div className="relative">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-none rounded-xl text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 select-arrow"
                  >
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Filter 2: Dropdown - Date */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">
                  Filter 2: Review Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={timeFilter}
                    onChange={(e: any) => setTimeFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-none rounded-xl text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 select-arrow"
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

            {/* Custom Date Picker Inputs when Custom selected */}
            <AnimatePresence>
              {timeFilter === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-hidden"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase block pl-1">Start Date</span>
                    <input 
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold font-sans outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase block pl-1">End Date</span>
                    <input 
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold font-sans outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
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
                placeholder="Search history by task or user name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* History Lists Row layout */}
          <div className="space-y-2.5 pb-10">
            {/* Table Header Row on desktops */}
            <div className="hidden md:grid grid-cols-[260px_1fr_120px_120px_120px] gap-4 px-6 py-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              <span>Identity</span>
              <span>Task Campaign / Action</span>
              <span className="text-center">Coins Payout</span>
              <span className="text-center">Process Status</span>
              <span className="text-right pr-4">Details</span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading history...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <Card className="p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/80 bg-transparent flex flex-col items-center justify-center rounded-[32px]">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                  <History className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-extrabold text-sm uppercase tracking-wider">No History Records Available</p>
                <p className="text-xs text-slate-400 mt-1">Adjust selected dropdown filters, search terms or time limits.</p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {filteredSubmissions.map((sub: any) => (
                  <Card key={sub.id} className="p-0 border-none bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300 overflow-hidden rounded-2xl">
                    <div className="flex flex-col md:grid md:grid-cols-[260px_1fr_120px_120px_120px] items-center gap-3 p-4 md:py-3 md:px-6">
                      
                      {/* Identity Row */}
                      <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-black text-sm shrink-0 border border-slate-200/40">
                          {sub.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1 md:flex-none">
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {sub.profiles?.full_name || 'Anonymous'}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                            {sub.profiles?.email || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Task Info Row */}
                      <div className="w-full md:w-auto min-w-0 py-1.5 md:py-0 border-y md:border-none border-slate-50 dark:border-slate-800/50">
                        <div className="flex flex-col">
                          <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Task Name</span>
                          <div className="flex items-center gap-2">
                            {sub.isDynamic && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-none px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0 rounded-md">
                                DYNAMIC
                              </Badge>
                            )}
                            <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 truncate">
                              {sub.tasks?.title || 'Unknown Task'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reward coins */}
                      <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                        <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider">Reward</span>
                        <div className="flex flex-col md:items-center">
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight flex items-center gap-1">
                            +{formatCompactNumber(sub.tasks?.coins || 0)}
                            <span className="text-[9px] uppercase font-bold text-slate-450 dark:text-slate-500">Coins</span>
                          </p>
                        </div>
                      </div>

                      {/* Process Status with beautiful custom Badge colors */}
                      <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                        <span className="md:hidden text-[8px] font-black text-slate-400 uppercase tracking-wider">Timeline</span>
                        <div className="flex flex-col md:items-center">
                          <Badge 
                            className={cn(
                              "text-[9px] uppercase px-2.5 py-1 font-black border-none tracking-wider rounded-lg shrink-0",
                              sub.status === 'approved' 
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                            )}
                          >
                            {sub.status === 'approved' ? 'Approved' : 'Rejected'}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="w-full md:w-auto mt-1 md:mt-0">
                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setIsRejecting(false);
                            setRejectionData({ image: '', message: '' });
                          }}
                          className="w-full md:w-auto flex items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-all rounded-xl h-10 md:h-8.5 px-4 font-black text-[10px] uppercase tracking-wider shadow-sm border border-slate-200/50 dark:border-slate-800"
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

      {/* SUBMISSION DETAILS MODAL - FULLY RESPONSIVE FOR MOBILE (No overflows, readable layout) */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if(!isRejecting) setSelectedSub(null); }}
              className="absolute inset-0 bg-slate-950/30"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 150 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-850 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col mt-auto sm:mt-0 border border-slate-100 dark:border-slate-800"
            >
              {/* Modal Body with Scrollbar protection */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Verification Panel
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest break-all">
                      SUBMISSION ID: {selectedSub.id}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedSub(null)} 
                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 rounded-full cursor-pointer transition-transform duration-200 active:scale-90"
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
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800/85">
                      <p className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                        {selectedSub.profiles?.full_name}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 tracking-tight truncate mt-0.5">
                        {selectedSub.profiles?.email}
                      </p>
                      <div className="h-px bg-slate-200/50 dark:bg-slate-800 my-3" />
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl">
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" />
                          Balance:
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">
                          {formatCompactNumber(selectedSub.profiles?.wallet_balance || 0)} Pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Task Metadata Detail */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block pl-1">
                      Campaign Payload
                    </span>
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800/85">
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight line-clamp-2">
                        {selectedSub.tasks?.title}
                      </p>
                      <div className="h-px bg-slate-200/50 dark:bg-slate-800 my-3 hidden sm:block" />
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          Payout:
                        </span>
                        <span className="text-sm font-black text-emerald-500">
                          +{formatCompactNumber(selectedSub.tasks?.coins || 0)} Pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time block */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-[20px] grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Submission Date</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {new Date(selectedSub.created_at).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Submission Time</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {new Date(selectedSub.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>

                {/* Submitted Proof Payload Area (Link, Msg, Text details) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block pl-1">
                    Provided Verification Evidence
                  </span>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/50 dark:border-slate-800/80 space-y-4">
                    {/* 1. Submitted Proof Text */}
                    {selectedSub.proof_text && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Submission Proof Texts:</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-850 p-4 rounded-xl leading-relaxed break-words whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
                          {selectedSub.proof_text}
                        </p>
                      </div>
                    )}

                    {/* 2. Submitted Proof Link */}
                    {selectedSub.link && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Submitted Reference Link:</span>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={selectedSub.link} 
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-500 focus:outline-none"
                          />
                          <a 
                            href={selectedSub.link} 
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

                    {/* 3. Message Submitted */}
                    {selectedSub.message && (
                      <div className="space-y-1 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Applicant Comment Note:</span>
                        <blockquote className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-850/50 p-3.5 border-l-2 border-slate-300 dark:border-slate-700 rounded-r-xl">
                          "{selectedSub.message}"
                        </blockquote>
                      </div>
                    )}

                    {!selectedSub.proof_text && !selectedSub.link && !selectedSub.message && (
                      <div className="p-4 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                        Direct execution campaign. No text comments or active link audits required for validation.
                      </div>
                    )}
                  </div>
                </div>

                {/* If already completed history show the process details */}
                {selectedSub.status !== 'pending' && (
                  <div className={cn(
                    "p-4 rounded-2xl border text-xs font-bold leading-relaxed flex items-start gap-2.5",
                    selectedSub.status === 'approved' 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" 
                      : "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-450"
                  )}>
                    {selectedSub.status === 'approved' ? (
                      <>
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-700 dark:text-emerald-400">Audited Result: Approved</p>
                          <p className="mt-1 font-medium select-none">This submission has already been fully approved and reward has been credited to user balance.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold uppercase text-[10px] tracking-wider text-rose-700 dark:text-rose-400">Audited Result: Rejected</p>
                          <p className="mt-1 font-medium">This submission was rejected by the admin.</p>
                          {(selectedSub.reject_reason || selectedSub.rejection_reason) && (
                            <p className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-lg border border-rose-150/10">
                              Reason: "{selectedSub.reject_reason || selectedSub.rejection_reason}"
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Rejection Dialogue Interface Text Box */}
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
                            setRejectionData({ ...rejectionData, message: '' });
                          }} 
                          className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider py-0.5 px-2 bg-slate-100 dark:bg-slate-800 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea 
                        placeholder="State clearly why this proof is invalid so the user can fix and resubmit..."
                        value={rejectionData.message}
                        onChange={(e) => setRejectionData({ ...rejectionData, message: e.target.value })}
                        rows={3}
                        className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl text-xs sm:text-sm border-none shadow-sm text-slate-700 dark:text-slate-200 font-semibold focus:ring-1 focus:ring-rose-500 resize-none outline-none"
                      />
                      <Button 
                        type="button"
                        isLoading={isActionLoading}
                        onClick={handleReject}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 text-xs font-black uppercase tracking-wider shadow-md shadow-rose-650/10"
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
                  onClick={() => setSelectedSub(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider border-none h-11 sm:h-auto font-sans"
                >
                  Close Panel
                </Button>

                {selectedSub.status === 'pending' && !isRejecting && (
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
                      onClick={handleApprove}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider border-none h-11 sm:h-auto shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                      Approve
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

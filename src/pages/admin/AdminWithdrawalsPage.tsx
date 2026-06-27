import React, { useState, useEffect } from 'react';
import { triggerPushNotification } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatCompactNumber, cn } from '@/lib/utils';
import { useStore } from '@/store';
import { motion, AnimatePresence } from 'motion/react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { Link } from 'react-router-dom';
import { Eye, X, CheckCircle2, XCircle, Clock, Wallet, User, Mail, CreditCard, Calendar, Search, History, ListChecks } from 'lucide-react';

const parseAccountInfo = (infoValue: any) => {
  if (!infoValue) return { name: 'N/A', number: 'N/A', bank: '', network: '' };
  if (typeof infoValue === 'object') return infoValue;
  try {
    return JSON.parse(infoValue);
  } catch (e) {
    return { name: 'N/A', number: infoValue, bank: '', network: '' };
  }
};

export default function AdminWithdrawalsPage() {
  const { cachedAdminWithdrawals, setCachedAdminWithdrawals } = useStore();
  const [allWithdrawals, setAllWithdrawals] = useState<any[]>(cachedAdminWithdrawals || []);
  const [isLoading, setIsLoading] = useState(!cachedAdminWithdrawals || cachedAdminWithdrawals.length === 0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = usePersistedState<any | null>('admin_withdrawals_selected', null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRejecting, setIsRejecting] = usePersistedState('admin_withdrawals_isRejecting', false);
  const [rejectReason, setRejectReason] = usePersistedState('admin_withdrawals_rejectReason', '');
  
  // Tab state
  const [activeTab, setActiveTab] = usePersistedState<'withdrawals' | 'history'>('admin_withdrawals_activeTab', 'withdrawals');
  
  // Filter states
  const [searchQuery, setSearchQuery] = usePersistedState('admin_withdrawals_searchQuery', '');
  const [statusFilter, setStatusFilter] = usePersistedState<'all' | 'approved' | 'rejected'>('admin_withdrawals_statusFilter', 'all');
  const [timeFilter, setTimeFilter] = usePersistedState<'all' | 'today' | 'week' | 'month'>('admin_withdrawals_timeFilter', 'all');

  useEffect(() => {
    fetchWithdrawals();
  }, [setCachedAdminWithdrawals]);

  async function fetchWithdrawals() {
    setFetchError(null);

    const { data, error } = await supabase
      .from('withdrawals')
      .select(`
        *,
        profiles ( full_name, email, avatar_url, wallet_balance, total_withdraw )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setAllWithdrawals(data);
      setCachedAdminWithdrawals(data);
    }
    if (error) {
      console.error('Error fetching withdrawals:', error);
      setFetchError(error.message);
    }
    setIsLoading(false);
  }

  // Filter Logic
  const filteredWithdrawals = allWithdrawals.filter(w => {
    // Tab filtering
    if (activeTab === 'withdrawals') {
      if (w.status !== 'pending') return false;
    } else {
      if (w.status === 'pending') return false;
    }

    // Search filtering
    const matchesSearch = 
      w.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.amount.toString().includes(searchQuery) ||
      parseAccountInfo(w.account_info).number?.includes(searchQuery);

    if (searchQuery && !matchesSearch) return false;

    // Status filtering (only for history)
    if (activeTab === 'history' && statusFilter !== 'all' && w.status !== statusFilter) {
      return false;
    }

    // Time filtering (only for history)
    if (activeTab === 'history' && timeFilter !== 'all') {
      const subDate = new Date(w.created_at);
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
      }
    }

    return true;
  });

  const pendingCount = allWithdrawals.filter(w => w.status === 'pending').length;

  // History stats
  const getHistoryStats = () => {
    const historySubs = allWithdrawals.filter(w => w.status !== 'pending');
    let filteredHistory = historySubs;
    
    if (timeFilter !== 'all') {
      const now = new Date();
      if (timeFilter === 'today') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        filteredHistory = historySubs.filter(w => new Date(w.created_at) >= startOfDay);
      } else if (timeFilter === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - 7));
        filteredHistory = historySubs.filter(w => new Date(w.created_at) >= startOfWeek);
      } else if (timeFilter === 'month') {
        const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));
        filteredHistory = historySubs.filter(w => new Date(w.created_at) >= startOfMonth);
      }
    }

    return {
      approved: filteredHistory.filter(w => w.status === 'approved').length,
      rejected: filteredHistory.filter(w => w.status === 'rejected').length,
      total: filteredHistory.length,
      amount: filteredHistory.filter(w => w.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0)
    };
  };

  const historyStats = getHistoryStats();

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;

    setIsProcessing(true);
    try {
      // 1. Fetch current profile to check balance and update stats
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('wallet_balance, total_withdraw')
        .eq('id', selectedWithdrawal.user_id)
        .single();
        
      if (profileFetchError) throw new Error("Could not fetch user profile");
      
      if (profile.wallet_balance < selectedWithdrawal.amount) {
        throw new Error(`Insufficient Balance: User only has ${formatCompactNumber(profile.wallet_balance)} Coins.`);
      }

      // 2. Update Profile Stats (Deduct Balance here)
      const newBalance = (profile.wallet_balance || 0) - selectedWithdrawal.amount;
      const newTotalWithdraw = (profile.total_withdraw || 0) + selectedWithdrawal.amount;

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: newBalance,
          total_withdraw: newTotalWithdraw
        })
        .eq('id', selectedWithdrawal.user_id);

      if (profileUpdateError) throw new Error("Could not update user profile balance");

      // Create Notification
      await supabase.from('notifications').insert([{
        user_id: selectedWithdrawal.user_id,
        title: 'Withdrawal Approved! ✅',
        message: `Your withdrawal of ${formatCompactNumber(selectedWithdrawal.amount)} Coins has been approved and processed.`,
        type: 'success'
      }]);

      triggerPushNotification(
        selectedWithdrawal.user_id,
        'Withdrawal Approved! ✅',
        `Your withdrawal of ${formatCompactNumber(selectedWithdrawal.amount)} Coins has been approved and processed.`
      ).catch(err => console.error('[FCM] Withdrawal approved push failed', err));

      // Generate Receipt Data
      const receiptNumber = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const approvedAt = new Date().toISOString();

      // Final: Update Withdrawal Status
      const { error: withdrawalUpdateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'approved', 
          receipt_number: receiptNumber,
          approved_at: approvedAt,
          feedback_status: 'pending'
        })
        .eq('id', selectedWithdrawal.id);

      if (withdrawalUpdateError) throw new Error("Could not update withdrawal status");

      setSelectedWithdrawal(null);
      await fetchWithdrawals();
      alert(`Withdrawal approved successfully!`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;
    const reason = rejectReason.trim();
    if (!reason) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Update Withdrawal Status
      const { error: withdrawalUpdateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', selectedWithdrawal.id);

      if (withdrawalUpdateError) throw new Error("Could not update withdrawal status");

      // 2. Create Notification
      await supabase.from('notifications').insert([{
        user_id: selectedWithdrawal.user_id,
        title: 'Withdrawal Rejected ❌',
        message: `Your withdrawal request of ${formatCompactNumber(selectedWithdrawal.amount)} Coins was rejected. Reason: ${reason}`,
        type: 'error'
      }]);

      triggerPushNotification(
        selectedWithdrawal.user_id,
        'Withdrawal Rejected ❌',
        `Your withdrawal request of ${formatCompactNumber(selectedWithdrawal.amount)} Coins was rejected. Reason: ${reason}`
      ).catch(err => console.error('[FCM] Withdrawal rejected push failed', err));

      setSelectedWithdrawal(null);
      setIsRejecting(false);
      setRejectReason('');
      await fetchWithdrawals();
      alert(`Withdrawal rejected successfully!`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* Header & Top Summary */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Withdrawals</h2>
            <p className="text-slate-500 font-medium">Verify and process user withdrawal requests.</p>
          </div>
          <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-500/10 px-6 py-4 rounded-[24px] border border-amber-100 dark:border-amber-500/20 shadow-sm">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Queue Size</p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 leading-none">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-[24px] border border-slate-100 dark:border-slate-800 flex gap-1 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={cn(
              "px-8 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3",
              activeTab === 'withdrawals' 
                ? "bg-amber-600 text-white shadow-lg shadow-amber-200 dark:shadow-none scale-[1.02]" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <Wallet className="w-4 h-4" />
            Withdrawals
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-8 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3",
              activeTab === 'history' 
                ? "bg-amber-600 text-white shadow-lg shadow-amber-200 dark:shadow-none scale-[1.02]" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {activeTab === 'history' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-6"
        >
          {/* History Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Approved', value: historyStats.approved, color: 'emerald', icon: CheckCircle2 },
              { label: 'Rejected', value: historyStats.rejected, color: 'rose', icon: XCircle },
              { label: 'Total Paid', value: `${formatCompactNumber(historyStats.amount)}`, color: 'amber', icon: Wallet },
              { label: 'Processed', value: historyStats.total, color: 'slate', icon: History }
            ].map((stat) => (
              <Card key={stat.label} className="p-6 border-none bg-white dark:bg-slate-800 rounded-[32px] shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-${stat.color === 'emerald' ? 'emerald' : stat.color === 'rose' ? 'rose' : stat.color === 'amber' ? 'amber' : 'slate'}-50 dark:bg-${stat.color === 'emerald' ? 'emerald' : stat.color === 'rose' ? 'rose' : stat.color === 'amber' ? 'amber' : 'slate'}-500/10`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color === 'emerald' ? 'emerald' : stat.color === 'rose' ? 'rose' : stat.color === 'amber' ? 'amber' : 'slate'}-500`} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-black text-${stat.color === 'emerald' ? 'emerald' : stat.color === 'rose' ? 'rose' : stat.color === 'amber' ? 'amber' : 'slate'}-500/60 uppercase tracking-widest leading-none mb-1`}>{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* History Filters */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search user, ID or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                />
              </div>

              {/* Status Filter */}
              <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl">
                {(['all', 'approved', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      statusFilter === f 
                        ? "bg-white dark:bg-slate-800 text-amber-600 shadow-sm" 
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>

              {/* Time Filter */}
              <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl">
                {(['all', 'today', 'week', 'month'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      timeFilter === f 
                        ? "bg-white dark:bg-slate-800 text-amber-600 shadow-sm" 
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {f === 'all' ? 'All Time' : f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results List */}
      <div className="space-y-3 pb-8">
        {/* Header Row - Only on Desktop */}
        <div className="hidden lg:grid grid-cols-[240px_1fr_120px_120px_120px] gap-4 px-8 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
          <span>Beneficiary</span>
          <span>Payment Info</span>
          <span className="text-center">Amount</span>
          <span className="text-center">Timeline</span>
          <span className="text-right pr-4">{activeTab === 'withdrawals' ? 'Action' : 'Status'}</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Accounts...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWithdrawals.map((req: any) => (
              <Card key={req.id} className="p-0 border-none overflow-hidden hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300">
                <div className="flex flex-col lg:grid lg:grid-cols-[240px_1fr_120px_120px_120px] gap-4 lg:items-center items-stretch p-5 lg:p-3 lg:px-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                  {/* User Section */}
                  <div className="flex items-center gap-4 w-full lg:w-auto text-left">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black shrink-0 border border-amber-100/50 dark:border-amber-500/20 text-sm">
                      {req.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-900 dark:text-white text-xs truncate uppercase tracking-tight">{req.profiles?.full_name || 'User'}</p>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate">{req.profiles?.email}</p>
                    </div>
                  </div>

                  {/* Method & Info Section */}
                  <div className="w-full lg:w-auto min-w-0 py-3 lg:py-0 border-y lg:border-none border-slate-100 dark:border-slate-800/80 flex items-center gap-3 text-left">
                    <div className="flex flex-col min-w-0 w-full">
                      <span className="lg:hidden text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Payment Request</span>
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{req.method}</span>
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 break-all font-mono">{parseAccountInfo(req.account_info).number}</p>
                    </div>
                  </div>

                  {/* Amount Section */}
                  <div className="flex lg:justify-center items-center w-full lg:w-auto text-left lg:text-center py-1 lg:py-0">
                    <div className="flex flex-col lg:items-center w-full">
                      <span className="lg:hidden text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Value</span>
                      <p className="text-[13px] font-black text-amber-500 dark:text-amber-400 tracking-tighter">
                        {formatCompactNumber(req.amount)} <span className="text-[9px] uppercase ml-0.5 opacity-60">Pts</span>
                      </p>
                    </div>
                  </div>

                  {/* Date Section */}
                  <div className="flex lg:justify-center items-center w-full lg:w-auto text-left lg:text-center py-1 lg:py-0">
                    <div className="flex flex-col lg:items-center w-full">
                      <span className="lg:hidden text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 font-sans">Requested</span>
                      <div className="flex flex-row lg:flex-col lg:items-center gap-2 lg:gap-0 font-sans">
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-tighter">
                          {new Date(req.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-tighter lg:mt-0.5">
                          {new Date(req.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="flex justify-stretch lg:justify-end w-full lg:w-auto mt-3 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-none border-slate-100 dark:border-slate-800/80">
                    {activeTab === 'withdrawals' ? (
                      <Button 
                        onClick={() => setSelectedWithdrawal(req)}
                        className="w-full lg:w-auto bg-slate-900 dark:bg-amber-600 text-white hover:bg-amber-600 dark:hover:bg-amber-500 transition-all rounded-xl h-11 lg:h-9 px-6 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200/50 dark:shadow-none"
                      >
                        Review
                      </Button>
                    ) : (
                      <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end w-full lg:w-auto gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge 
                            className={cn(
                              "text-[8px] uppercase px-2 py-0.5 font-black border-none tracking-wider",
                              req.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20"
                            )}
                          >
                            {req.status}
                          </Badge>
                          {req.status === 'approved' && (
                            <Link 
                              to={`/dashboard/receipt/${req.id}`}
                              className="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase hover:underline flex items-center gap-1 bg-amber-500/10 dark:bg-amber-500/5 px-2 py-0.5 rounded"
                            >
                              <Eye className="w-3 h-3" />
                              Receipt
                            </Link>
                          )}
                        </div>
                        <button 
                          onClick={() => setSelectedWithdrawal(req)}
                          className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase hover:underline cursor-pointer py-1"
                        >
                          Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {filteredWithdrawals.length === 0 && (
              <Card className="min-w-full p-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 bg-transparent flex flex-col items-center justify-center rounded-[40px]">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[32px] flex items-center justify-center mb-6">
                  {activeTab === 'withdrawals' ? <Wallet className="w-12 h-12 text-slate-200" /> : <History className="w-12 h-12 text-slate-200" />}
                </div>
                <p className="text-slate-400 font-black uppercase text-[11px] tracking-[0.3em]">
                  {activeTab === 'withdrawals' ? 'No Processing Queue' : 'No History Records'}
                </p>
                {searchQuery && (
                  <p className="text-[10px] text-slate-400 mt-2">Try different search terms or filters.</p>
                )}
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedWithdrawal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && !isRejecting && setSelectedWithdrawal(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-[40px] sm:rounded-[48px] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col mt-auto sm:mt-0"
            >
              <div className="p-6 sm:p-10 space-y-8 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Vault Request</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedWithdrawal.method} TRANSFER</p>
                  </div>
                  <button onClick={() => setSelectedWithdrawal(null)} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-full transition-all active:scale-90">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {/* User Info Header */}
                <div className="flex items-center gap-6 p-6 rounded-[32px] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0 border border-slate-100 dark:border-slate-800">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-0.5 truncate">{selectedWithdrawal.profiles?.full_name}</h3>
                    <div className="text-[11px] text-slate-500 font-bold lowercase truncate opacity-60">
                      {selectedWithdrawal.profiles?.email}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Net Worth</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{formatCompactNumber(selectedWithdrawal.profiles?.wallet_balance)}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 leading-none">Cash Out</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-tight">{formatCompactNumber(selectedWithdrawal.amount)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Destination Assets</span>
                  <div className="p-8 rounded-[40px] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                    <CreditCard className="absolute top-[-20px] right-[-20px] w-40 h-40 text-white/5 rotate-12 pointer-events-none" />
                    
                    <div className="relative space-y-6">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{selectedWithdrawal.method} GATEWAY</span>
                        <Wallet className="w-6 h-6 text-indigo-400" />
                      </div>

                      <div className="space-y-4">
                        {(() => {
                           const info = parseAccountInfo(selectedWithdrawal.account_info);
                           const accountName = info?.name || 'N/A';
                           const accountNumber = info?.number || 'N/A';
                           
                           return (
                             <div className="space-y-2">
                               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-white/10 pb-3">
                                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Name</span>
                                 <span className="text-sm font-black text-white">{accountName}</span>
                               </div>
                               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-white/10 pb-3">
                                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Number</span>
                                 <span className="text-sm font-black text-indigo-400 font-mono">{accountNumber}</span>
                               </div>
                             </div>
                           )
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 px-2 uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    REQUESTED: {new Date(selectedWithdrawal.created_at).toLocaleString()}
                  </div>
                </div>

                {selectedWithdrawal.status === 'pending' && !isRejecting && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      onClick={handleApprove}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-[24px] h-14 text-[11px] font-black shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center border-none uppercase tracking-widest"
                      isLoading={isProcessing}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsRejecting(true)}
                      className="w-full border-rose-100 dark:border-rose-900/30 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[24px] h-14 text-[11px] font-black active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-widest"
                      disabled={isProcessing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {isRejecting && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 bg-rose-50 dark:bg-rose-500/5 rounded-[40px] border-2 border-rose-100 dark:border-rose-500/20 space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-rose-500" />
                        </div>
                        <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest">Rejection Protocol</h4>
                      </div>
                      <button onClick={() => setIsRejecting(false)} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] py-1 px-3">CANCEL</button>
                    </div>
                    
                    <div className="space-y-4">
                      <textarea 
                        placeholder="Reason for denial (visible to user)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                        className="w-full bg-white dark:bg-slate-800 p-6 rounded-[32px] text-sm border-none ring-2 ring-transparent focus:ring-rose-500 transition-all resize-none shadow-sm text-slate-700 dark:text-slate-200 font-bold"
                      />

                      <Button 
                        type="button"
                        isLoading={isProcessing}
                        onClick={handleReject}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-[24px] h-16 font-black shadow-xl shadow-rose-600/30 active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
                      >
                        CONFIRM REJECTION
                      </Button>
                    </div>
                  </motion.div>
                )}

                {selectedWithdrawal.status !== 'pending' && (
                  <div className="space-y-4 w-full">
                    <div className={cn(
                      "p-8 rounded-[32px] text-center border-2 flex flex-col items-center justify-center space-y-2",
                      selectedWithdrawal.status === 'approved' ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-600" : "bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20 text-rose-600"
                    )}>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Status Record</p>
                      <p className="text-xl font-black uppercase tracking-tight">{selectedWithdrawal.status}</p>
                      {selectedWithdrawal.rejection_reason && (
                        <p className="mt-4 text-xs font-bold italic opacity-60 max-w-xs mx-auto">"{selectedWithdrawal.rejection_reason}"</p>
                      )}
                    </div>
                    {selectedWithdrawal.status === 'approved' && (
                      <Link 
                        to={`/dashboard/receipt/${selectedWithdrawal.id}`}
                        className="w-full bg-slate-900 dark:bg-amber-600 hover:bg-slate-850 text-white rounded-[24px] h-14 text-[11px] font-black uppercase tracking-widest flex items-center justify-center border-none shadow-lg shadow-slate-200/50 dark:shadow-none"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Receipt
                      </Link>
                    )}
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

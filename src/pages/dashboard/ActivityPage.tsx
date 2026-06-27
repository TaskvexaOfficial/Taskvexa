import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Clock, XCircle, Wallet, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCompactNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { BannerAd } from '@/components/BannerAd';
import WithdrawalReceiptModal from '@/components/WithdrawalReceiptModal';

export default function ActivityPage() {
  const { cachedProfile } = useStore();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tasks' | 'withdraw'>('tasks');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const status = searchParams.get('status');
    if (tab === 'tasks' || tab === 'withdraw') setActiveTab(tab);
    if (status) setActiveStatus(status);
  }, [searchParams]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRejectedTask, setSelectedRejectedTask] = useState<any | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      setIsLoading(true);
      if (!cachedProfile?.id) {
        setIsLoading(false);
        return;
      }

      const [tasksRes, dynamicRes, withdrawalsRes] = await Promise.all([
        supabase
          .from('task_submissions')
          .select('*')
          .eq('user_id', cachedProfile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('dynamic_task_submissions')
          .select('*, dynamic_tasks(name, coins)')
          .eq('user_id', cachedProfile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', cachedProfile.id)
          .order('created_at', { ascending: false })
      ]);

      const tasksDataRaw = tasksRes.data;
      const dynamicTasksRaw = dynamicRes.data;
      const withdrawals = withdrawalsRes.data;

      let tasksDataForMap: any = [];
      if (tasksDataRaw && tasksDataRaw.length > 0) {
        const taskIds = [...new Set(tasksDataRaw.filter(t => t.task_id).map(t => t.task_id))];
        if (taskIds.length > 0) {
          const { data: tData } = await supabase.from('tasks').select('id, title, coins').in('id', taskIds);
          if (tData) tasksDataForMap = tData;
        }
      }
      
      const tasksMap = Object.fromEntries(tasksDataForMap.map((t: any) => [t.id, t]));
      const tasks = tasksDataRaw?.map(t => ({...t, tasks: tasksMap[t.task_id]})) || [];

      let parsedTasks: any[] = [];
      tasks?.forEach(t => {
        parsedTasks.push({
          id: t.id,
          type: 'task_submitted',
          title: t.tasks?.title || 'Unknown Task',
          coins: t.tasks?.coins || 0,
          date: t.created_at,
          status: t.status,
          rejection_reason: t.reject_reason || t.rejection_reason,
          rejection_image_url: t.rejection_image_url
        });
      });

      dynamicTasksRaw?.forEach(t => {
        parsedTasks.push({
          id: t.id,
          type: 'dynamic_task_submitted',
          title: t.dynamic_tasks?.name || 'Unknown Dynamic Task',
          coins: t.dynamic_tasks?.coins || 0,
          date: t.created_at,
          status: t.status,
          rejection_reason: t.rejection_reason,
          rejection_image_url: null
        });
      });

      // Sort integrated tasks by date descending
      parsedTasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let parsedWithdrawals: any[] = [];
      withdrawals?.forEach(w => {
        parsedWithdrawals.push({
          id: w.id,
          type: 'withdrawal',
          title: `Withdrawal via ${w.method}`,
          coins: w.amount,
          date: w.created_at,
          status: w.status
        });
      });

      setTaskHistory(parsedTasks);
      setWithdrawalHistory(parsedWithdrawals);
      setIsLoading(false);
    }
    fetchActivity();
  }, [cachedProfile?.id]);

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 dark:text-emerald-400" />;
    if (status === 'rejected') return <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 dark:text-rose-400" />;
    return <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 dark:text-amber-400" />;
  };

  const getStatusBg = (status: string) => {
    if (status === 'approved') return "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20";
    if (status === 'rejected') return "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20";
    return "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20";
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="text-[9px] px-2.5 py-1 rounded-lg border-none font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">Approved</Badge>;
    if (status === 'rejected') return <Badge className="text-[9px] px-2.5 py-1 rounded-lg border-none font-black uppercase tracking-widest bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400">Rejected</Badge>;
    return <Badge className="text-[9px] px-2.5 py-1 rounded-lg border-none font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">Processing</Badge>;
  };

  const taskStats = {
    pending: taskHistory.filter(a => a.status === 'pending').length,
    approved: taskHistory.filter(a => a.status === 'approved').length,
    rejected: taskHistory.filter(a => a.status === 'rejected').length,
  };

  const filteredTaskHistory = taskHistory.filter(task => {
    if (activeStatus === 'all') return true;
    return task.status === activeStatus;
  });

  const withdrawStats = {
    pending: withdrawalHistory.filter(a => a.status === 'pending').length,
    approved: withdrawalHistory.filter(a => a.status === 'approved').length,
    rejected: withdrawalHistory.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="px-4">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Timeline</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-2">Transaction and task execution history.</p>
      </div>

      <div className="px-4">
        <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-[24px] max-w-md border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "flex-1 py-3 px-4 rounded-[18px] text-sm font-bold transition-all",
              activeTab === 'tasks' 
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            )}
          >
            Tasks History
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={cn(
              "flex-1 py-3 px-4 rounded-[18px] text-sm font-bold transition-all",
              activeTab === 'withdraw' 
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            )}
          >
            Withdraw History
          </button>
        </div>
      </div>

      <div className="space-y-4 px-2">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' ? (
            <motion.div 
              key="tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
               <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Task Execution Summary</h3>
               <div className="grid grid-cols-3 gap-2 sm:gap-3 px-2">
                 <button 
                   onClick={() => setActiveStatus('pending')}
                   className={cn(
                     "p-3 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center text-center shadow-sm transition-all",
                     activeStatus === 'pending' 
                       ? "bg-amber-100 dark:bg-amber-500/30 border-amber-300 dark:border-amber-400 scale-105 shadow-inner" 
                       : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 opacity-60 hover:opacity-100"
                   )}
                 >
                   <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{taskStats.pending}</span>
                   <span className="text-[9px] sm:text-[10px] font-black text-amber-600/80 dark:text-amber-400/80 uppercase tracking-widest mt-1 text-center leading-tight">Processing</span>
                 </button>
                 <button 
                   onClick={() => setActiveStatus('approved')}
                   className={cn(
                     "p-3 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center text-center shadow-sm transition-all",
                     activeStatus === 'approved' 
                       ? "bg-emerald-100 dark:bg-emerald-500/30 border-emerald-300 dark:border-emerald-400 scale-105 shadow-inner" 
                       : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 opacity-60 hover:opacity-100"
                   )}
                 >
                   <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{taskStats.approved}</span>
                   <span className="text-[9px] sm:text-[10px] font-black text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest mt-1 text-center leading-tight">Approved</span>
                 </button>
                 <button 
                   onClick={() => setActiveStatus('rejected')}
                   className={cn(
                     "p-3 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center text-center shadow-sm transition-all",
                     activeStatus === 'rejected' 
                       ? "bg-rose-100 dark:bg-rose-500/30 border-rose-300 dark:border-rose-400 scale-105 shadow-inner" 
                       : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 opacity-60 hover:opacity-100"
                   )}
                 >
                   <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{taskStats.rejected}</span>
                   <span className="text-[9px] sm:text-[10px] font-black text-rose-600/80 dark:text-rose-400/80 uppercase tracking-widest mt-1 text-center leading-tight">Rejected</span>
                 </button>
               </div>

               <div className="flex items-center justify-between px-2 mt-6">
                 <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Task Executions</h3>
                 {activeStatus !== 'all' && (
                   <button onClick={() => setActiveStatus('all')} className="text-[10px] font-black text-indigo-500 uppercase hover:underline">View All</button>
                 )}
               </div>
               
               <div className="bg-white dark:bg-slate-800 rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
                 {filteredTaskHistory.length > 0 ? filteredTaskHistory.map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 sm:p-5 lg:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group relative"
                    >
                      <div className="absolute inset-x-4 bottom-0 h-px bg-slate-100 dark:bg-slate-700/50 group-last:hidden"></div>
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={cn("w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 border", getStatusBg(activity.status || 'pending'))}>
                          {getStatusIcon(activity.status || 'pending')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base leading-tight break-words pr-2">{activity.title}</h4>
                          <p className={cn(
                            "text-[10px] sm:text-sm font-black tracking-tight mt-0.5",
                            activity.status === 'approved' ? "text-emerald-500 dark:text-emerald-400" : (activity.status === 'rejected' ? "text-slate-400 dark:text-slate-600" : "text-amber-500 dark:text-amber-400")
                          )}>
                            {activity.status === 'approved' ? '+' : ''}{formatCompactNumber(activity.coins)} Coin
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center shrink-0 ml-4">
                        {activity.status === 'rejected' ? (
                          <div className="flex flex-col items-center group/btn">
                            <button 
                              onClick={() => setSelectedRejectedTask(activity)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-lg shadow-indigo-600/20 active:scale-95 transition-all mb-1"
                            >
                              Check Reason
                            </button>
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none">Rejected</span>
                          </div>
                        ) : (
                          <div className="text-right">
                             {getStatusBadge(activity.status || 'pending')}
                             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                               {new Date(activity.date).toLocaleDateString()}
                             </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                 )) : (
                   <div className="p-20 text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4">
                        <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">No task records found</p>
                   </div>
                 )}
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="withdraw"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
               <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Financial Summary</h3>
               <div className="grid grid-cols-3 gap-2 sm:gap-3 px-2">
                 <button 
                   onClick={() => setActiveStatus('pending')}
                   className={cn(
                     "p-3 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center text-center shadow-sm transition-all",
                     activeStatus === 'pending' && activeTab === 'withdraw'
                       ? "bg-amber-100 dark:bg-amber-500/30 border-amber-300 dark:border-amber-400 scale-105 shadow-inner" 
                       : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 opacity-60 hover:opacity-100"
                   )}
                 >
                   <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{withdrawStats.pending}</span>
                   <span className="text-[9px] sm:text-[10px] font-black text-amber-600/80 dark:text-amber-400/80 uppercase tracking-widest mt-1 text-center leading-tight">Processing</span>
                 </button>
                 <button 
                   onClick={() => setActiveStatus('approved')}
                   className={cn(
                     "p-3 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center text-center shadow-sm transition-all",
                     activeStatus === 'approved' && activeTab === 'withdraw'
                       ? "bg-emerald-100 dark:bg-emerald-500/30 border-emerald-300 dark:border-emerald-400 scale-105 shadow-inner" 
                       : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 opacity-60 hover:opacity-100"
                   )}
                 >
                   <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{withdrawStats.approved}</span>
                   <span className="text-[9px] sm:text-[10px] font-black text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest mt-1 text-center leading-tight">Approved</span>
                 </button>
                 <button 
                   onClick={() => setActiveStatus('rejected')}
                   className={cn(
                     "p-3 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center text-center shadow-sm transition-all",
                     activeStatus === 'rejected' && activeTab === 'withdraw'
                       ? "bg-rose-100 dark:bg-rose-500/30 border-rose-300 dark:border-rose-400 scale-105 shadow-inner" 
                       : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 opacity-60 hover:opacity-100"
                   )}
                 >
                   <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{withdrawStats.rejected}</span>
                   <span className="text-[9px] sm:text-[10px] font-black text-rose-600/80 dark:text-rose-400/80 uppercase tracking-widest mt-1 text-center leading-tight">Rejected</span>
                 </button>
               </div>

               <div className="flex items-center justify-between px-2 mt-6">
                 <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financial Payouts</h3>
                 {activeStatus !== 'all' && (
                   <button onClick={() => setActiveStatus('all')} className="text-[10px] font-black text-indigo-500 uppercase hover:underline">View All</button>
                 )}
               </div>
               
               <div className="bg-white dark:bg-slate-800 rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
                 {withdrawalHistory.filter(w => activeStatus === 'all' || w.status === activeStatus).length > 0 ? withdrawalHistory.filter(w => activeStatus === 'all' || w.status === activeStatus).map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 sm:p-5 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group relative gap-4"
                    >
                      <div className="absolute inset-x-4 bottom-0 h-px bg-slate-100 dark:bg-slate-700/50 group-last:hidden"></div>
                      <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                        <div className={cn("w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 border", getStatusBg(activity.status || 'pending'))}>
                          {getStatusIcon(activity.status || 'pending')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-base leading-tight break-words pr-2">{activity.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-1">{new Date(activity.date).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pl-13 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800/40 shrink-0 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 shrink-0">
                           {getStatusBadge(activity.status || 'pending')}
                           {(activity.status === 'approved' || activity.status === 'completed') && (
                             <button 
                               type="button"
                               onClick={() => setSelectedReceiptId(activity.id)}
                               className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all active:scale-95 text-[8.5px] font-black uppercase tracking-widest shadow-sm cursor-pointer border-none"
                             >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Receipt
                             </button>
                           )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs sm:text-lg font-black tracking-tight text-rose-500 dark:text-rose-400 leading-none mb-1">
                             -{formatCompactNumber(Math.abs(activity.coins))}
                          </p>
                          <p className="text-[8px] sm:text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Coins</p>
                        </div>
                      </div>
                    </motion.div>
                 )) : (
                   <div className="p-20 text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4">
                        <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">No payout records found</p>
                   </div>
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rejection Detail Modal */}
      <AnimatePresence>
        {selectedRejectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRejectedTask(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
                      <XCircle className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Task Rejected</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedRejectedTask.title}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRejectedTask(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700/50">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2 italic">Official Rejection Note</span>
                    <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed font-bold">
                      {selectedRejectedTask.rejection_reason || "No specific reason provided. Please ensure you followed all instructions and provided clear proof."}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => setSelectedRejectedTask(null)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[20px] h-14 text-base font-black"
                >
                  Close Feedback
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-8 px-4 scale-90 md:scale-100 origin-top">
        <BannerAd />
      </div>

      {selectedReceiptId && (
        <WithdrawalReceiptModal 
          withdrawalId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2, Clock, XCircle, TrendingUp, ChevronRight, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { cn, formatCompactNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { BannerAd } from '@/components/BannerAd';
import WithdrawalReceiptModal from '@/components/WithdrawalReceiptModal';

const MOCK_DATA_CHART: any[] = [];



export default function DashboardOverview() {
  const { cachedStats, cachedStatsTime, setCachedStats, cachedProfile, cachedRecentActivity, setCachedRecentActivity, cachedChartData, setCachedChartData } = useStore();
  const [stats, setStats] = useState(() => cachedStats || {
    balance: cachedProfile?.wallet_balance || 0,
    total_tasks_completed: cachedProfile?.total_tasks_completed || 0,
    total_tasks_pending: 0,
    referral_earnings: cachedProfile?.total_referral_earnings || 0,
    pending_withdrawals: 0,
    total_payout: 0
  });

  const [recentActivity, setRecentActivity] = useState<any[]>(cachedRecentActivity || []);
  const [chartData, setChartData] = useState<any[]>(cachedChartData || []);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  useEffect(() => {
    let profileChannel: any;
    let submissionsChannel: any;

    async function loadStatsAndActivity() {
      const userId = cachedProfile?.id;
      if (!userId) return;

      // Calculate start of current week (Sunday) for analytics
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      // Parallelize fetching profile stats, recent tasks, and recent withdrawals
      const [
        profileRes, 
        submissionsRes, 
        withdrawalsRes, 
        pendingTasksRes, 
        pendingWithdrawRes, 
        approvedTasksRes, 
        analyticsRes, 
        referralsCountRes, 
        recentReferralsRes,
        dynamicSubmissionsRes,
        dynamicPendingTasksRes,
        dynamicApprovedTasksRes,
        dynamicAnalyticsRes
      ] = await Promise.all([
        supabase.from('profiles').select('wallet_balance, total_tasks_completed, total_tasks_pending, total_referral_earnings').eq('id', userId).single(),
        supabase.from('task_submissions').select('*, tasks(title, coins)').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('task_submissions').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'pending'),
        supabase.from('withdrawals').select('*').eq('user_id', userId).eq('status', 'pending'),
        supabase.from('task_submissions').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'approved'),
        supabase.from('task_submissions').select('created_at, status, tasks(coins)').eq('user_id', userId).eq('status', 'approved').gte('created_at', startOfWeek.toISOString()).order('created_at', { ascending: true }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('referred_by', userId),
        supabase.from('profiles').select('id, full_name, created_at').eq('referred_by', userId).order('created_at', { ascending: false }).limit(5),
        // Dynamic Task submissions queries
        supabase.from('dynamic_task_submissions').select('*, dynamic_tasks(name, coins)').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('dynamic_task_submissions').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'pending'),
        supabase.from('dynamic_task_submissions').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'approved'),
        supabase.from('dynamic_task_submissions').select('created_at, status, dynamic_tasks(coins)').eq('user_id', userId).eq('status', 'approved').gte('created_at', startOfWeek.toISOString()).order('created_at', { ascending: true })
      ]);

      if (profileRes.data) {
        const profile = profileRes.data;
        
        // Fetch sums for withdrawals
        const { data: approvedWithdrawals } = await supabase.from('withdrawals').select('amount').eq('user_id', userId).eq('status', 'approved');
        
        const pendingW = pendingWithdrawRes.data?.reduce((acc: number, w: any) => acc + (w.amount || 0), 0) || 0;
        const totalP = approvedWithdrawals?.reduce((acc: number, w: any) => acc + (w.amount || 0), 0) || 0;

        const totalCompleted = (approvedTasksRes.count || 0) + (dynamicApprovedTasksRes.count || 0);
        const totalPending = (pendingTasksRes.count || 0) + (dynamicPendingTasksRes.count || 0);

        const newStats = {
          balance: profile.wallet_balance || 0,
          total_tasks_completed: totalCompleted,
          total_tasks_pending: totalPending,
          referral_earnings: profile.total_referral_earnings || 0,
          referrals_count: referralsCountRes.count || 0,
          pending_withdrawals: pendingW,
          total_payout: totalP
        };
        setStats(newStats);
        setCachedStats(newStats);
      }

      // Process analytics data for chart
      const dailyEarnings: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      if (analyticsRes.data) {
        analyticsRes.data.forEach((sub: any) => {
          const subDate = new Date(sub.created_at);
          const dayIndex = subDate.getDay();
          dailyEarnings[dayIndex] += sub.tasks?.coins || 0;
        });
      }
      if (dynamicAnalyticsRes.data) {
        dynamicAnalyticsRes.data.forEach((sub: any) => {
          const subDate = new Date(sub.created_at);
          const dayIndex = subDate.getDay();
          dailyEarnings[dayIndex] += sub.dynamic_tasks?.coins || 0;
        });
      }
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const newChartData = dayNames.map((name, index) => ({ name, coins: dailyEarnings[index] }));
      setChartData(newChartData);
      setCachedChartData(newChartData);

      const allActivity: any[] = [];
      if (submissionsRes.data) {
        submissionsRes.data.forEach((t: any) => {
          allActivity.push({
            id: `t_${t.id}`,
            type: 'task',
            title: t.tasks?.title || 'Unknown Task',
            coins: t.tasks?.coins || 0,
            date: t.created_at,
            status: t.status
          });
        });
      }
      if (dynamicSubmissionsRes.data) {
        dynamicSubmissionsRes.data.forEach((t: any) => {
          allActivity.push({
            id: `dt_${t.id}`,
            type: 'task',
            title: t.dynamic_tasks?.name || 'Unknown Dynamic Task',
            coins: t.dynamic_tasks?.coins || 0,
            date: t.created_at,
            status: t.status
          });
        });
      }
      if (withdrawalsRes.data) {
        withdrawalsRes.data.forEach((w: any) => {
          allActivity.push({
            id: `w_${w.id}`,
            type: 'withdrawal',
            title: `Withdrawal via ${w.method}`,
            coins: -w.amount,
            date: w.created_at,
            status: w.status
          });
        });
      }
      if (recentReferralsRes.data) {
        recentReferralsRes.data.forEach((r: any) => {
          allActivity.push({
            id: `r_${r.id}`,
            type: 'referral',
            title: `New Referral: ${r.full_name}`,
            coins: 0,
            date: r.created_at,
            status: 'approved'
          });
        });
      }
      allActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const newRecentActivity = allActivity.slice(0, 5);
      setRecentActivity(newRecentActivity);
      setCachedRecentActivity(newRecentActivity);
    }

    const CACHE_TTL_MS = 15000; // 15 seconds cache TTL
    const isCacheFresh = cachedStats && (Date.now() - cachedStatsTime < CACHE_TTL_MS);

    if (!isCacheFresh) {
      loadStatsAndActivity();
    }

    // Set up real-time for immediate updates
    const userId = cachedProfile?.id;
    if (userId) {
      profileChannel = supabase.channel(`dashboard-profile-${userId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: any) => {
          if (payload?.new && payload.new.id === userId) {
            loadStatsAndActivity();
          }
        })
        .subscribe();
        
      submissionsChannel = supabase.channel(`dashboard-subs-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_submissions' }, (payload: any) => {
          if (payload?.new && payload.new.user_id === userId) {
            loadStatsAndActivity();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dynamic_task_submissions' }, (payload: any) => {
          if (payload?.new && payload.new.user_id === userId) {
            loadStatsAndActivity();
          }
        })
        .subscribe();
    }

    return () => {
      if (profileChannel) supabase.removeChannel(profileChannel);
      if (submissionsChannel) supabase.removeChannel(submissionsChannel);
    };
  }, [setCachedStats, cachedProfile?.id]);

  const totalCoins = stats.balance;
  const pkrValue = (totalCoins / 10).toFixed(2);
  const usdValue = (totalCoins / 2780).toFixed(2); // Assuming 1 USD = 278 PKR

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-4 lg:p-5 flex flex-col justify-between h-[100px] lg:h-[120px]">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight lg:tracking-widest leading-none truncate">Coin Balance</p>
            </div>
            <div className="flex items-baseline gap-1 mt-auto overflow-hidden">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight truncate">{formatCompactNumber(totalCoins)}</h3>
              <span className="text-[8px] lg:text-[9px] font-black text-indigo-500 uppercase tracking-widest shrink-0">Coin</span>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link to="/dashboard/activity?tab=tasks&status=approved">
            <Card className="p-4 lg:p-5 flex flex-col justify-between h-[100px] lg:h-[120px] hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight lg:tracking-widest leading-none truncate">Completed</p>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight mt-auto truncate">{formatCompactNumber(stats.total_tasks_completed)}</h3>
            </Card>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link to="/dashboard/activity?tab=tasks&status=pending">
            <Card className="p-4 lg:p-5 flex flex-col justify-between h-[100px] lg:h-[120px] hover:shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight lg:tracking-widest leading-none truncate">Pending</p>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight mt-auto truncate">{formatCompactNumber(stats.total_tasks_pending)}</h3>
            </Card>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-4 lg:p-5 flex flex-col justify-between h-[100px] lg:h-[120px]">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight lg:tracking-widest leading-none truncate">Referrals</p>
            </div>
            <div className="flex items-baseline gap-1 mt-auto overflow-hidden">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight truncate">{formatCompactNumber(stats.referrals_count || 0)}</h3>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-4 lg:p-5 flex flex-col justify-between h-[100px] lg:h-[120px] bg-rose-50/30 dark:bg-rose-500/5 border-none">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight lg:tracking-widest leading-none truncate">Pending Withdraw</p>
            </div>
            <div className="flex items-baseline gap-1 mt-auto overflow-hidden">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight truncate">{formatCompactNumber(stats.pending_withdrawals)}</h3>
              <span className="text-[8px] lg:text-[9px] font-black text-rose-500 uppercase tracking-widest shrink-0">Coin</span>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="p-4 lg:p-5 flex flex-col justify-between h-[100px] lg:h-[120px] bg-indigo-50/30 dark:bg-indigo-500/5 border-none">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight lg:tracking-widest leading-none truncate">Total Payout</p>
            </div>
            <div className="flex items-baseline gap-1 mt-auto overflow-hidden">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight truncate">{formatCompactNumber(stats.total_payout)}</h3>
              <span className="text-[8px] lg:text-[9px] font-black text-indigo-500 uppercase tracking-widest shrink-0">Coin</span>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Chart Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="h-[400px] flex flex-col overflow-hidden relative">
            <CardHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Earnings Analytics</CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Daily coin accumulation trend</CardDescription>
                </div>
                <Link to="/dashboard/activity">
                   <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold shadow-sm">Report <ChevronRight className="w-4 h-4 ml-1" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 mt-6 relative z-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCoins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontSize: '13px', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#4f46e5', fontWeight: 900 }}
                  />
                  <Area type="monotone" dataKey="coins" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCoins)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-1">
          <Card className="h-[400px] flex flex-col">
            <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Recent Activity</CardTitle>
                <Link to="/dashboard/activity" className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest hover:underline transition-colors shrink-0">View All</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto no-scrollbar">
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {recentActivity.length === 0 && (
                   <div className="p-8 text-center text-slate-500 text-sm">No recent activity.</div>
                )}
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3 sm:gap-4 items-center p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                      activity.status === 'approved' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" : 
                      activity.status === 'pending' ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20" :
                      activity.status === 'rejected' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    )}>
                      {activity.status === 'approved' && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {activity.status === 'pending' && <Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {activity.status === 'rejected' && <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{activity.title}</p>
                        <span className={cn("text-xs sm:text-sm font-black shrink-0 tracking-tight", 
                          activity.status === 'approved' ? "text-emerald-600 dark:text-emerald-400" : 
                          activity.status === 'rejected' ? "text-rose-600 dark:text-rose-400" :
                          "text-slate-600 dark:text-slate-400"
                        )}>
                          {activity.coins > 0 ? '+' : ''}{formatCompactNumber(Math.abs(activity.coins))} Coin
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            {new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                          {activity.status === 'pending' && <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest leading-none">Processing</span>}
                          {activity.status === 'rejected' && <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest leading-none">Rejected</span>}
                          {activity.status === 'approved' && <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest leading-none">Approved</span>}
                          {activity.type === 'withdrawal' && (activity.status === 'approved' || activity.status === 'completed') && (
                            <button 
                              onClick={() => setSelectedReceiptId(activity.id.replace('w_', ''))}
                              className="text-[9px] font-black uppercase bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md cursor-pointer transition-all active:scale-95"
                            >
                              Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="mt-8 scale-90 md:scale-100 origin-top">
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
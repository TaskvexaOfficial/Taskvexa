import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Users, FileText, DollarSign, Settings, Bell, LayoutDashboard, ShieldCheck, Activity, UserPlus, Share2, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCompactNumber } from '@/lib/utils';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { cachedAdminStats, cachedAdminStatsTime, setCachedAdminStats } = useStore();
  const [stats, setStats] = useState(() => {
    const defaultStats = {
      totalUsers: 0,
      pendingTasks: 0,
      pendingWithdrawals: 0,
      totalPayouts: 0,
      pendingFeedback: 0,
      activeUsers7Days: 0,
      todayRegistrations: 0,
      pendingTaskRequests: 0,
      totalReferrals: 0
    };
    return cachedAdminStats?.stats ? { ...defaultStats, ...cachedAdminStats.stats } : defaultStats;
  });
  
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>(() => cachedAdminStats?.recentSubmissions || []);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>(() => cachedAdminStats?.recentWithdrawals || []);

  useEffect(() => {
    async function loadStats() {
      // Parallelize all count and data fetches
      const [
        usersCountRes,
        pendingTasksCountRes,
        pendingWithdrawalsCountRes,
        approvedSubmissionsRes,
        recentSubmissionsRes,
        recentWithdrawalsRes,
        pendingFeedbackRes,
        approvedDynamicSubmissionsRes,
        profilesDataRes,
        pendingTaskRequestsRes,
        totalReferralsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('task_submissions').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('withdrawals').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('task_submissions').select('tasks(coins)').eq('status', 'approved'),
        supabase.from('task_submissions').select('*, tasks(title), profiles(full_name)').order('created_at', { ascending: false }).limit(4),
        supabase.from('withdrawals').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(4),
        supabase.from('user_feedback').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('dynamic_task_submissions').select('dynamic_tasks(coins)').eq('status', 'approved'),
        supabase.from('profiles').select('id, created_at'),
        supabase.from('task_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact' }).not('referred_by', 'is', null)
      ]);

      if (pendingFeedbackRes.error) {
        console.error("Error fetching feedback count:", pendingFeedbackRes.error);
      }

      let totalPayouts = 0;
      approvedSubmissionsRes.data?.forEach((sub: any) => {
        totalPayouts += sub.tasks?.coins || 0;
      });
      approvedDynamicSubmissionsRes?.data?.forEach((sub: any) => {
        totalPayouts += sub.dynamic_tasks?.coins || 0;
      });

      const profilesList = profilesDataRes.data || [];
      const authMap = new Map<string, any>();

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const authRes = await fetch('/api/admin/users-auth', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (authRes.ok) {
            const authJson = await authRes.json();
            const usersList = authJson.users || [];
            usersList.forEach((u: any) => {
              authMap.set(u.id, u);
            });
          }
        }
      } catch (e) {
        console.error("Error setting active/today counts in overview:", e);
      }

      let activeUsers7Days = 0;
      let todayRegistrations = 0;

      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const todayStr = now.toDateString();

      profilesList.forEach((p: any) => {
        const au = authMap.get(p.id);
        const lastSignIn = au?.last_sign_in_at || null;
        const authCreatedAt = au?.created_at || p.created_at;

        // Active users (7d) calculation
        const lastActive = new Date(lastSignIn || p.created_at);
        if (lastActive >= sevenDaysAgo) {
          activeUsers7Days++;
        }

        // Today's registrations calculation
        const createdDate = new Date(authCreatedAt);
        if (createdDate.toDateString() === todayStr) {
          todayRegistrations++;
        }
      });

      const newStats = {
        totalUsers: usersCountRes.count || 0,
        pendingTasks: pendingTasksCountRes.count || 0,
        pendingWithdrawals: pendingWithdrawalsCountRes.count || 0,
        totalPayouts,
        pendingFeedback: pendingFeedbackRes.count || 0,
        activeUsers7Days,
        todayRegistrations,
        pendingTaskRequests: pendingTaskRequestsRes.count || 0,
        totalReferrals: totalReferralsRes.count || 0
      };
      
      setStats(newStats);
      setRecentSubmissions(recentSubmissionsRes.data || []);
      setRecentWithdrawals(recentWithdrawalsRes.data || []);
      
      setCachedAdminStats({ 
        stats: newStats, 
        recentSubmissions: recentSubmissionsRes.data || [], 
        recentWithdrawals: recentWithdrawalsRes.data || [] 
      });
    }

    const CACHE_TTL_MS = 15000; // 15 seconds TTL
    const isCacheFresh = cachedAdminStats && (Date.now() - cachedAdminStatsTime < CACHE_TTL_MS);

    if (!isCacheFresh) {
      loadStats();
    }
  }, [setCachedAdminStats]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 px-2">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Admin Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">System statistics and recent activities.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
           <Button variant="primary" className="flex-1 sm:flex-none h-12 rounded-xl font-bold shadow-lg shadow-indigo-600/20" onClick={() => navigate('/admin/settings')}>
             <Settings className="w-5 h-5 mr-2" /> Settings
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
         {/* Card 1 - Total Users */}
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
           <Card className="p-6 h-full border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden group relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors pointer-events-none"></div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform">
                       <Users className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Total Users</p>
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{formatCompactNumber(stats.totalUsers)}</h3>
                 </div>
              </div>
           </Card>
         </motion.div>

         {/* Card 2 - Active Users */}
         <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           transition={{ delay: 0.12 }}
           className="cursor-pointer font-sans"
           onClick={() => navigate('/admin/users')}
         >
            <Card className="p-6 h-full border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden group relative hover:scale-[1.02] active:scale-[0.98] transition-all">
               <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 dark:bg-sky-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors pointer-events-none"></div>
               <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-sky-50 dark:bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 border border-sky-100 dark:border-sky-500/20 group-hover:scale-110 transition-transform">
                        <Activity className="w-6 h-6" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Active Users (7d)</p>
                  </div>
                  <div>
                     <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{formatCompactNumber(stats.activeUsers7Days || 0)}</h3>
                  </div>
               </div>
            </Card>
         </motion.div>

         {/* Card 3 - Today Registrations */}
         <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           transition={{ delay: 0.14 }}
           className="cursor-pointer font-sans"
           onClick={() => navigate('/admin/users')}
         >
            <Card className="p-6 h-full border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden group relative hover:scale-[1.02] active:scale-[0.98] transition-all">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 dark:bg-rose-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors pointer-events-none"></div>
               <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 border border-rose-100 dark:border-rose-500/20 group-hover:scale-110 transition-transform">
                        <UserPlus className="w-6 h-6" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Today's Registrations</p>
                  </div>
                  <div>
                     <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{formatCompactNumber(stats.todayRegistrations || 0)}</h3>
                  </div>
               </div>
            </Card>
         </motion.div>

         {/* Card 4 - Pending Task Submissions */}
         <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           transition={{ delay: 0.16 }}
           className="cursor-pointer font-sans"
           onClick={() => navigate('/admin/submissions')}
         >
           <Card className="p-6 h-full border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden group relative hover:scale-[1.02] active:scale-[0.98] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors pointer-events-none"></div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition-transform">
                       <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Pending Tasks</p>
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight overflow-hidden text-ellipsis">{formatCompactNumber(stats.pendingTasks)}</h3>
                 </div>
              </div>
           </Card>
         </motion.div>

         {/* Card 5 - Pending Withdrawals */}
         <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           transition={{ delay: 0.18 }}
           className="cursor-pointer font-sans"
           onClick={() => navigate('/admin/submissions/withdrawals')}
         >
           <Card className="p-6 h-full border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden group relative hover:scale-[1.02] active:scale-[0.98] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 dark:bg-amber-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors pointer-events-none"></div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-100 dark:border-amber-500/20 group-hover:scale-110 transition-transform">
                       <ShieldCheck className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Pending Withdrawals</p>
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight overflow-hidden text-ellipsis">{formatCompactNumber(stats.pendingWithdrawals)}</h3>
                 </div>
              </div>
           </Card>
         </motion.div>

         {/* Card 6 - Pending Task Requests */}
         <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           transition={{ delay: 0.2 }}
           className="cursor-pointer font-sans"
           onClick={() => navigate('/admin/tasks/requests')}
         >
           <Card className="p-6 h-full border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden group relative hover:scale-[1.02] active:scale-[0.98] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 dark:bg-orange-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors pointer-events-none"></div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 border border-orange-100 dark:border-orange-500/20 group-hover:scale-110 transition-transform">
                       <HelpCircle className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Pending Task Requests</p>
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight overflow-hidden text-ellipsis">{formatCompactNumber(stats.pendingTaskRequests)}</h3>
                 </div>
              </div>
           </Card>
         </motion.div>

         {/* Card 7 - Total Referrals */}
         <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           transition={{ delay: 0.22 }}
           className="cursor-pointer font-sans"
           onClick={() => navigate('/admin/referrals')}
         >
           <Card className="p-6 h-full border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden group relative hover:scale-[1.02] active:scale-[0.98] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 dark:bg-violet-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors pointer-events-none"></div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 border border-violet-100 dark:border-violet-500/20 group-hover:scale-110 transition-transform">
                       <Share2 className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Total Referrals</p>
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight overflow-hidden text-ellipsis">{formatCompactNumber(stats.totalReferrals)}</h3>
                 </div>
              </div>
           </Card>
         </motion.div>

         {/* Card 8 - User Feedback */}
         <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           transition={{ delay: 0.24 }}
           className="cursor-pointer font-sans"
           onClick={() => navigate('/admin/settings/feedback')}
         >
            <Card className="p-6 h-full border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden group relative hover:scale-[1.02] active:scale-[0.98] transition-all">
               <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 dark:bg-pink-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors pointer-events-none"></div>
               <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 border border-pink-100 dark:border-pink-500/20 group-hover:scale-110 transition-transform">
                        <Bell className="w-6 h-6" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">User Feedback</p>
                  </div>
                  <div>
                     <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight overflow-hidden text-ellipsis">{formatCompactNumber(stats.pendingFeedback)}</h3>
                  </div>
               </div>
            </Card>
         </motion.div>

         {/* Card 9 - Total Payouts */}
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
            <Card className="p-6 h-full border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden group relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 dark:bg-purple-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors pointer-events-none"></div>
               <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 border border-purple-100 dark:border-purple-500/20 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-6 h-6" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Total Payouts</p>
                  </div>
                  <div>
                     <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight overflow-hidden text-ellipsis">{formatCompactNumber(stats.totalPayouts)} <span className="text-xl">Coins</span></h3>
                  </div>
               </div>
            </Card>
         </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="p-6 border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] h-full flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Task Submissions</h3>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/submissions')} className="h-8 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none shadow-inner">View All</Button>
               </div>
               <div className="space-y-4 flex-1">
                   {recentSubmissions.map(sub => (
                      <div key={sub.id} className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                         <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{sub.tasks?.title} - {sub.profiles?.full_name}</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{new Date(sub.created_at).toLocaleString()}</span>
                         </div>
                         <div className="flex gap-2 shrink-0 ml-4">
                            <Badge className={sub.status === 'pending' ? 'bg-amber-100 text-amber-700' : sub.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{sub.status}</Badge>
                         </div>
                      </div>
                   ))}
                   {recentSubmissions.length === 0 && <p className="text-sm text-slate-500">No recent submissions</p>}
                </div>
            </Card>
         </motion.div>
         
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="p-6 border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] h-full flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Withdrawal Requests</h3>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/withdrawals')} className="h-8 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none shadow-inner">View All</Button>
               </div>
               <div className="space-y-4 flex-1">
                   {recentWithdrawals.map(w => (
                      <div key={w.id} className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                         <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{w.profiles?.full_name}</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{w.method} &bull; {formatCompactNumber(w.amount)} Coins</span>
                         </div>
                         <div className="shrink-0 ml-4">
                            <Badge className={w.status === 'pending' ? 'bg-amber-100 text-amber-700' : w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{w.status}</Badge>
                         </div>
                      </div>
                   ))}
                   {recentWithdrawals.length === 0 && <p className="text-sm text-slate-500">No recent withdrawals</p>}
                </div>
            </Card>
         </motion.div>
      </div>
    </div>
  );
}

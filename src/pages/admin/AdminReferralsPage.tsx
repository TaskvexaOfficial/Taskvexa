import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Gift, TrendingUp, Search, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn, formatCompactNumber } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function AdminReferralsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalReferrals: 0,
    topCommission: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      // Fetch recent referral earnings with details
      const { data: earningsData, error: earningsError } = await supabase
        .from('referral_earnings')
        .select(`
          *,
          referrer:referrer_user_id(full_name, email),
          referred:referred_user_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (earningsError) throw earningsError;
      setEarnings(earningsData || []);

      // Fetch top referrers by total earnings
      const { data: topUsers, error: usersError } = await supabase
        .from('profiles')
        .select('full_name, email, total_referral_earnings, referral_code')
        .order('total_referral_earnings', { ascending: false })
        .limit(10);
      
      if (usersError) throw usersError;
      setTopReferrers(topUsers || []);

      // Summary stats
      const totalEarnings = earningsData?.reduce((acc, curr) => acc + curr.commission_amount, 0) || 0;
      const topComm = earningsData?.reduce((max, curr) => Math.max(max, curr.commission_amount), 0) || 0;
      
      setSummary({
        totalEarnings,
        totalReferrals: earningsData?.length || 0,
        topCommission: topComm
      });

    } catch (err) {
      console.error('Error fetching admin referral data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredEarnings = earnings.filter(e => {
    const referrerName = e.referrer?.full_name || 'Deleted User';
    const referredName = e.referred?.full_name || 'Deleted User';
    const referrerEmail = e.referrer?.email || '';
    const referredEmail = e.referred?.email || '';
    return (
      referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referredName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referrerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referredEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Referral Management</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Monitor all network commissions and active referrers.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
             {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
             Refresh Data
           </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Network Payout</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{formatCompactNumber(summary.totalEarnings)} Coins</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[65%]" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Conversions</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{summary.totalReferrals}</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[45%]" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Top Single Bonus</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">+{formatCompactNumber(summary.topCommission)}</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 w-[80%]" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Top Referrers */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Top Networkers</h3>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {topReferrers.map((user, i) => (
              <div key={user.email} className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 font-black">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{user.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{user.referral_code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-500">{formatCompactNumber(user.total_referral_earnings)}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Coins Earned</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Earnings History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
             <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Recent Commissions</h3>
             </div>
             
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search network..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-2 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none w-full sm:w-64"
                />
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referrer</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referred Agent</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Commission</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Scanning Network Records...</p>
                      </td>
                    </tr>
                  ) : filteredEarnings.length > 0 ? (
                    filteredEarnings.map((entry) => {
                      const isReferrerDeleted = !entry.referrer || !entry.referrer_user_id;
                      const isReferredDeleted = !entry.referred || !entry.referred_user_id;
                      const isRowDimmed = isReferrerDeleted || isReferredDeleted;

                      return (
                        <tr key={entry.id} className={cn(
                          "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group",
                          isRowDimmed && "opacity-60"
                        )}>
                          <td className="px-6 py-4">
                            <p className={cn(
                              "text-sm font-black leading-tight",
                              isReferrerDeleted ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700" : "text-slate-900 dark:text-white"
                            )}>
                              {entry.referrer?.full_name || 'Deleted User'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{entry.referrer?.email || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className={cn(
                              "text-sm font-black leading-tight",
                              isReferredDeleted ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {entry.referred?.full_name || 'Deleted User'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{entry.referred?.email || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-base font-black text-emerald-500">+{formatCompactNumber(entry.commission_amount)}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{entry.commission_percentage}% Cut</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">{new Date(entry.created_at).toLocaleDateString()}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                         <p className="text-slate-400 font-black uppercase text-sm tracking-widest">No Earnings Found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Users, Loader2 } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

export default function ReferralMembersPage() {
  const { cachedProfile } = useStore();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (cachedProfile?.id) {
       fetchMembers();
    }
  }, [cachedProfile]);

  async function fetchMembers() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, total_tasks_completed')
        .eq('referred_by', cachedProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also get commission sum for each member
      const memberIds = data?.map(m => m.id) || [];
      const { data: commissions } = await supabase
        .from('referral_earnings')
        .select('referred_user_id, commission_amount')
        .in('referred_user_id', memberIds);

      const commissionsMap: any = {};
      commissions?.forEach(c => {
        commissionsMap[c.referred_user_id] = (commissionsMap[c.referred_user_id] || 0) + c.commission_amount;
      });

      const membersWithEarnings = data?.map(m => ({
        ...m,
        total_earned: commissionsMap[m.id] || 0
      })) || [];

      setMembers(membersWithEarnings);
    } catch (err) {
      console.error('Error fetching referral members:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6 pb-12 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
             </div>
             Direct Connections
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 text-center sm:text-left">Detailed list of all your referred agents and their contributions.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-center sm:text-left">TOTAL AGENTS</p>
           <p className="text-2xl font-black text-slate-900 dark:text-white leading-none text-center sm:text-left">{members.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden pb-2 min-h-[400px] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
           <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Agent Identity</span>
           <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Commission Contribution</span>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Scanning Files...</p>
          </div>
        ) : members.length > 0 ? (
          members.map((member, i) => (
            <motion.div 
              key={member.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group"
            >
               <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 font-black shrink-0 group-hover:scale-105 transition-transform duration-300">
                     {member.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                     <p className="font-black text-slate-900 dark:text-white text-base leading-tight mb-1 truncate">{member.full_name}</p>
                     <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        {member.total_tasks_completed || 0} TASKS COMPLETED &bull; JOINED {new Date(member.created_at).toLocaleDateString()}
                     </p>
                  </div>
               </div>
               <div className="text-right shrink-0">
                  <p className="text-lg font-black text-emerald-500 dark:text-emerald-400 leading-none mb-1">+{formatCompactNumber(member.total_earned)}</p>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">COINS EARNED</p>
               </div>
            </motion.div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[32px] flex items-center justify-center">
              <User className="w-12 h-12 text-slate-200" />
            </div>
            <div>
              <p className="text-slate-400 font-black uppercase text-[11px] tracking-[0.3em]">No Agents Found</p>
              <p className="text-sm font-medium text-slate-400 mt-2">Your network is currently empty. Invite friends to see them here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

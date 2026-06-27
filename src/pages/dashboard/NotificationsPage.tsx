import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, CheckCircle2, XCircle, Info, Wallet, CheckSquare, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { cachedProfile } = useStore();

  useEffect(() => {
    let fallbackInterval: any;

    async function loadNotifications() {
      if (!cachedProfile?.id) return;
      setIsLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', cachedProfile.id)
        .order('created_at', { ascending: false });
      
      if (data) setNotifications(data);
      setIsLoading(false);
    }

    loadNotifications();

    // Subscribe to new notifications
    const channel = supabase.channel(`notifications-page-${cachedProfile?.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: any) => {
        if (payload?.new && String(payload.new.user_id).trim().toLowerCase() === String(cachedProfile?.id).trim().toLowerCase()) {
          setNotifications(prev => {
            const alreadyExists = prev.some(n => n.id === payload.new.id);
            if (alreadyExists) return prev;
            return [payload.new, ...prev];
          });
        }
      })
      .subscribe();

    // 4-second polling fallback to bypass any potential Realtime constraints
    fallbackInterval = setInterval(async () => {
      if (!cachedProfile?.id) return;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', cachedProfile.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        setNotifications(data);
      }
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [cachedProfile?.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle2;
      case 'error': return XCircle;
      case 'withdrawal': return Wallet;
      case 'task': return CheckSquare;
      case 'referral': return Users;
      default: return Info;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500';
      case 'error': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-500';
      default: return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500';
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
             </div>
             Notifications
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">View all your recent alerts and updates.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 mx-4 sm:mx-0 rounded-2xl sm:rounded-[32px] shadow-lg shadow-slate-200/40 dark:shadow-none overflow-hidden pb-1 sm:pb-2 border border-slate-100 dark:border-slate-800 sm:border-0">
        {isLoading ? (
          <div className="p-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium font-bold">
             You have no new notifications.
          </div>
        ) : (
          notifications.map((notification, i) => {
            const Icon = getIcon(notification.type);
            const colorClasses = getColorClasses(notification.type);
            return (
              <motion.div 
                key={notification.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.01, duration: 0.2 }}
                className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group"
              >
                 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 ${colorClasses}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight mb-1">{notification.title}</p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2 leading-relaxed">{notification.message}</p>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date(notification.created_at).toLocaleString()}</p>
                 </div>
                 {!notification.is_read && (
                   <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                 )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

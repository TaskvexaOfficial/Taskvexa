import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  ArrowRightLeft, 
  Users, 
  BarChart3, 
  Bell, 
  History, 
  Settings, 
  LifeBuoy,
  LogOut,
  Menu,
  X,
  User,
  MessageSquare,
  Trophy,
  PartyPopper,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Languages,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { cn, formatCompactNumber } from '@/lib/utils';
import { Button } from '../ui/Button';
import { useStore } from '@/store';
import { AIChatWidget } from './AIChatWidget';
import { Logo } from '@/components/ui/Logo';
import { supabase } from '@/lib/supabase';

// MOCK_USER is replaced by real user state
const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Offer Walls', path: '/dashboard/cpx-surveys', icon: ClipboardList },
  { name: 'Wallet', path: '/dashboard/wallet', icon: Wallet },
  { name: 'Coin Converter', path: '/dashboard/converter', icon: ArrowRightLeft },
  { name: 'Referrals', path: '/dashboard/referrals', icon: Users },
  { name: 'Activity', path: '/dashboard/activity', icon: History },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];

type Language = 'english' | 'urdu' | 'romanUrdu';

const rulesData: Record<Language, {
  title: string;
  warning: string;
  rules: string[];
}> = {
  english: {
    title: "TaskVexa Rules & Guidelines",
    warning: "⚠️ Important: 3 Rejected Task Submissions May Result in a Permanent Account Ban.",
    rules: [
      "One user can use only one account.",
      "Read the tutorial before submitting any task.",
      "Fake, edited, copied, or invalid proofs are not allowed.",
      "Spam submissions are prohibited.",
      "Incorrect or incomplete submissions may be rejected.",
      "3 rejected task submissions may result in a permanent account ban.",
      "Banned accounts may lose access to coins, rewards, and earnings.",
      "Referral fraud and multiple accounts are prohibited.",
      "Any abuse, exploitation, or manipulation of the platform is not allowed.",
      "TaskVexa reserves the right to reject tasks or suspend accounts that violate the rules.",
      "By using TaskVexa, you agree to follow all platform rules."
    ]
  },
  urdu: {
    title: "ٹاسک وئکسا (TaskVexa) کے قوانین اور ہدایات",
    warning: "⚠️ اہم: 3 مسترد شدہ کاموں کے بعد آپ کا اکاؤنٹ مستقل طور پر بلاک ہو سکتا ہے۔",
    rules: [
      "ایک صارف صرف ایک اکاؤنٹ استعمال کر سکتا ہے۔",
      "کسی بھی کام کو جمع کرانے سے پہلے ٹیوٹوریل ضرور پڑھیں۔",
      "جعلی، ایڈٹ شدہ، کاپی شدہ، یا غیر درست ثبوت پیش کرنے کی اجازت نہیں ہے۔",
      "اسپام (فضول) طریقے سے کام جمع کرانا ممنوع ہے۔",
      "غلط یا نامکمل کام مسترد کیے جا سکتے ہیں۔",
      "3 مسترد شدہ کاموں کے بعد آپ کا اکاؤنٹ مستقل طور پر بلاک کیا جا سکتا ہے۔",
      "بلاک شدہ اکاؤنٹس اپنے کوائنز، انعامات اور کمائی تک رسائی کھو سکتے ہیں۔",
      "ریفرل فراڈ اور ایک سے زیادہ اکاؤنٹس بنانا ممنوع ہے۔",
      "پلیٹ فارم کا غلط استعمال، استحصال، یا گڑبڑ کرنے کی کوئی گنجائش نہیں ہے۔",
      "ٹاسک وئکسا کے پاس قوانین کی خلاف ورزی کرنے پر کام مسترد کرنے یا اکاؤنٹس معطل کرنے کا حق محفوظ ہے۔",
      "ٹاسک وئکسا استعمال کر کے آپ پلیٹ فارم کے تمام قوانین پر عمل کرنے کی ہامی بھرتے ہیں۔"
    ]
  },
  romanUrdu: {
    title: "TaskVexa Rules & Guidelines",
    warning: "⚠️ Important: 3 Rejected Task Submissions May Result in a Permanent Account Ban.",
    rules: [
      "Aik user sirf aik hi account use kar sakta hai.",
      "Koi bhi task submit karne se pehle tutorial lazmi parhein.",
      "Fake, edited, copied, ya invalid proofs allow nahi hain.",
      "Spam submissions sakhti se prohibited hain.",
      "Ghalat ya incomplete submissions reject ki ja sakti hain.",
      "3 rejected task submissions par aapka account permanently ban ho sakta hai.",
      "Banned accounts apne coins, rewards aur earnings se hath dho sakte hain.",
      "Referral fraud aur multiple accounts banana sakhti se mana hai.",
      "Platform ka ghalat istemal, exploitation, ya manipulation bilkul allow nahi hai.",
      "TaskVexa ke paas rules violate karne par tasks reject karne ya accounts suspend karne ka poora haq hai.",
      "TaskVexa use karte hue aap platform ke tamam rules follow karne ka iqrar karte hain."
    ]
  }
};

import { WelcomePopup } from './WelcomePopup';

export function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { avatar, theme, setChatOpen, cachedProfile, setCachedProfile, isProfileSyncing } = useStore();
  const isAuthReady = useStore(state => state.isAuthReady);
  
  useEffect(() => {
    let notifChannel: any;
    let profileChannel: any;
    let fallbackInterval: any;
    
    async function initDashboard() {
      if (!isAuthReady || isProfileSyncing || !cachedProfile?.id) {
        return;
      }

      // 1. Initial Data Fetch
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', cachedProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (notifData) {
        setNotifications(notifData);
        setHasUnread(notifData.some((n: any) => !n.is_read));
      }

      // 2. Auth Redirects (if not admin)
      if (cachedProfile.role?.trim().toLowerCase() === 'admin') {
        navigate('/admin');
        return;
      }
    }

    if (isAuthReady && !isProfileSyncing) {
      if (!cachedProfile) {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (!session) {
            navigate('/auth');
          } else {
            console.log("[DashboardLayout] Re-syncing missing profile from session...");
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              if (profile) {
                setCachedProfile(profile);
              } else {
                // Skeleton fallback
                setCachedProfile({
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.email?.split('@')[0] || 'User',
                  wallet_balance: 0
                });
              }
            } catch (err) {
              console.error("[DashboardLayout] Failed to rescue profile:", err);
            }
          }
        });
      } else {
        initDashboard();

        // 3. Setup Persistent Real-time Channels with enhanced logging
        notifChannel = supabase.channel(`notifs-layout-${cachedProfile.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: any) => {
            console.log('[Realtime Notification] New insert event payload:', payload);
            if (payload?.new && String(payload.new.user_id).trim().toLowerCase() === String(cachedProfile.id).trim().toLowerCase()) {
              setNotifications(prev => {
                const alreadyExists = prev.some(n => n.id === payload.new.id);
                if (alreadyExists) return prev;
                return [payload.new, ...prev].slice(0, 10);
              });
              setHasUnread(true);
            }
          })
          .subscribe((status) => {
            console.log('[Realtime Notification] Status update:', status);
          });

        profileChannel = supabase.channel(`profile-layout-${cachedProfile.id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: any) => {
            if (payload?.new && payload.new.id === cachedProfile.id) {
              if (payload.new.role === 'admin') {
                window.location.href = '/admin';
                return;
              }
              setCachedProfile(payload.new);
            }
          })
          .subscribe();

        // 4. Reliable Polling Fallback (every 4 seconds)
        fallbackInterval = setInterval(async () => {
          if (!cachedProfile?.id) return;
          const { data: latestNotifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', cachedProfile.id)
            .order('created_at', { ascending: false })
            .limit(10);
            
          if (latestNotifs) {
            setNotifications(latestNotifs);
            // Recompute unread status
            setHasUnread(latestNotifs.some((n: any) => !n.is_read));
          }
        }, 4000);
      }
    }

    return () => {
      if (notifChannel) supabase.removeChannel(notifChannel);
      if (profileChannel) supabase.removeChannel(profileChannel);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [isAuthReady, isProfileSyncing, cachedProfile?.id, navigate, setCachedProfile]);

  const handleLogout = () => {
    // Navigate immediately for perceived performance
    navigate('/auth');
    useStore.getState().clearCache();
    
    // Perform network sign out in background
    supabase.auth.signOut().catch(error => {
      console.error('Logout error:', error);
    });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // ... rest of DashboardLayout as before, changing MOCK_USER references ...

  useEffect(() => {
    const container = document.getElementById('dashboard-scroll-container');
    if (container) {
      container.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const userProfile = { 
    name: cachedProfile?.full_name || 'User', 
    coins: cachedProfile?.wallet_balance || 0 
  };

  useEffect(() => {
    if (showNotifications) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showNotifications]);

  const markAllAsRead = async () => {
    if (!cachedProfile?.id) return;
    setHasUnread(false);
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', cachedProfile.id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 overflow-hidden font-sans transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[280px] flex-col bg-slate-50 dark:bg-slate-900 z-20 shrink-0">
        <div className="h-24 flex items-center px-8">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-2xl font-black tracking-tight"><span className="text-slate-900 dark:text-white">Task</span><span className="text-blue-500">vexa</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 no-scrollbar">
          <div className="mb-6 px-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Workspace</p>
            <nav className="space-y-1.5">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-sm font-bold transition-all duration-200 group',
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/60 dark:border-slate-700/50'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent'
                    )
                  }
                  end={item.path === '/dashboard'}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 mb-4 mx-4 space-y-1.5 list-none">
          <Link to="/dashboard/support" className="flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-sm font-bold text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
            <LifeBuoy className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            Support Support
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-white flex flex-col z-50 lg:hidden shadow-2xl"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Logo className="w-8 h-8" />
                  <span className="text-xl font-bold tracking-tight"><span className="text-slate-900 dark:text-white">Task</span><span className="text-blue-500">vexa</span></span>
                </div>
                <button onClick={closeMobileMenu} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )
                      }
                      end={item.path === '/dashboard'}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="p-4 border-t border-slate-100 flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-transparent transition-colors">
        {/* Top Header */}
        <header className={cn("h-24 flex items-center justify-between px-6 lg:px-10 shrink-0 transition-[z-index]", showNotifications ? "relative z-[300]" : "relative z-20")}>
          {/* Hamburger left container for mobile or generic spacing */}
          <div className="flex items-center lg:hidden w-auto shrink-0">
            <button
              onClick={toggleMobileMenu}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Centered page title on mobile */}
          <div className="flex-1 lg:hidden text-center px-2 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white capitalize tracking-tight truncate">
              {(() => {
                const pathParts = location.pathname.split('/').filter(Boolean);
                if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === 'dashboard')) return 'Overview';
                
                // If we are looking at a specific task (e.g. /dashboard/tasks/uuid) show 'Task Details'
                if ((pathParts.includes('tasks') || pathParts.includes('dynamic-tasks')) && pathParts.length > 2) return 'Task Details';
                
                return pathParts[1].replace(/-/g, ' ');
              })()}
            </h1>
          </div>

          {/* Desktop Heading layout */}
          <div className="hidden lg:flex items-center gap-4">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight">
              {(() => {
                const pathParts = location.pathname.split('/').filter(Boolean);
                if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === 'dashboard')) return 'Overview';
                
                // If we are looking at a specific task (e.g. /dashboard/tasks/uuid) show 'Task Details'
                if ((pathParts.includes('tasks') || pathParts.includes('dynamic-tasks')) && pathParts.length > 2) return 'Task Details';
                
                return pathParts[1].replace(/-/g, ' ');
              })()}
            </h1>
          </div>
          
          <div className="flex items-center justify-end gap-2.5 sm:gap-4 relative w-auto shrink-0">
            <div className="hidden sm:flex bg-slate-50 dark:bg-slate-900 rounded-full py-2 px-5 items-center gap-2 border border-slate-200/60 dark:border-slate-800 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:block"></span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{formatCompactNumber(userProfile?.coins || 0)}<span className="text-indigo-500 dark:text-indigo-400 font-bold ml-1 text-[10px] uppercase tracking-widest">COIN</span></span>
            </div>
            
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-[#592BFF] dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-full shadow-sm hover:shadow transition-all duration-200 shrink-0 cursor-pointer"
            >
              <Bell className="w-[19px] h-[19px]" />
              {hasUnread && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </button>

            <Link to="/dashboard/profile" className="w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-[#592BFF] dark:hover:border-indigo-400 flex items-center justify-center overflow-hidden shadow-sm hover:shadow transition-all duration-200 shrink-0">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-[19px] h-[19px] text-slate-500 dark:text-slate-400" />
              )}
            </Link>
 
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[100] bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowNotifications(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full -right-2 sm:right-0 mt-4 w-[calc(100vw-32px)] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-none z-[110] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]"
                  >
                     <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <h3 className="font-black text-slate-900 dark:text-white">Notifications</h3>
                        <button 
                         onClick={markAllAsRead}
                         className="text-xs text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:underline transition-all"
                        >
                         Mark all as read
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain">
                        {notifications.length === 0 ? (
                           <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                              No new notifications.
                           </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={cn(
                                "p-4 sm:p-5 border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer",
                                !notif.is_read && "bg-indigo-50/30 dark:bg-indigo-500/5"
                              )}
                            >
                              <div className="flex items-start gap-4">
                                <div className={cn(
                                  "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm",
                                  notif.type === 'success' ? "bg-emerald-500 shadow-emerald-500/20" : notif.type === 'error' ? "bg-rose-500 shadow-rose-500/20" : "bg-indigo-500 shadow-indigo-500/20",
                                  notif.is_read && "opacity-0"
                                )}></div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug break-words">{notif.title}</p>
                                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed break-words">{notif.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-2.5 font-bold uppercase tracking-widest">{new Date(notif.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800 shrink-0">
                        <Link 
                           to="/dashboard/notifications" 
                           onClick={() => setShowNotifications(false)}
                           className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block w-full"
                        >
                           View All Notifications
                        </Link>
                     </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div id="dashboard-scroll-container" className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-4 lg:p-8 w-full">
            <Outlet />
          </div>
        </div>
      </main>
      
      <AIChatWidget />
      <WelcomePopup />
    </div>
  );
}

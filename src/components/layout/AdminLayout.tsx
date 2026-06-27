import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Wallet, 
  Settings, 
  Bell, 
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck,
  UserPlus,
  MessageSquare,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import { cn, formatCompactNumber } from '@/lib/utils';
import { Button } from '../ui/Button';
import { useStore } from '@/store';
import { Logo } from '@/components/ui/Logo';
import { supabase } from '@/lib/supabase';

const ADMIN_NAV_ITEMS = [
  { name: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Users', path: '/admin/users', icon: Users },
  { 
    name: 'Tasks', 
    id: 'tasks',
    icon: CheckSquare,
    children: [
      { name: 'Manage Tasks', path: '/admin/tasks' },
      { name: 'Dynamic Tasks', path: '/admin/dynamic-tasks' }
    ]
  },
  { 
    name: 'Submissions', 
    id: 'submissions',
    icon: ShieldCheck,
    children: [
      { name: 'Task Submissions', path: '/admin/submissions' },
      { name: 'Withdrawal Submissions', path: '/admin/withdrawals' }
    ]
  },
  { 
    name: 'User Management', 
    id: 'user_management',
    icon: Users,
    children: [
      { name: 'Task Requests', path: '/admin/task-requests' },
      { name: 'Referrals', path: '/admin/referrals' },
      { name: 'User Feedback', path: '/admin/feedback' }
    ]
  },
  { 
    name: 'Settings', 
    id: 'settings',
    icon: Settings,
    children: [
      { name: 'General Settings', path: '/admin/settings?tab=general' },
      { name: 'Notification Settings', path: '/admin/settings?tab=notifications' },
      { name: 'Converter', path: '/admin/converter' }
    ]
  },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell },
];

export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const { avatar, theme, cachedProfile, setCachedProfile } = useStore();

  const isChildActive = (childPath: string) => {
    const [path, query] = childPath.split('?');
    if (location.pathname !== path) return false;
    if (!query) return true;
    
    const searchParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(query);
    
    const currentTab = searchParams.get('tab') || 'general';
    const targetTab = targetParams.get('tab');
    
    if (targetTab) {
      return currentTab === targetTab;
    }
    
    return true;
  };

  const toggleSubMenu = (id: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    const newOpen: Record<string, boolean> = {};
    ADMIN_NAV_ITEMS.forEach(item => {
      if (item.children) {
        if (item.children.some(child => {
          const pathOnly = child.path.split('?')[0];
          return location.pathname === pathOnly;
        })) {
          newOpen[item.id!] = true;
        }
      }
    });
    setOpenSubMenus(prev => ({ ...prev, ...newOpen }));
  }, [location.pathname]);
  const isAuthReady = useStore(state => state.isAuthReady);
  const isProfileSyncing = useStore(state => state.isProfileSyncing);
  const [adminProfile, setAdminProfile] = useState<{name: string} | null>(
    cachedProfile ? { name: cachedProfile.full_name || 'Admin' } : null
  );

  useEffect(() => {
    async function checkAdminAuth() {
      if (!isAuthReady || isProfileSyncing || !cachedProfile) {
        if (isAuthReady && !isProfileSyncing) {
          // Double check session before redirecting
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            navigate('/auth');
          } else {
            console.log("[AdminLayout] Re-syncing missing admin profile from session...");
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              if (profile) {
                setCachedProfile(profile);
                if (profile.role?.trim().toLowerCase() !== 'admin') {
                  navigate('/dashboard');
                } else {
                  setAdminProfile({ name: profile.full_name || 'Admin' });
                }
              }
            } catch (err) {
              console.error("[AdminLayout] Failed to rescue admin profile:", err);
            }
          }
        }
        return;
      }

      if (cachedProfile.role?.trim().toLowerCase() !== 'admin') {
        console.warn("[AdminLayout] User is not admin, redirecting to dashboard");
        navigate('/dashboard');
        return;
      }

      setAdminProfile({ name: cachedProfile.full_name || 'Admin' });
    }
    checkAdminAuth();
  }, [isAuthReady, isProfileSyncing, navigate, cachedProfile, setCachedProfile]);

  const handleLogout = () => {
    navigate('/auth');
    useStore.getState().clearCache();
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

  useEffect(() => {
    const container = document.getElementById('admin-scroll-container');
    if (container) {
      container.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const renderNavItem = (item: any, isMobile = false) => {
    const iconColorInactive = "text-slate-500 group-hover:text-slate-300";

    if (item.children) {
      const isExpanded = !!openSubMenus[item.id!];
      const hasActiveChild = item.children.some((child: any) => isChildActive(child.path));

      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => toggleSubMenu(item.id!)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] text-sm font-bold transition-all duration-200 group text-left cursor-pointer border border-transparent',
              hasActiveChild 
                ? 'bg-slate-800/80 text-white border-slate-700/50' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("w-5 h-5 transition-colors", hasActiveChild ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span>{item.name}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-200", isExpanded && "rotate-180 text-white")} />
          </button>
          
          {isExpanded && (
            <div className="pl-4 pr-1 py-1 space-y-1 bg-slate-950/20 dark:bg-slate-900/10 rounded-[14px]">
              {item.children.map((child: any) => {
                const isActive = isChildActive(child.path);
                return (
                  <Link
                    key={child.path}
                    to={child.path}
                    onClick={isMobile ? closeMobileMenu : undefined}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-xs font-bold transition-all duration-200 border border-transparent',
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full transition-colors shrink-0", isActive ? "bg-white" : "bg-slate-600")} />
                    {child.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isActive = item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path);

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={isMobile ? closeMobileMenu : undefined}
        className={cn(
          'flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-sm font-bold transition-all duration-200 group border border-transparent',
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        )}
        end={item.path === '/admin'}
      >
        <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : iconColorInactive)} />
        {item.name}
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 overflow-hidden font-sans transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[280px] flex-col bg-slate-900 dark:bg-slate-950 text-white z-20 shrink-0 border-r border-slate-800">
        <div className="h-24 flex items-center px-8">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 text-white" />
            <span className="text-2xl font-black tracking-tight"><span className="text-white">Admin</span><span className="text-indigo-500">Panel</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 no-scrollbar">
          <div className="mb-6 px-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Management</p>
            <nav className="space-y-1.5">
              {ADMIN_NAV_ITEMS.map((item) => renderNavItem(item, false))}
            </nav>
          </div>
        </div>

        <div className="p-4 mb-4 mx-4 space-y-1.5 list-none">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all group"
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
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-900 flex flex-col z-50 lg:hidden shadow-2xl"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Logo className="w-8 h-8 text-white" />
                  <span className="text-xl font-bold tracking-tight text-white"><span className="text-white">Admin</span><span className="text-indigo-500">Panel</span></span>
                </div>
                <button onClick={closeMobileMenu} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-1">
                  {ADMIN_NAV_ITEMS.map((item) => renderNavItem(item, true))}
                </nav>
              </div>

              <div className="p-4 border-t border-slate-800 flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white dark:bg-slate-950 transition-colors m-2 lg:m-4 lg:ml-0 rounded-[32px] border border-slate-200/60 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none">
        {/* Top Header */}
        <header className="h-24 flex items-center justify-between px-6 lg:px-10 z-10 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white hidden sm:block capitalize tracking-tight">
              {location.pathname.endsWith('/users/active') ? 'Active Users (7d)' : location.pathname.endsWith('/users/today') ? "Today's Registrations" : location.pathname.split('/').pop() === 'admin' ? 'Overview' : location.pathname.split('/').pop()?.replace('-', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 relative">
             <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1.5 rounded-full text-sm border border-indigo-100 dark:border-indigo-500/20">
               {adminProfile?.name || 'Admin'}
             </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div id="admin-scroll-container" className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

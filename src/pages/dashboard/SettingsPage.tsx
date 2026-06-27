import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User, 
  Lock, 
  Moon, 
  Settings as SettingsIcon, 
  CreditCard, 
  Share2, 
  HelpCircle, 
  Star, 
  Bug, 
  MessageSquare, 
  ChevronRight, 
  Sun,
  LogOut,
  PlusCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';
import { BannerAd } from '@/components/BannerAd';

export default function SettingsPage() {
  const { theme, setTheme, setChatOpen } = useStore();
  const isDarkMode = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const SETTINGS_GROUPS = [
    {
      title: 'Personalization',
      items: [
        { id: 'profile', name: 'Profile Account', icon: User, desc: 'Manage your name, email and details.', path: '/dashboard/settings/profile' },
        { id: 'password', name: 'Security & Password', icon: Lock, desc: 'Update your security credentials.', path: '/dashboard/settings/password' },
        { id: 'theme', name: 'Dark Mode', icon: isDarkMode ? Sun : Moon, desc: 'Toggle between light and dark themes.', toggle: true },
      ]
    },
    {
      title: 'Workspace',
      items: [
        { id: 'tasks', name: 'Tasks', icon: SettingsIcon, desc: 'View and manage running tasks.', path: '/dashboard/tasks' },
        { id: 'withdraw', name: 'Withdraw', icon: CreditCard, desc: 'Withdraw your earned coins.', path: '/dashboard/withdraw' },
        { id: 'referral', name: 'Referral', icon: Share2, desc: 'Manage your affiliate links and bonus.', path: '/dashboard/referrals' },
      ]
    },
    {
      title: 'Feedback & Help',
      items: [
        { id: 'help-support', name: 'Help & Support', icon: HelpCircle, desc: 'Get assistance, report issues, and share feedback.', path: '/dashboard/support' },
      ]
    }
  ];

  return (
    <div className="w-full space-y-12 pb-20">
      <div className="px-4">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Adjust your experience and secure your account.</p>
      </div>

      <div className="space-y-10">
        {SETTINGS_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">{group.title}</h3>
            <Card className="overflow-hidden border border-slate-200 dark:border-white/5 shadow-lg shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[24px]">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {group.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="group relative">
                    {item.toggle ? (
                      <div 
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shadow-sm dark:shadow-none border border-indigo-100 dark:border-indigo-500/20">
                             <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{item.name}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <div className={`relative w-12 sm:w-14 h-6 sm:h-7 rounded-full transition-all duration-300 ease-in-out border ${isDarkMode ? 'bg-slate-900 border-indigo-500/30' : 'bg-slate-100 border-slate-200'}`}>
                          <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300 ease-in-out shadow-sm flex items-center justify-center ${isDarkMode ? 'translate-x-7 sm:translate-x-8 bg-indigo-500 shadow-indigo-500/50' : 'translate-x-1 sm:translate-x-1 bg-white shadow-slate-300/50'}`}>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Link 
                        to={item.path}
                        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 dark:group-hover:border-indigo-500/20 transition-all group-hover:scale-105 shadow-sm dark:shadow-none">
                             <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{item.name}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-transparent group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 flex items-center justify-center transition-colors">
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))}

        <div className="mt-8 mb-4 px-4 scale-90 md:scale-100 origin-top">
          <BannerAd />
        </div>

        <div className="px-4 py-4">
           <Button 
             variant="danger" 
             onClick={async () => {
               const { supabase } = await import('@/lib/supabase');
               await supabase.auth.signOut();
               useStore.getState().clearCache();
               window.location.href = '/auth';
             }}
             className="w-full h-14 font-black text-sm relative overflow-hidden group rounded-[20px]"
           >
              <span className="relative z-10 flex items-center justify-center gap-2">
                 <LogOut className="w-5 h-5" />
                 Logout Account
              </span>
              <div className="absolute inset-0 bg-red-700 w-0 group-hover:w-full transition-all duration-300 ease-out"></div>
           </Button>
        </div>
      </div>
    </div>
  );
}

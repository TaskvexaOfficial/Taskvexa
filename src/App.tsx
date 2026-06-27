/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { ScrollToTop } from './components/ScrollToTop';
import { supabase } from '@/lib/supabase';
import { setupFCM } from '@/lib/firebase';
import { useStore } from '@/store';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedFavicon } from './components/AnimatedFavicon';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught route or rendering error caught by boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
          <div className="absolute top-[-10%] left-[-10%] w-[80vh] h-[80vh] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[80vh] h-[80vh] bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 text-center flex flex-col items-center">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full mb-4">
              <AlertTriangle className="w-10 h-10 animate-bounce" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Something went wrong</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              We encountered an issue restoring this view. This can sometimes happen due to network changes or software updates.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="flex-1 h-12 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 text-slate-700 dark:text-white font-bold text-sm rounded-2xl transition-all cursor-pointer"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Immediately loaded layouts
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import WithdrawalFeedbackPopup from './components/WithdrawalFeedbackPopup';

// Lazy load pages
const DashboardOverview = lazy(() => import('@/pages/dashboard/DashboardPage'));
const TaskListingPage = lazy(() => import('@/pages/dashboard/TaskListingPage'));
const TaskDetailPage = lazy(() => import('@/pages/dashboard/TaskDetailPage'));
const DynamicTaskDetailPage = lazy(() => import('@/pages/dashboard/DynamicTaskDetailPage'));
const WalletPage = lazy(() => import('@/pages/dashboard/WalletPage'));
const WithdrawPage = lazy(() => import('@/pages/dashboard/WithdrawPage'));
const ReceiptPage = lazy(() => import('@/pages/dashboard/ReceiptPage'));
const CoinConverterPage = lazy(() => import('@/pages/dashboard/CoinConverterPage'));
const AnalyticsPage = lazy(() => import('@/pages/dashboard/AnalyticsPage'));
const ReferralPage = lazy(() => import('@/pages/dashboard/ReferralPage'));
const ReferralMembersPage = lazy(() => import('@/pages/dashboard/ReferralMembersPage'));
const ReferralCompetitionPage = lazy(() => import('@/pages/dashboard/ReferralCompetitionPage'));
const RulesPage = lazy(() => import('@/pages/dashboard/RulesPage'));
const NotificationsPage = lazy(() => import('@/pages/dashboard/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage'));
const PasswordPage = lazy(() => import('@/pages/dashboard/PasswordPage'));
const ActivityPage = lazy(() => import('@/pages/dashboard/ActivityPage'));
const SupportPage = lazy(() => import('@/pages/dashboard/SupportPage'));
const ReportBugPage = lazy(() => import('@/pages/dashboard/ReportBugPage'));
const WebsiteReviewPage = lazy(() => import('@/pages/dashboard/WebsiteReviewPage'));
const SuggestionsPage = lazy(() => import('@/pages/dashboard/SuggestionsPage'));
const CpxSurveysPage = lazy(() => import('@/pages/dashboard/CpxSurveysPage'));
const RequestTaskPage = lazy(() => import('@/pages/dashboard/RequestTaskPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminTasksPage = lazy(() => import('@/pages/admin/AdminTasksPage'));
const AdminDynamicTasksPage = lazy(() => import('@/pages/admin/AdminDynamicTasksPage'));
const AdminSubmissionsPage = lazy(() => import('@/pages/admin/AdminSubmissionsPage'));
const AdminWithdrawalsPage = lazy(() => import('@/pages/admin/AdminWithdrawalsPage'));
const AdminTaskRequestsPage = lazy(() => import('@/pages/admin/AdminTaskRequestsPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminReferralsPage = lazy(() => import('@/pages/admin/AdminReferralsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage'));
const AdminConverterPage = lazy(() => import('@/pages/admin/AdminConverterPage'));
const AdminFeedbackPage = lazy(() => import('@/pages/admin/AdminFeedbackPage'));

const FeaturesPage = lazy(() => import('@/pages/public/FeaturesPage'));
const HowItWorksPage = lazy(() => import('@/pages/public/HowItWorksPage'));
const FaqPage = lazy(() => import('@/pages/public/FaqPage'));
const GenericInfoPage = lazy(() => import('@/pages/public/GenericInfoPage'));
const ReviewsPage = lazy(() => import('@/pages/public/ReviewsPage'));
const SubmitReviewPage = lazy(() => import('@/pages/public/SubmitReviewPage'));
const BlogPage = lazy(() => import('@/pages/public/BlogPage'));

// New Standalone Pages
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/public/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('@/pages/public/TermsAndConditionsPage'));
const WithdrawalPolicyPage = lazy(() => import('@/pages/public/WithdrawalPolicyPage'));
const ReferralRulesPage = lazy(() => import('@/pages/public/ReferralRulesPage'));

export default function App() {
  const setCachedProfile = useStore(state => state.setCachedProfile);
  const setIsAuthReady = useStore(state => state.setIsAuthReady);
  const isAuthReady = useStore(state => state.isAuthReady);
  const isProfileSyncing = useStore(state => state.isProfileSyncing);
  const setIsProfileSyncing = useStore(state => state.setIsProfileSyncing);
  const clearCache = useStore(state => state.clearCache);

  const [banDetails, setBanDetails] = useState<{ isBanned: boolean; reason?: string } | null>(null);

  useEffect(() => {
    // Fallback to ensure auth ready state resolves even if supabase hangs
    const fallbackTimer = setTimeout(() => {
      console.warn("Auth initialization timed out, forcing ready state");
      setIsAuthReady(true);
    }, 2000);

    async function ensureProfileIntegrity(profile: any, userId: string, isNew: boolean = false) {
      const updates: any = {};
      let needsUpdate = false;
      
      if (!profile.uid) {
        updates.uid = Math.floor(10000000 + Math.random() * 90000000).toString();
        needsUpdate = true;
      }
      
      if (!profile.referral_code || profile.referral_code === 'TASKVEXA_USER') {
        const randomSuffix = Math.floor(10000 + Math.random() * 90000).toString();
        updates.referral_code = `TASKVEXA_${randomSuffix}`;
        needsUpdate = true;
      }
      
      // Handle pending referral
      const pendingRef = localStorage.getItem('pending_referral');
      if (!profile.referred_by && pendingRef && pendingRef !== profile.referral_code) {
        try {
          const { data: refUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', pendingRef.toUpperCase())
            .maybeSingle();
          
          if (refUser && refUser.id !== userId) {
            updates.referred_by = refUser.id;
            needsUpdate = true;
          }
        } catch (err) {
          console.error("[Auth-Trace-Sync-Detail-Ref-Error]", err);
        }
        localStorage.removeItem('pending_referral');
      }
      
      if (needsUpdate) {
        try {
          const dbPromise = isNew
            ? supabase
                .from('profiles')
                .upsert({ id: userId, ...profile, ...updates })
                .select()
                .maybeSingle()
            : supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .maybeSingle();

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Database operation timeout")), 12000)
          );

          const { data: updatedProfile, error: updateErr } = await Promise.race([
            dbPromise,
            timeoutPromise
          ]) as any;
          
          if (updateErr) throw updateErr;
          
          if (updatedProfile) {
            setCachedProfile(updatedProfile);
            return updatedProfile;
          }
        } catch (err) {
          console.error("Profile update error:", err);
        }
      }
      
      setCachedProfile(profile);
      return profile;
    }

    // Use a lock to prevent concurrent syncs
    let isSyncInProgress = false;

    async function syncProfile(userId: string, sessionUser: any) {
      if (isSyncInProgress) return;
      
      isSyncInProgress = true;
      // Only set UI-visible syncing state if we don't have a cached profile yet to prevent full-screen resets and unmounting
      if (!useStore.getState().cachedProfile) {
        setIsProfileSyncing(true);
      }

      const syncTimeoutId = setTimeout(() => {
        setIsProfileSyncing(false);
        isSyncInProgress = false;
      }, 25000);

      try {
        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Supabase response timeout")), 15000)
        );

        const { data: profile, error: fetchErr } = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]) as any;

        if (profile) {
          if (profile.is_banned) {
            setBanDetails({ isBanned: true, reason: profile.ban_reason });
            await supabase.auth.signOut();
            clearCache();
            return;
          }
          await ensureProfileIntegrity(profile, userId, false);
        } else {
          const skeleton = {
            id: userId,
            email: sessionUser.email,
            full_name: sessionUser.email?.split('@')[0] || 'User',
            wallet_balance: 0,
            total_referral_earnings: 0
          };
          await ensureProfileIntegrity(skeleton, userId, true);
        }
      } catch (err) {
        console.error("Sync error:", err);
        if (!useStore.getState().cachedProfile) {
           setCachedProfile({
             id: userId,
             email: sessionUser.email,
             full_name: 'Guest User',
             wallet_balance: 0
           });
        }
      } finally {
        clearTimeout(syncTimeoutId);
        setIsProfileSyncing(false);
        isSyncInProgress = false;
      }
    }

    async function initializeAuth() {
      const initTimeout = setTimeout(() => {
        setIsAuthReady(true);
      }, 10000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) console.error("Session error:", sessionError);
        
        if (session?.user) {
          await syncProfile(session.user.id, session.user);
          // Request FCM setup on session restoration
          setupFCM(session.user.id).catch(err => {
            console.error("[FCM] Error in background setupFCM on init:", err);
          });
        }
      } catch (error) {
        console.error("Init error:", error);
      } finally {
        clearTimeout(initTimeout);
        clearTimeout(fallbackTimer);
        setIsAuthReady(true);
      }
    }

    initializeAuth();

    let lastRevalidationTime = 0;
    const handleRevalidation = async () => {
      const now = Date.now();
      // Rate-limit revalidation to once every 6 seconds to prevent duplicate API requests or DB reads
      if (now - lastRevalidationTime < 6000) {
        return;
      }
      lastRevalidationTime = now;
      
      console.log("[Recovery] Revalidating session and profile integrity...");
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("[Recovery] Error fetching session:", sessionError);
          return;
        }
        if (session?.user) {
          await syncProfile(session.user.id, session.user);
        }
      } catch (err) {
        console.error("[Recovery] Revalidation failed:", err);
      }
    };

    window.addEventListener('online', handleRevalidation);
    window.addEventListener('focus', handleRevalidation);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRevalidation();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        syncProfile(session.user.id, session.user);
        // Request FCM setup on successful sign in or update
        setupFCM(session.user.id).catch(err => {
          console.error("[FCM] Error in background setupFCM on state change:", err);
        });
      } else if (event === 'SIGNED_OUT') {
        clearCache();
        setIsProfileSyncing(false);
        isSyncInProgress = false;
        
        // Reset ad state so it can display again on next login/visit
        sessionStorage.removeItem('landing_ad_closed');
        sessionStorage.removeItem('dashboard_ad_closed');
        if (typeof window !== 'undefined') {
          (window as any).adInitialized = false;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleRevalidation);
      window.removeEventListener('focus', handleRevalidation);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setCachedProfile, setIsAuthReady, clearCache, setIsProfileSyncing]);

  const isProtectedPath = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/dashboard') || 
    window.location.pathname.startsWith('/admin')
  );

  if (!isAuthReady || (isProtectedPath && isProfileSyncing)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[80vh] h-[80vh] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[80vh] h-[80vh] bg-cyan-500/5 dark:bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative flex flex-col items-center select-none">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 rounded-full border-[4px] border-indigo-100 dark:border-slate-800/80"></div>
            <div className="absolute inset-0 rounded-full border-[4px] border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Taskvexa</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm font-sans">Restoring secure session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatedFavicon />
      <RouteErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />
          <WithdrawalFeedbackPopup />
          <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
              <div className="absolute top-[-10%] left-[-15%] w-[80vh] h-[80vh] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="absolute bottom-[-10%] right-[-15%] w-[80vh] h-[80vh] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="relative flex flex-col items-center select-none">
                <div className="relative w-12 h-12 mb-3">
                  <div className="absolute inset-0 rounded-full border-[3px] border-indigo-100 dark:border-slate-800/80"></div>
                  <div className="absolute inset-0 rounded-full border-[3px] border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-tight font-sans">Loading Page...</p>
              </div>
            </div>
          }>
            <Routes>
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="features" element={<FeaturesPage />} />
              <Route path="how-it-works" element={<HowItWorksPage />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="submit-review" element={<SubmitReviewPage />} />
              
              <Route path="about" element={<AboutPage />} />
              <Route path="community" element={<GenericInfoPage title="Community" />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="contact" element={<ContactPage />} />
              
              {/* Standalone SEO optimized paths */}
              <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="terms-and-conditions" element={<TermsAndConditionsPage />} />
              <Route path="withdrawal-policy" element={<WithdrawalPolicyPage />} />
              <Route path="referral-rules" element={<ReferralRulesPage />} />

              {/* Legacy navigation redirects for safety and backward compatibility */}
              <Route path="legal/terms" element={<Navigate to="/terms-and-conditions" replace />} />
              <Route path="legal/privacy" element={<Navigate to="/privacy-policy" replace />} />
              <Route path="legal/cookies" element={<GenericInfoPage title="Cookie Policy" />} />
              <Route path="legal/withdrawal-policy" element={<Navigate to="/withdrawal-policy" replace />} />
              <Route path="legal/referral-rules" element={<Navigate to="/referral-rules" replace />} />
              <Route path="rewards" element={<GenericInfoPage title="Rewards Catalog" />} />
              <Route path="leaderboard" element={<GenericInfoPage title="Global Leaderboard" />} />
            </Route>
            
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage initialIsLogin={false} />} />
            
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="tasks" element={<TaskListingPage />} />
              <Route path="tasks/:id" element={<TaskDetailPage />} />
              <Route path="dynamic-tasks/:id" element={<DynamicTaskDetailPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="withdraw" element={<WithdrawPage />} />
              <Route path="receipt/:id" element={<ReceiptPage />} />
              <Route path="converter" element={<CoinConverterPage />} />
              <Route path="referrals" element={<ReferralPage />} />
              <Route path="referrals/members" element={<ReferralMembersPage />} />
              <Route path="referral-competition" element={<ReferralCompetitionPage />} />
              <Route path="rules" element={<RulesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings/profile" element={<ProfilePage />} />
              <Route path="settings/password" element={<PasswordPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="bug" element={<ReportBugPage />} />
              <Route path="review" element={<WebsiteReviewPage />} />
              <Route path="suggestions" element={<SuggestionsPage />} />
              <Route path="cpx-surveys" element={<CpxSurveysPage />} />
              <Route path="request-task" element={<RequestTaskPage />} />
            </Route>
            
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="tasks" element={<AdminTasksPage />} />
              <Route path="dynamic-tasks" element={<AdminDynamicTasksPage />} />
              <Route path="submissions" element={<AdminSubmissionsPage />} />
              <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="task-requests" element={<AdminTaskRequestsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/active" element={<AdminUsersPage filterType="active" />} />
              <Route path="users/today" element={<AdminUsersPage filterType="today" />} />
              <Route path="referrals" element={<AdminReferralsPage />} />
              <Route path="converter" element={<AdminConverterPage />} />
              <Route path="feedback" element={<AdminFeedbackPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </RouteErrorBoundary>

      {/* Account Ban Modal Screen Overlay */}
      <AnimatePresence>
        {banDetails && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBanDetails(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-[28px] border border-rose-100 dark:border-rose-950 p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
              
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full mb-4">
                <AlertTriangle className="w-10 h-10 animate-bounce" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Account Banned</h3>
              
              <p className="text-sm font-semibold text-slate-650 dark:text-slate-300 leading-relaxed max-w-sm mb-4">
                Your account has been permanently banned by the administrator.
              </p>
              
              {banDetails.reason && (
                <div className="w-full bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 mb-6 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block mb-0.5">Reason</span>
                  <p className="text-xs font-bold text-rose-850 dark:text-rose-400 leading-relaxed">
                    {banDetails.reason}
                  </p>
                </div>
              )}
              
              <button
                onClick={() => setBanDetails(null)}
                className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-600/10 active:scale-95"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

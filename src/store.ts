import { create } from 'zustand';

interface UserState {
  avatar: string;
  setAvatar: (avatar: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isChatOpen: boolean;
  setChatOpen: (isOpen: boolean) => void;
  cachedProfile: any | null;
  setCachedProfile: (profile: any) => void;
  cachedStats: any | null;
  cachedStatsTime: number;
  setCachedStats: (stats: any) => void;
  cachedRecentActivity: any[];
  setCachedRecentActivity: (activity: any[]) => void;
  cachedChartData: any[];
  setCachedChartData: (data: any[]) => void;
  cachedUserTasks: any[];
  setCachedUserTasks: (tasks: any[]) => void;
  cachedCategories: any[];
  setCachedCategories: (categories: any[]) => void;
  cachedAdminUsers: any[];
  setCachedAdminUsers: (users: any[]) => void;
  cachedAdminTasks: any[];
  setCachedAdminTasks: (tasks: any[]) => void;
  cachedAdminWithdrawals: any[];
  setCachedAdminWithdrawals: (withdrawals: any[]) => void;
  cachedAdminSubmissions: any[];
  setCachedAdminSubmissions: (submissions: any[]) => void;
  cachedAdminStats: any | null;
  cachedAdminStatsTime: number;
  setCachedAdminStats: (stats: any) => void;
  isAuthReady: boolean;
  setIsAuthReady: (isReady: boolean) => void;
  isProfileSyncing: boolean;
  setIsProfileSyncing: (isSyncing: boolean) => void;
  showAnnouncementModal: boolean;
  setShowAnnouncementModal: (show: boolean) => void;
  clearCache: () => void;
}

const getInitialProfile = (): any | null => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cached_profile') : null;
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to parse initial profile from localStorage:", e);
    return null;
  }
};

const getInitialAvatar = (): string => {
  try {
    const profile = getInitialProfile();
    return profile?.avatar_url || '';
  } catch (e) {
    return '';
  }
};

export const useStore = create<UserState>((set) => ({
  avatar: getInitialAvatar(),
  setAvatar: (avatar) => set({ avatar }),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  isChatOpen: false,
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  cachedProfile: getInitialProfile(),
  setCachedProfile: (profile) => {
    console.log("[Store] Setting cached profile:", profile?.email);
    if (profile) {
      try {
        localStorage.setItem('cached_profile', JSON.stringify(profile));
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem('cached_profile');
      } catch (e) {}
    }
    set({ cachedProfile: profile, avatar: profile?.avatar_url || '' });
  },
  cachedStats: null,
  cachedStatsTime: 0,
  setCachedStats: (stats) => set({ cachedStats: stats, cachedStatsTime: Date.now() }),
  cachedRecentActivity: [],
  setCachedRecentActivity: (activity) => set({ cachedRecentActivity: activity }),
  cachedChartData: [],
  setCachedChartData: (data) => set({ cachedChartData: data }),
  cachedUserTasks: [],
  setCachedUserTasks: (tasks) => set({ cachedUserTasks: tasks }),
  cachedCategories: [],
  setCachedCategories: (categories) => set({ cachedCategories: categories }),
  cachedAdminUsers: [],
  setCachedAdminUsers: (users) => set({ cachedAdminUsers: users }),
  cachedAdminTasks: [],
  setCachedAdminTasks: (tasks) => set({ cachedAdminTasks: tasks }),
  cachedAdminWithdrawals: [],
  setCachedAdminWithdrawals: (withdrawals) => set({ cachedAdminWithdrawals: withdrawals }),
  cachedAdminSubmissions: [],
  setCachedAdminSubmissions: (submissions) => set({ cachedAdminSubmissions: submissions }),
  cachedAdminStats: null,
  cachedAdminStatsTime: 0,
  setCachedAdminStats: (stats) => set({ cachedAdminStats: stats, cachedAdminStatsTime: Date.now() }),
  isAuthReady: false,
  setIsAuthReady: (isAuthReady) => set({ isAuthReady }),
  isProfileSyncing: false,
  setIsProfileSyncing: (isProfileSyncing) => set({ isProfileSyncing }),
  showAnnouncementModal: false,
  setShowAnnouncementModal: (showAnnouncementModal) => set({ showAnnouncementModal }),
  clearCache: () => {
    try {
      localStorage.removeItem('cached_profile');
    } catch (e) {}
    set({
      cachedProfile: null,
      cachedStats: null,
      cachedStatsTime: 0,
      cachedRecentActivity: [],
      cachedChartData: [],
      cachedUserTasks: [],
      cachedCategories: [],
      cachedAdminUsers: [],
      cachedAdminTasks: [],
      cachedAdminWithdrawals: [],
      cachedAdminSubmissions: [],
      cachedAdminStats: null,
      cachedAdminStatsTime: 0,
      avatar: '',
      isProfileSyncing: false,
      showAnnouncementModal: false,
    });
  },
}));


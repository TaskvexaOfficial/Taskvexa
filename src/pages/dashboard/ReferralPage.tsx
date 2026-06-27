import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Share2, 
  Users, 
  Trophy, 
  CheckCircle2, 
  Twitter, 
  User, 
  Loader2, 
  Facebook, 
  Send,
  Gift,
  Award,
  ArrowLeft,
  ArrowRight,
  Zap,
  Star,
  Crown,
  ChevronRight,
  ShieldCheck,
  Check,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Info,
  Globe,
  Activity,
  Wallet,
  MoreHorizontal,
  Megaphone,
  ClipboardList,
  Instagram,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCompactNumber } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { BannerAd } from '@/components/BannerAd';

// Premium Brand SVGs for Social Sharing
const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.004 2c-5.518 0-9.997 4.478-9.997 9.996 0 1.92.54 3.714 1.472 5.25L2.003 22l4.904-1.285c1.475.803 3.15 1.258 4.935 1.258 5.518 0 9.997-4.478 9.997-9.996s-4.479-9.996-9.997-9.996zm6.34 13.985c-.263.744-1.296 1.36-1.787 1.442-.48.081-.98.118-2.607-.544-2.083-.847-3.415-2.956-3.518-3.096-.104-.14-.836-1.11-.836-2.115 0-1.005.525-1.5.713-1.693.188-.194.413-.243.55-.243.138 0 .276 0 .388.006.12.006.275-.044.432.33.162.388.55 1.344.6 1.444.05.1.088.213.013.363-.075.15-.113.25-.226.388-.112.137-.238.306-.338.412-.112.113-.23.238-.1.463.131.226.582.957 1.245 1.55.857.769 1.576 1.006 1.801 1.113.225.106.357.087.488-.063.131-.15.563-.656.713-.881.15-.225.3-.188.507-.113.206.075 1.313.619 1.538.731.225.113.375.169.431.263.056.094.056.544-.207 1.288z" />
  </svg>
);

const TelegramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.6 1.5-1.55 2.75-2.9 2.86-3.05.02-.04.05-.13-.01-.18-.06-.05-.15-.03-.22-.01-.1.02-1.62 1.03-4.58 3.03-.43.3-.83.45-1.18.44-.39-.01-1.13-.22-1.69-.4-.68-.22-1.22-.34-1.18-.73.02-.2.3-.41.83-.62 3.24-1.4 5.4-2.33 6.48-2.78 3.08-1.28 3.72-1.5 4.13-1.5.1 0 .3.02.43.13.11.1.14.23.15.33-.01.1-.01.24-.02.4z" />
  </svg>
);

const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

type ActiveView = 'main' | 'leaderboard' | 'history' | 'referrals' | 'achievements';

export default function ReferralPage() {
  const { cachedProfile } = useStore();
  const [activeView, setActiveView] = useState<ActiveView>('main');
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeNodes: 0,
    passiveRevenue: 0,
    totalTasksCompletedByReferrals: 0,
    thisMonthEarnings: 0,
    growthPercentage: 0
  });
  
  const [allReferrals, setAllReferrals] = useState<any[]>([]);
  const [userEarningsMap, setUserEarningsMap] = useState<Record<string, number>>({});
  const [allEarningHistory, setAllEarningHistory] = useState<any[]>([]);
  const [topEarners, setTopEarners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const referralCode = cachedProfile?.referral_code || "TASKVEXA20";
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
  const shareMessage = `🚀 Join TaskVexa and start earning money today! 💸\n\nUse my referral code: ${referralCode}\n\nSign up here: ${referralLink}\n\nNo investment required! Let's earn together! 🤝`;

  useEffect(() => {
    if (cachedProfile?.id) {
      fetchReferralData();
    }
  }, [cachedProfile]);

  async function fetchReferralData() {
    setIsLoading(true);
    try {
      // 1. Get referrals
      const { data: referredUsers, error: refError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, total_tasks_completed, avatar_url, country')
        .eq('referred_by', cachedProfile?.id)
        .order('created_at', { ascending: false });

      if (refError) throw refError;

      const totalReferrals = referredUsers?.length || 0;
      const activeNodes = referredUsers?.filter(u => (u.total_tasks_completed || 0) > 0).length || 0;
      const passiveRevenue = cachedProfile?.total_referral_earnings || 0;
      const totalTasksCompletedByReferrals = referredUsers?.reduce((sum, u) => sum + (u.total_tasks_completed || 0), 0) || 0;

      // 2. Fetch commission history with referred user ID
      const { data: history, error: historyError } = await supabase
        .from('referral_earnings')
        .select('id, commission_amount, created_at, referred_user_id')
        .eq('referrer_user_id', cachedProfile?.id)
        .order('created_at', { ascending: false });
      
      if (historyError) {
        console.error("Error fetching earning history:", historyError);
      }
      
      let rawHistory = history || [];
      const memberIds = referredUsers?.map(u => u.id) || [];

      // If the primary query by referrer_user_id is empty or missing entries,
      // let's fetch by referred_user_id to ensure we have the commission details.
      if (memberIds.length > 0) {
        const { data: directComms, error: directCommsError } = await supabase
          .from('referral_earnings')
          .select('id, commission_amount, created_at, referred_user_id')
          .in('referred_user_id', memberIds)
          .order('created_at', { ascending: false });
        
        if (!directCommsError && directComms && directComms.length > 0) {
          if (rawHistory.length === 0) {
            rawHistory = directComms;
          } else {
            const historyIds = new Set(rawHistory.map(h => h.id));
            directComms.forEach((item: any) => {
              if (!historyIds.has(item.id)) {
                rawHistory.push(item);
              }
            });
          }
        }
      }
      
      const referredUsersMap = new Map((referredUsers || []).map(u => [u.id, u]));

      const earningHistoryData = rawHistory.map((item: any) => {
        const refUser = item.referred_user_id ? referredUsersMap.get(item.referred_user_id) : null;
        return {
          ...item,
          referred: refUser ? {
            id: refUser.id,
            full_name: refUser.full_name,
            avatar_url: refUser.avatar_url
          } : {
            id: item.referred_user_id || 'deleted',
            full_name: 'Deleted User',
            avatar_url: null,
            is_deleted: true
          }
        };
      });

      setAllEarningHistory(earningHistoryData);

      // Temporary Diagnostics Console Logs
      console.log("=== DIAGNOSTICS START ===");
      console.log("cachedProfile.id:", cachedProfile?.id);
      
      if (referredUsers && referredUsers.length > 0) {
        referredUsers.forEach((member: any) => {
          console.log("member.id:", member.id, "name:", member.full_name);
        });
      } else {
        console.log("member.id: [No referred users found]");
      }
      
      if (earningHistoryData && earningHistoryData.length > 0) {
        earningHistoryData.forEach((item: any) => {
          console.log("referred_user_id:", item.referred_user_id, "amount:", item.commission_amount);
        });
      } else {
        console.log("referred_user_id: [No earning history found]");
      }
      console.log("=== DIAGNOSTICS END ===");

      // Map real earnings per referred user
      const earningsMap: Record<string, number> = {};
      
      // Initialize with 0 for all referred users
      if (referredUsers) {
        referredUsers.forEach((u: any) => {
          earningsMap[u.id] = 0;
        });
      }

      // Fetch all commission totals for this referrer
      const { data: allCommissions, error: commsError } = await supabase
        .from('referral_earnings')
        .select('referred_user_id, commission_amount')
        .eq('referrer_user_id', cachedProfile?.id);

      if (!commsError && allCommissions) {
        allCommissions.forEach((item: any) => {
          const uid = item.referred_user_id;
          if (uid && earningsMap[uid] !== undefined) {
            earningsMap[uid] += Number(item.commission_amount || 0);
          } else if (uid) {
            earningsMap[uid] = Number(item.commission_amount || 0);
          }
        });
      }

      console.log("earningsMap:", earningsMap);
      setUserEarningsMap(earningsMap);

      // Sort referred users by real earned commission descending
      const sortedReferredUsers = [...(referredUsers || [])].sort((a, b) => {
        const earnA = earningsMap[a.id] || 0;
        const earnB = earningsMap[b.id] || 0;
        return earnB - earnA;
      });
      setAllReferrals(sortedReferredUsers);

      // Calculate this month's earnings (current calendar month) and previous month
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfThisMonthTime = startOfCurrentMonth.getTime();
      const startOfLastMonthTime = startOfLastMonth.getTime();

      const thisMonthEarnings = earningHistoryData
        .filter((item: any) => new Date(item.created_at).getTime() >= startOfThisMonthTime)
        .reduce((sum: number, item: any) => sum + Number(item.commission_amount || 0), 0);

      const lastMonthEarnings = earningHistoryData
        .filter((item: any) => {
          const t = new Date(item.created_at).getTime();
          return t >= startOfLastMonthTime && t < startOfThisMonthTime;
        })
        .reduce((sum: number, item: any) => sum + Number(item.commission_amount || 0), 0);

      let growthPercentage = 0;
      if (lastMonthEarnings > 0) {
        growthPercentage = ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;
      } else if (thisMonthEarnings > 0) {
        growthPercentage = 100;
      }

      setStats({
        totalReferrals,
        activeNodes,
        passiveRevenue,
        totalTasksCompletedByReferrals,
        thisMonthEarnings,
        growthPercentage
      });

      // 3. Fetch top earners
      const { data: topEarnersData } = await supabase
        .from('profiles')
        .select('id, full_name, uid, avatar_url, total_referral_earnings')
        .order('total_referral_earnings', { ascending: false })
        .limit(10);
      
      setTopEarners(topEarnersData || []);
    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank');
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const shareOnTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const triggerNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TaskVexa',
          text: shareMessage,
          url: referralLink,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const renderUserAvatar = (name: string, url?: string, sizeClass = "w-11 h-11", isDeleted = false) => {
    if (isDeleted) {
      return (
        <div className={cn(sizeClass, "rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 shadow-sm text-[10px]")}>
          DU
        </div>
      );
    }
    if (url) {
      return (
        <img 
          src={url} 
          alt={name} 
          referrerPolicy="no-referrer"
          className={cn(sizeClass, "rounded-full object-cover border border-slate-100 shadow-sm")} 
        />
      );
    }
    const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
    const colors = [
      'from-indigo-500 to-purple-600',
      'from-emerald-400 to-teal-600',
      'from-pink-500 to-rose-600',
      'from-amber-400 to-orange-600',
      'from-blue-500 to-indigo-600'
    ];
    const hash = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const gradient = colors[hash % colors.length];

    return (
      <div className={cn(sizeClass, "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shadow-sm text-xs", gradient)}>
        {initials}
      </div>
    );
  };

  // Styled SVG Vector components to match the high-end design
  const HeroIllustration = () => (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 flex items-center justify-center select-none">
      <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
      <svg viewBox="0 0 160 160" className="w-full h-full relative z-10 drop-shadow-[0_8px_16px_rgba(99,102,241,0.15)]">
        {/* Floating Stars */}
        <path d="M120,30 L123,35 L129,36 L124,40 L125,46 L120,43 L115,46 L116,40 L111,36 L117,35 Z" fill="#FBBF24" />
        <path d="M40,110 L41.5,112.5 L46,113 L43,115.5 L43.5,119.5 L40,117.5 L36.5,119.5 L37,115.5 L34,113 L38.5,112.5 Z" fill="#FBBF24" />
        
        {/* Gold coin stack base left */}
        <ellipse cx="25" cy="120" rx="14" ry="5" fill="#D97706" />
        <rect x="11" y="114" width="28" height="6" fill="#F59E0B" />
        <ellipse cx="25" cy="114" rx="14" ry="5" fill="#FBBF24" />
        <rect x="11" y="108" width="28" height="6" fill="#FBBF24" />
        <ellipse cx="25" cy="108" rx="14" ry="5" fill="#FCD34D" />

        {/* Gold coin stack base right */}
        <ellipse cx="135" cy="122" rx="15" ry="5.5" fill="#D97706" />
        <rect x="120" y="115" width="30" height="7" fill="#F59E0B" />
        <ellipse cx="135" cy="115" rx="15" ry="5.5" fill="#FBBF24" />
        <rect x="120" y="108" width="30" height="7" fill="#FBBF24" />
        <ellipse cx="135" cy="108" rx="15" ry="5.5" fill="#FCD34D" />
        
        {/* Gift Box group */}
        <g transform="translate(38, 42)">
          {/* Box Shadow */}
          <ellipse cx="38" cy="74" rx="34" ry="9" fill="#E2E8F0" />
          
          {/* Main Box body */}
          <rect x="8" y="26" width="60" height="46" rx="8" fill="#4F46E5" />
          {/* Box Lid */}
          <rect x="4" y="16" width="68" height="12" rx="4" fill="#818CF8" />

          {/* Golden ribbon wrapping */}
          <rect x="34" y="16" width="8" height="56" fill="#F59E0B" />
          <rect x="35" y="16" width="6" height="56" fill="#FCD34D" />
          <rect x="8" y="42" width="60" height="8" fill="#F59E0B" />
          <rect x="8" y="43" width="60" height="6" fill="#FCD34D" />

          {/* Bow on top */}
          <path d="M38,16 C25,-1 38,1 38,16 Z" fill="#D97706" />
          <path d="M38,16 C28,1 38,2 38,16 Z" fill="#F59E0B" />
          <path d="M38,16 C51,-1 38,1 38,16 Z" fill="#D97706" />
          <path d="M38,16 C48,1 38,2 38,16 Z" fill="#F59E0B" />
          
          <circle cx="38" cy="16" r="5" fill="#FBBF24" />
          <circle cx="38" cy="16" r="3" fill="#FDE68A" />
        </g>
      </svg>
    </div>
  );

  const MegaphoneIllustration = () => (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center select-none">
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]">
        <circle cx="60" cy="60" r="48" fill="white" fillOpacity="0.08" />
        <g transform="translate(20, 24) rotate(-12)">
          {/* Handle */}
          <rect x="22" y="44" width="8" height="22" rx="2" fill="#312E81" />
          <rect x="23" y="44" width="6" height="22" rx="1" fill="#4F46E5" />
          
          {/* Body */}
          <path d="M15,35 L60,12 L60,58 L15,35 Z" fill="#E0E7FF" stroke="#312E81" strokeWidth="4.5" strokeLinejoin="round" />
          <rect x="5" y="30" width="12" height="10" rx="3" fill="#312E81" />
          <rect x="7" y="31" width="8" height="8" rx="2" fill="#818CF8" />

          {/* Front lip */}
          <path d="M60,12 C72,12 72,58 60,58 Z" fill="#4F46E5" />
          <path d="M60,18 L74,10 L74,60 L60,52" fill="#818CF8" />
        </g>
        {/* Floating circles representing sounds */}
        <circle cx="96" cy="38" r="9" fill="#FBBF24" />
        <circle cx="106" cy="70" r="6" fill="#60A5FA" />
        <circle cx="32" cy="88" r="7" fill="#34D399" />
      </svg>
    </div>
  );

  const RosetteMedal = () => (
    <div className="w-10 h-10 shrink-0 text-emerald-500 flex items-center justify-center select-none">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
        <path d="M35 50 L20 92 L48 76 L76 92 L61 50" fill="#34D399" />
        <path d="M42 50 L30 92 L48 76 L66 92 L54 50" fill="#059669" />
        <circle cx="48" cy="42" r="26" fill="#34D399" stroke="#10B981" strokeWidth="4" />
        <circle cx="48" cy="42" r="18" fill="#10B981" />
        <path d="M40 42 L46 48 L58 36" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );

  // Generate beautiful shield icon based on milestone levels
  const renderBadgeIcon = (num: number, type: 'bronze' | 'silver' | 'gold' | 'master') => {
    let strokeColor = '';
    let textColor = '';
    let badgeBg = '';

    if (type === 'bronze') {
      strokeColor = '#10B981';
      textColor = '#059669';
      badgeBg = '#E6F9F3';
    } else if (type === 'silver') {
      strokeColor = '#94A3B8';
      textColor = '#475569';
      badgeBg = '#F1F5F9';
    } else if (type === 'gold') {
      strokeColor = '#F59E0B';
      textColor = '#D97706';
      badgeBg = '#FEF3C7';
    } else {
      strokeColor = '#A855F7';
      textColor = '#7E22CE';
      badgeBg = '#F3E8FF';
    }

    return (
      <div className="relative w-14 h-14 flex items-center justify-center mx-auto mb-3 select-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
          <path 
            d="M50 12 L78 20 C78 50 50 82 50 82 C50 82 22 50 22 20 L50 12 Z" 
            fill={badgeBg} 
            stroke={strokeColor} 
            strokeWidth="5" 
            strokeLinejoin="round"
          />
          {/* Stars under badge */}
          <path d="M36 28 L39 31 L44 32 L40 35 L41 40 L36 37 L31 40 L32 35 L28 32 L33 31 Z" fill="#FBBF24" />
          <path d="M64 28 L67 31 L72 32 L68 35 L69 40 L64 37 L59 40 L60 35 L56 32 L61 31 Z" fill="#FBBF24" />
        </svg>
        <span 
          className="absolute font-black text-sm tracking-tight" 
          style={{ color: textColor, transform: 'translateY(-2px)' }}
        >
          {num}
        </span>
      </div>
    );
  };

  // 1. Invite Friends Banner Component
  const renderInviteBanner = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4 relative overflow-hidden">
      <div className="space-y-3 max-w-[65%]">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white leading-[1.15] tracking-tight">
          Invite Friends & <br />
          <span className="text-[#6366F1]">Earn</span> More
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Earn <span className="font-extrabold text-[#6366F1]">20%</span> Lifetime Commission on every approved task completed by your referrals.
        </p>
      </div>
      <HeroIllustration />
    </div>
  );

  // 2. Earnings Graph Card & Three Stats Underneath
  const renderEarningsCard = () => {
    return (
      <div className="space-y-4">
        {/* Blue Gradient Earnings Card */}
        <div className="bg-gradient-to-br from-[#1E1B4B] to-[#4F46E5] text-white rounded-[24px] p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(79,70,229,0.15)] border border-white/5 min-h-[160px] flex flex-col justify-between">
          {/* Wavy glowing line graph behind */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-35 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="none">
              <path 
                d="M0,90 Q40,65 80,85 T160,30 T200,18" 
                fill="none" 
                stroke="url(#line-glow)" 
                strokeWidth="4" 
                strokeLinecap="round"
              />
              <path 
                d="M0,90 Q40,65 80,85 T160,30 T200,18 L200,120 L0,120 Z" 
                fill="url(#area-gradient)" 
              />
              <circle cx="200" cy="18" r="5" fill="#10B981" />
              <circle cx="200" cy="18" r="10" fill="#10B981" fillOpacity="0.3" className="animate-pulse" />
              <defs>
                <linearGradient id="line-glow" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="50%" stopColor="#C084FC" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200/80">Total Referral Earnings</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none mt-2 flex items-center gap-2">
              {stats.passiveRevenue.toLocaleString('en-IN')} <Coins className="w-7 h-7 text-amber-400 fill-amber-400/20 animate-pulse" strokeWidth={2.5} />
            </h2>
          </div>

          <div className="relative z-10 pt-4">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> {stats.growthPercentage > 0 ? `+${stats.growthPercentage.toFixed(1)}%` : `${stats.growthPercentage.toFixed(1)}%`} this month
            </div>
          </div>
        </div>

        {/* Separated Mini Statistics Card Columns */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center flex flex-col justify-center items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider leading-none">Total Referrals</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-2 leading-none">{stats.totalReferrals}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center flex flex-col justify-center items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider leading-none">Active Referrals</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-2 leading-none">{stats.activeNodes}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center flex flex-col justify-center items-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-inner">
              <ClipboardList className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider leading-none">Tasks Done</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-2 leading-none">{stats.totalTasksCompletedByReferrals}</p>
          </div>
        </div>
      </div>
    );
  };

  // 3. Referral Link Card
  const renderReferralLink = () => (
    <div className="rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white dark:bg-slate-900 p-6 space-y-5">
      <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5 leading-none">
        Your Referral Link <Info className="w-4 h-4 text-slate-300 cursor-pointer" />
      </h3>

      <div className="space-y-4">
        {/* Code Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Referral Code</label>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-900">
            <span className="font-extrabold text-slate-950 dark:text-white text-sm tracking-wider">{referralCode}</span>
            <button 
              onClick={handleCopyCode} 
              className="px-3 py-1.5 bg-[#6366F1] hover:bg-[#5053E0] text-white font-bold text-[10px] flex items-center gap-1.5 rounded-lg transition-colors shadow-sm"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Link Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Referral Link</label>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-900">
            <span className="font-medium text-slate-500 dark:text-slate-400 text-xs truncate pr-4 max-w-[200px] sm:max-w-xs">{referralLink}</span>
            <button 
              onClick={handleCopyLink} 
              className="px-3 py-1.5 bg-[#6366F1] hover:bg-[#5053E0] text-white font-bold text-[10px] flex items-center gap-1.5 rounded-lg transition-colors shadow-sm shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Big Blue Share Now button */}
        <button 
          onClick={triggerNativeShare}
          className="w-full h-11 bg-[#6366F1] hover:bg-[#5053E0] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-[0.99] text-xs"
        >
          <Share2 className="w-4 h-4" /> Share Now
        </button>

        {/* Social Sharing Icons horizontal row */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-1">
            <button onClick={shareOnWhatsApp} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <WhatsAppIcon className="w-5 h-5 fill-white" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">WhatsApp</span>
            </button>

            <button onClick={shareOnTelegram} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#0088CC] text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <TelegramIcon className="w-5.5 h-5.5 fill-white" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">Telegram</span>
            </button>

            <button onClick={shareOnFacebook} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <FacebookIcon className="w-5 h-5 fill-white" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">Facebook</span>
            </button>

            <button onClick={shareOnTwitter} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform border border-slate-800">
                <XIcon className="w-4.5 h-4.5 fill-white" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">X</span>
            </button>

            <button onClick={triggerNativeShare} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <Share2 className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 4. How It Works Section Component
  const renderHowItWorks = () => (
    <div className="rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white dark:bg-slate-900 p-6 space-y-6">
      <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5 leading-none">
        How It Works <Info className="w-4 h-4 text-slate-300 cursor-pointer" />
      </h3>

      <div className="relative">
        <div className="flex flex-row items-start justify-between relative z-10">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center max-w-[20%] space-y-2">
            <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shadow-inner border border-indigo-50 dark:border-indigo-900">
              <Globe className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest leading-none">Step 1</p>
              <p className="text-[9px] font-black text-slate-700 dark:text-slate-355 leading-tight">Share your referral link</p>
            </div>
          </div>

          <div className="pt-4 shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center max-w-[20%] space-y-2">
            <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shadow-inner border border-blue-50 dark:border-blue-900">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-extrabold text-blue-500 uppercase tracking-widest leading-none">Step 2</p>
              <p className="text-[9px] font-black text-slate-700 dark:text-slate-355 leading-tight">Friend signs up</p>
            </div>
          </div>

          <div className="pt-4 shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center max-w-[20%] space-y-2">
            <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shadow-inner border border-emerald-50 dark:border-emerald-900">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest leading-none">Step 3</p>
              <p className="text-[9px] font-black text-slate-700 dark:text-slate-355 leading-tight">Friend completes tasks</p>
            </div>
          </div>

          <div className="pt-4 shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center max-w-[20%] space-y-2">
            <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shadow-inner border border-amber-50 dark:border-amber-900">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-extrabold text-amber-500 uppercase tracking-widest leading-none">Step 4</p>
              <p className="text-[9px] font-black text-slate-700 dark:text-slate-355 leading-tight">You earn 20% commission</p>
            </div>
          </div>
        </div>

        {/* Connector line behind steps */}
        <div className="absolute top-5 left-[10%] right-[10%] h-[1px] bg-slate-100 dark:bg-slate-800 z-0"></div>
      </div>

      {/* Sub-features labels row */}
      <div className="pt-2 flex flex-wrap gap-1.5 justify-center">
        <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 flex items-center gap-1 shadow-sm">
          <Zap className="w-3 h-3 text-[#6366F1]" /> Lifetime Commission
        </span>
        <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 flex items-center gap-1 shadow-sm">
          <Users className="w-3 h-3 text-[#6366F1]" /> No Limit on Referrals
        </span>
        <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 flex items-center gap-1 shadow-sm">
          <Activity className="w-3 h-3 text-[#6366F1]" /> Earn While They Work
        </span>
      </div>
    </div>
  );

  // 5. Performance Overview Grid Component
  const renderPerformanceOverview = () => (
    <div className="space-y-4">
      <h3 className="text-base font-black text-slate-950 dark:text-white px-1 leading-none">Performance Overview</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Total Referrals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">Total Referrals</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-2 leading-none">{stats.totalReferrals}</h4>
            <p className="text-[9px] font-bold text-slate-400 mt-1 leading-none">All Time</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Referrals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">Active Referrals</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-2 leading-none">{stats.activeNodes}</h4>
            <p className="text-[9px] font-bold text-slate-400 mt-1 leading-none">Currently Active</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">Tasks Completed</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-2 leading-none">{stats.totalTasksCompletedByReferrals}</h4>
            <p className="text-[9px] font-bold text-slate-400 mt-1 leading-none">By Your Referrals</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-500 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">Total Earnings</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-2 leading-none flex items-center gap-1">
              {stats.passiveRevenue.toLocaleString('en-IN')} <Coins className="w-4 h-4 text-amber-500" />
            </h4>
            <p className="text-[9px] font-bold text-slate-400 mt-1 leading-none">All Time</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );



  // 6. Top Referrers Leaderboard Component
  const renderLeaderboard = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black text-slate-950 dark:text-white">Top Referrers (Leaderboard)</h3>
        <button 
          onClick={() => setActiveView('leaderboard')} 
          className="text-xs font-bold text-[#6366F1] hover:text-[#5053E0] hover:underline transition-all cursor-pointer"
        >
          View All
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden p-2 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>
        ) : topEarners.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No active referrers recorded yet on the leaderboard.
          </div>
        ) : (
          topEarners.slice(0, 5).map((earner, index) => {
            const rankIcons = [
              <Crown className="w-4 h-4 text-amber-500" />,
              <Award className="w-4 h-4 text-slate-400" />,
              <Award className="w-4 h-4 text-amber-700" />
            ];
            const rankColors = [
              "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30",
              "bg-slate-50 text-slate-800 border-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
              "bg-amber-50/70 text-amber-900 border-amber-100 dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/10"
            ];
            return (
              <div key={earner.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border shadow-sm shrink-0",
                    index < 3 ? rankColors[index] : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  )}>
                    {index < 3 ? rankIcons[index] : index + 1}
                  </div>
                  {renderUserAvatar(earner.full_name || 'User', earner.avatar_url, "w-9 h-9 shrink-0")}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-850 dark:text-slate-100 truncate leading-none">
                      {earner.full_name || 'Anonymous'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 leading-none">
                      Rank #{index + 1}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1">
                    {(earner.total_referral_earnings || 0).toLocaleString('en-IN')} <Coins className="w-4 h-4 text-amber-500 fill-amber-400/10" />
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // 7. My Referrals (Right Column)
  const renderMyReferrals = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-none">My Referrals</h3>
        <button 
          onClick={() => setActiveView('referrals')} 
          className="text-xs font-bold text-[#6366F1] hover:text-[#5053E0] hover:underline transition-all cursor-pointer"
        >
          View All
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden p-3.5 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>
        ) : allReferrals.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-850 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Referrals Yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Share your code with friends to start tracking your referrals here.</p>
          </div>
        ) : (
          allReferrals.slice(0, 5).map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                {renderUserAvatar(member.full_name || 'User', member.avatar_url, "w-10 h-10 shrink-0")}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-850 dark:text-slate-100 truncate leading-none mb-1">{member.full_name || 'Anonymous'}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">Joined {new Date(member.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                    {(userEarningsMap[member.id] || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider leading-none">Coins Earned</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                  <Coins className="w-3.5 h-3.5 text-amber-100 fill-amber-100/20" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // 8. Achievements List
  const renderAchievements = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-none">Achievements</h3>
        <button 
          onClick={() => setActiveView('achievements')} 
          className="text-xs font-bold text-[#6366F1] hover:text-[#5053E0] hover:underline transition-all cursor-pointer"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: 5 Referrals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center flex flex-col justify-between shadow-sm min-h-[175px]">
          <div>
            {renderBadgeIcon(5, 'bronze')}
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">Refer 5 Friends</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 leading-none">Earn 500 Coins</p>
          </div>
          <div className="mt-3 space-y-1">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${Math.min((stats.totalReferrals / 5) * 100, 100)}%` }}></div>
            </div>
            <p className="text-[9px] text-slate-400 font-black leading-none pt-0.5">{stats.totalReferrals >= 5 ? '5/5' : `${stats.totalReferrals}/5`}</p>
          </div>
        </div>

        {/* Card 2: 25 Referrals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center flex flex-col justify-between shadow-sm min-h-[175px]">
          <div>
            {renderBadgeIcon(25, 'silver')}
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">Refer 25 Friends</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 leading-none">Earn 2,500 Coins</p>
          </div>
          <div className="mt-3 space-y-1">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400" style={{ width: `${Math.min((stats.totalReferrals / 25) * 100, 100)}%` }}></div>
            </div>
            <p className="text-[9px] text-slate-400 font-black leading-none pt-0.5">{stats.totalReferrals >= 25 ? '25/25' : `${stats.totalReferrals}/25`}</p>
          </div>
        </div>

        {/* Card 3: 50 Referrals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center flex flex-col justify-between shadow-sm min-h-[175px]">
          <div>
            {renderBadgeIcon(50, 'gold')}
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">Refer 50 Friends</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 leading-none">Earn 5,000 Coins</p>
          </div>
          <div className="mt-3 space-y-1">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${Math.min((stats.totalReferrals / 50) * 100, 100)}%` }}></div>
            </div>
            <p className="text-[9px] text-slate-400 font-black leading-none pt-0.5">{stats.totalReferrals >= 50 ? '50/50' : `${stats.totalReferrals}/50`}</p>
          </div>
        </div>

        {/* Card 4: 100 Referrals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center flex flex-col justify-between shadow-sm min-h-[175px]">
          <div>
            {renderBadgeIcon(100, 'master')}
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">Refer 100 Friends</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 leading-none">Earn 10,000 Coins</p>
          </div>
          <div className="mt-3 space-y-1">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${Math.min((stats.totalReferrals / 100) * 100, 100)}%` }}></div>
            </div>
            <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-black leading-none pt-0.5">{stats.totalReferrals >= 100 ? '100/100' : `${stats.totalReferrals}/100`}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // 9. Why Refer & Earn
  const renderWhyRefer = () => (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-slate-950 dark:text-white px-1 leading-none">Why Refer & Earn?</h3>
      <div className="grid grid-cols-5 gap-1 shadow-sm border border-slate-100 dark:border-slate-800 rounded-[20px] bg-white dark:bg-slate-900 p-4 text-center">
        <div>
          <div className="w-9 h-9 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto text-sm font-black mb-1.5 shadow-inner">
            %
          </div>
          <p className="text-[9px] font-black text-slate-900 dark:text-slate-100 leading-tight">20% Lifetime</p>
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">Commission</p>
        </div>

        <div>
          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-1.5 shadow-inner">
            <Users className="w-4.5 h-4.5" />
          </div>
          <p className="text-[9px] font-black text-slate-900 dark:text-slate-100 leading-tight">Unlimited</p>
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">Referrals</p>
        </div>

        <div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1.5 shadow-inner">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <p className="text-[9px] font-black text-slate-900 dark:text-slate-100 leading-tight">Instant</p>
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">Tracking</p>
        </div>

        <div>
          <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-1.5 shadow-inner">
            <Wallet className="w-4.5 h-4.5" />
          </div>
          <p className="text-[9px] font-black text-slate-900 dark:text-slate-100 leading-tight">Automatic</p>
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">Earnings</p>
        </div>

        <div>
          <div className="w-9 h-9 rounded-full bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center mx-auto text-sm font-black mb-1.5 shadow-inner">
            ∞
          </div>
          <p className="text-[9px] font-black text-slate-900 dark:text-slate-100 leading-tight">No Referral</p>
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">Limit</p>
        </div>
      </div>
    </div>
  );

  // 10. Promotion Banner Component
  const renderPromotionBanner = () => (
    <div className="bg-gradient-to-br from-[#4F46E5] to-[#312E81] text-white rounded-[24px] p-6 relative overflow-hidden shadow-md flex items-center justify-between gap-4">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="relative z-10 space-y-4 max-w-[65%]">
        <h3 className="text-lg font-black tracking-tight leading-snug">Start Growing Your <br />Referral Network Today</h3>
        <p className="text-[10px] text-indigo-100 leading-relaxed font-semibold">
          The more friends you invite, the more passive income you earn.
        </p>
        <button 
          onClick={triggerNativeShare}
          className="bg-white text-[#4F46E5] hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.99] transition-transform font-extrabold px-4 h-9 rounded-xl text-[10px] shadow-md border-none flex items-center gap-1 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" /> Share Now
        </button>
      </div>
      <MegaphoneIllustration />
    </div>
  );

  // 11. Bottom Commission Card Component
  const renderBottomCommission = () => (
    <div className="bg-[#E6F9F3] dark:bg-emerald-950/10 border border-[#C2F1E1] dark:border-emerald-900/20 rounded-[20px] p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Check className="w-4.5 h-4.5 stroke-[3]" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100">Earn 20% Lifetime Commission</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
            You will earn 20% commission for lifetime on every task completed by your referrals.
          </p>
        </div>
      </div>
      <RosetteMedal />
    </div>
  );

  // Main Dashboard Rendering (combining mobile flat stack and desktop split layout)
  const renderMainDashboard = () => {
    return (
      <div className="w-full">
        {/* Desktop Layout: Split in 2 columns (LEFT and RIGHT) */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* LEFT COLUMN: 55% or lg:col-span-7 */}
          <div className="lg:col-span-7 space-y-6 flex flex-col">
            {renderInviteBanner()}
            {renderEarningsCard()}
            {renderReferralLink()}
            {renderHowItWorks()}
            {renderPerformanceOverview()}
            {renderMyReferrals()}
            {renderLeaderboard()}
          </div>

          {/* RIGHT COLUMN: 45% or lg:col-span-5 */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            {renderAchievements()}
            {renderWhyRefer()}
            {renderPromotionBanner()}
            {renderBottomCommission()}
          </div>
        </div>

        {/* Mobile View: Same flat vertical stack to maintain strict render order */}
        <div className="block lg:hidden space-y-6 flex flex-col">
          {renderInviteBanner()}
          {renderEarningsCard()}
          {renderReferralLink()}
          {renderHowItWorks()}
          {renderPerformanceOverview()}
          {renderMyReferrals()}
          {renderLeaderboard()}
          {renderAchievements()}
          {renderWhyRefer()}
          {renderPromotionBanner()}
          {renderBottomCommission()}
        </div>
      </div>
    );
  };

  // Render Full Leaderboard sub-view
  const renderLeaderboardView = () => (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setActiveView('main')} 
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Full Leaderboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Top overall TaskVexa affiliate earners.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>
        ) : topEarners.length === 0 ? (
          <p className="p-12 text-center text-slate-400 text-xs font-semibold">No earners on the leaderboard yet.</p>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {topEarners.map((earner, index) => (
              <div key={earner.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border shadow-sm",
                    index === 0 ? "bg-amber-100 border-amber-200 text-amber-800" :
                    index === 1 ? "bg-slate-100 border-slate-200 text-slate-800" :
                    index === 2 ? "bg-orange-100 border-orange-200 text-orange-800" :
                    "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400"
                  )}>
                    {index === 0 ? <Crown className="w-5 h-5 text-amber-600" /> : index + 1}
                  </div>
                  {renderUserAvatar(earner.full_name || 'User', earner.avatar_url, "w-11 h-11")}
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-none mb-1">
                      {earner.full_name || 'Anonymous User'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ID: {earner.uid || earner.id.split('-')[0]}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-1.5 justify-end">
                  <p className="text-base font-black text-[#6366F1]">{(earner.total_referral_earnings || 0).toLocaleString('en-IN')}</p>
                  <Coins className="w-5 h-5 text-amber-500 fill-amber-500/10" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Referral Earnings History sub-view
  const renderHistoryView = () => (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setActiveView('main')} 
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Earning History</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Your complete history of passive commission records.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#4F46E5] mx-auto" /></div>
        ) : allEarningHistory.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {allEarningHistory.map((item) => (
              <div key={item.id} className={cn(
                "p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors",
                item.referred?.is_deleted && "opacity-60"
              )}>
                <div className="flex items-center gap-4">
                  {renderUserAvatar(item.referred?.full_name || 'Deleted User', item.referred?.avatar_url, "w-11 h-11", item.referred?.is_deleted)}
                  <div>
                    <p className={cn(
                      "text-sm font-extrabold text-slate-900 dark:text-white leading-none mb-1",
                      item.referred?.is_deleted && "text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700 decoration-1"
                    )}>
                      {item.referred?.full_name || 'Deleted User'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-1.5 justify-end">
                  <p className="text-base font-black text-emerald-500">+{item.commission_amount ? item.commission_amount.toLocaleString('en-IN') : '0'}</p>
                  <Coins className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-850 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Earnings Recorded Yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Your passive earnings logs will appear here when your friends do tasks.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render My Referrals List sub-view
  const renderReferralsView = () => {
    const filteredReferrals = allReferrals.filter(ref => 
      ref.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="w-full space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveView('main')} 
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Referrals List</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Complete list of users in your network.</p>
            </div>
          </div>
          
          <input 
            type="text" 
            placeholder="Search referrals..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#4F46E5] mx-auto" /></div>
          ) : filteredReferrals.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredReferrals.map((member) => (
                <div key={member.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                  <div className="flex items-center gap-4">
                    {renderUserAvatar(member.full_name || 'User', member.avatar_url, "w-11 h-11")}
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-none mb-1">
                        {member.full_name || 'Anonymous User'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-none flex items-center justify-end gap-1.5">
                        {(userEarningsMap[member.id] || 0).toLocaleString('en-IN')}
                        <Coins className="w-4 h-4 text-amber-500 fill-amber-400/10" />
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider leading-none">
                        Coins Earned
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-850 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Referrals Found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Try looking for another name or invite more friends.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Achievements Milestones sub-view
  const renderAchievementsView = () => {
    const milestones = [
      { goal: 5, title: 'Active Affiliate', reward: '500 Coins', badge: 'Bronze Rank' },
      { goal: 25, title: 'Silver Referrer', reward: '2,500 Coins', badge: 'Silver Rank' },
      { goal: 50, title: 'Gold Referrer', reward: '5,000 Coins', badge: 'Gold Rank' },
      { goal: 100, title: 'Referral Master', reward: '10,000 Coins', badge: 'Diamond Rank' },
    ];

    return (
      <div className="w-full space-y-6 pb-12">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveView('main')} 
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Achievements & Milestones</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Earn massive bonuses as your referral circle expands.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {milestones.map((ms, i) => {
            const isUnlocked = stats.totalReferrals >= ms.goal;
            const progress = Math.min((stats.totalReferrals / ms.goal) * 100, 100);
            return (
              <div 
                key={i} 
                className={cn(
                  "rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden bg-white dark:bg-slate-900",
                  isUnlocked && "bg-emerald-50/10 dark:bg-emerald-950/5"
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-md", 
                      isUnlocked ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {ms.badge}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{ms.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold">Milestone Target: Refer {ms.goal} Friends</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Reward: {ms.reward}</p>
                  </div>

                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center font-black text-base shadow-sm shrink-0", 
                    isUnlocked ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}>
                    {isUnlocked ? <Check className="w-7 h-7 text-emerald-600" /> : `${stats.totalReferrals}/${ms.goal}`}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", isUnlocked ? "bg-emerald-500" : "bg-indigo-500")}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    <span>{isUnlocked ? 'Unlocked' : 'In Progress'}</span>
                    <span>{Math.floor(progress)}% Completed</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
        >
          {activeView === 'main' && renderMainDashboard()}
          {activeView === 'leaderboard' && renderLeaderboardView()}
          {activeView === 'history' && renderHistoryView()}
          {activeView === 'referrals' && renderReferralsView()}
          {activeView === 'achievements' && renderAchievementsView()}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 scale-90 md:scale-100 origin-top">
        <BannerAd />
      </div>
    </div>
  );
}

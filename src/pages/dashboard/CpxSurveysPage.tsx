import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Sparkles, Trophy, Star, Shield, Lock, ArrowLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';

// High-fidelity custom animated logo for CPX Research
const CpxLogo = () => (
  <div className="w-12 h-12 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-center relative overflow-hidden shrink-0">
    <svg viewBox="0 0 100 100" className="w-8 h-8">
      {/* Outer rotating ring segments */}
      <circle cx="50" cy="50" r="35" stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray="160 50" strokeLinecap="round" className="animate-[spin_12s_linear_infinite]" />
      <circle cx="50" cy="50" r="22" stroke="#60a5fa" strokeWidth="6" fill="none" strokeDasharray="100 30" strokeLinecap="round" className="animate-[spin_8s_linear_infinite_reverse]" />
      {/* Center node */}
      <circle cx="50" cy="50" r="8" fill="#1d4ed8" />
    </svg>
  </div>
);

// High-fidelity custom logo for CPAlead with Funnel representation
const CpaLeadLogo = () => (
  <div className="w-12 h-12 bg-[#00c853] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-center relative overflow-hidden shrink-0">
    <svg viewBox="0 0 100 100" className="w-7 h-7 text-white fill-current">
      <path d="M15 20h70v10L55 60v25H45V60L15 30V20zm8 8l20 28.5V80h14V56.5L77 28H23z" />
      <line x1="30" y1="23" x2="70" y2="23" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <line x1="40" y1="36" x2="60" y2="36" stroke="white" strokeWidth="5" strokeLinecap="round" />
    </svg>
  </div>
);

// High-fidelity custom Safety logo
const SafetyLogo = () => (
  <div className="w-12 h-12 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-indigo-500 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 11 2 2 4-4" />
    </svg>
  </div>
);

export default function CpxSurveysPage() {
  const { cachedProfile } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab/Wall selection state synchronized with URL search params of 'wall'
  const [selectedWall, setSelectedWall] = useState<string | null>(null);

  // CPX Research States
  const [iframeLoading, setIframeLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // CPAlead States
  const [cpaleadLoading, setCpaleadLoading] = useState(true);
  const [cpaleadError, setCpaleadError] = useState(false);
  const [cpaleadKey, setCpaleadKey] = useState(0);

  // Synchronize state from query parameter 'wall'
  useEffect(() => {
    const wall = searchParams.get('wall');
    if (wall === 'cpx' || wall === 'cpalead') {
      setSelectedWall(wall);
    } else {
      setSelectedWall(null);
    }
  }, [searchParams]);

  // App ID configuration
  const cpxAppId = (import.meta as any).env.VITE_CPX_APP_ID || '33527';
  
  // Choose user identifier. Use uid (8-digit) if present, otherwise UUID id
  const extUserId = cachedProfile?.uid || cachedProfile?.id || '';
  const email = cachedProfile?.email || '';
  const username = cachedProfile?.full_name || email.split('@')[0] || 'User';

  const queryParams = [
    `app_id=${cpxAppId}`,
    `ext_user_id=${extUserId}`,
    `email=${encodeURIComponent(email)}`,
    `username=${encodeURIComponent(username)}`,
    `theme=light`,
    `background_color=%23ffffff`,
    `text_color=%230f172a`,
    `accent_color=%234f46e5`
  ].join('&');

  const cpxUrl = `https://offers.cpx-research.com/index.php?${queryParams}`;

  // CPAlead wall url
  const cpaleadUrl = `https://www.cdnflyer.com/wall/AlgM0Doc${extUserId ? `?subid=${extUserId}` : ''}`;

  // CPX loading effect
  useEffect(() => {
    if (selectedWall === 'cpx') {
      setIframeLoading(true);
      setHasError(false);
      const timer = setTimeout(() => {
        setIframeLoading(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [iframeKey, selectedWall]);

  // CPAlead loading effect
  useEffect(() => {
    if (selectedWall === 'cpalead') {
      setCpaleadLoading(true);
      setCpaleadError(false);
      const timer = setTimeout(() => {
        setCpaleadLoading(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [cpaleadKey, selectedWall]);

  useEffect(() => {
    // Prevent horizontal scroll globally on this page
    const prevOverflowX = document.body.style.overflowX;
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = prevOverflowX;
    };
  }, []);

  const handleRefreshCpx = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleRefreshCpalead = () => {
    setCpaleadKey(prev => prev + 1);
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col relative transition-colors duration-200">
      {selectedWall === null ? (
        /* ==========================================
           SCREEN 1: THE PREMIUM REDESIGNED OFFER WALL 
           ========================================== */
        <div className="flex-grow flex flex-col w-full h-full pb-10">
          {/* 1. Header Area - Clean & Minimal typography (No images, No coins) */}
          <div className="px-6 pt-8 pb-5 shrink-0 max-w-3xl mx-auto w-full">
            <h1 className="text-[25px] sm:text-[28px] font-black tracking-tight text-slate-900 leading-none">OFFER WALL</h1>
            <p className="text-[12px] sm:text-[13px] font-semibold text-slate-400 mt-2.5">
              Complete Tasks, Earn Points, Claim <span className="text-indigo-600 font-extrabold">Rewards!</span>
            </p>
          </div>

          {/* 2. Hero Banner - Clean, attractive gradient banner without extra images */}
          <div className="px-6 mb-6 shrink-0 max-w-3xl mx-auto w-full">
            <div className="p-5 sm:p-6 rounded-[22px] bg-gradient-to-br from-indigo-600 via-indigo-650 to-indigo-700 text-white shadow-[0_8px_24px_rgba(79,70,229,0.1)] flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-indigo-150 uppercase tracking-widest block leading-none">Complete Offers</span>
                <h2 className="text-[20px] font-black tracking-tight leading-none text-white mt-1">Earn Rewards</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/5">
                <Trophy className="w-5 h-5 fill-none stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* 3. Explore Offer Walls section head */}
          <div className="px-6 mb-4 shrink-0 max-w-3xl mx-auto w-full">
            <h2 className="text-[16px] sm:text-[17px] font-black text-slate-900 tracking-tight leading-none mb-1">Explore Offer Walls</h2>
            <p className="text-[11px] sm:text-[12px] font-semibold text-slate-400">Choose any offer wall and start earning now!</p>
          </div>

          {/* 4. Clickable Cards list (Display ONLY the real integrated offerwalls dynamically) */}
          <div className="px-6 space-y-4 max-w-3xl mx-auto w-full flex-grow">
            {/* CPX Research Card */}
            <div 
              onClick={() => {
                setSelectedWall('cpx');
                setSearchParams({ wall: 'cpx' });
              }}
              className="h-[96px] p-4 rounded-[22px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex items-center justify-between hover:border-indigo-100 hover:shadow-[0_8px_30px_rgba(79,70,229,0.03)] transition-all duration-200 cursor-pointer active:scale-[0.99] group overflow-hidden"
            >
              <div className="flex items-center gap-4 min-w-0">
                <CpxLogo />
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-[14px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors truncate">CPX Research</h3>
                  <p className="text-[11px] font-semibold text-slate-400 leading-tight truncate">
                    Complete Surveys and Earn Points
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wider border border-emerald-100">
                    High Paying
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 ml-3">
                <div className="flex items-center gap-0.5 text-amber-500 font-extrabold text-[11px] bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 text-amber-500" />
                  <span>4.8</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* CPL Lead Card */}
            <div 
              onClick={() => {
                setSelectedWall('cpalead');
                setSearchParams({ wall: 'cpalead' });
              }}
              className="h-[96px] p-4 rounded-[22px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex items-center justify-between hover:border-indigo-100 hover:shadow-[0_8px_30px_rgba(79,70,229,0.03)] transition-all duration-200 cursor-pointer active:scale-[0.99] group overflow-hidden"
            >
              <div className="flex items-center gap-4 min-w-0">
                <CpaLeadLogo />
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-[14px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors truncate">CPL Lead</h3>
                  <p className="text-[11px] font-semibold text-slate-400 leading-tight truncate">
                    Submit Leads and Earn Rewards
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase tracking-wider border border-indigo-100">
                    Popular
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 ml-3">
                <div className="flex items-center gap-0.5 text-amber-500 font-extrabold text-[11px] bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 text-amber-500" />
                  <span>4.6</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          {/* 5. Data Safe Section - Placed as a completely separate section below all Offer Wall cards, with proper top margin & container */}
          <div className="mt-8 pt-6 pb-6 border-t border-slate-100/90 bg-slate-50/50 w-full shrink-0">
            <div className="max-w-3xl mx-auto w-full px-6">
              <div className="p-4 rounded-[22px] border border-slate-200/50 bg-white flex items-center justify-between select-none shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="flex items-center gap-4 min-w-0">
                  <SafetyLogo />
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-[13px] font-black text-slate-800">Your Data is Safe</h3>
                    <p className="text-[11px] font-semibold text-slate-400 leading-tight truncate">
                      We never share your data with anyone.
                    </p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-indigo-400 shrink-0 border border-purple-100/50 ml-3">
                  <Lock className="w-4 h-4 fill-indigo-100 text-indigo-500 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==========================================
           SCREEN 2: THE INTERACTIVE OFFER DETAILS IFRAME
           ========================================== */
        <div className="w-full h-screen flex flex-col items-stretch overflow-hidden bg-white">
          {/* Top Back/Status Header bar */}
          <div className="h-[64px] bg-white border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none">
            <button 
              onClick={() => {
                setSelectedWall(null);
                setSearchParams({});
              }}
              className="flex items-center gap-1.5 text-slate-705 hover:text-slate-900 font-black text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 stroke-[3]" />
              Back
            </button>
            <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
              {selectedWall === 'cpx' ? 'CPX Research' : 'CPL Lead'}
            </span>
            <button 
              onClick={selectedWall === 'cpx' ? handleRefreshCpx : handleRefreshCpalead}
              className="p-2 text-slate-505 hover:text-indigo-600 rounded-xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              title="Reload Current Offerwall"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Embedded Iframe Viewport Container */}
          <div className="flex-1 w-full bg-white relative">
            
            {/* CPX Research Survey rendering */}
            {selectedWall === 'cpx' && (
              <div className="w-full h-full relative">
                {iframeLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white px-4 text-center">
                    <div className="relative w-12 h-12 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-100 animate-pulse"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">
                      Loading Surveys
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      Matching the best paid campaigns for your profile...
                    </p>
                  </div>
                )}

                {hasError && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white px-6 py-8 text-center">
                    <div className="p-3 bg-rose-50 text-rose-500 rounded-full mb-4 border border-rose-100">
                      <AlertTriangle className="w-6 h-6 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      Unable to Load Surveys
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                      We couldn't connect securely. This can be caused by active VPNs, tracking shields, or aggressive ad-blockers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs justify-center">
                      <Button 
                        onClick={handleRefreshCpx} 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                      </Button>
                      <a 
                        href={cpxUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-xl font-bold transition-all border border-slate-200"
                      >
                        Open in New Tab
                      </a>
                    </div>
                  </div>
                )}

                <iframe
                  key={iframeKey}
                  src={cpxUrl}
                  title="CPX Research Surveys"
                  width="100%"
                  height="100%"
                  onLoad={() => setIframeLoading(false)}
                  onError={() => {
                    setIframeLoading(false);
                    setHasError(true);
                  }}
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            )}

            {/* CPAlead Offers rendering */}
            {selectedWall === 'cpalead' && (
              <div className="w-full h-full relative">
                {cpaleadLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white px-4 text-center">
                    <div className="relative w-12 h-12 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-100 animate-pulse"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">
                      Loading Offer Wall
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      Fetching high-paying apps, quizzes, and tasks...
                    </p>
                  </div>
                )}

                {cpaleadError && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white px-6 py-8 text-center">
                    <div className="p-3 bg-rose-50 text-rose-500 rounded-full mb-4 border border-rose-100">
                      <AlertTriangle className="w-6 h-6 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      Unable to Load Offers
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                      We couldn't connect securely with CPL Lead. Try disabling your VPN or active ad-blockers to load offers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs justify-center">
                      <Button 
                        onClick={handleRefreshCpalead} 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                      </Button>
                      <a 
                        href={cpaleadUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-xl font-bold transition-all border border-slate-200"
                      >
                        Open in New Tab
                      </a>
                    </div>
                  </div>
                )}

                <iframe
                  key={cpaleadKey}
                  src={cpaleadUrl}
                  title="CPAlead Offers"
                  width="100%"
                  height="100%"
                  onLoad={() => setCpaleadLoading(false)}
                  onError={() => {
                    setCpaleadLoading(false);
                    setCpaleadError(true);
                  }}
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

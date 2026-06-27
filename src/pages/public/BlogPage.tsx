import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useSEO } from '@/hooks/useSEO';
import { 
  Clock, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  ChevronRight, 
  Bookmark, 
  Share2, 
  Heart, 
  HelpCircle,
  Activity,
  Layers,
  Award,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BannerAd } from '@/components/BannerAd';

// Rich behavioral and productivity article paragraphs
const ARTICLE_PARAGRAPHS = [
  "In the modern era of strategic user engagement, optimizing online productivity is a necessity. Daily digital platforms are evolving to provide highly structured workflow setups that capture cognitive attention.",
  "When users participate in standard online experiences, they often look for ways to enhance their active focus span. With a single click, learners can explore tailored milestone updates instead of dealing with repetitive layouts. This paradigm shift proves that passive scrolling is obsolete.",
  "Intelligent micro-challenges offer a gateway to reveal high-priority listings on demand. By maintaining an updated digital profile, users discover that every daily activity contributes toward skill retention.",
  "The main advantage of automated task tracking is how quickly you can authenticate your digital milestones securely. The verification queue operates in real time, encouraging users to interact with verified action graphs and interesting logical puzzles.",
  "To achieve maximum daily momentum, find an environment where you can concentrate on strategic daily objectives. High-value accomplishments yield a direct platform payout for users who complete verification pipelines properly.",
  "Each custom user action acts as a powerful driver of long-term consistency. As content exploration becomes simplified, gaining instant admission to advanced dashboards improves overall satisfaction.",
  "Ultimately, smart digital experiences respect your time and attention. By deciding to discover new focus opportunities, you elevate your daily routine. This systematic method acts as a prime accelerator to premium community panels and high-priority list tiers. By participating regularly, you sustain your preferred status, earning reputation tokens within the ecosystem."
];

const WRONG_MESSAGES = [
  "Secret unavailable", 
  "No active word", 
  "Hidden word missing", 
  "Try another location"
];

interface Token {
  id: string; // "pIdx-wIdx"
  originalText: string;
  cleanWord: string;
  isCandidate: boolean;
}

interface SelectedTokenState {
  word: string;
  isWinner: boolean;
}

interface RevealedResult {
  isCorrect: boolean;
  code?: string;
  message?: string;
}

interface PendingVerification {
  tokenId: string;
  word: string;
  isWinner: boolean;
  clickTime: number;
}

export default function BlogPage() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(640);
  const [saved, setSaved] = useState(false);

  const seoTitle = "Taskvexa Blog | Digital Engagement & Micro-Task Insights";
  const seoDescription = "Explore expert research briefs, cognitive momentum strategies, and dynamic micro-task verification guidelines. Turn quiet hours into active earning focus.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/blog',
    schema: {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Taskvexa Productivity Journal",
      "description": seoDescription,
      "url": "https://taskvexa.xyz/blog",
      "publisher": {
        "@type": "Organization",
        "name": "TaskVexa Inc.",
        "logo": {
          "@type": "ImageObject",
          "url": "https://taskvexa.xyz/favicon.svg"
        }
      }
    }
  });

  // States for dynamic randomization and parsing
  const [parsedParagraphs, setParsedParagraphs] = useState<Token[][]>([]);
  const [secretWord, setSecretWord] = useState("");
  const [selectedTokens, setSelectedTokens] = useState<Record<string, SelectedTokenState>>({});
  
  // Maps tokenId -> Result
  const [revealedResults, setRevealedResults] = useState<Record<string, RevealedResult>>({});
  
  // Background silent verification interval hook
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (code: string, tokenId: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(tokenId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy code: ', err);
    });
  };

  // 1. Mount hook to load dynamic Adsterra script and initialize randomizer
  useEffect(() => {
    // Inject the required Adsterra Popunder Script directly in document body
    const script = document.createElement('script');
    script.src = "https://pl29526229.effectivecpmnetwork.com/11/28/eb/1128ebbe91a5137cb46721c3e1f1d5b0.js";
    script.async = true;
    document.body.appendChild(script);

    // Dynamic selection & initialization setup
    initializeGame();

    return () => {
      // Clean up script safely
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // 2. Main setup function to parse paragraphs and pick 10 fully dynamic random words
  const initializeGame = () => {
    // Create completely unique secret code on reload using website name and random digits
    const randomNum = Math.floor(Math.random() * 899999 + 100000);
    const generatedCode = `Taskvexa${randomNum}`;
    setSecretWord(generatedCode);

    // Save newly generated code to Supabase table asynchronously
    // Expiry is set to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    (async () => {
      try {
        const { error } = await supabase
          .from('dynamic_task_secret_codes')
          .insert([
            {
              code: generatedCode,
              expires_at: expiresAt,
              is_used: false
            }
          ]);
        if (error) {
          console.error('[DATABASE] Failed to auto-save generated blog secret code:', error.message);
        } else {
          console.log('[DATABASE] Blog secret code saved successfully for validation:', generatedCode);
        }
      } catch (err) {
        console.error('[DATABASE] Error saving blog secret code:', err);
      }
    })();

    // Parse existing text paragraphs to isolate alphabetic candidate words (length >= 4)
    const parsed = ARTICLE_PARAGRAPHS.map((paragraph, pIdx) => {
      // Split preserving whitespace
      const words = paragraph.split(/\s+/);
      return words.map((word, wIdx) => {
        // Strip common punctuation marks to isolate candidate alphabetical word strictly
        const clean = word.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()"'’“]+|[.,\/#!$%\^&\*;:{}=\-_`~()"'’“]+$/g, "");
        const isCandidate = /^[a-zA-Z]{4,}$/.test(clean);
        return {
          id: `${pIdx}-${wIdx}`,
          originalText: word,
          cleanWord: clean,
          isCandidate
        };
      });
    });
    setParsedParagraphs(parsed);

    // Collect all valid candidate words with their token locations
    const allCandidates: { id: string; cleanWord: string }[] = [];
    parsed.forEach((paragraphTokens) => {
      paragraphTokens.forEach((token) => {
        if (token.isCandidate) {
          allCandidates.push({ id: token.id, cleanWord: token.cleanWord });
        }
      });
    });

    // Fully random uniform shuffle using Fisher-Yates algorithm
    const shuffled = [...allCandidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    
    // Pick exactly 10 unique words from the active content
    const chosenCount = Math.min(10, shuffled.length);
    const chosen = shuffled.slice(0, chosenCount);

    // Pick exactly ONE indices out of the selected 10 as the winning path
    const winnerIdx = Math.floor(Math.random() * chosenCount);

    const matchMap: Record<string, SelectedTokenState> = {};
    chosen.forEach((cand, index) => {
      matchMap[cand.id] = {
        word: cand.cleanWord,
        isWinner: index === winnerIdx
      };
    });

    setSelectedTokens(matchMap);
    setRevealedResults({});
    setPendingVerification(null);
  };

  // 3. User focus/visibility listening mechanism for background verification
  useEffect(() => {
    const handleReturn = () => {
      if (!pendingVerification) return;

      const durationSpent = Date.now() - pendingVerification.clickTime;

      // Small 500ms safety limit to prevent accidental self-execution during click
      if (durationSpent >= 500) {
        if (pendingVerification.isWinner) {
          setRevealedResults(prev => ({
            ...prev,
            [pendingVerification.tokenId]: {
              isCorrect: true,
              code: secretWord
            }
          }));
        } else {
          setRevealedResults(prev => ({
            ...prev,
            [pendingVerification.tokenId]: {
              isCorrect: false,
              message: "No Hidden Code Found"
            }
          }));
        }
        // Verification completes, clear the tracking state
        setPendingVerification(null);
      }
    };

    // Add window standard focusing events
    window.addEventListener('focus', handleReturn);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleReturn();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic check. If they are on the page or return, review without popups
    const silentCheckInterval = setInterval(() => {
      if (pendingVerification && Date.now() - pendingVerification.clickTime >= 500) {
        if (document.hasFocus() || document.visibilityState === 'visible') {
          handleReturn();
        }
      }
    }, 200);

    return () => {
      window.removeEventListener('focus', handleReturn);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(silentCheckInterval);
    };
  }, [pendingVerification, secretWord]);

  // Tracking reading scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 105);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLike = () => {
    if (liked) {
      setLikeCount(prev => prev - 1);
      setLiked(false);
    } else {
      setLikeCount(prev => prev + 1);
      setLiked(true);
    }
  };

  // Triggered when a hidden highlighted word gets clicked
  const handleWordClick = (tokenId: string, word: string, isWinner: boolean) => {
    // Avoid double trigger if result already revealed for this word location
    if (revealedResults[tokenId]) return;

    // Avoid multi-clicking/timer reset issues while a word verification is already running
    if (pendingVerification) return;

    // Trigger Popunder setup immediately inside a try/catch
    try {
      window.open("https://www.profitablecreativeformat.com/xj9bkmx2?key=1128ebbe91a5137cb46721c3e1f1d5b0", "_blank", "noopener,noreferrer");
    } catch (e) {
      console.log('Popunder fallback initiated');
    }

    // Set silent timer verification state silently with zero countdowns
    setPendingVerification({
      tokenId,
      word,
      isWinner,
      clickTime: Date.now()
    });
  };

  const getHighlightClass = (id: string) => {
    // Beautiful soft pastel highlights as requested (Yellow, Green, Sky Blue, Pink/Red)
    const colors = [
      "bg-[#fef08a] text-[#854d0e] border-b-2 border-amber-300 hover:bg-[#fde047] shadow-sm font-semibold tracking-wide",
      "bg-[#dcfce7] text-[#166534] border-b-2 border-emerald-300 hover:bg-[#bbf7d0] shadow-sm font-semibold tracking-wide",
      "bg-[#e0f2fe] text-[#0369a1] border-b-2 border-sky-300 hover:bg-[#bae6fd] shadow-sm font-semibold tracking-wide",
      "bg-[#ffe4e6] text-[#9f1239] border-b-2 border-rose-300 hover:bg-[#fecdd3] shadow-sm font-semibold tracking-wide"
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Render dynamic parsed paragraphs in flow
  const renderParagraph = (paragraphIndex: number) => {
    const tokens = parsedParagraphs[paragraphIndex];
    if (!tokens) return null;

    return (
      <span key={paragraphIndex}>
        {tokens.map((token) => {
          const tokenConfig = selectedTokens[token.id];
          const isSelected = !!tokenConfig;

          if (isSelected) {
            const hasResult = !!revealedResults[token.id];
            const resultDetails = revealedResults[token.id];

            // Strip prefix or trailing punctuation to align highlight perfectly on clean letters
            const matchTrailing = token.originalText.match(/[.,\/#!$%\^&\*;:{}=\-_`~()"'’“]+$/);
            const matchLeading = token.originalText.match(/^[.,\/#!$%\^&\*;:{}=\-_`~()"'’“]+/);
            const trailingPunc = matchTrailing ? matchTrailing[0] : "";
            const leadingPunc = matchLeading ? matchLeading[0] : "";
            const pClass = getHighlightClass(token.id);

            return (
              <span key={token.id} className="relative inline-flex flex-col items-center mx-1 align-baseline group/word">
                <span className="align-baseline">
                  {leadingPunc}
                  <span
                    onClick={() => handleWordClick(token.id, token.cleanWord, tokenConfig.isWinner)}
                    className={`cursor-pointer px-2 py-0.5 rounded transition-all duration-300 selection:bg-indigo-100 select-none ${pClass} hover:scale-105 active:scale-95`}
                  >
                    {token.cleanWord}
                  </span>
                  {trailingPunc}
                  {" "}
                </span>

                {/* Inline premium result details (replaces modal) */}
                {hasResult && resultDetails && (
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 text-[11px] font-bold shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border rounded-xl z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-1 duration-200">
                    {resultDetails.isCorrect ? (
                      <span className="text-emerald-800 bg-emerald-50 border border-emerald-250 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        <span className="font-mono tracking-wide">{resultDetails.code}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(resultDetails.code!, token.id);
                          }}
                          className="ml-1 p-0.5 text-slate-500 hover:text-emerald-700 transition-colors duration-200 rounded hover:bg-slate-100 focus:outline-none flex items-center"
                          title="Copy Code"
                        >
                          {copiedId === token.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </span>
                    ) : (
                      <span className="text-rose-800 bg-rose-50 border border-rose-250 rounded-xl px-2.5 py-1.5 block">
                        ⚠️ {resultDetails.message}
                      </span>
                    )}
                  </span>
                )}
                
                {/* Micro-silent glowing pulse when verification is pending */}
                {pendingVerification && pendingVerification.tokenId === token.id && !hasResult && (
                  <span className="absolute -top-1 -right-1 block w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                )}
              </span>
            );
          }

          // Return standard normal article text
          return (
            <span key={token.id}>
              {token.originalText}{" "}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 pb-24 font-sans relative overflow-x-hidden">
      
      {/* Sticky Progress Bar */}
      <div className="fixed top-20 left-0 w-full h-[3px] z-40 bg-slate-200">
        <div 
          className="h-full bg-indigo-600 transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 md:pt-[105px]">
        
        {/* Navigation row */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <button 
            id="back-home-btn"
            onClick={() => navigate('/')}
            className="group flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors pointer-events-auto bg-white border border-slate-200 px-4.5 py-2.5 rounded-full cursor-pointer hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-indigo-500" />
            <span>Go Back To Home</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>PLATFORM</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-indigo-600 font-semibold">PREMIUM INSIGHTS</span>
          </div>
        </div>

        {/* Dynamic Interactive Alert Banner */}
        <div className="mb-8 bg-indigo-50/80 backdrop-blur-md rounded-2xl border border-indigo-100 p-5 flex items-center gap-4 justify-between flex-wrap md:flex-nowrap shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h5 className="font-extrabold text-[#1e1b4b] text-xs uppercase tracking-wider">Natural Dynamic Randomizer Configured</h5>
              <p className="text-indigo-950/80 text-[11px] leading-relaxed mt-0.5">
                Every refresh dynamically tokenizes the raw article text, selects 10 fully changing highlighted words randomly, creates a new secret code, and positions them instantly.
              </p>
            </div>
          </div>
          <button 
            onClick={initializeGame}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            ♻️ RE-SHUFFLE NOW
          </button>
        </div>

        {/* Article Container Box */}
        <article className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.015)] overflow-hidden">
          
          {/* Large featured image (Mug, Plant, notebook inspired by reference image) */}
          <div className="w-full h-60 sm:h-[400px] overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=1200&auto=format&fit=crop" 
              alt="Simple Ways to Improve Your Daily Productivity" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-md">
                <Sparkles className="w-3 h-3" />
                Productivity
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-10 md:p-12">
            
            {/* Headers, Author, Date, Reading Time */}
            <div className="border-b border-slate-100 pb-8 mb-8">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
                The Psychology of Digital Engagement: Transforming Idle Minutes into Prime Focus Cycles
              </h1>
              
              <div className="flex flex-wrap items-center justify-between gap-6">
                
                {/* Author with circular initials */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm border border-indigo-200">
                    AV
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Dr. Alistair Vance
                    </h4>
                    <p className="text-xs text-slate-500">Chief Behavioral Strategist, Taskvexa Hub</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>MAY 20, 2025</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>6 MIN READ</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Ad Location 1 */}
            <BannerAd />

            {/* Paragraph list with correct rendering */}
            <div className="space-y-8 text-slate-650 leading-relaxed text-[15px] sm:text-[17px]">
              
              <p>
                {renderParagraph(0)}
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-4">
                Why Productivity Matters
              </h2>

              <p>
                {renderParagraph(1)}
              </p>

              {/* Ad Location 2 */}
              <BannerAd />

              {/* Pro Tip Card */}
              <div className="bg-[#f0fdf4] border border-[#bbf7d0]/60 rounded-2xl p-6 my-6 flex gap-4 items-start shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#dcfce7] flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-emerald-950 text-sm uppercase tracking-wide mb-1">Pro Tip: Active Recall</h5>
                  <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                    By choosing short-burst engagements instead of passive multi-tasking, you allow the brain to develop active recall anchors. Every interaction builds stronger cognitive retention loops.
                  </p>
                </div>
              </div>

              <p>
                {renderParagraph(2)}
              </p>

              {/* High Fidelity Illustration Inline Image */}
              <div className="my-8 overflow-hidden rounded-2xl border border-slate-150 shadow-sm relative">
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop" 
                  alt="Digital Workspace Goals Tracker Illustration" 
                  referrerPolicy="no-referrer"
                  className="w-full h-[220px] sm:h-[280px] object-cover"
                />
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-[11px] text-slate-550 flex justify-between items-center flex-wrap gap-2">
                  <span className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    Verification Framework 4.1
                  </span>
                  <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                    [REAL-TIME PROTOCOL ACTIVE]
                  </span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-4">
                Daily Habits That Make a Big Difference
              </h2>

              <p>
                {renderParagraph(3)}
              </p>

              <p>
                {renderParagraph(4)}
              </p>

              {/* Bullet points mimicking the exact visual style in the reference image */}
              <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-6 md:p-8 my-6">
                <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-4">
                  Key Milestones for Consistent Engagement
                </h4>
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                    <span className="text-sm sm:text-[15px] text-slate-700">Wake up early and plan your day.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                    <span className="text-sm sm:text-[15px] text-slate-700">Break tasks into smaller, manageable steps.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                    <span className="text-sm sm:text-[15px] text-slate-700">Avoid distractions and stay focused.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                    <span className="text-sm sm:text-[15px] text-slate-700">Take short breaks to recharge your mind.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                    <span className="text-sm sm:text-[15px] text-slate-700">Review your progress at the end of the day.</span>
                  </li>
                </ul>
              </div>

              {/* Ad Location 3 */}
              <BannerAd />

              {/* Double Quote element EXACTLY styled like the gorgeous lavender component in the picture */}
              <div className="bg-[#f5f3ff] border-l-4 border-[#765bf6] rounded-r-2xl p-6 md:p-8 my-8 shadow-sm">
                <p className="text-[#3b2d93] italic font-semibold text-lg md:text-xl leading-relaxed mb-3">
                  "It's not about having enough time, it's about using time <span className="bg-[#e4e0ff] text-[#4f35ec] px-1.5 py-0.5 rounded font-bold">wisely</span>."
                </p>
                <div className="text-[10px] font-bold tracking-widest uppercase text-[#7c3aed] font-mono">— Dr. Alistair Vance, Focus Digest International</div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-4">
                Stay Consistent and Patient
              </h2>

              <p>
                {renderParagraph(5)}
              </p>

              {/* Premium Quick Information Card */}
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 my-6 flex gap-4 items-start shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-sky-950 text-sm uppercase tracking-wide mb-1">Attention Management Framework</h5>
                  <p className="text-xs sm:text-sm text-sky-800 leading-relaxed">
                    By bypassing outdated, high-friction evaluation queues, you allow modern engagement pipelines to reward your progress in real time. Consistency is verified instantly.
                  </p>
                </div>
              </div>

              <p>
                {renderParagraph(6)}
              </p>

              {/* Ad Location 4 */}
              <BannerAd />

            </div>

            {/* Bottom Actions Row - Likes, Share, Bookmark */}
            <div className="border-t border-slate-100 pt-8 mt-12 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <button 
                  id="like-post-btn"
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full border transition-all text-xs font-bold uppercase tracking-wider cursor-pointer ${
                    liked 
                      ? 'bg-rose-50 border-rose-200 text-rose-600 scale-105' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 transition-transform duration-300 ${liked ? 'fill-current text-rose-500 scale-110' : ''}`} />
                  <span>{likeCount} Likes</span>
                </button>
                
                <button 
                  id="bookmark-post-btn"
                  onClick={() => setSaved(!saved)}
                  className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                    saved 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 scale-105' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                  title={saved ? "Saved to Bookmarks" : "Bookmark Insight"}
                >
                  <Bookmark className={`w-4 h-4 ${saved ? 'fill-current text-indigo-600' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Share Article URL</span>
                <button 
                  id="copy-post-link"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Ecosystem insight link copied securely to clipboard.");
                  }}
                  className="p-2.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Copy Insights Link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Premium Author Biography Card */}
            <div className="bg-slate-50 rounded-[24px] border border-slate-150 p-6 sm:p-8 mt-12 flex flex-col sm:flex-row gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 border border-slate-100">
                AV
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base mb-1">Dr. Alistair Vance</h4>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2">Principal Digital Interaction Architect, Taskvexa Journal</p>
                <p className="text-sm text-slate-650 leading-relaxed mb-4 font-normal">
                  Dr. Vance has spent over fifteen years researching micro-attentonal tracking models, digital workflow layouts, and reward logic design patterns. His research centers on redirecting idle web hours into active, enjoyable cognitive gains.
                </p>
                <div className="inline-flex gap-4">
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-bold text-indigo-600 hover:underline">Academic Publications</a>
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-bold text-indigo-600 hover:underline">Research Bio Profile</a>
                </div>
              </div>
            </div>

            {/* Related Posts Section EXACTLY as shown in the mockup image */}
            <div className="mt-12 bg-[#fffaf5] border border-[#f5ebe0] rounded-2xl p-6">
              <h4 className="font-black text-[#5c3e16] text-xs uppercase tracking-widest mb-4">Related Posts</h4>
              <div className="space-y-4">
                
                {/* Related Post 1 */}
                <div className="flex gap-4 items-center bg-white/70 hover:bg-white p-3 rounded-xl border border-transparent hover:border-[#f5ebe0] transition-all cursor-pointer">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=200&auto=format&fit=crop" 
                      alt="Time management" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-950 text-sm leading-tight hover:text-indigo-600 transition-colors">
                      Top 5 Time Management Techniques
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      May 15, 2025
                    </p>
                  </div>
                </div>

                {/* Related Post 2 */}
                <div className="flex gap-4 items-center bg-white/70 hover:bg-white p-3 rounded-xl border border-transparent hover:border-[#f5ebe0] transition-all cursor-pointer">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=200&auto=format&fit=crop" 
                      alt="Simple habits" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-950 text-sm leading-tight hover:text-indigo-600 transition-colors">
                      Simple Habits for a Better Life
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      May 12, 2025
                    </p>
                  </div>
                </div>

                {/* Related Post 3 */}
                <div className="flex gap-4 items-center bg-white/70 hover:bg-white p-3 rounded-xl border border-transparent hover:border-[#f5ebe0] transition-all cursor-pointer">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=200&auto=format&fit=crop" 
                      alt="Online earning as student" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-950 text-sm leading-tight hover:text-indigo-600 transition-colors">
                      How to Earn Online as a Student
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      May 10, 2025
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </article>

        {/* Newsletter Subscription Card */}
        <div className="max-w-4xl mx-auto bg-gradient-to-tr from-indigo-50 to-[#fff5f5] text-slate-800 rounded-[24px] p-8 sm:p-12 text-center mt-16 border border-indigo-100 relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-xl mx-auto">
            <h3 className="text-xl md:text-2xl font-black mb-4 uppercase tracking-widest text-slate-900">Subscribe to Taskvexa Briefs</h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-8 leading-relaxed max-w-xl mx-auto">
              Receive advanced workspace productivity papers, custom visual metrics advice, and exciting updates directly twice a month. No clutter, guaranteed.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing to our research briefs!"); }} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <input 
                type="email" 
                required
                placeholder="Enter email address" 
                className="w-full sm:w-80 bg-white border border-slate-200 rounded-full px-5 py-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/50 shadow-sm"
              />
              <Button type="submit" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 border-none text-white rounded-full font-bold px-8 py-3.5 text-xs uppercase tracking-wider cursor-pointer h-auto shadow-sm active:scale-95">
                Subscribe Reports
              </Button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, CheckCircle2 } from 'lucide-react';

// Easily editable Trustpilot URL as requested
const TRUSTPILOT_FEEDBACK_URL = "https://www.trustpilot.com/reviews/6a3933f82495e0ca0e18d25e";

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  feedback_status?: string | null;
}

export default function WithdrawalFeedbackPopup() {
  const { cachedProfile } = useStore();
  const [activeWithdrawal, setActiveWithdrawal] = useState<Withdrawal | null>(null);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef<any>(null);

  const userId = cachedProfile?.id;

  // Helper to load dismissed IDs from localStorage (fail-safe fallback)
  const getDismissedIds = (): string[] => {
    try {
      const stored = localStorage.getItem('taskvexa_dismissed_feedback_withdrawals');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Helper to add a dismissed ID to localStorage (fail-safe fallback)
  const markAsLocallyDismissed = (id: string) => {
    try {
      const dismissed = getDismissedIds();
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem('taskvexa_dismissed_feedback_withdrawals', JSON.stringify(dismissed));
      }
    } catch (e) {
      console.error("[Feedback Popup] Error updating localStorage:", e);
    }
  };

  // Query pending feedback withdrawals
  const queryPendingWithdrawal = async (currentUserId: string) => {
    try {
      // Find approved withdrawals where feedback_status is 'pending' OR null (if some are already approved but need feedback)
      // To strictly adhere to "when approved, set pending", we query for status = 'approved' and feedback_status == 'pending'.
      const { data, error } = await supabase
        .from('withdrawals')
        .select('id, amount, status, feedback_status')
        .eq('user_id', currentUserId)
        .eq('status', 'approved')
        .eq('feedback_status', 'pending');

      if (error) {
        // If feedback_status column is missing, fail-safe: don't break anything, just ignore
        console.warn("[Feedback Popup] Could not fetch withdrawals feedback state:", error);
        return;
      }

      if (data && data.length > 0) {
        // Filter out any locally dismissed withdrawals (the fail-safe mechanism)
        const dismissedIds = getDismissedIds();
        const unactedWithdrawals = data.filter(w => !dismissedIds.includes(w.id));

        if (unactedWithdrawals.length > 0) {
          // Set the first pending withdrawal as active
          setActiveWithdrawal(unactedWithdrawals[0]);
        } else if (activeWithdrawal) {
          setActiveWithdrawal(null);
        }
      } else if (activeWithdrawal) {
        setActiveWithdrawal(null);
      }
    } catch (err) {
      console.error("[Feedback Popup] Error querying pending withdrawals:", err);
    }
  };

  // Handle Action (completed/dismissed)
  const handleAction = async (status: 'completed' | 'dismissed') => {
    if (!activeWithdrawal || !userId) return;

    setLoading(true);
    const withdrawalId = activeWithdrawal.id;

    try {
      // 1. Attempt to update the status in the database
      const { error } = await supabase
        .from('withdrawals')
        .update({ feedback_status: status })
        .eq('id', withdrawalId);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.warn("[Feedback Popup] Database column might be missing, calling fail-safe block:", err);
    } finally {
      // 2. Persist locally to never show this ID again under any circumstance
      markAsLocallyDismissed(withdrawalId);
      
      // 3. Clear active state
      setActiveWithdrawal(null);
      setLoading(false);

      // Check if there are any other approved withdrawals that are pending feedback
      queryPendingWithdrawal(userId);
    }
  };

  const handleGiveFeedback = () => {
    if (!activeWithdrawal) return;
    // Redirect to Trustpilot in a new viewport
    window.open(TRUSTPILOT_FEEDBACK_URL, '_blank', 'noopener,noreferrer');
    
    // Complete transaction feedback log
    handleAction('completed');
  };

  const handleMaybeLater = () => {
    handleAction('dismissed');
  };

  useEffect(() => {
    if (!userId) {
      setActiveWithdrawal(null);
      return;
    }

    // 1. Initial lookup on login/website load
    queryPendingWithdrawal(userId);

    // 2. Set up Real-Time subscription for changes
    try {
      const channel = supabase
        .channel(`feedback-withdrawals-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'withdrawals',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log("[Feedback Popup] Real-time webhook update payload:", payload);
            if (
              payload.new &&
              payload.new.status === 'approved' &&
              payload.new.feedback_status === 'pending'
            ) {
              const dismissedIds = getDismissedIds();
              if (!dismissedIds.includes(payload.new.id)) {
                setActiveWithdrawal(payload.new as Withdrawal);
              }
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;
    } catch (realtimeErr) {
      console.error("[Feedback Popup] Failed to initialize real-time subscription:", realtimeErr);
    }

    // 3. Polling fallback (as required: "Agar real-time connection available na ho to fallback polling use karo")
    const interval = setInterval(() => {
      if (userId) {
        queryPendingWithdrawal(userId);
      }
    }, 20000); // Poll every 20 seconds

    return () => {
      clearInterval(interval);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [userId]);

  return (
    <AnimatePresence>
      {activeWithdrawal && (
        <div className="fixed inset-x-0 bottom-0 md:inset-x-auto md:bottom-4 md:right-4 z-[999] px-4 pb-4 md:px-0 md:pb-0 pointer-events-none">
          <motion.div
            initial={{ y: 150, opacity: 0, scale: 0.95 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1,
              transition: { 
                type: 'spring', 
                damping: 25, 
                stiffness: 350 
              } 
            }}
            exit={{ 
              y: 100, 
              opacity: 0, 
              scale: 0.95,
              transition: { 
                duration: 0.15 
              } 
            }}
            className="w-full md:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto p-5 sm:p-6"
          >
            {/* Soft indicator bar for mobile bottom sheets */}
            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-4 md:hidden" />

            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-full h-fit flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 leading-none">
                    Withdrawal Approved 🎉
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Your withdrawal has been approved successfully. Thank you for using our platform. We'd love to hear your feedback.
                  </p>
                </div>
              </div>

              <button
                disabled={loading}
                onClick={handleMaybeLater}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer self-start"
                title="Dismiss"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                disabled={loading}
                onClick={handleMaybeLater}
                className="flex-1 h-10 sm:h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Maybe Later
              </button>
              <button
                disabled={loading}
                onClick={handleGiveFeedback}
                className="flex-1 h-10 sm:h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                Give Feedback
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

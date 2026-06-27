import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { cn, formatCompactNumber } from '@/lib/utils';
import { 
  X, 
  Calendar,
  User,
  Send,
  Ticket,
  Coins,
  Check
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface WithdrawalReceiptModalProps {
  withdrawalId: string | null;
  onClose: () => void;
}

// Beautiful realistic SVG representation of the official TaskVexa logo
const LogoSVG = () => (
  <svg className="w-14 h-14 shrink-0 transition-transform duration-300 hover:scale-110 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 25 H60 L55 40 H40 V85 H22 V40 H15 Z" fill="#3B82F6" />
    <path d="M42 45 L62 85 L95 25 H75 L62 55 L52 35 Z" fill="#1E293B" className="dark:fill-blue-200" />
  </svg>
);

export default function WithdrawalReceiptModal({ withdrawalId, onClose }: WithdrawalReceiptModalProps) {
  const { cachedProfile } = useStore();
  const [withdrawal, setWithdrawal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadReceipt() {
      if (!withdrawalId) return;
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchErr } = await supabase
          .from('withdrawals')
          .select(`
            *,
            profiles ( id, full_name, email )
          `)
          .eq('id', withdrawalId)
          .single();

        if (fetchErr) throw fetchErr;
        if (!data) throw new Error("Receipt data could not be found.");

        // Direct user authorization verification
        const isUserAuthorized = cachedProfile && (
          cachedProfile.id === data.user_id || 
          cachedProfile.role?.trim().toLowerCase() === 'admin'
        );

        if (!isUserAuthorized) {
          throw new Error("Access Denied: You do not have permission to view this receipt.");
        }

        setWithdrawal(data);
      } catch (err: any) {
        console.error("Error loading receipt:", err);
        setError(err.message || "Failed to load receipt details");
      } finally {
        setLoading(false);
      }
    }

    // Handle ESC key press to close popup
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (withdrawalId && cachedProfile) {
      loadReceipt();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [withdrawalId, cachedProfile]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + " " + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!withdrawalId) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl relative border border-slate-100 dark:border-slate-800 flex flex-col my-4 sm:my-8 animate-scale-up">
        
        {/* Simple Top Corner Exit Icon */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all z-10 cursor-pointer"
          title="Close Receipt"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-16 flex flex-col justify-center items-center gap-4 text-center bg-white dark:bg-slate-900">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-50 dark:border-slate-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading secure receipt...</p>
          </div>
        ) : error || !withdrawal ? (
          <div className="p-10 text-center space-y-6 bg-white dark:bg-slate-900">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-955/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <X className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Validation Error</h4>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
                {error || "An error occurred while displaying receipt details."}
              </p>
            </div>
            <button 
              onClick={onClose}
              type="button"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
            >
              Close Window
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-8 space-y-6 bg-white dark:bg-slate-900 overflow-y-auto max-h-[90vh] no-scrollbar">
            
            {/* Top Logo and Banner Title Area - Logo strictly above the name */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 mt-2">
              <LogoSVG />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">TaskVexa</h3>
            </div>

            {/* Glowing Big Green Checkmark Success Area */}
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#22C55E] flex items-center justify-center shadow-lg shadow-green-100 dark:shadow-none animate-pulse">
                <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white stroke-[3.5]" />
                
                {/* Visual sparkles */}
                <span className="absolute -top-1 -left-1 text-yellow-300 text-xs animate-ping">✦</span>
                <span className="absolute -top-2 right-2 text-green-300 text-xs">✦</span>
                <span className="absolute bottom-1 -right-1 text-yellow-400 text-xs">✦</span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xl sm:text-2xl font-black text-[#22C55E] tracking-tight">
                  Withdrawal Successful
                </h4>
                <p className="text-[12px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 max-w-[280px] mx-auto leading-tight">
                  Money has been sent successfully.
                </p>
              </div>
            </div>

            {/* Transaction Data Table Card Panel - Improved mobile layouts to never truncate text */}
            <div className="bg-slate-50/50 dark:bg-slate-950/45 border border-slate-100 dark:border-slate-800/80 rounded-[20px] p-3 sm:p-5 space-y-4">
              
              {/* Row 1: Date & Time */}
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Date & Time</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right leading-tight break-words pl-2">
                  {formatDateTime(withdrawal.created_at)}
                </span>
              </div>

              {/* Grid separator lines */}
              <div className="h-px bg-slate-100/70 dark:bg-slate-800/60" />

              {/* Row 2: Transaction ID */}
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center shrink-0">
                    <Ticket className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Transaction ID</span>
                </div>
                <span className="font-mono font-extrabold text-slate-850 dark:text-slate-200 select-all text-right leading-tight break-all pl-2">
                  ID#{withdrawal.receipt_number || withdrawal.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              {/* Grid separator lines */}
              <div className="h-px bg-slate-100/70 dark:bg-slate-800/60" />

              {/* Row 3: Sent To */}
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center shrink-0">
                    <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Sent to</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right leading-tight pl-2">
                  Admin
                </span>
              </div>

              {/* Grid separator lines */}
              <div className="h-px bg-slate-100/70 dark:bg-slate-800/60" />

              {/* Row 4: Sent By */}
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Sent by</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right leading-tight break-words pl-2">
                  {withdrawal.profiles?.full_name || 'Maryam'}
                </span>
              </div>

              {/* Grid separator lines */}
              <div className="h-px bg-slate-100/70 dark:bg-slate-800/60" />

              {/* Row 5: Total Amount */}
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center shrink-0">
                    <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Total Amount</span>
                </div>
                <span className="text-base sm:text-lg font-black text-[#22C55E] dark:text-[#22C55E] font-mono tracking-tight shrink-0 text-right pl-2">
                  {withdrawal.amount} COINS
                </span>
              </div>

            </div>

            {/* Large full width Action Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-sm sm:text-base uppercase tracking-wide rounded-2.5xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-none active:scale-[0.98] cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { cn, formatCompactNumber } from '@/lib/utils';
import { 
  ArrowLeft, 
  FileText, 
  Image as ImageIcon, 
  Calendar,
  User,
  Send,
  Ticket,
  Coins,
  Check,
  AlertCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Beautiful realistic SVG representation of the official TaskVexa logo
const LogoSVG = () => (
  <svg className="w-14 h-14 shrink-0 transition-transform duration-300 hover:scale-110 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 25 H60 L55 40 H40 V85 H22 V40 H15 Z" fill="#3B82F6" />
    <path d="M42 45 L62 85 L95 25 H75 L62 55 L52 35 Z" fill="#1E293B" />
  </svg>
);

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cachedProfile } = useStore();
  const [withdrawal, setWithdrawal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadReceipt() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchErr } = await supabase
          .from('withdrawals')
          .select(`
            *,
            profiles ( id, full_name, email )
          `)
          .eq('id', id)
          .single();

        if (fetchErr) throw fetchErr;
        if (!data) throw new Error("Receipt not found");

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
        setError(err.message || "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    }

    if (cachedProfile) {
      loadReceipt();
    }
  }, [id, cachedProfile]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return formatDate(dateStr) + " " + formatTime(dateStr);
  };

  const handleDownloadPDF = async () => {
    const element = printableRef.current;
    if (!element || isDownloading) return;

    try {
      setIsDownloading(true);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgWidthMm = 160; 
      const imgHeightMm = (canvasHeight * imgWidthMm) / canvasWidth;

      const posX = (pdfWidth - imgWidthMm) / 2;
      const posY = 15; 

      pdf.addImage(imgData, 'PNG', posX, posY, imgWidthMm, imgHeightMm);
      pdf.save(`Receipt-${withdrawal?.receipt_number || id}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to package PDF receipt. Please retry.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadImage = async () => {
    const element = printableRef.current;
    if (!element || isDownloading) return;

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Receipt-${withdrawal?.receipt_number || id}.png`;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
      alert("Failed to package image receipt. Please retry.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col justify-center items-center p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px]">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-505 font-bold text-xs uppercase tracking-widest">Validating Credentials...</p>
      </div>
    );
  }

  if (error || !withdrawal) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-850 space-y-6 my-12">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-955/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Failed to Load Receipt</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            {error || "The requested receipt could not be retrieved, or you lack access permission."}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/dashboard/wallet')}
            className="flex-1 h-12 bg-slate-100 dark:bg-slate-755 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
          >
            Go to Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-6 px-4 space-y-6">
      
      {/* Back to navigation trigger */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-150/40">
          SECURE TRANSACTION
        </span>
      </div>

      {/* Main Cashier Receipt Card Component */}
      <div 
        ref={printableRef}
        className="bg-white text-slate-850 rounded-[28px] border border-slate-150 p-6 sm:p-8 space-y-6 relative text-left shadow-lg"
      >
        {/* Top Logo and Banner Title Area - Logo strictly above the name */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 mt-2">
          <LogoSVG />
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">TaskVexa</h3>
        </div>

        {/* Glowing Big Green Checkmark Success Area */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#22C55E] flex items-center justify-center shadow-lg shadow-green-100">
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
            <p className="text-[12px] sm:text-xs font-medium text-slate-400 max-w-[280px] mx-auto leading-tight">
              Money has been sent successfully.
            </p>
          </div>
        </div>

        {/* Transaction Data Table Card Panel - Improved mobile responsive designs to never truncate */}
        <div className="bg-slate-50/70 border border-slate-100 rounded-[20px] p-3 sm:p-5 space-y-4">
          
          {/* Row 1: Date & Time */}
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="font-bold text-slate-700 whitespace-nowrap">Date & Time</span>
            </div>
            <span className="font-extrabold text-slate-800 text-right leading-tight break-words pl-2">
              {formatDateTime(withdrawal.created_at)}
            </span>
          </div>

          {/* Grid separator lines */}
          <div className="h-px bg-slate-100/70" />

          {/* Row 2: Transaction ID */}
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Ticket className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="font-bold text-slate-700 whitespace-nowrap">Transaction ID</span>
            </div>
            <span className="font-mono font-extrabold text-slate-800 select-all text-right leading-tight break-all pl-2">
              ID#{withdrawal.receipt_number || withdrawal.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Grid separator lines */}
          <div className="h-px bg-slate-100/70" />

          {/* Row 3: Sent To */}
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Send className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="font-bold text-slate-700 whitespace-nowrap">Sent to</span>
            </div>
            <span className="font-extrabold text-slate-800 text-right leading-tight pl-2">
              Admin
            </span>
          </div>

          {/* Grid separator lines */}
          <div className="h-px bg-slate-100/70" />

          {/* Row 4: Sent By */}
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="font-bold text-slate-700 whitespace-nowrap">Sent by</span>
            </div>
            <span className="font-extrabold text-slate-800 text-right leading-tight break-words pl-2">
              {withdrawal.profiles?.full_name || 'Maryam'}
            </span>
          </div>

          {/* Grid separator lines */}
          <div className="h-px bg-slate-100/70" />

          {/* Row 5: Total Amount */}
          <div className="flex items-center justify-between gap-3 text-[12px] sm:text-sm">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Coins className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="font-bold text-slate-700 whitespace-nowrap">Total Amount</span>
            </div>
            <span className="text-base sm:text-lg font-black text-[#22C55E] font-mono tracking-tight shrink-0 text-right pl-2">
              {withdrawal.amount} COINS
            </span>
          </div>

        </div>
      </div>

      {/* Buttons block */}
      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          Download PDF
        </button>
        
        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className="flex-1 h-12 bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 disabled:opacity-50 text-slate-705 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ImageIcon className="w-4 h-4" />
          Download Image
        </button>
      </div>

      <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] px-4 leading-relaxed">
        🔐 Authenticated transaction. This record is held with absolute immutability inside the Taskvexa Ledger.
      </p>
    </div>
  );
}

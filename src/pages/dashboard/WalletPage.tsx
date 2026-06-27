import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn, formatCompactNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { BannerAd } from '@/components/BannerAd';
import WithdrawalReceiptModal from '@/components/WithdrawalReceiptModal';

export default function WalletPage() {
  const { cachedProfile } = useStore();
  const [totalCoins, setTotalCoins] = useState(cachedProfile?.wallet_balance || 0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRejection, setSelectedRejection] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!cachedProfile?.id) return;
      
      const withdrawalsRes = await supabase.from('withdrawals').select('*').eq('user_id', cachedProfile.id).order('created_at', { ascending: false });

      let allTx: any[] = [];
      if (withdrawalsRes.data) {
        withdrawalsRes.data.forEach((w: any) => {
          allTx.push({
            id: `w_${w.id}`,
            type: 'withdrawn',
            amount: w.amount,
            desc: `Withdrawal via ${w.method}`,
            date: w.created_at,
            status: w.status,
            rejectionReason: w.rejection_reason
          });
        });
      }
      
      allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(allTx.slice(0, 10)); // just recent 10
      setIsLoading(false);
    }
    loadData();
  }, [cachedProfile?.id]);

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="lg:col-span-2">
          <Card className="h-[280px] bg-[#0F172A] text-white overflow-hidden relative p-8">
            {/* Subtle Gradient background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">Available Assets</p>
                <div className="flex items-baseline gap-2 overflow-hidden">
                  <h2 className="text-5xl lg:text-6xl font-black tracking-tight truncate">{formatCompactNumber(totalCoins)}</h2>
                  <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase shrink-0">COIN</span>
                </div>
              </div>
              
              <div className="mt-8">
                <Link to="/dashboard/withdraw">
                   <Button variant="primary" className="h-14 px-10 bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-white/10 uppercase tracking-widest text-[10px] font-black rounded-2xl">
                      Withdraw Funds
                   </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <div className="lg:col-span-1">
          <Card className="h-[280px] p-6 lg:p-8 flex flex-col justify-between group">
            <div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Payout Protocol</h3>
               <div className="space-y-4">
                  <div className="flex gap-4 items-center">
                     <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                       <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                     </div>
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minimum</p>
                       <p className="text-sm font-black text-slate-900 dark:text-white">1,000 Coin</p>
                     </div>
                  </div>
                  <div className="flex gap-4 items-center">
                     <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                       <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                     </div>
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing Wait</p>
                       <p className="text-sm font-black text-slate-900 dark:text-white">12 - 24 Hours</p>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
               <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">10 Coin = 1 PKR</p>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Global Spot Rate Applied</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Ledger History</h3>
        <Card className="overflow-hidden border-none shadow-sm dark:bg-slate-800/50 min-h-[100px]">
          {isLoading ? (
             <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
          ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
           {transactions.length === 0 && (
             <div className="py-8 text-center text-slate-500 text-sm">No recent transactions.</div>
           )}
            {transactions.map((tx, i) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group gap-4 relative"
              >
                 <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                      tx.type === 'earned' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" : "bg-rose-50 dark:bg-rose-500/10 text-rose-650 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
                    )}>
                       {tx.type === 'earned' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight mb-1">{tx.desc}</p>
                       <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date(tx.date).toLocaleString()}</span>
                    </div>
                 </div>
                 
                 <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pl-15 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-805/40">
                    <div className="flex items-center gap-1.5 shrink-0">
                       <Badge className={cn("text-[8.5px] px-2 py-0.5 rounded-md border-none font-black uppercase tracking-widest", (tx.status === 'completed' || tx.status === 'approved') ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : tx.status === 'rejected' ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400")}>
                         {tx.status}
                       </Badge>
                       {tx.status === 'rejected' && tx.rejectionReason && (
                         <button 
                           onClick={() => setSelectedRejection(tx.rejectionReason)}
                           className="flex items-center gap-1 px-2 py-0.5 bg-rose-500 hover:bg-rose-650 text-white rounded-md transition-all active:scale-95 text-[8.5px] font-black uppercase tracking-widest shadow-sm cursor-pointer border-none"
                           title="View Reason"
                         >
                            <AlertCircle className="w-3.5 h-3.5" />
                            Reason
                         </button>
                       )}
                       {(tx.status === 'approved' || tx.status === 'completed') && (
                         <button 
                           type="button"
                           onClick={() => setSelectedReceiptId(tx.id.replace('w_', ''))}
                           className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-all active:scale-95 text-[8.5px] font-black uppercase tracking-widest shadow-md cursor-pointer border-none"
                         >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            View Receipt
                         </button>
                       )}
                    </div>
                    
                    <div className="text-right shrink-0">
                       <p className={cn(
                         "text-base sm:text-xl font-black tracking-tight leading-none mb-1",
                         tx.type === 'earned' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                       )}>
                          {tx.type === 'earned' ? '+' : '-'}{formatCompactNumber(tx.amount)}
                       </p>
                       <p className="text-[8px] sm:text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">COINS</p>
                    </div>
                 </div>
              </motion.div>
            ))}
          </div>
          )}
        </Card>
      </div>

      <div className="mt-8 scale-90 md:scale-100 origin-top">
        <BannerAd />
      </div>

      {/* Modern Custom Dialog Modal for Rejection Reason */}
      <AnimatePresence>
        {selectedRejection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRejection(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white dark:bg-slate-800 rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative z-10 border border-slate-100 dark:border-slate-700/50 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Transaction Rejected</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Reason Details</p>
              </div>

              <div className="p-5 rounded-[20px] bg-slate-50 dark:bg-slate-900/50 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 text-center leading-relaxed">
                {selectedRejection}
              </div>

              <Button
                variant="secondary"
                onClick={() => setSelectedRejection(null)}
                className="w-full h-12 text-sm rounded-[16px] font-black"
              >
                Close Back
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedReceiptId && (
        <WithdrawalReceiptModal 
          withdrawalId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}

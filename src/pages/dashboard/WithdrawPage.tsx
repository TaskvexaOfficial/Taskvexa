import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowLeft, Image, DollarSign, Building, History, Wallet, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn, formatCompactNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import WithdrawalReceiptModal from '@/components/WithdrawalReceiptModal';

export default function WithdrawPage() {
  const { cachedProfile } = useStore();
  const navigate = useNavigate();
  const [userIdState, setUserIdState] = useState<string | null>(cachedProfile?.id || null);
  const [totalCoins, setTotalCoins] = useState(cachedProfile?.wallet_balance || 0);
  const [pendingCoins, setPendingCoins] = useState(0);
  const minWithdrawal = 1000;
  
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [selectedRejection, setSelectedRejection] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  
  const availableCoins = Math.max(0, totalCoins - pendingCoins);
  
  useEffect(() => {
    async function loadUser() {
      let uid = cachedProfile?.id;
      if (!uid) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          uid = session?.user?.id || null;
        } catch (e) {
          console.error("Error getting session in WithdrawPage:", e);
        }
      }
      if (uid) {
        setUserIdState(uid);
        try {
          // Fetch current wallet balance
          const { data } = await supabase.from('profiles').select('wallet_balance').eq('id', uid).single();
          if (data) setTotalCoins(data.wallet_balance || 0);
        } catch (err) {
          console.error("Error fetching balance:", err);
        }

        try {
          // Fetch pending withdrawals sum
          const { data: withdrawalsData } = await supabase
            .from('withdrawals')
            .select('amount')
            .eq('user_id', uid)
            .eq('status', 'pending');
          if (withdrawalsData) {
            const sum = withdrawalsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
            setPendingCoins(sum);
          }
        } catch (err) {
          console.error("Error fetching pending withdrawals:", err);
        }
      }
    }
    loadUser();
  }, [cachedProfile?.id]);
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [method, setMethod] = useState<'easypaisa' | 'jazzcash' | 'bank' | 'usd'>('usd');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('Binance / TRC20 (USD)');
  
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    
    const amount = parseInt(withdrawAmount);
    
    if (!withdrawAmount || isNaN(amount)) {
      setInlineError('Please enter a valid amount');
      return;
    }
    
    if (amount < minWithdrawal) {
      setInlineError(`Minimum withdrawal is ${formatCompactNumber(minWithdrawal)} Coins`);
      return;
    }
    
    if (amount > availableCoins) {
      setInlineError(`Insufficient available balance. You have ${formatCompactNumber(pendingCoins)} Coins in pending withdrawals, leaving ${formatCompactNumber(availableCoins)} Coins available.`);
      return;
    }

    if (!accountNumber) {
      setInlineError('Please enter your account number/wallet address');
      return;
    }

    if ((method === 'easypaisa' || method === 'jazzcash' || method === 'bank') && !accountName) {
      setInlineError('Please enter the account holder name');
      return;
    }

    setStep('confirm');
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setInlineError(null);
    setIsSubmitting(true);
    
    const paymentDetails = {
      name: accountName,
      number: accountNumber,
      bank: bankName,
      network: cryptoNetwork
    };

    let finalUserId = userIdState || cachedProfile?.id;
    if (!finalUserId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          finalUserId = user.id;
          setUserIdState(user.id);
        }
      } catch (e) {
        console.error("Auth session retrieval error:", e);
      }
    }

    if (!finalUserId) {
      setInlineError('Error: Authentication session not found. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert([
          {
            user_id: finalUserId,
            amount: Number(withdrawAmount),
            method: method,
            account_info: JSON.stringify(paymentDetails),
            status: 'pending'
          }
        ]);
        
      if (error) throw error;
      setStep('success');
    } catch (error: any) {
      console.error("Withdrawal submission failed details:", error);
      setInlineError('Error: ' + (error.message || JSON.stringify(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    async function fetchHistory() {
      const uid = userIdState || cachedProfile?.id;
      if (!uid) return;
      try {
        const { data } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false });
        if (data) setHistory(data);
      } catch (err) {
        console.error("Error fetching withdrawal history:", err);
      }
    }
    fetchHistory();
  }, [step, userIdState, cachedProfile?.id]);

  const getMethodIcon = () => {
    switch (method) {
      case 'bank': return <Building className="w-6 h-6 text-indigo-500" />;
      case 'usd': return <DollarSign className="w-6 h-6 text-emerald-500" />;
      default: return <Image className="w-6 h-6 text-amber-500" />;
    }
  };

  return (
    <div className="w-full pb-32">
      <div className="flex items-center justify-between px-2 mb-8">
        <button 
          onClick={() => step === 'confirm' ? setStep('input') : navigate('/dashboard/wallet')} 
          className="p-3 border-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[16px] transition-all group"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
        </button>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {step === 'confirm' ? 'Confirm Transfer' : step === 'success' ? 'Request Submitted' : 'Withdraw Funds'}
        </h2>
        <div className="w-11 h-11"></div>
      </div>

      <div className="px-2">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 p-8 lg:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none"></div>
                
                <div className="max-w-xl mx-auto space-y-8 relative z-10">
                  <div className="text-center space-y-3 mb-8">
                    <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">Available Balance</p>
                    <h3 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm truncate">{formatCompactNumber(availableCoins)}</h3>
                    {pendingCoins > 0 && (
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        Total Coins: {formatCompactNumber(totalCoins)} | Pending: -{formatCompactNumber(pendingCoins)}
                      </p>
                    )}
                  </div>
                  
                  <form onSubmit={handleNext} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Coins to withdraw</label>
                        <input 
                          type="number"
                          required
                          min={minWithdrawal}
                          max={availableCoins}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder={`Min ${formatCompactNumber(minWithdrawal)}`}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold text-lg text-slate-900 dark:text-white shadow-inner"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Payment Method</label>
                        <div className="relative">
                          <select 
                            value={method}
                            onChange={(e) => setMethod(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold appearance-none text-lg text-slate-900 dark:text-white shadow-inner"
                          >
                            <option value="easypaisa">EasyPaisa</option>
                            <option value="jazzcash">JazzCash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="usd">Crypto (USD)</option>
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                      {(method === 'easypaisa' || method === 'jazzcash' || method === 'bank') && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Account Holder Name</label>
                          <input 
                            type="text"
                            required
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-base text-slate-900 dark:text-white shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder="Full Legal Name"
                          />
                        </div>
                      )}

                      {(method === 'easypaisa' || method === 'jazzcash') && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Account Number</label>
                          <input 
                            type="text"
                            required
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-base text-slate-900 dark:text-white shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder="03XX-XXXXXXX"
                          />
                        </div>
                      )}

                      {method === 'bank' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Bank Name</label>
                            <input 
                              type="text"
                              required
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-base text-slate-900 dark:text-white shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600"
                              placeholder="E.g. Bank Alfalah, HBL"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">IBAN / Account Number</label>
                            <input 
                              type="text"
                              required
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-base text-slate-900 dark:text-white shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600"
                              placeholder="PKXXXX..."
                            />
                          </div>
                        </>
                      )}

                      {method === 'usd' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] ml-1">Exchange Network (Fixed)</label>
                            <input 
                              type="text"
                              readOnly
                              required
                              value={cryptoNetwork}
                              className="w-full bg-slate-100 dark:bg-slate-900/80 border-none rounded-[20px] py-4 px-5 focus:ring-0 outline-none transition-all font-bold text-base text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-inner"
                              placeholder="Binance / TRC20 (USD)"
                            />
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider ml-1">
                              Fixed Exchange Rate: 1,000 Coins = 3.50 USD
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Wallet Address</label>
                            <input 
                              type="text"
                              required
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-base text-slate-900 dark:text-white shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600"
                              placeholder="Enter USD/TRC20 Address"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {inlineError && (
                      <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-[20px] text-xs font-semibold flex items-center justify-between gap-3 shadow-inner">
                        <span className="flex-1 text-left">{inlineError}</span>
                        <button type="button" onClick={() => setInlineError(null)} className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 shrink-0">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <Button 
                      variant="primary"
                      type="submit" 
                      className="w-full h-16 mt-6 text-lg rounded-[20px] shadow-2xl shadow-indigo-600/20 transition-all font-black border-none hover:-translate-y-1"
                    >
                      Process Transaction
                    </Button>
                  </form>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="rounded-[32px] border-none shadow-xl bg-white dark:bg-slate-800 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {getMethodIcon()}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Review Transfer</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Please verify your details before confirming</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{formatCompactNumber(parseInt(withdrawAmount))} Coins</span>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Method</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white capitalize">{method}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payout Details</p>
                      {accountName && <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{accountName}</p>}
                      <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all">{accountNumber}</p>
                      {bankName && <p className="text-xs font-bold text-slate-500">{bankName}</p>}
                    </div>
                  </div>
                </div>

                {inlineError && (
                  <div className="mt-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-[20px] text-xs font-semibold flex items-center justify-between gap-3 shadow-inner">
                    <span className="flex-1 text-left">{inlineError}</span>
                    <button type="button" onClick={() => setInlineError(null)} className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 shrink-0">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="mt-8 space-y-4">
                  <Button 
                    variant="primary"
                    onClick={handleConfirmSubmit}
                    className="w-full h-16 text-lg rounded-[20px] shadow-xl font-black border-none"
                    isLoading={isSubmitting}
                  >
                    Confirm & Submit
                  </Button>
                  <button 
                    onClick={() => setStep('input')}
                    disabled={isSubmitting}
                    className="w-full py-4 text-sm font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-widest"
                  >
                    Go Back & Edit
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 max-w-md mx-auto rounded-[32px] p-10 shadow-2xl shadow-black/10 dark:shadow-none border border-slate-100 dark:border-slate-700/50 text-center space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
              
              <div className="w-32 h-32 bg-emerald-50 dark:bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto text-emerald-500 shadow-2xl shadow-emerald-500/20 relative rotate-[5deg]">
                <div className="absolute inset-0 border-[6px] border-emerald-100 dark:border-emerald-500/20 rounded-[32px] animate-ping opacity-20"></div>
                <CheckCircle2 className="w-14 h-14 -rotate-[5deg]" />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Thanks!</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-bold px-4 leading-relaxed bg-emerald-50/50 dark:bg-emerald-500/5 py-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10">
                  Thanks for submitting your withdrawal. Your withdrawal will be received in your account within 24 hours.
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full h-16 text-base bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-[20px] shadow-xl transition-all font-black border-none" 
              >
                Close & Go to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Withdrawal History List */}
        {step === 'input' && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-4"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Recent Cash Outs
              </h3>
            </div>
            
            <div className="space-y-3">
              {history.map((w) => (
                <Card key={w.id} className="p-4 rounded-[24px] border-none shadow-sm bg-white dark:bg-slate-800 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700",
                      w.status === 'approved' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" : 
                      w.status === 'rejected' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500" : 
                      "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                    )}>
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{formatCompactNumber(w.amount)} Coins</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{w.method}</span>
                        <span className="text-slate-300 dark:text-slate-700 font-bold opacity-30 text-[10px]">•</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(w.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge className={cn(
                      "text-[8px] uppercase px-2 py-0.5 font-bold border-none",
                      w.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20" : 
                      w.status === 'rejected' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20" : 
                      "bg-amber-100 text-amber-700 dark:bg-amber-500/20"
                    )}>
                      {w.status}
                    </Badge>
                    {w.rejection_reason && (
                      <button 
                         onClick={() => setSelectedRejection(w.rejection_reason)}
                         className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                         <XCircle className="w-3 h-3" />
                         Reason
                      </button>
                    )}
                    {(w.status === 'approved' || w.status === 'completed') && (
                      <button 
                         type="button"
                         onClick={() => setSelectedReceiptId(w.id)}
                         className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline flex items-center gap-1 mt-1 cursor-pointer bg-transparent border-none outline-none"
                      >
                         <CheckCircle2 className="w-3.5 h-3.5" />
                         View Receipt
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
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
                  <XCircle className="w-6 h-6" />
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

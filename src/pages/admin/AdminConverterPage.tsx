import React, { useState, useEffect } from 'react';
import { RefreshCcw, Info, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';

type Currency = 'coins' | 'pkr' | 'usd';

const CURRENCY_LABELS: Record<Currency, string> = {
  coins: 'Coins',
  pkr: 'Pakistani Rupee (PKR)',
  usd: 'US Dollar (USD)',
};

export default function AdminConverterPage() {
  const [fromUnit, setFromUnit] = useState<Currency>('coins');
  const [toUnit, setToUnit] = useState<Currency>('pkr');
  const [amount, setAmount] = useState<string>('1000');
  const [result, setResult] = useState<number>(0);

  // Conversion rates (mock)
  const COIN_TO_PKR = 0.1; // 10 coins = 1 PKR
  const PKR_TO_USD = 1 / 278; // 278 PKR = 1 USD
  const COIN_TO_USD = COIN_TO_PKR * PKR_TO_USD;

  const calculateConversion = () => {
    const val = parseFloat(amount) || 0;
    let baseInCoins = 0;

    // Convert from unit to coins (base)
    if (fromUnit === 'coins') baseInCoins = val;
    else if (fromUnit === 'pkr') baseInCoins = val / COIN_TO_PKR;
    else if (fromUnit === 'usd') baseInCoins = val / COIN_TO_USD;

    // Convert from coins (base) to toUnit
    let finalVal = 0;
    if (toUnit === 'coins') finalVal = baseInCoins;
    else if (toUnit === 'pkr') finalVal = baseInCoins * COIN_TO_PKR;
    else if (toUnit === 'usd') finalVal = baseInCoins * COIN_TO_USD;

    setResult(finalVal);
  };

  useEffect(() => {
    calculateConversion();
  }, [fromUnit, toUnit, amount]);

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 px-2 lg:px-4">
      <div className="text-center md:text-left space-y-2 mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Admin Financial Converter</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Internal conversion tool for financial reconciliation.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-[32px] shadow-xl shadow-slate-200/40 dark:shadow-none p-6 md:p-10 space-y-8 relative overflow-hidden group border-none"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50 dark:bg-amber-500/5 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

        <div className="flex flex-col gap-8 relative z-10 w-full">
           {/* Input Box */}
           <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[24px] shadow-inner border border-slate-100/50 dark:border-slate-800 relative group/input focus-within:shadow-md focus-within:ring-2 ring-indigo-500/20 transition-all">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Source Amount</label>
              
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                 <input 
                   type="number"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="flex-1 w-full text-4xl md:text-5xl font-black tracking-tighter bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-slate-800 text-slate-900 dark:text-white outline-none"
                   placeholder="0"
                 />
                 
                 <div className="relative shrink-0 w-full md:w-auto">
                    <select 
                      value={fromUnit}
                      onChange={(e) => setFromUnit(e.target.value as Currency)}
                      className="appearance-none w-full md:w-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider py-3 pl-4 pr-10 rounded-[16px] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center md:text-left"
                    >
                      {(['coins', 'pkr', 'usd'] as Currency[]).map(c => (
                         <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                 </div>
              </div>
           </div>

           {/* Switcher */}
           <div className="relative flex justify-center -my-12 z-20 pointer-events-none">
              <button 
                onClick={swapUnits}
                className="w-14 h-14 bg-indigo-600 dark:bg-indigo-500 text-white rounded-[20px] flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all group/btn border-[6px] border-white dark:border-slate-800 pointer-events-auto"
              >
                <RefreshCcw className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
              </button>
           </div>

           {/* Target Box */}
           <div className="bg-slate-900 dark:bg-black rounded-[24px] p-6 text-white relative shadow-2xl overflow-hidden mt-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"></div>
              <div className="relative z-10 flex flex-col">
                 <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Converted Value</label>
                 
                 <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 overflow-hidden">
                      <h3 className="text-4xl md:text-5xl font-black tracking-tighter truncate text-white">
                        {toUnit === 'usd' ? result.toFixed(3) : result.toFixed(2)}
                      </h3>
                    </div>
                    
                    <div className="relative shrink-0 w-full md:w-auto mt-2 md:mt-0">
                      <select 
                        value={toUnit}
                        onChange={(e) => setToUnit(e.target.value as Currency)}
                        className="appearance-none w-full md:w-auto bg-slate-800 dark:bg-slate-900/80 text-white font-black text-sm uppercase tracking-wider py-3 pl-4 pr-10 rounded-[16px] shadow-sm ring-1 ring-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center md:text-left"
                      >
                        {(['coins', 'pkr', 'usd'] as Currency[]).map(c => (
                           <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                   </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="pt-8 md:pt-10 mt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
           <div className="flex items-start gap-4 p-5 md:p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-[20px] border border-indigo-100 dark:border-indigo-500/20">
              <div className="w-10 h-10 rounded-[12px] bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">Admin Exchange Protocol</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                   Synchronized weekly average spot prices for system maintenance.
                </p>
              </div>
           </div>
           
           <div className="flex flex-col justify-center bg-slate-50 dark:bg-slate-900/50 p-5 md:p-6 rounded-[20px] shadow-inner">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4">
                 <span>Baseline Rate</span>
                 <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-200 dark:decoration-indigo-900 underline-offset-4">10 COIN = 0.035 USD</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '85%' }}
                   transition={{ duration: 1, ease: 'easeOut' }}
                   className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                 ></motion.div>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

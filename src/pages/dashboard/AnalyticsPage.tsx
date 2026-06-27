import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, Target, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHLY_DATA = [
  { name: 'Jan', completed: 120, rejected: 10 },
  { name: 'Feb', completed: 150, rejected: 15 },
  { name: 'Mar', completed: 180, rejected: 5 },
  { name: 'Apr', completed: 220, rejected: 8 },
  { name: 'May', completed: 250, rejected: 12 },
  { name: 'Jun', completed: 300, rejected: 20 },
];

const CATEGORY_DATA = [
  { name: 'App Downloads', value: 400, color: '#6366f1' },   // indigo-500
  { name: 'Surveys', value: 300, color: '#10b981' },         // emerald-500
  { name: 'Social Media', value: 300, color: '#f59e0b' },    // amber-500
  { name: 'Videos', value: 200, color: '#f43f5e' },          // rose-500
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6m'); // 1w, 1m, 6m, 1y

  return (
    <div className="space-y-8 w-full px-2 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Real-time Insights</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">System Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Detailed breakdown of your task completion and earnings trajectory.</p>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[20px] p-1.5 border border-slate-100 dark:border-slate-800 inline-flex shadow-inner">
          {['1w', '1m', '6m', '1y'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn("px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-[16px] transition-all",
                timeRange === range ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Total Tasks Attempted', value: '1,280', icon: Target, trend: '+12%', color: 'indigo' },
           { label: 'Overall Approval Rate', value: '94.5%', icon: Activity, trend: '+2.1%', color: 'emerald' },
           { label: 'Avg. Earnings / Task', value: '85', suffix: 'Coins', icon: TrendingUp, trend: '+5%', color: 'amber' },
           { label: 'Time Spent (Est.)', value: '45h 20m', icon: Clock, trend: '-1h', color: 'rose' }
         ].map((stat, i) => (
           <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
             <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 p-6 md:p-8 relative overflow-hidden group h-full flex flex-col justify-between">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 rounded-full blur-[40px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none`}></div>
                <div className="relative z-10 flex items-center justify-between mb-4">
                   <div className={`w-12 h-12 rounded-[16px] bg-${stat.color}-50 dark:bg-${stat.color}-500/10 border border-${stat.color}-100 dark:border-${stat.color}-500/20 flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                   </div>
                   <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">
                     {stat.trend}
                   </div>
                </div>
                <div className="relative z-10 mt-auto pt-6">
                   <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase mb-2">{stat.label}</p>
                   <div className="flex items-baseline gap-2">
                     <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                     {stat.suffix && <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.suffix}</span>}
                   </div>
                </div>
             </Card>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 h-full">
          <Card className="h-full rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 p-8 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent dark:from-indigo-500/5 pointer-events-none"></div>
            <div className="relative z-10 mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Task Completion Trends</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Completed vs Rejected tasks over time</p>
            </div>
            <div className="h-[350px] w-full mt-auto relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '16px', fontWeight: 600 }}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                  <Area type="monotone" dataKey="rejected" name="Rejected" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorRejected)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Pie Chart */}
        <div className="h-full">
          <Card className="h-full rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 p-8 flex flex-col items-centertext-center relative">
            <div className="relative z-10 w-full text-center mb-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Earnings Distribution</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Source of aggregated coins</p>
            </div>
            
            <div className="flex-1 w-full relative min-h-[250px] flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={CATEGORY_DATA}
                     cx="50%"
                     cy="50%"
                     innerRadius={80}
                     outerRadius={110}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                     cornerRadius={8}
                   >
                     {CATEGORY_DATA.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 800, fontSize: '14px' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               {/* Center text */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">1.2k</span>
                 <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Tasks</span>
               </div>
            </div>
            
            {/* Legend Grid */}
            <div className="w-full grid grid-cols-2 gap-y-4 gap-x-2 mt-4 px-2 pt-6 border-t border-slate-100 dark:border-slate-700/50">
              {CATEGORY_DATA.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }}></span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate" title={item.name}>{item.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

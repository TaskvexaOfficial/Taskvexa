import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Star, Bug, Lightbulb, Trash2, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store';

interface Feedback {
  id: string;
  user_id: string;
  type: 'support' | 'review' | 'bug' | 'suggestion';
  title: string;
  description: string;
  severity?: string;
  rating?: number;
  category?: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'support' | 'review' | 'bug' | 'suggestion'>('all');

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      let query = supabase
        .from('user_feedback')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('user_feedback')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('user_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFeedback(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'support': return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'review': return <Star className="w-4 h-4 text-amber-500" />;
      case 'bug': return <Bug className="w-4 h-4 text-rose-500" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">User Feedback</h2>
          <p className="text-base text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed mt-2">
            Manage all user support tickets, reviews, bug reports, and suggestions in one place.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-2">
        {(['all', 'support', 'review', 'bug', 'suggestion'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap shadow-sm ${
              filter === t 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 scale-105' 
                : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold">Loading feedback records...</p>
          </div>
        ) : feedback.length === 0 ? (
          <Card className="p-12 text-center border-none shadow-xl bg-white dark:bg-slate-800 rounded-[32px]">
            <p className="text-slate-400 font-bold">No feedback found for this category.</p>
          </Card>
        ) : (
          feedback.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id}
            >
              <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden relative group">
                <div className={`absolute top-0 left-0 w-2 h-full ${
                  item.type === 'support' ? 'bg-indigo-500' :
                  item.type === 'review' ? 'bg-amber-500' :
                  item.type === 'bug' ? 'bg-rose-500' : 'bg-blue-500'
                }`}></div>
                
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                        item.type === 'support' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' :
                        item.type === 'review' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                        item.type === 'bug' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                        'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                      }`}>
                        {getTypeIcon(item.type)}
                        {item.type}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        item.status === 'resolved' || item.status === 'reviewed'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {item.status}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-auto lg:ml-0">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Submission`}
                        {item.rating && <span className="ml-3 text-amber-500 flex items-center gap-1 inline-flex text-base">
                          <Star className="w-4 h-4 fill-current" /> {item.rating}/5
                        </span>}
                      </h4>
                      <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                        By {item.profiles?.full_name || 'Unknown'} ({item.profiles?.email || 'No email'})
                      </p>
                    </div>

                    <div className="p-6 rounded-[24px] bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-sm font-medium whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-100 dark:border-slate-800">
                      {item.description}
                    </div>

                    {item.severity && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity:</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          item.severity.toLowerCase().includes('critical') ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                        }`}>{item.severity}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-3 shrink-0 lg:justify-start">
                    {item.status === 'pending' && (
                      <Button
                        onClick={() => updateStatus(item.id, item.type === 'support' || item.type === 'bug' ? 'resolved' : 'reviewed')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 px-6 font-black text-xs border-none shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as {item.type === 'support' || item.type === 'bug' ? 'Resolved' : 'Reviewed'}
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      onClick={() => deleteFeedback(item.id)}
                      className="rounded-2xl h-12 px-6 font-black text-xs border-none shadow-lg shadow-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Report
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

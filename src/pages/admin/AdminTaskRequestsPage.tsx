import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CheckSquare, 
  XSquare, 
  Edit3, 
  CheckCircle, 
  Clock, 
  User, 
  Mail, 
  Briefcase, 
  Coins, 
  Save, 
  X,
  UserCheck,
  Phone,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

interface TaskRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  contact_platform: string;
  contact_info: string;
  notes: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

export default function AdminTaskRequestsPage() {
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Editing state controls
  const [editingRequest, setEditingRequest] = useState<TaskRequest | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBudget, setEditBudget] = useState(0);
  const [editContactPlat, setEditContactPlat] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAllRequests = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Try querying from dedicated task_requests table first
      const { data, error } = await supabase
        .from('task_requests')
        .select('*, profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          // Dedicated table not found, fallback to user_feedback table
          setUseFallback(true);
          const { data: fbData, error: fbErr } = await supabase
            .from('user_feedback')
            .select('*, profiles:user_id(full_name, email)')
            .eq('type', 'task_request')
            .order('created_at', { ascending: false });

          if (fbErr) throw fbErr;

          if (fbData) {
            const parsedData: TaskRequest[] = fbData.map((item: any) => {
              let parsedDesc = item.description;
              let budgetVal = 0;
              let platformVal = 'WhatsApp';
              let infoVal = '';
              let notesVal = '';

              try {
                const json = JSON.parse(item.description);
                parsedDesc = json.description || item.description;
                budgetVal = json.budget || 0;
                platformVal = json.contact_platform || 'WhatsApp';
                infoVal = json.contact_info || '';
                notesVal = json.notes || '';
              } catch (e) {
                // description is raw text
              }

              return {
                id: item.id,
                user_id: item.user_id,
                title: item.title,
                description: parsedDesc,
                category: item.category || 'Other Tasks',
                budget: budgetVal,
                contact_platform: platformVal,
                contact_info: infoVal,
                notes: notesVal,
                status: item.status || 'pending',
                created_at: item.created_at,
                profiles: item.profiles ? {
                  full_name: item.profiles.full_name || 'Anonymous User',
                  email: item.profiles.email || 'N/A'
                } : null
              };
            });
            setRequests(parsedData);
          }
        } else {
          throw error;
        }
      } else if (data) {
        const mappedData: TaskRequest[] = data.map((item: any) => ({
          ...item,
          profiles: item.profiles ? {
            full_name: (item.profiles as any).full_name || 'Anonymous User',
            email: (item.profiles as any).email || 'N/A'
          } : null
        }));
        setRequests(mappedData);
      }
    } catch (err: any) {
      console.error('Error fetching admin requests:', err);
      setErrorMsg(err.message || 'Error occurred while loading campaign submissions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      if (useFallback) {
        // Fallback update on user_feedback
        const { error } = await supabase
          .from('user_feedback')
          .update({ status: newStatus })
          .eq('id', requestId);

        if (error) throw error;
      } else {
        // Standard table update
        const { error } = await supabase
          .from('task_requests')
          .update({ status: newStatus })
          .eq('id', requestId);

        if (error) throw error;
      }

      // Live update state
      setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Fail to update status: ' + err.message);
    }
  };

  const startEdit = (req: TaskRequest) => {
    setEditingRequest(req);
    setEditTitle(req.title);
    setEditDesc(req.description);
    setEditCategory(req.category);
    setEditBudget(req.budget);
    setEditContactPlat(req.contact_platform);
    setEditContactInfo(req.contact_info);
    setEditNotes(req.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    setIsUpdating(true);

    try {
      if (useFallback) {
        // Combined updated json description
        const combinedDescription = JSON.stringify({
          description: editDesc,
          budget: editBudget,
          contact_platform: editContactPlat,
          contact_info: editContactInfo,
          notes: editNotes
        });

        const { error } = await supabase
          .from('user_feedback')
          .update({
            title: editTitle,
            description: combinedDescription,
            category: editCategory
          })
          .eq('id', editingRequest.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('task_requests')
          .update({
            title: editTitle,
            description: editDesc,
            category: editCategory,
            budget: editBudget,
            contact_platform: editContactPlat,
            contact_info: editContactInfo,
            notes: editNotes
          })
          .eq('id', editingRequest.id);

        if (error) throw error;
      }

      // Success close modal & refresh
      setEditingRequest(null);
      await fetchAllRequests();
    } catch (err: any) {
      console.error('Error updating request:', err);
      alert('Failed to update submission details: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.trim().toLowerCase()) {
      case 'approved':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      case 'completed':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
      case 'rejected':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
      default:
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
    }
  };

  return (
    <div className="space-y-8 pb-20 select-none max-w-7xl mx-auto px-2">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm">
          <Briefcase className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{useFallback ? 'Fallback Panel' : 'Primary DB Table'}</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Manage Task Requests</h2>
        <p className="text-sm text-slate-505 dark:text-slate-400 max-w-xl font-medium leading-relaxed">
          Review, approve, reject, or mark custom campaigns as completed. Verify the content categories, budget, and touch-to-contact usernames.
        </p>
      </div>

      {errorMsg && (
        <Card className="p-4 border-2 border-rose-100 dark:border-rose-950 bg-rose-50/20 text-rose-600 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-bold">{errorMsg}</span>
        </Card>
      )}

      {/* Main Container */}
      {isLoading ? (
        <Card className="p-20 text-center flex flex-col items-center justify-center border-none shadow-sm dark:bg-slate-900">
          <div className="w-12 h-12 rounded-full border-[3px] border-indigo-100 dark:border-slate-850 border-t-indigo-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading campaign submissions...</p>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-650 mb-4 border border-slate-200/50 dark:border-slate-800">
            <CheckSquare className="w-6 h-6" />
          </div>
          <p className="text-base font-black text-slate-800 dark:text-slate-200">No Custom Campaign Requests Found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">When users submit custom task requests, they will show up here immediately for moderation.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((req) => (
            <Card key={req.id} className="p-6 md:p-8 border-none bg-white dark:bg-slate-900 shadow-lg shadow-slate-200/40 dark:shadow-none rounded-[32px] hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col lg:flex-row justify-between gap-6">
              
              {/* Left Column: Task Details */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                    {req.category}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusStyle(req.status)}`}>
                    {req.status}
                  </span>
                  <span className="text-[10px] font-black text-slate-400">
                    Submitted: {new Date(req.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{req.title}</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {req.description}
                  </p>
                </div>

                {req.notes && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Additional Notes</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-350">{req.notes}</p>
                  </div>
                )}

                {/* Submitters Profile card */}
                <div className="pt-3.5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-450">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>User: <strong className="text-slate-950 dark:text-white">{req.profiles?.full_name || 'Anonymous user'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-500" />
                    <span>Email: <strong className="text-slate-950 dark:text-white">{req.profiles?.email || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Budget: <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{req.budget.toLocaleString()} Coins</strong></span>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact info + Action buttons */}
              <div className="w-full lg:w-72 flex flex-col justify-between p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-850 gap-4">
                <div className="space-y-2.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#592BFF] dark:text-indigo-400 block pb-1.5 border-b border-indigo-100/30">User Contact Demographics</span>
                  
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Platform: <strong className="text-slate-900 dark:text-white">{req.contact_platform}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto select-all">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono break-all leading-tight">
                      {req.contact_info}
                    </span>
                  </div>
                </div>

                {/* Moderation Actions list */}
                <div className="space-y-2 pt-4 border-t border-slate-200/40 dark:border-slate-800 flex flex-col gap-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleUpdateStatus(req.id, 'approved')}
                      variant="outline"
                      className="h-10 rounded-xl text-xs font-black bg-[#2563EB]/10 border-none hover:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button 
                      onClick={() => handleUpdateStatus(req.id, 'rejected')}
                      variant="outline"
                      className="h-10 rounded-xl text-xs font-black bg-rose-500/10 border-none hover:bg-rose-500/20 text-rose-600 dark:text-rose-450 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XSquare className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>

                  <Button 
                    onClick={() => handleUpdateStatus(req.id, 'completed')}
                    variant="primary"
                    className="h-10 rounded-xl text-xs font-black bg-emerald-600 border-none hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 w-full cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark as Completed
                  </Button>

                  <Button 
                    onClick={() => startEdit(req)}
                    variant="outline"
                    className="h-10 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-805 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 w-full mt-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Request
                  </Button>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Editing Modal Dialog */}
      <AnimatePresence>
        {editingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingRequest(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] z-10 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                  Edit Campaign Settings
                </h4>
                <button 
                  onClick={() => setEditingRequest(null)}
                  className="p-2 bg-slate-50 dark:bg-slate-950 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-5">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Campaign Title</label>
                  <input 
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205/50 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Description instructions</label>
                  <textarea 
                    required
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-950 border border-slate-205/50 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Category name</label>
                    <input 
                      type="text"
                      required
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205/50 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Allocated budget (Coins)</label>
                    <input 
                      type="number"
                      required
                      value={editBudget}
                      onChange={(e) => setEditBudget(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205/50 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Platform name</label>
                    <input 
                      type="text"
                      required
                      value={editContactPlat}
                      onChange={(e) => setEditContactPlat(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205/50 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Contact information</label>
                    <input 
                      type="text"
                      required
                      value={editContactInfo}
                      onChange={(e) => setEditContactInfo(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205/50 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Additional info notes</label>
                  <textarea 
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full min-h-[70px] bg-slate-50 dark:bg-slate-950 border border-slate-205/50 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingRequest(null)}
                    className="h-12 rounded-xl text-sm font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-6 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="h-12 rounded-xl text-sm font-black px-8 cursor-pointer"
                    isLoading={isUpdating}
                  >
                    {isUpdating ? 'Saving variations...' : 'Save Settings'}
                  </Button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

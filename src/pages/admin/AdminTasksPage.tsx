import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Edit, X, Settings2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCompactNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/store';
import { AnimatePresence, motion } from 'motion/react';
import { usePersistedState } from '@/hooks/usePersistedState';

export default function AdminTasksPage() {
  const { cachedAdminTasks, setCachedAdminTasks } = useStore();
  const [tasks, setTasks] = useState<any[]>(() => cachedAdminTasks || []);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(() => cachedAdminTasks?.length === 0);

  // Form states
  const [showForm, setShowForm] = usePersistedState('admin_tasks_showForm', false);
  const [showCategoriesModal, setShowCategoriesModal] = usePersistedState('admin_tasks_showCategoriesModal', false);
  const [newCat, setNewCat] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const [editingTaskId, setEditingTaskId] = usePersistedState<string | null>('admin_tasks_editingTaskId', null);

  const [formData, setFormData] = usePersistedState('admin_tasks_formData', {
    title: '',
    category_id: '',
    coins: 0,
    instructions: '',
    mistakes_to_avoid: '',
    video_url: '',
    image_url: '',
    max_completions: 1,
    status: 'active',
    claim_enabled: false,
    max_winners: 1,
    claim_timer_minutes: 5,
    alert_message_roman_urdu: '',
    alert_message_urdu: '',
    alert_message_english: '',
    global_completion_limit: '' as string | number,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category_id: '',
      coins: 0,
      instructions: '',
      mistakes_to_avoid: '',
      video_url: '',
      image_url: '',
      max_completions: 1,
      status: 'active',
      claim_enabled: false,
      max_winners: 1,
      claim_timer_minutes: 5,
      alert_message_roman_urdu: '',
      alert_message_urdu: '',
      alert_message_english: '',
      global_completion_limit: '',
    });
    setEditingTaskId(null);
  };


  useEffect(() => {
    fetchData();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('task_categories').select('*').order('created_at', { ascending: false });
    if (data) setCategories(data);
  };

  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat) return;
    setIsAddingCat(true);
    const { error } = await supabase.from('task_categories').insert([{ name: newCat }]);
    setIsAddingCat(false);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setNewCat('');
      fetchCategories();
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Tasks in this category will remain but without a category.')) return;
    
    // First remove this category from any tasks using it
    await supabase.from('tasks').update({ category_id: null }).eq('category_id', id);

    const { error, count } = await supabase.from('task_categories').delete({ count: 'exact' }).eq('id', id);
    if (error) {
      alert('Error: ' + error.message);
    } else if (count === 0) {
      alert('Failed to delete category. Supabase Row Level Security (RLS) is blocking the delete! Please check your RLS policies for the task_categories table in the Supabase Dashboard.');
    } else {
      fetchCategories();
      fetchData(); // re-fetch tasks to update their category
    }
  };

  async function fetchData() {
    if (tasks.length === 0) setIsLoading(true);
    
    // Fetch categories
    const { data: cats } = await supabase.from('task_categories').select('*');
    if (cats) setCategories(cats);

    // Fetch tasks
    const { data: tsks } = await supabase
      .from('tasks')
      .select('*, task_categories(name)')
      .order('created_at', { ascending: false });
    
    if (tsks) {
      setTasks(tsks);
      setCachedAdminTasks(tsks);
    }
    setIsLoading(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskPayload = {
      title: formData.title,
      category_id: formData.category_id || null,
      coins: Number(formData.coins),
      instructions: formData.instructions,
      mistakes_to_avoid: formData.mistakes_to_avoid,
      video_url: formData.video_url,
      image_url: formData.image_url,
      max_completions: Number(formData.max_completions) || 1,
      status: formData.status,
      claim_enabled: formData.claim_enabled || false,
      max_winners: Number(formData.max_winners) || 1,
      claim_timer_minutes: Number(formData.claim_timer_minutes) || 5,
      alert_message_roman_urdu: formData.alert_message_roman_urdu || '',
      alert_message_urdu: formData.alert_message_urdu || '',
      alert_message_english: formData.alert_message_english || '',
      global_completion_limit: formData.global_completion_limit !== '' && formData.global_completion_limit !== null && formData.global_completion_limit !== undefined 
        ? Number(formData.global_completion_limit) 
        : null
    };

    if (editingTaskId) {
      const { error } = await supabase.from('tasks').update(taskPayload).eq('id', editingTaskId);
      if (!error) {
        setShowForm(false);
        resetForm();
        fetchData();
      } else {
        alert('Error updating task: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('tasks').insert([taskPayload]);
      if (!error) {
        setShowForm(false);
        resetForm();
        fetchData();
      } else {
        alert('Error creating task: ' + error.message);
      }
    }
  };

  const handleEditClick = (task: any) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title || '',
      category_id: task.category_id || '',
      coins: task.coins || 0,
      instructions: task.instructions || '',
      mistakes_to_avoid: task.mistakes_to_avoid || '',
      video_url: task.video_url || '',
      image_url: task.image_url || '',
      max_completions: task.max_completions || 1,
      status: task.status || 'active',
      claim_enabled: task.claim_enabled || false,
      max_winners: task.max_winners || 1,
      claim_timer_minutes: task.claim_timer_minutes || 5,
      alert_message_roman_urdu: task.alert_message_roman_urdu || '',
      alert_message_urdu: task.alert_message_urdu || '',
      alert_message_english: task.alert_message_english || '',
      global_completion_limit: task.global_completion_limit !== null && task.global_completion_limit !== undefined 
        ? task.global_completion_limit 
        : '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Are you sure you want to delete this task? This will also delete all user submissions associated with it.')) {
      try {
        // Find and delete any referral earnings referencing submissions of this task
        const { data: subs, error: subsFetchError } = await supabase
          .from('task_submissions')
          .select('id')
          .eq('task_id', id);

        if (subsFetchError) {
          console.error('Error fetching submissions for cleanup:', subsFetchError);
        } else if (subs && subs.length > 0) {
          const subIds = subs.map(s => s.id);
          const { error: earningsError } = await supabase
            .from('referral_earnings')
            .delete()
            .in('task_completion_id', subIds);

          if (earningsError) {
            console.error('Error cleaning up referral earnings:', earningsError);
          }
        }

        // Delete submissions of this task first
        const { error: submissionsDeleteError } = await supabase
          .from('task_submissions')
          .delete()
          .eq('task_id', id);

        if (submissionsDeleteError) {
          console.error('Error deleting task submissions:', submissionsDeleteError);
        }

        // Delete the task itself
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
          alert('Error deleting task: ' + error.message);
        } else {
          // Success: update UI and refresh
          const updatedTasks = tasks.filter(t => t.id !== id);
          setTasks(updatedTasks);
          setCachedAdminTasks(updatedTasks);
          fetchData();
        }
      } catch (err: any) {
        alert('An unexpected error occurred: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Manage Tasks</h2>
          <p className="text-slate-500 font-medium">Add, edit or remove tasks available to users.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategoriesModal(true)}>
            <Settings2 className="w-5 h-5 mr-2" />
            Add Categories
          </Button>
          <Button onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              setShowForm(true);
            }
          }} className="shadow-lg shadow-indigo-600/20">
            <Plus className="w-5 h-5 mr-2" />
            {showForm ? 'Cancel' : 'Add New Task'}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <h3 className="text-xl font-bold">{editingTaskId ? 'Edit Task' : 'Create New Task'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Task Title</label>
                <input required name="title" value={formData.title} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="e.g. Download App XYZ" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Reward Coins</label>
                <input required type="number" name="coins" value={formData.coins} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Category</label>
                <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-500">
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Max Completions Per User</label>
                <input required type="number" name="max_completions" value={formData.max_completions} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" min="1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Global Completion Limit</label>
                <input type="number" name="global_completion_limit" value={formData.global_completion_limit} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" min="1" placeholder="Unlimited (Leave blank)" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Video URL (e.g. Youtube Embed)</label>
                <input name="video_url" value={formData.video_url} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Image URL</label>
                <input name="image_url" value={formData.image_url} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
              </div>

              {/* Claim Task System Toggle and Inputs */}
              <div className="col-span-1 md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Enable Claim Task System</h4>
                    <p className="text-xs text-slate-400 font-medium">Require users to reserve task slots before completion.</p>
                  </div>
                  <label htmlFor="claim_enabled_toggle" className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      name="claim_enabled"
                      checked={formData.claim_enabled || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, claim_enabled: e.target.checked }))} 
                      className="sr-only peer"
                      id="claim_enabled_toggle"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {formData.claim_enabled && (
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/20 dark:bg-indigo-950/5 p-5 rounded-2xl border border-indigo-100/30 dark:border-indigo-900/10">
                  <div className="space-y-2">
                    <label className="text-sm font-bold block text-slate-700 dark:text-slate-300">Maximum Winners / Completions</label>
                    <input 
                      required 
                      type="number" 
                      name="max_winners" 
                      value={formData.max_winners} 
                      onChange={handleInputChange} 
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent" 
                      min="1" 
                      placeholder="e.g. 1, 5, 10"
                    />
                    <p className="text-[11px] text-slate-400 font-medium">How many users can successfully complete this task (e.g. 1, 5, 10) before it auto-closes.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold block text-slate-700 dark:text-slate-300">Claim Timer (Minutes)</label>
                    <select 
                      name="claim_timer_minutes" 
                      value={formData.claim_timer_minutes} 
                      onChange={handleInputChange} 
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent text-slate-500"
                    >
                      <option value={5}>5 Minutes</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes (1 hour)</option>
                      <option value={120}>120 Minutes (2 hours)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 font-medium font-bold">Time allowed for completing the task before slot resets.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
               <label className="text-sm font-bold">Instructions</label>
               <textarea required name="instructions" value={formData.instructions} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent h-24" placeholder="Step by step..."></textarea>
            </div>
            
            <div className="space-y-2">
               <label className="text-sm font-bold">Mistakes to Avoid (One per line)</label>
               <textarea name="mistakes_to_avoid" value={formData.mistakes_to_avoid} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent h-24" placeholder="Don't use VPN..."></textarea>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
               <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">Optional Task Alert Message Popup</h4>
               <p className="text-xs text-slate-400 font-medium mb-4">If filled, users will be shown an important alert message popup instantly upon clicking this task.</p>
               
               <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-2">
                   <label className="text-sm font-bold block">Alert Message (Roman Urdu)</label>
                   <textarea name="alert_message_roman_urdu" value={formData.alert_message_roman_urdu} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent h-20 text-sm" placeholder="e.g. Is task ko mukammal karne ke liye VPN mat use karein..."></textarea>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold block">Alert Message (Urdu)</label>
                   <textarea name="alert_message_urdu" value={formData.alert_message_urdu} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent h-20 text-sm" dir="rtl" placeholder="اس ٹاسک کو مکمل کرنے کے لیے وی پی این کا استعمال نہ کریں۔"></textarea>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold block">Alert Message (English)</label>
                   <textarea name="alert_message_english" value={formData.alert_message_english} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent h-20 text-sm" placeholder="e.g. Please do not use a VPN to complete this task..."></textarea>
                 </div>
               </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" variant="primary" className="px-8">{editingTaskId ? 'Update Task' : 'Create Task'}</Button>
              {editingTaskId && (
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel Edit</Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {tasks.map(task => (
            <Card key={task.id} className={`p-6 relative group border-none shadow-xl shadow-slate-200/40 dark:shadow-none transition-opacity ${task.status === 'inactive' ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800'} rounded-[32px]`}>
               <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => handleEditClick(task)} className="w-8 h-8 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20 cursor-pointer shadow-sm border border-indigo-100/30">
                     <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer shadow-sm border border-rose-100/30">
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>
               
               <div className="flex items-center gap-4 mb-4 mt-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {task.image_url ? <img src={task.image_url} alt="img" className="w-full h-full object-cover" /> : task.title[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-[10px] uppercase tracking-widest">{task.task_categories?.name || 'Category'}</Badge>
                      {task.status === 'inactive' && <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200">Inactive</Badge>}
                    </div>
                  </div>
               </div>
               <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{task.instructions}</p>
               
               <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col justify-between items-start gap-2">
                 <div className="flex justify-between w-full items-center">
                   <span className="font-black text-indigo-600 dark:text-indigo-400">{formatCompactNumber(task.coins)} Coins</span>
                   <span className="text-xs font-bold text-slate-400">{new Date(task.created_at).toLocaleDateString()}</span>
                 </div>
                 {task.max_completions && (
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Completions: {task.max_completions}</span>
                 )}
                 {task.global_completion_limit !== undefined && task.global_completion_limit !== null && task.global_completion_limit > 0 ? (
                   <div className="w-full mt-2 pt-2 border-t border-dashed border-slate-150 dark:border-slate-700/50 flex flex-col gap-1">
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Global Limit System</span>
                       <span className="text-emerald-600 dark:text-emerald-400 font-black">ACTIVE</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Global Limit</span>
                       <span className="text-slate-700 dark:text-slate-300 font-extrabold">{task.global_completion_limit}</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Occupied Slots</span>
                       <span className="text-slate-700 dark:text-slate-300 font-extrabold">{task.occupied_slots || 0}</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Available Slots</span>
                       <span className="text-slate-700 dark:text-slate-300 font-extrabold">
                         {Math.max(0, task.global_completion_limit - (task.occupied_slots || 0))}
                       </span>
                     </div>
                   </div>
                 ) : (
                   <div className="w-full mt-2 pt-2 border-t border-dashed border-slate-150 dark:border-slate-700/50 flex flex-col gap-1">
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Global Limit</span>
                       <span className="text-slate-500 dark:text-slate-400 font-extrabold">Unlimited Mode</span>
                     </div>
                   </div>
                 )}
                 {task.claim_enabled && (
                   <div className="w-full mt-2 pt-2 border-t border-dashed border-slate-150 dark:border-slate-700/50 flex flex-col gap-1">
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Claim System</span>
                       <span className="text-indigo-600 dark:text-indigo-400 font-black">ACTIVE</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Completed Winners</span>
                       <span className="text-slate-700 dark:text-slate-300 font-extrabold">{task.completed_count || 0} / {task.max_winners || 1}</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>Claim Timer</span>
                       <span className="text-slate-700 dark:text-slate-300 font-extrabold">{task.claim_timer_minutes || 5} min</span>
                     </div>
                   </div>
                 )}
               </div>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCategoriesModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Task Categories</h3>
                <button onClick={() => setShowCategoriesModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleAddCat} className="flex gap-2 mb-6">
                  <input 
                    type="text"
                    value={newCat} 
                    onChange={e => setNewCat(e.target.value)} 
                    placeholder="New Category Name" 
                    className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <Button type="submit" disabled={isAddingCat} variant="primary" className="h-11 px-6 rounded-xl shadow-lg shadow-indigo-600/20 whitespace-nowrap">
                    Add
                  </Button>
                </form>

                <div className="space-y-3">
                  {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{c.name}</span>
                      <button onClick={() => handleDeleteCat(c.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 group-hover:text-rose-500 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-slate-500 font-medium">No categories found.</p>
                      <p className="text-sm text-slate-400 mt-1">Add one using the form above.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

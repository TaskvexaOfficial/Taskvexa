import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatCompactNumber, cn } from '@/lib/utils';
import { Search, Edit, Trash2, X, User as UserIcon, Activity, ListTodo, Wallet, Users, Image as ImageIcon, Eye } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '@/store';
import { usePersistedState } from '@/hooks/usePersistedState';

const parseAccountInfo = (infoValue: any) => {
  if (!infoValue) return { name: 'N/A', number: 'N/A', bank: '', network: '' };
  if (typeof infoValue === 'object') return infoValue;
  try {
    return JSON.parse(infoValue);
  } catch (e) {
    return { name: 'N/A', number: infoValue, bank: '', network: '' };
  }
};

interface AdminUsersPageProps {
  filterType?: 'active' | 'today';
}

export default function AdminUsersPage({ filterType }: AdminUsersPageProps = {}) {
  const { cachedAdminUsers, setCachedAdminUsers, cachedAdminStats, setCachedAdminStats } = useStore();
  const [users, setUsers] = useState<any[]>(() => cachedAdminUsers || []);
  const [isLoading, setIsLoading] = useState(() => cachedAdminUsers?.length === 0);
  const [search, setSearch] = usePersistedState('admin_users_search', '');
  const [currentPage, setCurrentPage] = usePersistedState('admin_users_currentPage', 1);
  const [localBanReason, setLocalBanReason] = usePersistedState('admin_users_localBanReason', '');

  const [selectedUser, setSelectedUser] = usePersistedState<any>('admin_users_selectedUser', null);
  const [isModalOpen, setIsModalOpen] = usePersistedState('admin_users_isModalOpen', false);
  const [activeTab, setActiveTab] = usePersistedState<'profile' | 'stats' | 'tasks' | 'withdrawals' | 'referrals'>('admin_users_activeTab', 'profile');
  
  // Data for tabs
  const [editData, setEditData] = useState<any>({});
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [filteredUserTasks, setFilteredUserTasks] = useState<any[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<any[]>([]);
  const [userReferrals, setUserReferrals] = useState<any[]>([]);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);

  // Task Filters
  const [taskSearch, setTaskSearch] = useState('');
  const [taskDateFilter, setTaskDateFilter] = useState<'all' | 'today' | 'last-week' | 'last-month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [activeTaskDetail, setActiveTaskDetail] = useState<any>(null);

  const isFirstSearchRender = React.useRef(true);
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    let result = [...userTasks];
    
    if (taskSearch) {
      result = result.filter(t => t.tasks?.title?.toLowerCase().includes(taskSearch.toLowerCase()));
    }

    if (taskDateFilter !== 'all') {
      const now = new Date();
      result = result.filter(t => {
        const tDate = new Date(t.created_at);
        if (taskDateFilter === 'today') {
          return tDate.toDateString() === now.toDateString();
        }
        if (taskDateFilter === 'last-week') {
          const lastWeek = new Date();
          lastWeek.setDate(now.getDate() - 7);
          return tDate >= lastWeek;
        }
        if (taskDateFilter === 'last-month') {
          const lastMonth = new Date();
          lastMonth.setMonth(now.getMonth() - 1);
          return tDate >= lastMonth;
        }
        if (taskDateFilter === 'custom' && customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return tDate >= start && tDate <= end;
        }
        return true;
      });
    }

    setFilteredUserTasks(result);
  }, [taskSearch, taskDateFilter, customStartDate, customEndDate, userTasks]);

  useEffect(() => {
    fetchUsers();

    const channel = supabase.channel(`admin-users-channel-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setUsers(prev => {
            const updated = [payload.new, ...prev.filter(u => u.id !== payload.new.id)];
            const sorted = updated.sort((a,b) => (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase()));
            setCachedAdminUsers(sorted);
            return sorted;
          });
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => {
            const updated = prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u);
            const sorted = updated.sort((a,b) => (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase()));
            setCachedAdminUsers(sorted);
            return sorted;
          });
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => {
            const updated = prev.filter(u => u.id !== payload.old.id);
            setCachedAdminUsers(updated);
            return updated;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchUsers() {
    if (users.length === 0) setIsLoading(true);
    
    let authUsers: any[] = [];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const authRes = await fetch('/api/admin/users-auth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (authRes.ok) {
          const authJson = await authRes.json();
          authUsers = authJson.users || [];
        }
      }
    } catch (e) {
      console.error("Error loading auth users metadata in table:", e);
    }

    const authMap = new Map<string, any>();
    authUsers.forEach(au => {
      authMap.set(au.id, au);
    });

    // First attempt: Select all (ideal)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email', { ascending: true });

    if (data) {
      // Sort alphabetically by email case insensitively
      const sortedData = data.sort((a, b) => (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase()));
      // Fetch referral counts
      const userIds = sortedData.map(u => u.id);
      const { data: refsData } = await supabase.from('profiles').select('id, referred_by').in('referred_by', userIds);
      
      const counts: Record<string, number> = {};
      if (refsData) {
        refsData.forEach(r => {
          if (r.referred_by) {
             counts[r.referred_by] = (counts[r.referred_by] || 0) + 1;
          }
        });
      }
      
      const mergedData = sortedData.map(u => {
        const au = authMap.get(u.id);
        return {
          ...u,
          referrals_count: counts[u.id] || 0,
          last_sign_in_at: au?.last_sign_in_at || null,
          auth_created_at: au?.created_at || u.created_at
        };
      });

      setUsers(mergedData);
      setCachedAdminUsers(mergedData);
    } else if (error) {
      console.error('Full profile fetch error, attempting limited fetch:', error);
      // Fallback: If some columns are missing (like wallet_balance), just get basic info
      const { data: basicData } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, role, avatar_url, is_banned, ban_reason, banned_at')
        .order('email', { ascending: true });
      
      if (basicData) {
        // Sort alphabetically by email case insensitively
        const sortedBasicData = basicData.sort((a, b) => (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase()));
        // Fetch referral counts
        const userIds = sortedBasicData.map(u => u.id);
        const { data: refsData } = await supabase.from('profiles').select('id, referred_by').in('referred_by', userIds);
        
        const counts: Record<string, number> = {};
        if (refsData) {
          refsData.forEach(r => {
            if (r.referred_by) {
               counts[r.referred_by] = (counts[r.referred_by] || 0) + 1;
            }
          });
        }
        
        const mergedData = sortedBasicData.map(u => {
          const au = authMap.get(u.id);
          return {
            ...u,
            referrals_count: counts[u.id] || 0,
            last_sign_in_at: au?.last_sign_in_at || null,
            auth_created_at: au?.created_at || u.created_at
          };
        });

        setUsers(mergedData);
        setCachedAdminUsers(mergedData);
      }
    }
    setIsLoading(false);
  }

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if(!confirm('Are you sure you want to delete this user? This will PERMANENTLY remove them from the database and authentication system. This action cannot be undone.')) return;
    
    setIsDeleting(id);
    try {
      // Find user to check active state
      const targetUser = users.find(u => u.id === id);
      const wasActive = targetUser ? !targetUser.is_banned : true;

      // First attempt: Call the custom RPC function that handles auth deletion
      const { error: rpcError } = await supabase.rpc('delete_user_permanently', { target_user_id: id });
      
      if (!rpcError) {
        const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
        setCachedAdminUsers(updatedUsers);
        
        // Immediately decrease active count in Dashboard if the deleted user was active
        if (wasActive && cachedAdminStats && cachedAdminStats.stats) {
          setCachedAdminStats({
            ...cachedAdminStats,
            stats: {
              ...cachedAdminStats.stats,
              totalUsers: Math.max(0, (cachedAdminStats.stats.totalUsers || 0) - 1)
            }
          });
        }

        alert('User deleted successfully from both Database and Auth.');
        return;
      }

      console.warn('RPC deletion failed, falling back to profile-only delete:', rpcError);

      // Fallback: Delete profile
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      
      if (error) {
        alert('Error deleting user profile: ' + error.message);
      } else {
        const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
        setCachedAdminUsers(updatedUsers);
        
        // Immediately decrease active count in Dashboard if the deleted user was active
        if (wasActive && cachedAdminStats && cachedAdminStats.stats) {
          setCachedAdminStats({
            ...cachedAdminStats,
            stats: {
              ...cachedAdminStats.stats,
              totalUsers: Math.max(0, (cachedAdminStats.stats.totalUsers || 0) - 1)
            }
          });
        }

        alert('User profile removed. Note: To delete from Supabase Auth permanently, you MUST run the NEW SQL script.');
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditClick = async (user: any) => {
    setSelectedUser(user);
    setEditData({ ...user });
    setLocalBanReason('');
    setIsModalOpen(true);
    setActiveTab('profile');
    setUserTasks([]);
    setUserWithdrawals([]);
    setUserReferrals([]);
    
    setIsLoadingModalData(true);
    
    const [tasksResRaw, dynTasksResRaw, withRes, refRes] = await Promise.all([
      supabase.from('task_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('dynamic_task_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email, avatar_url, created_at').eq('referred_by', user.id).order('created_at', { ascending: false })
    ]);
    
    let tasksResData = tasksResRaw.data || [];
    if (tasksResData.length > 0) {
      const taskIds = [...new Set(tasksResData.filter(t => t.task_id).map(t => t.task_id))];
      if (taskIds.length > 0) {
        const { data: tData } = await supabase.from('tasks').select('id, title, coins').in('id', taskIds);
        const tasksMap = Object.fromEntries((tData || []).map((t: any) => [t.id, t]));
        tasksResData = tasksResData.map(t => ({...t, tasks: tasksMap[t.task_id], isDynamic: false}));
      }
    }

    let dynTasksResData = dynTasksResRaw.data || [];
    if (dynTasksResData.length > 0) {
      const dynTaskIds = [...new Set(dynTasksResData.filter(t => t.task_id).map(t => t.task_id))];
      if (dynTaskIds.length > 0) {
        const { data: dtData } = await supabase.from('dynamic_tasks').select('id, name, coins').in('id', dynTaskIds);
        const dynTasksMap = Object.fromEntries((dtData || []).map((t: any) => [t.id, t]));
        dynTasksResData = dynTasksResData.map(t => ({
          ...t, 
          tasks: {
            id: t.task_id,
            title: dynTasksMap[t.task_id]?.name || 'Unknown Dynamic Task',
            coins: dynTasksMap[t.task_id]?.coins || 0
          },
          isDynamic: true
        }));
      }
    }

    const combinedTasks = [...tasksResData, ...dynTasksResData].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    setUserTasks(combinedTasks);
    if (withRes.data) setUserWithdrawals(withRes.data);
    if (refRes.data) setUserReferrals(refRes.data);
    
    // Compute referrals count directly
    setEditData(prev => ({...prev, referrals_count: (refRes.data || []).length}));
    
    setIsLoadingModalData(false);
  };

  const saveProfileData = async () => {
    const { error, count } = await supabase
      .from('profiles')
      .update({
         full_name: editData.full_name,
         phone_number: editData.phone_number,
         country: editData.country,
         avatar_url: editData.avatar_url,
         referral_code: editData.referral_code,
         referred_by: editData.referred_by || null
      }, { count: 'exact' })
      .eq('id', selectedUser.id);
      
    if (error) {
       alert('Error: ' + error.message);
    } else if (count === 0) {
       alert('Failed to update. Supabase Row Level Security (RLS) is blocking the update! Please follow the instructions provided by the AI to fix your RLS policies.');
    } else {
       setIsModalOpen(false);
       fetchUsers();
    }
  };

  const saveStatsData = async () => {
    const { error, count } = await supabase
      .from('profiles')
      .update({
         wallet_balance: Number(editData.wallet_balance),
         total_tasks_completed: Number(editData.total_tasks_completed),
         total_withdraw: Number(editData.total_withdraw),
         total_referral_earnings: Number(editData.total_referral_earnings)
      }, { count: 'exact' })
      .eq('id', selectedUser.id);
      
    if (error) {
       alert('Error: ' + error.message);
    } else if (count === 0) {
       alert('Failed to update stats. Supabase Row Level Security (RLS) is blocking the update! Please follow the instructions provided by the AI to fix your RLS policies.');
    } else {
       setIsModalOpen(false);
       fetchUsers();
    }
  };

  const filteredUsers = users.filter(u => {
    if (filterType === 'active') {
      const lastActive = new Date(u.last_sign_in_at || u.created_at);
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      if (lastActive < sevenDaysAgo) {
        return false;
      }
    } else if (filterType === 'today') {
      const createdDate = new Date(u.auth_created_at || u.created_at);
      const now = new Date();
      if (createdDate.toDateString() !== now.toDateString()) {
        return false;
      }
    }

    return (
      u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const indexOfLastItem = activePage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">
            {filterType === 'active' ? 'Active Users (Last 7 Days)' : filterType === 'today' ? "Today's Registrations" : 'Users'}
          </h2>
          <p className="text-slate-500 font-medium">
            {filterType === 'active' ? 'Manage users who have logged in within the last 7 days.' : filterType === 'today' ? 'Manage users who registered today.' : 'Manage all platform users.'}
          </p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
           <input 
             type="text" 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Search users..." 
             className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
           />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
      ) : (
        <>
          <Card className="overflow-hidden border-none shadow-sm dark:shadow-none bg-white dark:bg-slate-800 rounded-[24px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Balance</th>
                    <th className="px-6 py-4">Tasks Done</th>
                    <th className="px-6 py-4">Withdrawn</th>
                    <th className="px-6 py-4">Referrals</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-slate-500">{user.full_name?.[0]?.toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white">{user.full_name || 'Anonymous'}</p>
                              {user.is_banned ? (
                                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-full border border-rose-250 dark:border-rose-900">
                                  Banned
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-full border border-emerald-250 dark:border-emerald-900">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{user.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{formatCompactNumber(user.wallet_balance || 0)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.total_tasks_completed || 0}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-medium">${formatCompactNumber(user.total_withdraw || 0)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.referrals_count || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            disabled={isDeleting === user.id}
                            onClick={(e) => {
                              handleDelete(user.id, e);
                            }}
                            className={cn(
                              "group relative p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all active:scale-95 z-20",
                              isDeleting === user.id && "opacity-50 cursor-not-allowed"
                            )}
                            title="Delete User"
                          >
                            <div className="relative">
                              {isDeleting === user.id ? (
                                <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              )}
                            </div>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white dark:bg-slate-800 rounded-[24px]">
              <span className="text-xs font-bold text-slate-500">
                Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={activePage === 1}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750/50 rounded-xl text-slate-650 dark:text-slate-350 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-850 transition-all font-sans"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        className={cn(
                          "w-8.5 h-8.5 text-xs font-black rounded-xl transition-all font-sans",
                          activePage === pg
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900/50"
                        )}
                      >
                        {pg}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={activePage === totalPages}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750/50 rounded-xl text-slate-650 dark:text-slate-350 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-850 transition-all font-sans"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit User Modal */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200/50 dark:border-slate-800"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                       {selectedUser.avatar_url ? (
                         <img src={selectedUser.avatar_url} alt="User" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-500">
                           {selectedUser.full_name?.[0]?.toUpperCase() || 'U'}
                         </div>
                       )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedUser.full_name || 'Anonymous User'}</h3>
                      <p className="text-sm text-slate-500">{selectedUser.email}</p>
                    </div>
                    <Badge className="ml-2 uppercase tracking-widest text-[10px]">{selectedUser.role}</Badge>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body with Sidebar/Tabs */}
                <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                  {/* Sidebar Navigation */}
                  <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-row md:flex-col p-4 gap-1 overflow-x-auto md:overflow-y-auto shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
                     {[
                       { id: 'profile', icon: UserIcon, label: 'Profile Settings' },
                       { id: 'stats', icon: Activity, label: 'Manage Stats' },
                       { id: 'tasks', icon: ListTodo, label: 'All Tasks' },
                       { id: 'withdrawals', icon: Wallet, label: 'Withdrawals' },
                       { id: 'referrals', icon: Users, label: 'Referrals' },
                     ].map(tab => (
                       <button
                         key={tab.id}
                         onClick={() => setActiveTab(tab.id as any)}
                         className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                       >
                         <tab.icon className="w-4 h-4" />
                         {tab.label}
                       </button>
                     ))}
                  </div>

                  {/* Tab Content Area */}
                  <div className="flex-1 overflow-y-auto p-6 relative">
                    {isLoadingModalData ? (
                       <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10 backdrop-blur-sm">
                         <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                       </div>
                    ) : null}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                      <div className="space-y-6 max-w-xl">
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Profile Information</h4>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                            <input 
                              type="text" 
                              value={editData.full_name || ''} 
                              onChange={e => setEditData({...editData, full_name: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email (Read Only)</label>
                              <input 
                                type="email" 
                                value={editData.email || ''} 
                                readOnly
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 text-slate-500 outline-none grayscale opacity-80 cursor-not-allowed"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">User ID (Read Only)</label>
                              <div className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 text-slate-500 font-mono text-sm break-all">
                                {editData.id || ''}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
                              <input 
                                type="text" 
                                value={editData.phone_number || ''} 
                                onChange={e => setEditData({...editData, phone_number: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Country</label>
                              <input 
                                type="text" 
                                value={editData.country || ''} 
                                onChange={e => setEditData({...editData, country: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Referral Code</label>
                              <input 
                                type="text" 
                                value={editData.referral_code || ''} 
                                onChange={e => setEditData({...editData, referral_code: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Referred By (User ID)</label>
                              <input 
                                type="text" 
                                value={editData.referred_by || ''} 
                                onChange={e => setEditData({...editData, referred_by: e.target.value})}
                                placeholder="Referrer UUID"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-mono text-xs"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Profile Image URL</label>
                            <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 value={editData.avatar_url || ''} 
                                 onChange={e => setEditData({...editData, avatar_url: e.target.value})}
                                 placeholder="https://..."
                                 className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                               />
                               {editData.avatar_url && (
                                 <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-indigo-100 dark:border-indigo-900">
                                   <img src={editData.avatar_url} alt="preview" className="w-full h-full object-cover" />
                                 </div>
                               )}
                            </div>
                          </div>

                          {/* Account Ban control status block */}
                          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">Account Block Status & Controls</h5>
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-150 dark:border-slate-800/60 flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Status</span>
                                {editData.is_banned ? (
                                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-full border border-rose-200 dark:border-rose-900">
                                    Banned
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-full border border-emerald-200 dark:border-emerald-900">
                                    Active
                                  </span>
                                )}
                              </div>

                              {editData.is_banned ? (
                                <div className="space-y-3">
                                  <div className="text-xs space-y-1">
                                    <p className="font-semibold text-slate-400">Banned At:</p>
                                    <p className="font-mono text-slate-600 dark:text-slate-300">
                                      {editData.banned_at ? new Date(editData.banned_at).toLocaleString() : 'Date N/A'}
                                    </p>
                                  </div>
                                  <div className="text-xs space-y-1">
                                    <p className="font-semibold text-slate-400">Reason of Ban:</p>
                                    <p className="font-bold text-rose-600 dark:text-rose-400">
                                      {editData.ban_reason || 'No reason specified'}
                                    </p>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={async () => {
                                      if (!confirm(`Are you sure you want to unban ${editData.full_name || 'this user'}?`)) return;
                                      const { error } = await supabase
                                        .from('profiles')
                                        .update({ is_banned: false, ban_reason: null, banned_at: null })
                                        .eq('id', selectedUser.id);
                                      if (error) {
                                        alert('Failed to unban user: ' + error.message);
                                      } else {
                                        const updated = { ...editData, is_banned: false, ban_reason: null, banned_at: null };
                                        setEditData(updated);
                                        setSelectedUser(updated);
                                        
                                        // Immediately increase active count in Dashboard
                                        if (cachedAdminStats && cachedAdminStats.stats) {
                                          setCachedAdminStats({
                                            ...cachedAdminStats,
                                            stats: {
                                              ...cachedAdminStats.stats,
                                              totalUsers: (cachedAdminStats.stats.totalUsers || 0) + 1
                                            }
                                          });
                                        }

                                        fetchUsers();
                                        alert('User has been unbanned successfully.');
                                      }
                                    }}
                                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/10"
                                  >
                                    Unban User
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Reason for Ban</label>
                                    <input 
                                      type="text" 
                                      placeholder="Violated platform policies / suspicious activity..." 
                                      value={localBanReason}
                                      onChange={e => setLocalBanReason(e.target.value)}
                                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500/30"
                                    />
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={async () => {
                                      if (!localBanReason.trim()) {
                                        alert('Please enter a reason for the ban.');
                                        return;
                                      }
                                      if (!confirm(`Are you sure you want to ban ${editData.full_name || 'this user'}?`)) return;
                                      const nowTime = new Date().toISOString();
                                      const { error } = await supabase
                                        .from('profiles')
                                        .update({ is_banned: true, ban_reason: localBanReason.trim(), banned_at: nowTime })
                                        .eq('id', selectedUser.id);
                                      if (error) {
                                        alert('Failed to ban user: ' + error.message);
                                      } else {
                                        const updated = { ...editData, is_banned: true, ban_reason: localBanReason.trim(), banned_at: nowTime };
                                        setEditData(updated);
                                        setSelectedUser(updated);
                                        setLocalBanReason('');

                                        // Immediately decrease active count in Dashboard
                                        if (cachedAdminStats && cachedAdminStats.stats) {
                                          setCachedAdminStats({
                                            ...cachedAdminStats,
                                            stats: {
                                              ...cachedAdminStats.stats,
                                              totalUsers: Math.max(0, (cachedAdminStats.stats.totalUsers || 0) - 1)
                                            }
                                          });
                                        }

                                        fetchUsers();
                                        alert('User has been banned successfully.');
                                      }
                                    }}
                                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-600/10"
                                  >
                                    Ban User
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-4">
                            <Button variant="primary" onClick={saveProfileData} className="w-auto px-8">Save Profile Changes</Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                      <div className="space-y-6 max-w-xl">
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Modify User Statistics</h4>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Balance (Coins)</label>
                             <input 
                               type="number" 
                               value={editData.wallet_balance || 0} 
                               onChange={e => setEditData({...editData, wallet_balance: e.target.value})}
                               className="w-full font-mono text-lg font-bold px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tasks Completed</label>
                             <input 
                               type="number" 
                               value={editData.total_tasks_completed || 0} 
                               onChange={e => setEditData({...editData, total_tasks_completed: e.target.value})}
                               className="w-full font-mono text-lg font-bold px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Withdrawn</label>
                             <input 
                               type="number" 
                               value={editData.total_withdraw || 0} 
                               onChange={e => setEditData({...editData, total_withdraw: e.target.value})}
                               className="w-full font-mono text-lg font-bold px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-500/10 focus:ring-2 focus:ring-emerald-500/50 text-emerald-600 dark:text-emerald-400 outline-none transition-all"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Referral Count</label>
                             <input 
                               type="number" 
                               value={editData.referrals_count || 0} 
                               readOnly
                               className="w-full font-mono text-lg font-bold px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-500/5 focus:ring-0 text-indigo-600/70 dark:text-indigo-400/70 outline-none transition-all cursor-not-allowed"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Referral Earnings</label>
                             <input 
                               type="number" 
                               value={editData.total_referral_earnings || 0} 
                               onChange={e => setEditData({...editData, total_referral_earnings: e.target.value})}
                               className="w-full font-mono text-lg font-bold px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-500/10 focus:ring-2 focus:ring-amber-500/50 text-amber-600 dark:text-amber-400 outline-none transition-all"
                             />
                           </div>
                        </div>
                        <div className="pt-4">
                           <Button variant="primary" onClick={saveStatsData} className="w-auto px-8">Save Statistics Changes</Button>
                        </div>
                      </div>
                    )}

                    {/* Tasks Tab */}
                    {activeTab === 'tasks' && (
                      <div className="space-y-6">
                         <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                           <div className="flex items-center justify-between">
                             <h4 className="font-bold text-lg text-slate-900 dark:text-white">User Task Submissions</h4>
                             <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 pointer-events-none hover:bg-slate-100 border-none">{filteredUserTasks.length} Visible</Badge>
                           </div>
                           
                           {/* Task Filters */}
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                             <div className="relative">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                               <input 
                                 type="text" 
                                 value={taskSearch}
                                 onChange={(e) => setTaskSearch(e.target.value)}
                                 placeholder="Search tasks..." 
                                 className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                               />
                             </div>
                             <select 
                               value={taskDateFilter}
                               onChange={(e) => setTaskDateFilter(e.target.value as any)}
                               className="px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                             >
                               <option value="all">All Dates</option>
                               <option value="today">Today</option>
                               <option value="last-week">Last Week</option>
                               <option value="last-month">Last Month</option>
                               <option value="custom">Custom Range</option>
                             </select>
                             {taskDateFilter === 'custom' && (
                               <div className="flex gap-2 lg:col-span-1">
                                 <input 
                                   type="date" 
                                   value={customStartDate}
                                   onChange={(e) => setCustomStartDate(e.target.value)}
                                   className="flex-1 px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl"
                                 />
                                 <input 
                                   type="date" 
                                   value={customEndDate}
                                   onChange={(e) => setCustomEndDate(e.target.value)}
                                   className="flex-1 px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl"
                                 />
                               </div>
                             )}
                           </div>
                         </div>

                         {filteredUserTasks.length > 0 ? (
                           <div className="overflow-x-auto">
                             <table className="w-full text-left text-xs whitespace-nowrap">
                               <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider">
                                 <tr>
                                   <th className="px-4 py-3">Task Name</th>
                                   <th className="px-4 py-3">Date</th>
                                   <th className="px-4 py-3">Coins</th>
                                   <th className="px-4 py-3">Status</th>
                                   <th className="px-4 py-3 text-right">View</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                 {filteredUserTasks.map((task, idx) => (
                                   <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                                     <td className="px-4 py-3 font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[150px]">{task.tasks?.title || 'Unknown Task'}</td>
                                     <td className="px-4 py-3 text-slate-500">{new Date(task.created_at).toLocaleDateString()}</td>
                                     <td className="px-4 py-3 font-black text-indigo-500">+{formatCompactNumber(task.tasks?.coins || 0)}</td>
                                     <td className="px-4 py-3">
                                        <Badge className={
                                          task.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-none text-[9px]" :
                                          task.status === 'rejected' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-none text-[9px]" :
                                          "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-none text-[9px]"
                                        }>{task.status}</Badge>
                                     </td>
                                     <td className="px-4 py-3 text-right">
                                        <Button 
                                          variant="outline" 
                                          size="xs" 
                                          className="h-7 text-[10px] font-bold"
                                          onClick={() => setActiveTaskDetail(task)}
                                        >View</Button>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         ) : (
                           <p className="text-slate-500 text-center py-10">No tasks found matching filters.</p>
                         )}
                      </div>
                    )}

                    {/* Withdrawals Tab */}
                    {activeTab === 'withdrawals' && (
                      <div className="space-y-6">
                         <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                           <h4 className="font-bold text-lg text-slate-900 dark:text-white">User Withdrawals</h4>
                           <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 pointer-events-none hover:bg-slate-100 border-none">{userWithdrawals.length} Requests</Badge>
                         </div>
                         {userWithdrawals.length > 0 ? (
                            <div className="space-y-1">
                               <div className="grid grid-cols-[1.5fr_1fr_100px_80px_80px] gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">
                                 <span>Method & Info</span>
                                 <span className="text-center">Timeline</span>
                                 <span className="text-center">Amount</span>
                                 <span className="text-center">Status</span>
                                 <span className="text-right pr-4">Details</span>
                               </div>
                               <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[350px] overflow-y-auto">
                                 {userWithdrawals.map((w, idx) => (
                                   <div key={idx} className="grid grid-cols-[1.5fr_1fr_100px_80px_80px] gap-2 items-center px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                     <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase leading-none">{w.method}</span>
                                          <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                                            {parseAccountInfo(w.account_info)?.name || 'N/A'}
                                          </span>
                                        </div>
                                        <p className="text-[9px] font-mono text-slate-400 truncate opacity-70">
                                          {parseAccountInfo(w.account_info)?.number || 'N/A'}
                                        </p>
                                     </div>
                                     <div className="text-center">
                                       <p className="text-[10px] font-bold text-slate-500">{new Date(w.created_at).toLocaleDateString()}</p>
                                     </div>
                                     <div className="text-center">
                                       <p className="text-[11px] font-black text-emerald-500">{formatCompactNumber(w.amount || 0)}</p>
                                     </div>
                                     <div className="flex justify-center">
                                       <Badge className={cn("text-[8px] uppercase px-1.5 py-0 font-black border-none", w.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20" : w.status === 'rejected' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20")}>{w.status}</Badge>
                                     </div>
                                     <div className="flex justify-end pr-2">
                                        <button 
                                          onClick={() => {
                                            const info = parseAccountInfo(w.account_info);
                                            alert(`Full Transaction Details:\n\nName: ${info?.name || 'N/A'}\nNumber: ${info?.number || 'N/A'}\nMethod: ${w.method}\nDate: ${new Date(w.created_at).toLocaleString()}\nStatus: ${w.status}${w.rejection_reason ? '\nReason: ' + w.rejection_reason : ''}`);
                                          }}
                                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-90 text-[10px] font-black uppercase tracking-widest"
                                        >
                                          View
                                        </button>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                            </div>
                         ) : (
                           <p className="text-slate-500 text-center py-10">No withdrawal requests found.</p>
                         )}
                      </div>
                    )}

                    {/* Referrals Tab */}
                    {activeTab === 'referrals' && (
                      <div className="space-y-6">
                         <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                           <h4 className="font-bold text-lg text-slate-900 dark:text-white">Referred Users</h4>
                           <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 pointer-events-none hover:bg-slate-100 border-none">{userReferrals.length} Refers</Badge>
                         </div>
                         {userReferrals.length > 0 ? (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {userReferrals.map((ru, idx) => (
                               <div key={idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                   {ru.avatar_url ? (
                                      <img src={ru.avatar_url} alt={ru.full_name} className="w-full h-full object-cover" />
                                   ) : (
                                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{(ru.full_name || 'U')[0].toUpperCase()}</span>
                                   )}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{ru.full_name || 'Anonymous'}</p>
                                    <p className="text-xs text-slate-500 truncate">{ru.email || 'No email'}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Joined {new Date(ru.created_at).toLocaleDateString()}</p>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center py-16 text-center">
                             <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                             <p className="text-slate-500 font-medium">This user hasn't referred anyone yet.</p>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Detail Sub-modal */}
      <AnimatePresence>
        {activeTaskDetail && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-black text-slate-900 dark:text-white">Submission Details</h4>
                <button onClick={() => setActiveTaskDetail(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Task Title</p>
                  <p className="font-bold text-slate-900 dark:text-white">{activeTaskDetail.tasks?.title || 'Unknown Task'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submission Link</p>
                  {activeTaskDetail.link ? (
                    <a href={activeTaskDetail.link} target="_blank" rel="noreferrer" className="text-blue-500 font-bold hover:underline break-all block">
                      {activeTaskDetail.link}
                    </a>
                  ) : (
                    <p className="text-slate-500 italic">No link provided</p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Message / Note</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {activeTaskDetail.message || 'No message provided'}
                  </p>
                </div>

                        {activeTaskDetail.status === 'rejected' && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Rejection Reason</p>
                    <p className="text-sm text-rose-700 dark:text-rose-300 font-bold leading-relaxed">
                      {activeTaskDetail.reject_reason || activeTaskDetail.rejection_reason || 'No specific reason provided'}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Coins</p>
                    <p className="text-lg font-black text-indigo-500">{formatCompactNumber(activeTaskDetail.tasks?.coins || 0)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <Badge className="mt-1 capitalize">{activeTaskDetail.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button className="w-full h-12" onClick={() => setActiveTaskDetail(null)}>Close View</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

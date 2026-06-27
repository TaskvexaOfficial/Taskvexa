import React, { useState, useEffect } from 'react';
import { triggerPushNotification } from '@/lib/firebase';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Bell, Send, CheckCircle2, User, Users } from 'lucide-react';

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (user.full_name || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please enter a title and message.');
      return;
    }

    if (selectedUser !== 'all' && !selectedUser) {
      alert('Please select a specific user from the dropdown list.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedUser === 'all') {
        const batchSize = 100;
        for (let i = 0; i < users.length; i += batchSize) {
          const batchUsers = users.slice(i, i + batchSize);
          const notifications = batchUsers.map(user => ({
            user_id: user.id,
            title: title.trim(),
            message: message.trim(),
            type,
            is_read: false
          }));

          const { error } = await supabase.from('notifications').insert(notifications);
          if (error) throw error;

          // Dispatch immediate FCM Push Notifications for this batch
          for (const u of batchUsers) {
            triggerPushNotification(u.id, title.trim(), message.trim()).catch(err => {
              console.error(`[FCM-CLIENT] Failed to trigger push for user ${u.id}:`, err);
            });
          }
        }
      } else {
        const { error } = await supabase.from('notifications').insert([{
          user_id: selectedUser,
          title: title.trim(),
          message: message.trim(),
          type,
          is_read: false
        }]);
        if (error) throw error;

        // Dispatch immediate FCM Push Notification for single user
        triggerPushNotification(selectedUser, title.trim(), message.trim()).catch(err => {
          console.error(`[FCM-CLIENT] Failed to trigger push for user ${selectedUser}:`, err);
        });
      }

      alert('Notification sent successfully!');
      setTitle('');
      setMessage('');
      setSelectedUser('all');
      setType('info');

    } catch (error: any) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. ' + (error.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Send Notifications</h1>
        <p className="text-slate-500 dark:text-slate-400">Send custom notifications to a specific user or all users instantly.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSendNotification} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Audience</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedUser === 'all' ? 'border-primary-500 bg-primary-500/5' : 'border-slate-200 dark:border-slate-700 hover:border-primary-500/50'}`}>
                <div className={`p-2 rounded-lg ${selectedUser === 'all' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">All Users</h4>
                  <p className="text-xs text-slate-500">Send to everyone ({users.length} users)</p>
                </div>
                <input
                  type="radio"
                  name="audience"
                  value="all"
                  checked={selectedUser === 'all'}
                  onChange={() => {
                    setSelectedUser('all');
                    setSearchQuery('');
                  }}
                  className="hidden"
                />
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedUser !== 'all' ? 'border-primary-500 bg-primary-500/5' : 'border-slate-200 dark:border-slate-700 hover:border-primary-500/50'}`}>
                <div className={`p-2 rounded-lg ${selectedUser !== 'all' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Specific User</h4>
                  <p className="text-xs text-slate-500">Select a single user</p>
                </div>
                <input
                  type="radio"
                  name="audience"
                  value="specific"
                  checked={selectedUser !== 'all'}
                  onChange={() => {
                    setSelectedUser('');
                    setSearchQuery('');
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {selectedUser !== 'all' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select User</label>
                {searchQuery && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    Found {filteredUsers.length} of {users.length}
                  </span>
                )}
              </div>
              
              {/* User search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type name or email to search user..."
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-colors dark:text-white text-sm"
              />

              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-colors dark:text-white"
                required
              >
                <option value="" disabled>Select a user...</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notification Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Special Bonus Unlocked!"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-colors"
                  required
                />
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your notification message here..."
                  className="w-full h-32 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-colors resize-none"
                  required
                />
             </div>

             <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notification Type</label>
              <div className="flex gap-4">
                {['info', 'success', 'warning', 'error'].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      checked={type === t}
                      onChange={(e) => setType(e.target.value)}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    <span className="capitalize text-sm font-medium dark:text-slate-200">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-white font-bold bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20"
          >
            {isSubmitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                <Bell className="w-5 h-5" />
              </motion.div>
            ) : (
              <><Send className="w-5 h-5" /> Send Notification</>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

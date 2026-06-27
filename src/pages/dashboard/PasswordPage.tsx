import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Lock, ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStore } from '@/store';

export default function PasswordPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { cachedProfile } = useStore();
  
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (!cachedProfile?.email) {
      setError("Could not determine user email.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cachedProfile.email,
          currentPassword, 
          newPassword 
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch(e) {
        throw new Error('Server error: Could not parse response');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        navigate('/dashboard/settings');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-20 px-2 lg:px-4">
      <div className="flex items-center justify-between mb-8">
        <Link to="/dashboard/settings" className="p-3 border-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[16px] transition-all group">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Security</h2>
        <div className="w-11 h-11"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none"></div>

           <form onSubmit={handleUpdate} className="space-y-10 max-w-md mx-auto relative z-10">
               <div className="text-center space-y-4 mb-2">
                 <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-[24px] flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-500/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Change Password</h3>
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">Regularly changing your password improves account security.</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[20px]">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 text-center">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-[20px]">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> {success}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Current Password</label>
                  <input 
                    type="password" 
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-base text-slate-900 dark:text-white shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-base text-slate-900 dark:text-white shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-base text-slate-900 dark:text-white shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>

              <Button 
                variant="primary"
                type="submit" 
                className="w-full h-16 rounded-[20px] shadow-xl shadow-indigo-600/20 transition-all font-black border-none mt-4 text-base hover:-translate-y-1"
                isLoading={isSaving}
              >
                Save
              </Button>

           </form>
        </Card>
      </motion.div>
    </div>
  );
}

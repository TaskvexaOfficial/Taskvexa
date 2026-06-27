import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Camera, Mail, Phone, Globe, ArrowLeft, Save, Hash, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { avatar, setAvatar, cachedProfile, setCachedProfile } = useStore();
  const [isLoading, setIsLoading] = useState(!cachedProfile);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState(() => cachedProfile || {
    uid: '',
    full_name: '',
    email: '',
    phone_number: '',
    country: '',
  });

  const handleCopyUid = () => {
    if (profileData.uid) {
      navigator.clipboard.writeText(profileData.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      if (cachedProfile) {
        setProfileData({
          uid: cachedProfile.uid || '',
          full_name: cachedProfile.full_name || '',
          email: cachedProfile.email || '',
          phone_number: cachedProfile.phone_number || '',
          country: cachedProfile.country || '',
        });
        if (cachedProfile.avatar_url) {
          setAvatar(cachedProfile.avatar_url);
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const newData = {
            uid: profile.uid || '',
            full_name: profile.full_name || '',
            email: profile.email || user.email || '',
            phone_number: profile.phone_number || '',
            country: profile.country || '',
          };
          setProfileData(newData);
          setCachedProfile(profile);
          if (profile.avatar_url) {
            setAvatar(profile.avatar_url);
          }
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [setAvatar, setCachedProfile, cachedProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
       const { error } = await supabase.from('profiles').update({
         full_name: profileData.full_name,
         phone_number: profileData.phone_number,
         country: profileData.country,
       }).eq('id', user.id);
       
       if (error) {
         alert('Error updating profile: ' + error.message);
       } else {
         alert('Profile updated successfully!');
         setIsEditing(false);
       }
    }
    setIsSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
      
      // Upload to Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatar(publicUrl);
      
      // Update profile
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="w-full space-y-8 pb-20 px-2 lg:px-4">
      <div className="flex items-center justify-between mb-8">
        <Link to="/dashboard/settings" className="p-3 border-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[16px] transition-all group">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Profile</h2>
        <div className="w-11 h-11"></div>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSave} 
        className="space-y-8"
      >
        <Card className="border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] p-8 md:p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none"></div>

           <div className="flex flex-col items-center mb-10 relative z-10">
             <div className={`relative group/avatar ${isEditing ? 'cursor-pointer' : ''} mb-6`} onClick={() => fileInputRef.current?.click()}>
                <div className={`w-32 h-32 rounded-[32px] ${isEditing ? 'bg-indigo-600 ring-4 ring-white dark:ring-slate-800' : 'bg-slate-300 dark:bg-slate-700'} flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-600/30 overflow-hidden transition-transform ${isEditing ? 'group-hover/avatar:scale-105' : ''}`}>
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      profileData.full_name?.charAt(0)?.toUpperCase() || 'AD'
                    )}
                </div>
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-slate-800 rounded-[16px] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform border border-slate-100 dark:border-slate-700">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-[12px] flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                  disabled={!isEditing}
                />
             </div>
             
             <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2 mb-2 text-center">
               {profileData.full_name || 'Anonymous User'}
             </h2>
             
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 py-1.5 px-3 mb-2 rounded-full border border-slate-100 dark:border-slate-800">
               <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                 UID: {profileData.uid ? profileData.uid : 'Waiting...'}
               </span>
               {profileData.uid && (
                 <button
                   type="button"
                   onClick={handleCopyUid}
                   className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-indigo-500"
                   title="Copy UID"
                 >
                   {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                 </button>
               )}
             </div>
             
             {isEditing && <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mt-2">Update Profile Picture</p>}
          </div>

          <div className="space-y-6 relative z-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Full Legal Name</label>
                  <div className={`relative ${!isEditing ? 'opacity-70' : ''}`}>
                    <User className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isEditing ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      className={`w-full ${isEditing ? 'bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-600 dark:text-slate-300'} border-none rounded-[20px] py-4 pl-14 pr-5 outline-none transition-all font-bold text-base shadow-inner`}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <div className="relative opacity-70">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      disabled
                      value={profileData.email}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-[20px] py-4 pl-14 pr-5 cursor-not-allowed font-bold text-base text-slate-600 dark:text-slate-300"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 ml-2">Email cannot be changed.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                  <div className={`relative ${!isEditing ? 'opacity-70' : ''}`}>
                    <Phone className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isEditing ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <input 
                      type="tel" 
                      disabled={!isEditing}
                      value={profileData.phone_number}
                      onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
                      className={`w-full ${isEditing ? 'bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-600 dark:text-slate-300'} border-none rounded-[20px] py-4 pl-14 pr-5 outline-none transition-all font-bold text-base shadow-inner`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Region</label>
                  <div className={`relative ${!isEditing ? 'opacity-70' : ''}`}>
                    <Globe className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isEditing ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <select 
                      disabled={!isEditing}
                      value={profileData.country}
                      onChange={(e) => {
                        setProfileData({...profileData, country: e.target.value});
                      }}
                      className={`w-full ${isEditing ? 'bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-600 dark:text-slate-300'} border-none rounded-[20px] py-4 pl-14 pr-10 outline-none transition-all font-bold appearance-none text-base shadow-inner`}
                    >
                      <option value="" disabled>Select your country</option>
                      <option value="PK">Pakistan</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="IN">India</option>
                      <option value="BD">Bangladesh</option>
                      <option value="AF">Afghanistan</option>
                      <option value="AE">United Arab Emirates</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="IT">Italy</option>
                      <option value="ES">Spain</option>
                      <option value="ID">Indonesia</option>
                      <option value="MY">Malaysia</option>
                      <option value="TR">Turkey</option>
                      <option value="ZA">South Africa</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
             </div>

             <Button 
               variant="primary"
               type="submit" 
               className="w-full h-16 rounded-[20px] shadow-xl shadow-indigo-600/20 transition-all font-black border-none mt-8 hover:-translate-y-1 text-base flex items-center justify-center gap-3"
               isLoading={isSaving}
             >
               {isEditing ? (
                 <>
                   <Save className="w-5 h-5" />
                   Save Changes
                 </>
               ) : (
                 <>
                   Edit Profile
                 </>
               )}
             </Button>
          </div>
        </Card>
      </motion.form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Shield, 
  Fingerprint, 
  Network, 
  AlertTriangle, 
  CheckCircle2, 
  UserX, 
  Loader2, 
  Calendar, 
  User, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Sliders,
  Bell,
  Mail,
  ToggleLeft,
  Settings,
  Flame,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';

  // Prevent any toggle flickering on load by reading immediately from localStorage cache
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem('multiple_account_detection_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const [loading, setLoading] = useState(true);
  const [detections, setDetections] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedFingerprints, setExpandedFingerprints] = useState<Record<string, boolean>>({});

  // Notification states
  const [notifConfig, setNotifConfig] = useState({
    systemAlerts: true,
    registrationAlerts: true,
    highValueWithdrawals: true,
    taskReviewReminder: false,
    lowPointsThreshold: 1000
  });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [successNotifMsg, setSuccessNotifMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchDetections();
    fetchNotificationSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/detection-settings', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.details || data.error);
      } else {
        const isEnabled = !!data.enabled;
        setEnabled(isEnabled);
        localStorage.setItem('multiple_account_detection_enabled', String(isEnabled));
      }
    } catch (err: any) {
      console.error("Error fetching settings:", err);
    }
    setLoading(false);
  };

  const fetchDetections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/detections', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (data.detections) {
        setDetections(data.detections);
      } else if (data.error) {
        setErrorMsg(data.details || data.error);
      }
    } catch (err: any) {
      console.error("Error fetching detection stats:", err);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'notification_settings')
        .maybeSingle();
      if (data && data.value) {
        try {
          const parsed = JSON.parse(data.value);
          setNotifConfig(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error("Error parsing stored notification settings JSON string:", e);
        }
      }
    } catch (err) {
      console.warn("Could not query notification settings from DB, using fallback states:", err);
    }
  };

  const toggleSettings = async () => {
    const nextState = !enabled;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/detection-settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ enabled: nextState })
      });
      const data = await res.json();
      if (data.success) {
        setEnabled(nextState);
        localStorage.setItem('multiple_account_detection_enabled', String(nextState));
      } else {
        setErrorMsg(data.details || data.error || "Failed to update settings");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    }
    setLoading(false);
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifs(true);
    setSuccessNotifMsg(null);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'notification_settings',
          value: JSON.stringify(notifConfig),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      if (error) throw error;
      setSuccessNotifMsg("Notification parameters saved successfully!");
      setTimeout(() => setSuccessNotifMsg(null), 3000);
    } catch (err: any) {
      console.error("Failed to save notice:", err);
      // Fallback with localStorage
      localStorage.setItem('notification_settings_fallback', JSON.stringify(notifConfig));
      setSuccessNotifMsg("Saved locally (offline mode fallback)");
      setTimeout(() => setSuccessNotifMsg(null), 3500);
    } finally {
      setSavingNotifs(false);
    }
  };

  const toggleExpand = (fp: string) => {
    setExpandedFingerprints(prev => ({
      ...prev,
      [fp]: !prev[fp]
    }));
  };

  // Group user devices by their fingerprints
  const fpGroups = detections.reduce((acc, curr) => {
    const fp = curr.device_fingerprint || 'unknown-device';
    if (!acc[fp]) {
      acc[fp] = {
        fingerprint: fp,
        users: [],
        ips: new Set<string>(),
        status: 'Safe',
        created_at: curr.created_at,
        hasReferralInvolvement: false
      };
    }
    acc[fp].users.push(curr);
    if (curr.ip_address) {
      acc[fp].ips.add(curr.ip_address);
    }
    if (curr.referred_by || curr.referred_by_name) {
      acc[fp].hasReferralInvolvement = true;
    }
    if (acc[fp].users.length > 1) {
      acc[fp].status = 'Possible Multiple Account';
    }
    // Update oldest/newest date
    if (new Date(curr.created_at).getTime() > new Date(acc[fp].created_at).getTime()) {
      acc[fp].created_at = curr.created_at;
    }
    return acc;
  }, {} as Record<string, any>);

  const groupedList = Object.values(fpGroups).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h2>
          <p className="text-slate-500 font-medium">Global platform parameters, configurations & security tools</p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1 shrink-0 self-start md:self-auto border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setSearchParams({ tab: 'general' })}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'general' 
                ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'notifications' })}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'notifications' 
                ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Notification Settings
          </button>
        </div>
      </div>

      {activeTab === 'general' ? (
        <>
          <Card className="p-6 md:p-8 border-none shadow-sm dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                    <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-black text-2xl text-slate-900 dark:text-white">Multiple Account Detection</h3>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                  Automatically track device fingerprints and IPs for new registrations. If multiple accounts are created from the exact same device, they will be flagged for review to prevent referral abuse and fraud.
                </p>
              </div>
              
              <button 
                onClick={toggleSettings}
                disabled={loading}
                className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 ${
                  enabled ? 'bg-indigo-600 dark:bg-indigo-500 shadow-lg shadow-indigo-600/30' : 'bg-slate-200 dark:bg-slate-700'
                } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                id="toggle-account-detection"
              >
                <span className="sr-only">Toggle feature</span>
                <span
                  className={`pointer-events-none flex items-center justify-center h-9 w-9 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-[40px]' : 'translate-x-0'
                  }`}
                >
                  {loading ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : enabled ? <CheckCircle2 className="w-5 h-5 text-indigo-600" /> : <UserX className="w-5 h-5 text-slate-400" />}
                </span>
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-2xl mb-8 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                  <h4 className="font-bold text-rose-800 dark:text-rose-300">Deployment Notice</h4>
                </div>
                <p className="text-sm text-rose-700 dark:text-rose-200">
                  The query failed or returned an error: <span className="font-mono bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded text-xs">{errorMsg}</span>
                </p>
                <div className="text-sm text-rose-700 dark:text-rose-200 bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                  <p className="font-bold mb-1">How to fix this in Supabase if the table does not exist:</p>
                  <p className="mb-2">Run the query from the SQL schema file provided in <code className="font-mono bg-white/80 dark:bg-slate-900/40 px-1 rounded font-bold">/schema_multiple_accounts.sql</code> in your Supabase SQL Editor.</p>
                </div>
              </div>
            )}

            {enabled && groupedList.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">Detected Tracking Logs</h4>
                  <span className="text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-bold">
                    {groupedList.length} Unique Devices
                  </span>
                </div>
                
                {/* Responsive Container for Device Logs Table */}
                <div className="overflow-x-auto -mx-6 md:mx-0 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                        <th className="py-4 px-6 font-semibold">Device Fingerprint</th>
                        <th className="py-4 px-6 font-semibold text-center">Accounts Handled</th>
                        <th className="py-4 px-6 font-semibold text-center">IPs Connected</th>
                        <th className="py-4 px-6 font-semibold text-center">Referrals?</th>
                        <th className="py-4 px-6 font-semibold">Status / Review</th>
                        <th className="py-4 px-6 font-semibold text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {groupedList.map((group: any, idx: number) => {
                        const isExpanded = !!expandedFingerprints[group.fingerprint];
                        return (
                          <React.Fragment key={idx}>
                            <tr className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-5 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-100 dark:bg-slate-700/60 rounded-xl">
                                    <Fingerprint className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {group.fingerprint.substring(0, 16)}...
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                      Last active: {new Date(group.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 px-6 text-center">
                                <span className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-full text-xs ${
                                  group.users.length > 1 
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' 
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                  {group.users.length} {group.users.length > 1 ? 'Accounts' : 'Account'}
                                </span>
                              </td>
                              <td className="py-5 px-6 text-center">
                                <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg">
                                  <Network className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{group.ips.size} Unique</span>
                                </div>
                              </td>
                              <td className="py-5 px-6 text-center">
                                {group.hasReferralInvolvement ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                    ⚠️ Linked Referral
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="py-5 px-6">
                                {group.status === 'Safe' ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Safe
                                  </span>
                                ) : (
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 text-xs font-bold animate-pulse">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      Possible Multiple Account
                                    </span>
                                    {group.hasReferralInvolvement && (
                                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider mt-0.5">
                                        Referral Loop Warning!
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="py-5 px-6 text-right">
                                <button
                                  onClick={() => toggleExpand(group.fingerprint)}
                                  className="p-1 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                                  id={`btn-inspect-${idx}`}
                                >
                                  <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>

                            {/* Collapsible details row listing all child registrations */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="bg-slate-50/50 dark:bg-slate-900/30 p-6 border-y border-slate-100 dark:border-slate-800">
                                  <div className="space-y-3">
                                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <User className="w-3.5 h-3.5" /> Registered Profiles under Device Fingerprint
                                    </h5>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {group.users.map((u: any, idxChild: number) => (
                                        <div key={idxChild} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 p-4 rounded-xl flex flex-col justify-between shadow-sm">
                                          <div>
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                              <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{u.full_name}</p>
                                                <p className="text-xs text-slate-400 font-mono tracking-tight">{u.email}</p>
                                              </div>
                                              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 font-mono px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                                UID: {u.user_id.substring(0, 8)}
                                              </span>
                                            </div>

                                            <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                                              <p className="flex items-center gap-2 font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Reg Date: {new Date(u.created_at).toLocaleString()}</span>
                                              </p>
                                              <p className="flex items-center gap-2 font-medium">
                                                <Network className="w-3.5 h-3.5 text-slate-400" />
                                                <span>IP Address: <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">{u.ip_address}</code></span>
                                              </p>
                                            </div>
                                          </div>

                                          {/* Referral warnings */}
                                          {u.referred_by_name && (
                                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-2.5 rounded-lg mt-3 flex items-center justify-between gap-2">
                                              <div className="text-amber-800 dark:text-amber-400 text-[11px] font-bold">
                                                Referred by: <span className="underline">{u.referred_by_name}</span>
                                              </div>
                                              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {enabled && groupedList.length === 0 && !loading && (
              <div className="py-12 text-center text-slate-500 font-semibold flex flex-col items-center justify-center gap-3">
                <Fingerprint className="w-12 h-12 text-slate-300 dark:text-slate-600 animate-pulse" />
                <p className="text-slate-400 text-sm">No registered devices tracked yet under the Multiple Account Policy.</p>
              </div>
            )}
          </Card>

          <Card className="p-6 border-none shadow-sm dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px]">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-xl text-slate-900 dark:text-white-80">Review Guidelines</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              The multiple account system detects matching browser signatures, display variables, context timelines, and IP ranges. Use flagged notifications to audit suspicious referral cycles. Do not ban users automatically; manually review before taking account adjustments.
            </p>
          </Card>
        </>
      ) : (
        <Card className="p-6 md:p-8 border-none shadow-sm dark:shadow-none bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden">
          <form onSubmit={handleSaveNotifications} className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                  <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white">Admin Notifications Setup</h3>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                Configure when the administration team should receive alerts, emails, or platform logs regarding critical user interactions.
              </p>
            </div>

            {successNotifMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{successNotifMsg}</span>
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {/* System Security Alert Toggle */}
              <div className="py-5 flex items-center justify-between gap-6">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" /> System Violation Warnings
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Receive immediate dashboard warnings upon multiple-registration device threats.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={notifConfig.systemAlerts}
                    onChange={(e) => setNotifConfig({ ...notifConfig, systemAlerts: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Registration notifications toggle */}
              <div className="py-5 flex items-center justify-between gap-6">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" /> Registration Alerts
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Log a custom notification when new users register an account.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={notifConfig.registrationAlerts}
                    onChange={(e) => setNotifConfig({ ...notifConfig, registrationAlerts: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* High-Value Withdrawals */}
              <div className="py-5 flex items-center justify-between gap-6">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-slate-400" /> High-Value Withdrawal Flag
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Highlight withdrawal submissions that exceed standard account limits.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={notifConfig.highValueWithdrawals}
                    onChange={(e) => setNotifConfig({ ...notifConfig, highValueWithdrawals: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Task reviews uncompleted */}
              <div className="py-5 flex items-center justify-between gap-6">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" /> Task Verification reminder
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Send automatic team notifications of any submission pending review over 24 hours.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={notifConfig.taskReviewReminder}
                    onChange={(e) => setNotifConfig({ ...notifConfig, taskReviewReminder: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Threshold indicator */}
              <div className="py-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-slate-400" /> Low Points Alarm Threshold
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Set the minimum point limit before user accounts are alert-blocked or logged from claiming withdrawals.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      value={notifConfig.lowPointsThreshold}
                      onChange={(e) => setNotifConfig({ ...notifConfig, lowPointsThreshold: Number(e.target.value) })}
                      className="w-32 text-right bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Points</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
              <Button
                type="submit"
                disabled={savingNotifs}
                className="px-6 h-12 flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider cursor-pointer"
                id="btn-save-notification-params"
              >
                {savingNotifs ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Notification Parameters</span>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Globe, Phone, Ticket, X, ArrowLeft, CheckCircle2, Star, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { BannerAd } from '@/components/BannerAd';
import { setupFCM, triggerPushNotification } from '@/lib/firebase';

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', dial: '+92', format: '03XXXXXXXXX', length: 11 },
  { code: 'IN', name: 'India', dial: '+91', format: 'XXXXXXXXXX', length: 10 },
  { code: 'BD', name: 'Bangladesh', dial: '+880', format: 'XXXXXXXXXX', length: 10 },
  { code: 'US', name: 'USA', dial: '+1', format: 'XXXXXXXXXX', length: 10 },
  { code: 'GB', name: 'UK', dial: '+44', format: 'XXXXXXXXXX', length: 10 },
  { code: 'AE', name: 'UAE', dial: '+971', format: 'XXXXXXXXX', length: 9 },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', format: 'XXXXXXXXX', length: 9 },
];

const getDeviceFingerprint = async () => {
  const nav = window.navigator;
  const screen = window.screen;
  const fpStr = [
      nav.userAgent,
      nav.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!(window as any).Math.PI
  ].join('||');
  const msgBuffer = new TextEncoder().encode(fpStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function AuthPage({ initialIsLogin = true }: { initialIsLogin?: boolean }) {
  // Restore registration / OTP verification progress on mount to handle low-memory suspensions
  const savedState = (() => {
    try {
      const raw = localStorage.getItem('pending_signup_state');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse saved signup state:", e);
    }
    return null;
  })();

  const [isLogin, setIsLogin] = useState(() => {
    if (savedState && savedState.showOtp) {
      return false; // Force staying on the registration screen to show OTP
    }
    return initialIsLogin;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(() => savedState?.email || '');
  const [password, setPassword] = useState(() => savedState?.password || '');
  const [confirmPassword, setConfirmPassword] = useState(() => savedState?.confirmPassword || '');
  const [fullName, setFullName] = useState(() => savedState?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(() => savedState?.phoneNumber || '');
  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (savedState?.selectedCountryCode) {
      return COUNTRIES.find(c => c.code === savedState.selectedCountryCode) || COUNTRIES[0];
    }
    return COUNTRIES[0];
  });
  const [referralCode, setReferralCode] = useState(() => savedState?.referralCode || '');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(() => savedState?.showOtp || false);
  const [isForgotPassword, setIsForgotPassword] = useState(() => savedState?.isForgotPassword || false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(() => {
    if (savedState?.timerExpiresAt) {
      const secondsLeft = Math.ceil((savedState.timerExpiresAt - Date.now()) / 1000);
      return secondsLeft > 0 ? secondsLeft : 0;
    }
    return 0;
  });
  const [otpEmail, setOtpEmail] = useState(() => savedState?.otpEmail || '');

  // Keep state synchronized with localStorage
  useEffect(() => {
    const timerExpiresAt = resendTimer > 0 ? (Date.now() + resendTimer * 1000) : null;
    const state = {
      email,
      password,
      confirmPassword,
      fullName,
      phoneNumber,
      selectedCountryCode: selectedCountry?.code,
      referralCode,
      showOtp,
      otpEmail,
      isForgotPassword,
      timerExpiresAt
    };
    try {
      localStorage.setItem('pending_signup_state', JSON.stringify(state));
    } catch (e) {
      console.error("Error writing signup state to localStorage:", e);
    }
  }, [email, password, confirmPassword, fullName, phoneNumber, selectedCountry, referralCode, showOtp, otpEmail, isForgotPassword]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { cachedProfile, isAuthReady, setCachedProfile, setShowAnnouncementModal } = useStore();

  useEffect(() => {
    let interval: any;
    if (showOtp && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtp, resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    if (value.length > 1) value = value[value.length - 1]; // Only 1 digit
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otpCode];
    for (let i = 0; i < 6; i++) {
      if (i < pastedData.length) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtpCode(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    const targetInput = document.getElementById(`otp-${focusIndex}`);
    targetInput?.focus();
  };

  const handleSendOtp = async (isResend = false, isForgotFlow = false) => {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccessMsg(null);
    try {
      const endpoint = isForgotFlow ? '/api/auth/forgot-password' : '/api/auth/register-otp';
      const bodyParams = isForgotFlow 
        ? { email } 
        : { email, password, full_name: fullName, referral_code: referralCode };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyParams),
      });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned status ${res.status} for POST ${endpoint}: ${text.substring(0, 100)}`);
      }
      
      if (!res.ok) throw new Error(data?.error || `Failed to send OTP (Status: ${res.status})`);
      
      if (!isResend) {
        setOtpEmail(email);
        setShowOtp(true);
      }
      setResendTimer(isForgotFlow ? 120 : 60); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof Notification !== 'undefined' && Notification.permission === 'default' && !isForgotPassword) {
      console.log('[FCM-DEBUG] Notification permission request started from direct user action (Verify OTP click)...');
      Notification.requestPermission().then((res) => {
        console.log('[FCM-DEBUG] Notification permission result:', res);
      }).catch(err => {
        console.error('[FCM-DEBUG] Notification permission request failed from gesture callback:', err);
      });
    }
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const otp = otpCode.join('');
      if (otp.length !== 6) throw new Error('Please enter a 6-digit code');

      const endpoint = isForgotPassword ? '/api/auth/verify-forgot-password-otp' : '/api/auth/verify-otp';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp }),
      });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned status ${res.status} for POST ${endpoint}: ${text.substring(0, 100)}`);
      }
      
      if (!res.ok) throw new Error(data?.error || `Invalid OTP (Status: ${res.status})`);

      if (isForgotPassword) {
        setShowOtp(false);
        setShowResetPassword(true);
        setOtpCode(['', '', '', '', '', '']); // Reset OTP inputs
        setIsLoading(false);
        return; // Don't proceed to auto-login flow below
      }

      // Now create the user in Supabase Auth after successful OTP verification (Registration Flow)
      const { data: supaData, error: supaError } = await supabase.auth.signUp({
        email: otpEmail,
        password: data.data.password,
        options: {
          data: {
            full_name: data.data.full_name,
          }
        }
      });

      if (supaError) throw supaError;

      if (supaData.user) {
         // Create profile 
          const generatedUid = Math.floor(10000000 + Math.random() * 90000000).toString();
          const randomSuffix = Math.floor(10000 + Math.random() * 90000).toString();
          const myReferralCode = `TASKVEXA_${randomSuffix}`;
          
          let referrerId = null;
          if (data.data.referral_code) {
            const { data: refUser, error: refErr } = await supabase
              .from('profiles')
              .select('id')
              .eq('referral_code', data.data.referral_code)
              .maybeSingle();

            if (refErr) console.error("Referrer search err:", refErr);

            if (refUser) {
               referrerId = refUser.id;
               await supabase.from('notifications').insert([{
                 user_id: referrerId,
                 title: 'New Referral! 🌟',
                 message: `${data.data.full_name} has joined using your referral link.`,
                 type: 'success'
               }]);
               triggerPushNotification(
                 referrerId,
                 'New Referral! 🌟',
                 `${data.data.full_name} has joined using your referral link.`
               ).catch(err => console.error('[FCM] Referrer signup notification push failed:', err));
            }
          }

          // Create Profile Data
          const { error: upsertErr } = await supabase.from('profiles').upsert([{
              id: supaData.user.id,
              uid: generatedUid,
              email: otpEmail,
              full_name: data.data.full_name,
              phone_number: `${selectedCountry.dial}${phoneNumber}`,
              country: selectedCountry.name,
              referral_code: myReferralCode,
              referred_by: referrerId,
              total_referral_earnings: 0,
              wallet_balance: 0
          }]);

          if (upsertErr) {
            console.error("Profile creation error during OTP signup:", upsertErr);
            setError("Failed to create profile. Please contact support.");
            // Don't navigate if profile failed to create, though Supabase user exists now
            // Maybe we should allow it and let self-healing fix it?
          } else {
             // Record device logic (fire and forget)
             getDeviceFingerprint().then(fp => {
                fetch('/api/admin/record-device', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({
                      email: otpEmail,
                      user_id: supaData.user.id,
                      device_fingerprint: fp,
                      full_name: data.data.full_name
                   })
                }).catch(e => console.error("Could not record device", e));
             });
          }
      }

      // Show Announcement Modal for registration
      setShowAnnouncementModal(true);
      try {
        localStorage.removeItem('pending_signup_state');
      } catch (e) {
        console.error("Failed to remove pending_signup_state:", e);
      }
      // Request FCM setup on successful user registration
      console.log('[FCM-DEBUG] Triggering setupFCM with permission request on successful registration...');
      setupFCM(supaData.user.id, true).catch(err => {
        console.error('[FCM-DEBUG] Error setting up FCM on registration:', err);
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      let msg = err.message || String(err);
      if (msg === msg.toUpperCase() && msg.includes('_')) {
        msg = msg.split('_').join(' ').toLowerCase();
        msg = msg.charAt(0).toUpperCase() + msg.slice(1);
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fill referral from URL
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      setIsLogin(false);
      // Store in localStorage for self-healing logic (handled in App.tsx)
      localStorage.setItem('pending_referral', ref);
    }
    
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  useEffect(() => {
    // If we already have a profile, go to the right place.
    if (isAuthReady && cachedProfile) {
      const path = cachedProfile.role?.trim().toLowerCase() === 'admin' ? '/admin' : '/dashboard';
      navigate(path, { replace: true });
    }
  }, [isAuthReady, cachedProfile, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setFieldErrors({ password: "Password must be at least 6 characters long" });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, newPassword: password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data?.error || `Failed to reset password`);

      // Success
      setSuccessMsg("Password reset successfully! You can now log in.");
      setShowResetPassword(false);
      setIsForgotPassword(false);
      setIsLogin(true);
      setPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      let msg = err.message || String(err);
      if (msg === msg.toUpperCase() && msg.includes('_')) {
        msg = msg.split('_').join(' ').toLowerCase();
        msg = msg.charAt(0).toUpperCase() + msg.slice(1);
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showOtp) {
       return handleVerifyOtp(e);
    }
    if (showResetPassword) {
       return handleResetPassword(e);
    }
    if (isForgotPassword) {
       return handleSendOtp(false, true);
    }
    
    if (isLogin && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      console.log('[FCM-DEBUG] Notification permission request started from direct user action (Login submit click)...');
      Notification.requestPermission().then((res) => {
        console.log('[FCM-DEBUG] Notification permission result:', res);
      }).catch(err => {
        console.error('[FCM-DEBUG] Notification permission request failed from gesture callback:', err);
      });
    }
    
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    // Email domain validation - Only @gmail.com allowed
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setError("Only @gmail.com email addresses are allowed.");
      setIsLoading(false);
      return;
    }

    // Global safety timeout to reset loading state if everything hangs
    const safetyTimeout = setTimeout(() => {
      console.warn("[AuthPage] Submission took too long, resetting loading state.");
      setIsLoading(false);
    }, 15000);

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      clearTimeout(safetyTimeout);
      return;
    }

    if (!isLogin) {
      // Check if email falls under banned profiles
      try {
        const { data: bannedProfile } = await supabase
          .from('profiles')
          .select('id, is_banned')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (bannedProfile && bannedProfile.is_banned) {
          setError("This email has been permanently banned by the administrator.");
          setIsLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }
      } catch (checkErr) {
        console.error("Banned check error during signup:", checkErr);
      }

      // Validate phone length
      if (phoneNumber.length !== selectedCountry.length) {
        setError(`Phone number for ${selectedCountry.name} must be ${selectedCountry.length} digits.`);
        setIsLoading(false);
        clearTimeout(safetyTimeout);
        return;
      }

      // Validate referral code if provided
      if (referralCode) {
        const { data: referrer, error: refError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode.toUpperCase())
          .maybeSingle();

        if (refError || !referrer) {
          setError("Invalid referral code. Please check and try again.");
          setIsLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }
      }
    }

    try {
      if (isLogin) {
        // Query profile for ban status first by email
        try {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, is_banned, ban_reason')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

          if (userProfile && userProfile.is_banned) {
            setError(
              `Your account has been permanently banned by the administrator.${
                userProfile.ban_reason ? ` Reason: ${userProfile.ban_reason}` : ''
              }`
            );
            setIsLoading(false);
            clearTimeout(safetyTimeout);
            return;
          }
        } catch (checkPErr) {
          console.error("Banned check error during login pre-check:", checkPErr);
        }

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;
        if (!loginData.user) throw new Error("Login failed");

        // Double check loaded user id inside active auth session
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('id, is_banned, ban_reason')
          .eq('id', loginData.user.id)
          .maybeSingle();

        if (freshProfile && freshProfile.is_banned) {
          await supabase.auth.signOut();
          setError(
            `Your account has been permanently banned by the administrator.${
              freshProfile.ban_reason ? ` Reason: ${freshProfile.ban_reason}` : ''
            }`
          );
          setIsLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }

        // Show Announcement Modal for every login as requested
        setShowAnnouncementModal(true);

        setIsLoading(false);
        clearTimeout(safetyTimeout);
        // Request FCM setup on successful user login
        console.log('[FCM-DEBUG] Triggering setupFCM with permission request on successful login...');
        setupFCM(loginData.user.id, true).catch(err => {
          console.error('[FCM-DEBUG] Error setting up FCM on login:', err);
        });
        navigate('/dashboard', { replace: true });
      } else {
        clearTimeout(safetyTimeout);
        await handleSendOtp();
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError('The email or password you entered is incorrect.');
      } else if (msg.includes('User already registered')) {
        setError('An account with this email already exists.');
      } else {
        setError(msg || 'Authentication failed');
      }
      setIsLoading(false); 
      clearTimeout(safetyTimeout);
    } finally {
      // Logic handled in try/catch or timeouts
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Global Screen-Fixed Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[360px]"
          >
            <div className="bg-red-500 text-white py-3 px-5 rounded-xl shadow-[0_8px_30px_rgb(239,68,68,0.3)] flex items-center justify-between gap-4 border border-white/10 backdrop-blur-sm">
              <p className="text-[13px] font-bold leading-tight">
                {typeof error === 'string' ? error : (error as any)?.message || 'An error occurred'}
              </p>
              <button 
                onClick={() => setError(null)} 
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Background Accents - Ultra Soft */}
      <div className="absolute top-[-10%] left-[-10%] w-[80vh] h-[80vh] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80vh] h-[80vh] bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[480px] relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <Logo className="w-14 h-14 group-hover:scale-105 active:scale-95 transition-transform duration-300" />
            <span className="text-4xl font-black tracking-tight"><span className="text-slate-900 dark:text-white">Task</span><span className="text-blue-500">vexa</span></span>
          </Link>
        </div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-[40px] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-700/50 p-10 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent dark:from-slate-700/20 rounded-[40px] pointer-events-none"></div>
            
            {/* Back Button inside the card - Top Left Corner */}
            <button 
              id="auth-back-btn"
              type="button" 
              onClick={() => navigate('/')} 
              aria-label="Back to home"
              className="absolute top-6 left-6 z-30 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/85 w-10 h-10 rounded-full border border-slate-200/50 dark:border-slate-700/80 cursor-pointer shadow-sm hover:scale-105 active:scale-95 duration-150"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <div className="mb-8 text-center">
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">
                    {showResetPassword ? 'New Password.' : isForgotPassword ? 'Reset Password.' : isLogin ? 'Welcome back.' : 'Sign up.'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-base">
                    {showResetPassword ? 'Enter a strong new password.' : isForgotPassword ? 'Enter your email to receive an OTP.' : isLogin ? 'Log in to your account.' : 'Create an account to start earning.'}
                  </p>
                </div>

                {successMsg && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-[20px]">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> {successMsg}
                    </p>
                  </div>
                )}

                {/* Global error was here, removed as it's now a fixed banner */}

                {showOtp ? (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verify Your Email</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        We've sent a 6-digit code to<br/>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {otpEmail.substring(0, 3)}***@{otpEmail.split('@')[1]}
                        </span>
                      </p>
                    </div>

                    {/* OTP Warning Box */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_2px_10px_rgba(245,158,11,0.05)]">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-bold text-amber-800 dark:text-amber-300 leading-snug">
                          ⚠️ OTP not received? Check Spam/Junk folder.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center gap-2 sm:gap-4 my-8">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all shadow-inner"
                        />
                      ))}
                    </div>

                    <Button variant="primary" type="submit" size="lg" className="w-full h-16 text-lg rounded-[20px] shadow-2xl shadow-indigo-600/20 font-black border-none hover:-translate-y-1" isLoading={isLoading}>
                      {isForgotPassword ? 'Verify OTP' : 'Verify & Create Account'}
                    </Button>

                    <div className="text-center mt-6">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Didn't receive the code?{' '}
                        <button 
                          type="button" 
                          onClick={() => handleSendOtp(true, isForgotPassword)}
                          disabled={resendTimer > 0 || isLoading}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:text-slate-400 transition-colors"
                        >
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </button>
                      </p>
                    </div>
                    <button type="button" onClick={() => { setShowOtp(false); setIsForgotPassword(false); }} className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-4 flex items-center justify-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back to {isForgotPassword ? 'Login' : 'Registration'}
                    </button>
                  </form>
                ) : showResetPassword ? (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">New Password</label>
                       <input 
                         type="password" 
                         required 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white font-bold text-base shadow-inner" 
                         placeholder="••••••••"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Confirm New Password</label>
                       <input 
                         type="password" 
                         required 
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white font-bold text-base shadow-inner" 
                         placeholder="••••••••"
                       />
                    </div>
                    
                    <Button variant="primary" type="submit" size="lg" className="w-full h-16 mt-8 text-lg rounded-[20px] shadow-2xl shadow-indigo-600/20 transition-all font-black border-none hover:-translate-y-1" isLoading={isLoading}>
                      Save Password
                    </Button>
                    <button type="button" onClick={() => { setShowResetPassword(false); setIsForgotPassword(false); setIsLogin(true); }} className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-4 flex items-center justify-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Cancel
                    </button>
                  </form>
                ) : isForgotPassword ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white font-bold text-base shadow-inner" 
                        placeholder="you@email.com"
                      />
                    </div>
                    <Button variant="primary" type="submit" size="lg" className="w-full h-16 mt-8 text-lg rounded-[20px] shadow-2xl shadow-indigo-600/20 transition-all font-black border-none hover:-translate-y-1" isLoading={isLoading}>
                      Send OTP
                    </Button>
                    <button type="button" onClick={() => { setIsForgotPassword(false); setError(null); }} className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-4 flex items-center justify-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back to Login
                    </button>
                  </form>
                ) : (
                  <>
                  <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Full Name</label>
                        <input 
                          type="text" 
                          required 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white font-bold text-base shadow-inner" 
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Country</label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select 
                              value={selectedCountry.code}
                              onChange={(e) => setSelectedCountry(COUNTRIES.find(c => c.code === e.target.value) || COUNTRIES[0])}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all text-slate-900 dark:text-white font-bold text-sm shadow-inner appearance-none cursor-pointer"
                            >
                              {COUNTRIES.map(country => (
                                <option key={country.code} value={country.code}>{country.name} ({country.dial})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="tel" 
                              required 
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white font-bold text-base shadow-inner" 
                              placeholder={selectedCountry.format}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white font-bold text-base shadow-inner" 
                      placeholder="taskvexa.offical@gmail.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-2 mb-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Password</label>
                      {isLogin && <button type="button" onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMsg(null); }} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline decoration-indigo-300 underline-offset-4">Forgot?</button>}
                    </div>
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white font-bold text-base shadow-inner" 
                      placeholder="••••••••"
                    />
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Confirm Password</label>
                      <input 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 px-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white font-bold text-base shadow-inner" 
                        placeholder="••••••••"
                      />
                    </div>
                  )}

                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Referral Code (Optional)</label>
                      <div className="relative">
                        <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[20px] py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white font-bold text-base shadow-inner" 
                          placeholder="TASKVEXA12345"
                        />
                      </div>
                    </div>
                  )}

                  <Button variant="primary" type="submit" size="lg" className="w-full h-16 mt-8 text-lg rounded-[20px] shadow-2xl shadow-indigo-600/20 transition-all font-black border-none hover:-translate-y-1" isLoading={isLoading}>
                    {isLogin ? 'Log In' : 'Sign Up'}
                  </Button>
                </form>
                </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {!isForgotPassword && !showResetPassword && !showOtp && (
            <div className="mt-10 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button 
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors ml-2 tracking-tight"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
              
              <div className="mt-8 scale-90 md:scale-100 origin-top">
                <BannerAd />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="mt-auto py-8 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest relative z-10">
        &copy; 2026 TASKVEXA &bull; <Link to="/privacy-policy" className="hover:text-slate-600 dark:hover:text-slate-400">Privacy Policy</Link>
      </div>
    </div>
  );
}


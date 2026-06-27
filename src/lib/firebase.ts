import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { supabase } from './supabase';

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
};

const rawVapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;
// Safely clean up any wrapping double/single quotes or spaces that might get injected into the env variables
const vapidKey = typeof rawVapidKey === 'string' ? rawVapidKey.replace(/^["']|["']$/g, '').trim() : '';

let messagingInstance: any = null;

/**
 * Returns the Firebase Messaging instance if supported by the browser and environmental settings.
 */
export async function getFCMInstance() {
  if (messagingInstance) return messagingInstance;

  const supported = await isSupported();
  if (!supported) {
    console.warn('[FCM-DEBUG] Push notifications are not supported in this browser.');
    return null;
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[FCM-DEBUG] Firebase configuration keys are missing. FCM will not initialize.');
    return null;
  }

  try {
    const app = initializeApp(firebaseConfig);
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error('[FCM-DEBUG] Failed to initialize Firebase app or messaging:', error);
    return null;
  }
}

/**
 * Saves or updates an FCM token in the Supabase 'user_push_tokens' table for a specific user.
 * Attempts to write to 'user_push_tokens' first, falling back to 'push_tokens' if the target table is missing.
 */
export async function saveFCMTokenToSupabase(userId: string, token: string) {
  try {
    console.log(`[FCM-DEBUG] saveFCMTokenToSupabase: checking and saving token for user ${userId} in user_push_tokens table...`);
    
    let dbSuccess = false;
    let savedToTable = '';

    // Step 1: Attempt to save to 'user_push_tokens' table
    try {
      console.log('[FCM-DEBUG] Checking existing token registration in user_push_tokens...');
      const { data: existingUserToken, error: selectError } = await supabase
        .from('user_push_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (selectError) {
        if (selectError.code === '42P01' || selectError.message?.includes('relation "user_push_tokens" does not exist')) {
          console.warn('[FCM-DEBUG] user_push_tokens table does not exist in target database. Skipping direct write and falling back.');
          throw new Error('user_push_tokens_missing');
        } else {
          console.error('[FCM-DEBUG] Supabase SELECT query on user_push_tokens failed with error:', selectError);
          throw selectError;
        }
      }

      if (existingUserToken) {
        console.log('[FCM-DEBUG] Found existing user row in user_push_tokens. Updating token...');
        const { error: updateError } = await supabase
          .from('user_push_tokens')
          .update({
            fcm_token: token,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('[FCM-DEBUG] Supabase UPDATE query on user_push_tokens failed with error:', updateError);
          throw updateError;
        }
        console.log('[FCM-DEBUG] Successfully updated token inside user_push_tokens table.');
      } else {
        console.log('[FCM-DEBUG] No existing user row discovered in user_push_tokens. Inserting new row...');
        const { error: insertError } = await supabase
          .from('user_push_tokens')
          .insert({
            user_id: userId,
            fcm_token: token,
            device_type: 'web',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('[FCM-DEBUG] Supabase INSERT query on user_push_tokens failed with error:', insertError);
          throw insertError;
        }
        console.log('[FCM-DEBUG] Successfully inserted new token row inside user_push_tokens table.');
      }

      dbSuccess = true;
      savedToTable = 'user_push_tokens';

    } catch (tblErr: any) {
      if (tblErr.message === 'user_push_tokens_missing') {
        // Fallback: Attempt to save to 'push_tokens' table
        try {
          console.log('[FCM-DEBUG] Initiating fallback save sequence to push_tokens table...');
          const { data: existingPushToken, error: fallbackSelectError } = await supabase
            .from('push_tokens')
            .select('*')
            .eq('token', token)
            .maybeSingle();

          if (fallbackSelectError) {
            console.error('[FCM-DEBUG] Supabase SELECT query on push_tokens fallback failed with error:', fallbackSelectError);
            throw fallbackSelectError;
          }

          if (existingPushToken) {
            if (existingPushToken.user_id === userId) {
              console.log('[FCM-DEBUG] Token already registered and linked to this user in push_tokens fallback table.');
            } else {
              console.log('[FCM-DEBUG] Token exists inside push_tokens fallback owned by another user. Re-linking...');
              const { error: fallbackUpdateError } = await supabase
                .from('push_tokens')
                .update({
                  user_id: userId,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingPushToken.id);

              if (fallbackUpdateError) {
                console.error('[FCM-DEBUG] Supabase UPDATE fallback query failed with error:', fallbackUpdateError);
                throw fallbackUpdateError;
              }
              console.log('[FCM-DEBUG] Fallback token ownership re-linked successfully.');
            }
          } else {
            // Check if there is an existing record for the same user in push_tokens
            const { data: userToken, error: userTokenError } = await supabase
              .from('push_tokens')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();

            if (userTokenError) {
              console.error('[FCM-DEBUG] Error scanning user token during fallback:', userTokenError);
              throw userTokenError;
            }

            if (userToken) {
              const { error: fallbackUserUpdateError } = await supabase
                .from('push_tokens')
                .update({
                  token: token,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

              if (fallbackUserUpdateError) {
                console.error('[FCM-DEBUG] Fallback update user token failed:', fallbackUserUpdateError);
                throw fallbackUserUpdateError;
              }
            } else {
              console.log('[FCM-DEBUG] Inserting brand new token in push_tokens fallback table...');
              const { error: fallbackInsertError } = await supabase
                .from('push_tokens')
                .insert({
                  user_id: userId,
                  token: token,
                  device_type: 'web',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (fallbackInsertError) {
                console.error('[FCM-DEBUG] Supabase INSERT fallback query failed with error:', fallbackInsertError);
                throw fallbackInsertError;
              }
            }
            console.log('[FCM-DEBUG] Fallback token registered successfully in push_tokens.');
          }

          dbSuccess = true;
          savedToTable = 'push_tokens';

        } catch (fallbackErr: any) {
          console.error('[FCM-DEBUG] CRITICAL: Both user_push_tokens and push_tokens fallback table writes failed!', fallbackErr);
        }
      } else {
        console.error('[FCM-DEBUG] Table write failed during operations inside user_push_tokens schema:', tblErr);
      }
    }

    // Step 2: Automatically trigger our backend sync endpoint to guarantee persistence via Service Role if possible
    try {
      console.log('[FCM-DEBUG] Fetching backend server payload sync over /api/save-token endpoint...');
      const apiResponse = await fetch('/api/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          fcm_token: token
        })
      });

      if (!apiResponse.ok) {
        const textError = await apiResponse.text();
        console.error(`[FCM-DEBUG] Backend API response was NOT OK (Status ${apiResponse.status}):`, textError);
      } else {
        const apiData = await apiResponse.json();
        console.log('[FCM-DEBUG] Backend API sync successfully returned:', apiData);
        if (apiData.success) {
          dbSuccess = true;
          if (!savedToTable) savedToTable = apiData.table || 'user_push_tokens';
        }
      }
    } catch (apiErr: any) {
      console.error('[FCM-DEBUG] Backend payload sync request to /api/save-token threw an exception:', apiErr);
    }

    if (!dbSuccess) {
      throw new Error('All push token persistence channels (client-side tables & server-side API) failed to record this token.');
    }

    console.log(`[FCM-DEBUG] Token save completed successfully. Persistent table target: ${savedToTable || 'user_push_tokens'}`);
    return true;

  } catch (error: any) {
    console.error('[FCM-DEBUG] saveFCMTokenToSupabase failed COMPLETELY. Token was NOT saved. Exact error details:', error);
    return false;
  }
}

/**
 * Registers the service worker and passes the Firebase configuration variables in the query parameters.
 */
export async function registerFCMServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[FCM-DEBUG] Service workers are not supported by this browser.');
    return null;
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[FCM-DEBUG] Cannot register service worker: missing configuration parameters.');
    return null;
  }

  try {
    const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(firebaseConfig.apiKey)}` +
      `&authDomain=${encodeURIComponent(firebaseConfig.authDomain || '')}` +
      `&projectId=${encodeURIComponent(firebaseConfig.projectId)}` +
      `&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || '')}` +
      `&appId=${encodeURIComponent(firebaseConfig.appId || '')}`;

    console.log('[FCM-DEBUG] Registering /firebase-messaging-sw.js with dynamic configuration query params...');
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/'
    });
    
    console.log('[FCM-DEBUG] Service worker registration completed successfully! Scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[FCM-DEBUG] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Main routine to trigger permission requests, SW registrations, token generation, 
 * saving the token to Supabase, and listening to foreground messaging.
 */
export async function setupFCM(userId: string, forceRequest: boolean = false) {
  if (typeof window === 'undefined') return null;

  try {
    console.log('[FCM-DEBUG] =================== FCM INITIALIZATION START ===================');
    console.log('[FCM-DEBUG] Target User ID:', userId, 'Force Request Permission:', forceRequest);
    
    const initialPermission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
    console.log('[FCM-DEBUG] Current browser permission status of notifications:', initialPermission);

    if (initialPermission === 'unsupported' || !('Notification' in window)) {
      console.warn('[FCM-DEBUG] Notification API is unsupported in this browser configuration.');
      window.dispatchEvent(new CustomEvent('push_permission_denied', { detail: { permission: 'unsupported' } }));
      return null;
    }

    const messaging = await getFCMInstance();
    if (!messaging) {
      console.warn('[FCM-DEBUG] Messaging could not be initialized (missing keys or browser support).');
      return null;
    }

    let permission = initialPermission;
    if (initialPermission !== 'granted') {
      if (initialPermission === 'denied') {
        console.log('[FCM-DEBUG] Notification permission is already DENIED. Skipping asking again to honor browser settings.');
        return null;
      }

      if (!forceRequest) {
        console.log('[FCM-DEBUG] Notification permission is not granted and forceRequest is false (background/lifecycle load). Skipping permission request to avoid automatic prompts.');
        return null;
      }

      console.log('[FCM-DEBUG] Notification permission request started from direct user action...');
      console.log('[FCM-DEBUG] [Notification.requestPermission] is being called now...');
      permission = await Notification.requestPermission();
      console.log('[FCM-DEBUG] Requested permission callback outcome:', permission);
    } else {
      console.log('[FCM-DEBUG] Notification permission is already GRANTED. Proceeding without requestPermission call.');
    }

    // Explicit log for notification permission status
    console.log('[FCM-DEBUG] Notification permission status:', permission);

    if (permission !== 'granted') {
      console.warn('[FCM-DEBUG] Notification permission denied/blocked by user:', permission);
      // Dispatch permission denied event so the UI can report how to enable it gracefully
      window.dispatchEvent(new CustomEvent('push_permission_denied', { detail: { permission } }));
      return null;
    }

    console.log('[FCM-DEBUG] Notification permission is GRANTED. Proceeding to register service worker...');
    const registration = await registerFCMServiceWorker();
    if (!registration) {
      console.error('[FCM-DEBUG] Service worker registration status: FAILED to acquire stable service worker registration.');
      return null;
    }
    console.log('[FCM-DEBUG] Service worker registration status: SUCCESS');

    // Wait until the service worker is activated and ready before getting token
    console.log('[FCM-DEBUG] Waiting for active service worker state...');
    await navigator.serviceWorker.ready;

    console.log('[FCM-DEBUG] FCM token generation status: STARTING');
    let token = '';
    try {
      // Diagnostic printing of key length and first 20 characters as requested
      const keyLength = vapidKey ? vapidKey.length : 0;
      const keySnippet = vapidKey ? vapidKey.substring(0, 20) : '';
      const rawKeyLength = rawVapidKey ? String(rawVapidKey).length : 0;
      const rawKeySnippet = rawVapidKey ? String(rawVapidKey).substring(0, 20) : '';

      console.log('[FCM-DEBUG] VAPID Key Diagnostics:', {
        rawLength: rawKeyLength,
        rawSnippet: rawKeySnippet,
        cleanLength: keyLength,
        cleanSnippet: keySnippet,
        hasQuotes: rawVapidKey && (String(rawVapidKey).startsWith('"') || String(rawVapidKey).endsWith('"') || String(rawVapidKey).startsWith("'") || String(rawVapidKey).endsWith("'"))
      });

      console.log('[FCM-DEBUG] Calling getToken() with configuration:', {
        vapidKeyExists: !!vapidKey,
        hasServiceWorkerRegistration: !!registration
      });

      token = await getToken(messaging, {
        vapidKey: vapidKey || undefined,
        serviceWorkerRegistration: registration
      });
      console.log('[FCM-DEBUG] getToken() returned token length:', token ? token.length : 0);
    } catch (getTokenError: any) {
      console.error('[FCM-DEBUG] Error occurred during getToken() call:', getTokenError);
      throw getTokenError;
    }

    if (token) {
      console.log('[FCM-DEBUG] ========================================================');
      console.log('[FCM-DEBUG] FCM token generation status: SUCCESS');
      console.log(`[FCM-DEBUG] GENERATED FCM TOKEN: ${token}`);
      console.log('[FCM-DEBUG] ========================================================');

      // Save token to Supabase user_push_tokens, checking and fallback.
      const saved = await saveFCMTokenToSupabase(userId, token);
      console.log('[FCM-DEBUG] Token save status:', saved ? 'SUCCESS' : 'FAILED');
      
      if (saved) {
        // Dispatch success event to trigger the beautiful React custom Toast notifications
        window.dispatchEvent(new CustomEvent('push_permission_granted', { detail: { token } }));
      } else {
        console.error('[FCM-DEBUG] Failed to save generated token structure inside DB.');
      }

      // Safe check or update of local caches / refresh tracking
      localStorage.setItem('fcm_last_token', token);
      localStorage.setItem('fcm_token_registered_user', userId);

      // Start capture of foreground push messages
      onMessage(messaging, (payload) => {
        console.log('[FCM-DEBUG] Notification receive status: RECEIVED foreground message:', payload);
        
        try {
          const title = payload.notification?.title || payload.data?.title || 'Notification';
          const body = payload.notification?.body || payload.data?.body || '';

          // Fire a custom window event for the app UI if it wants to listen and react
          const customEvent = new CustomEvent('fcm_message_received', { detail: payload });
          window.dispatchEvent(customEvent);

          if (Notification.permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/favicon.svg'
            });
          }
        } catch (err) {
          console.error('[FCM-DEBUG] Error showing custom foreground pop-up:', err);
        }
      });

      return token;
    } else {
      console.warn('[FCM-DEBUG] FCM token generation status: EMPTY/FAILED token received from Firebase getToken().');
      return null;
    }
  } catch (error) {
    console.error('[FCM-DEBUG] Critical error in setupFCM full execution cycle:', error);
    // Graceful event capture (avoid crashing app)
    window.dispatchEvent(new CustomEvent('push_permission_denied', { detail: { error: String(error) } }));
    return null;
  }
}

/**
 * Triggers a push notification immediately by invoking the backend's send-push endpoint.
 */
export async function triggerPushNotification(userId: string, title: string, message: string) {
  try {
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, message })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[FCM-DEBUG] Failed to trigger push notification endpoint:', error);
    return { success: false, error };
  }
}


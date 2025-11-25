# Google OAuth Setup Guide for Grouphomes4newbies

## ✅ Fixes Applied

I've implemented the following fixes to resolve the Google OAuth redirect issue:

1. **Enhanced AuthCallback Component** (`src/pages/AuthCallback.tsx`):
   - Added comprehensive debug logging to trace authentication flow
   - Implemented proper token extraction from URL hash fragments
   - Added session verification after token exchange
   - Using `window.location.href` for full page reload to ensure auth state updates
   - Added delays to ensure session establishment before redirect

2. **Updated Supabase Client Configuration** (`src/integrations/supabase/client.ts`):
   - Added `detectSessionInUrl: true` to automatically handle OAuth tokens
   - Added `flowType: 'pkce'` for enhanced OAuth security
   - Ensures proper session persistence in localStorage

## 🔧 Required Supabase Dashboard Configuration

### Step 1: Configure Authentication URLs

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj
2. Navigate to **Authentication** → **URL Configuration**
3. Set the following URLs:

```
Site URL: http://localhost:8081
Redirect URLs (add ALL of these):
- http://localhost:8081/auth/callback
- http://localhost:8081/dashboard
- http://localhost:8080/auth/callback
- http://localhost:8080/dashboard
- http://localhost:3000/auth/callback
- http://localhost:3000/dashboard
- http://localhost:5173/auth/callback
- http://localhost:5173/dashboard
```

### Step 2: Enable Google Provider

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. You should already have these configured:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)
4. Ensure "Skip nonce check" is **OFF** (unchecked)

### Step 3: Verify Google Cloud Console Settings

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, ensure you have:
```
https://hpyodaugrkctagkrfofj.supabase.co/auth/v1/callback
```

## 🧪 Testing Instructions

### 1. Clear Browser Data
```bash
# Clear localStorage and cookies for localhost:8081
# In Chrome DevTools Console:
localStorage.clear()
sessionStorage.clear()
```

### 2. Test the OAuth Flow

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Navigate to: http://localhost:8081/auth
4. Click "Continue with Google"
5. Watch the console logs for:
   - "AuthCallback: Starting authentication process..."
   - "Hash params:" (should show hasAccessToken: true)
   - "Setting session with tokens from hash..."
   - "Session verified, redirecting to dashboard..."

### 3. Expected Behavior

After clicking "Continue with Google" and authorizing:
1. You'll be redirected to `/auth/callback` with tokens in the URL hash
2. The AuthCallback component will extract and set the session
3. You'll be automatically redirected to `/dashboard`
4. The dashboard should load with your Google account info

## 🐛 Troubleshooting

### If still redirecting to login:

1. **Check Console Logs**: Look for any error messages in browser console
2. **Verify URL Hash**: After Google auth, check if the URL contains `#access_token=...`
3. **Session Storage**: In DevTools Console, run:
```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)
```

### Common Issues:

- **"No authentication session found"**: Tokens not being passed correctly
- **Infinite redirect loop**: Clear browser cache and cookies
- **403 Forbidden**: Check Supabase Row Level Security policies

## 📝 What Changed

### Before:
- OAuth callback wasn't properly extracting tokens from URL hash
- Session wasn't being verified before redirect
- React Router navigation wasn't triggering full auth state update

### After:
- Proper token extraction from both hash and query parameters
- Session verification with retry logic
- Full page reload ensures auth context updates
- Debug logging for complete visibility into auth flow

## 🚀 Production Deployment

For production, update the URLs in both Supabase and Google Cloud Console to:
```
Site URL: https://yourdomain.com
Redirect URLs:
- https://yourdomain.com/auth/callback
- https://yourdomain.com/dashboard
```

## 📞 Need Help?

If you're still experiencing issues after following this guide:

1. Share the console logs from the authentication attempt
2. Check the Network tab in DevTools for any failed requests
3. Verify all URLs match exactly (no trailing slashes)
4. Ensure cookies are enabled for localhost

The authentication system is now properly configured to handle Google OAuth login and should seamlessly redirect users to the dashboard after successful authentication.
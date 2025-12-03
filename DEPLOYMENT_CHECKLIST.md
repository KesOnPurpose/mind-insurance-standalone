# Deployment Checklist - Authentication & Invite Link Fix

**Date**: December 2, 2025
**Status**: ✅ Code changes deployed, ⚠️ Manual configuration required

---

## Completed Automatically ✅

### 1. Edge Function Updated
- **File**: `supabase/functions/send-user-invite/index.ts:295`
- **Change**: Updated fallback URL from `https://mindhouse-prodigy.vercel.app` to `https://grouphome4newbies.com`
- **Status**: ✅ Deployed to Supabase

### 2. Environment Variables Set
- **APP_URL**: `https://grouphome4newbies.com`
- **Location**: Supabase Edge Functions secrets
- **Status**: ✅ Configured

### 3. Frontend Environment Updated
- **File**: `.env.local`
- **Added**: `VITE_APP_URL=https://grouphome4newbies.com`
- **Status**: ✅ Configured

---

## Required Manual Steps ⚠️

### Step 1: Configure SMTP in Supabase

**CRITICAL**: Without SMTP configuration, invite emails and magic links will NOT work.

#### Option A: Configure in Supabase Dashboard (RECOMMENDED)
**Location**: Supabase Dashboard → Project Settings → Authentication → SMTP Settings

**Fill in**:
1. **Enable Custom SMTP**: Toggle ON
2. **Host**: Your SMTP host (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`, `smtp.mailgun.org`)
3. **Port Number**:
   - `587` for TLS (recommended)
   - `465` for SSL
4. **Username**: Your SMTP username (usually your email)
5. **Password**: Your SMTP password or app-specific password
6. **Sender Email**: `noreply@grouphome4newbies.com` (or your verified sender)
7. **Sender Name**: `Grouphomes4newbies`

**Test**: Click "Save" then "Send Test Email" to verify configuration

#### Option B: Set SMTP Secrets via CLI (ALTERNATIVE)
**Commands**:
```bash
npx supabase secrets set SMTP_HOST=smtp.yourprovider.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USER=your-email@domain.com
npx supabase secrets set SMTP_PASS=your-app-password
npx supabase secrets set SMTP_SENDER_EMAIL=noreply@grouphome4newbies.com
npx supabase secrets set SMTP_SENDER_NAME="Grouphomes4newbies"
```

**Then redeploy**:
```bash
npx supabase functions deploy send-user-invite
```

#### Common SMTP Providers:

**Gmail**:
- Host: `smtp.gmail.com`
- Port: `587`
- Username: `your-email@gmail.com`
- Password: Use [App Password](https://support.google.com/accounts/answer/185833) (not your regular password)
- Requires: 2FA enabled, app password generated

**SendGrid**:
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey` (literal string)
- Password: Your SendGrid API key

**Mailgun**:
- Host: `smtp.mailgun.org`
- Port: `587`
- Username: Your Mailgun SMTP username
- Password: Your Mailgun SMTP password

**Resend**:
- Host: `smtp.resend.com`
- Port: `587`
- Username: `resend`
- Password: Your Resend API key

---

### Step 2: Update Supabase Auth URL Configuration

**Location**: Supabase Dashboard → Authentication → URL Configuration

#### 2.1 Set Site URL
**Field**: Site URL
**Value**: `https://grouphome4newbies.com`

**Why**: This is the main domain for auth redirects

#### 2.2 Add Redirect URLs (Whitelist)
**Field**: Redirect URLs
**Add these** (one per line):
```
https://grouphome4newbies.com/**
https://mindhouse-prodigy.pages.dev/**
http://localhost:5173/**
```

**Why**: These domains are allowed for OAuth callbacks and magic link redirects

---

### Step 3: Update Email Templates

**Location**: Supabase Dashboard → Authentication → Email Templates

#### For Each Template (Confirm signup, Magic Link, Invite user, Change Email, Reset Password):

1. **Click the template**
2. **Update redirect URL**:
   - Find `{{ .ConfirmationURL }}` or `{{ .TokenURL }}`
   - Verify it's set to redirect to: `https://grouphome4newbies.com/auth/callback`
3. **Update email content** (if needed):
   - Replace any hardcoded `mindhouse-prodigy.vercel.app` references
   - Use `grouphome4newbies.com` instead
4. **Save template**
5. **Send test email** to verify

#### Key Templates:
1. **Confirm Signup** - New user email verification
   - Redirect: `https://grouphome4newbies.com/auth/callback`

2. **Magic Link** - OTP-based login
   - Redirect: `https://grouphome4newbies.com/chat`

3. **Invite User** - Admin-generated invites
   - Redirect: `https://grouphome4newbies.com/auth/callback`

4. **Reset Password** - Password recovery
   - Redirect: `https://grouphome4newbies.com/reset-password`

---

### Step 4: Update Cloudflare Pages Environment Variables (If Using)

**Location**: Cloudflare Dashboard → Pages → mindhouse-prodigy → Settings → Environment Variables

#### For Production Environment:
Add/Update:
- `VITE_SUPABASE_URL` = `https://hpyodaugrkctagkrfofj.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (copy from `.env.local`)
- `VITE_APP_URL` = `https://grouphome4newbies.com`

#### For Preview/Staging Environment:
Add/Update:
- `VITE_SUPABASE_URL` = `https://hpyodaugrkctagkrfofj.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (copy from `.env.local`)
- `VITE_APP_URL` = `https://staging.grouphome4newbies.com` (or Pages URL)

**After updating**: Redeploy the site

---

## Testing Checklist

### Test 1: New User Invite Flow ✓
1. ☐ Go to Admin Console → User Management
2. ☐ Click "Add User" button
3. ☐ Fill in email, name, tier
4. ☐ Check "Send Invite Email" toggle
5. ☐ Click "Add & Invite"
6. ☐ Verify success toast appears
7. ☐ Check email inbox
8. ☐ Verify email received with **grouphome4newbies.com** link
9. ☐ Click invite link
10. ☐ Verify redirects to `https://grouphome4newbies.com/auth/callback`
11. ☐ Complete signup
12. ☐ Verify redirected to assessment or chat

### Test 2: Magic Link (OTP) Flow ✓
1. ☐ Sign out (if logged in)
2. ☐ Go to login page
3. ☐ Enter email
4. ☐ Click "Send Magic Link" or "Continue with Email"
5. ☐ Check email inbox
6. ☐ Verify magic link received
7. ☐ Click magic link
8. ☐ Verify authenticated successfully
9. ☐ Verify redirected to `/chat`

### Test 3: Google OAuth Flow ✓
1. ☐ Click "Sign in with Google"
2. ☐ Google auth screen appears
3. ☐ Approve access
4. ☐ Verify callback to `https://grouphome4newbies.com/auth/callback`
5. ☐ Account created in `auth.users`
6. ☐ If email approved, linked to `gh_approved_users`
7. ☐ Redirected to assessment (new) or chat (returning)

### Test 4: Bulk User Import ✓
1. ☐ Admin Console → User Management
2. ☐ Click "Bulk Import" tab
3. ☐ Upload CSV or paste emails
4. ☐ Check "Send Invite Emails" toggle
5. ☐ Click "Import Users"
6. ☐ Verify all users imported
7. ☐ Check inboxes for invite emails
8. ☐ Verify links use **grouphome4newbies.com** domain

---

## Monitoring & Logs

### 1. Edge Function Logs
**Location**: Supabase Dashboard → Edge Functions → send-user-invite → Logs

**Check for**:
- ✅ `Using app URL: https://grouphome4newbies.com` (confirms correct domain)
- ✅ `Successfully sent invite to: user@example.com`
- ❌ SMTP connection errors
- ❌ Authentication failures

### 2. Auth Logs
**Location**: Supabase Dashboard → Authentication → Logs

**Monitor**:
- Signup success rate
- Login success rate
- OAuth callback successes/failures
- Magic link generation/redemption

### 3. Browser Console Logs
**When testing invite flow**, check console for:
- `AuthCallback: Handling authenticated user`
- `AuthCallback: Assessment not completed - redirecting to /assessment`
- `AuthCallback: Assessment completed - redirecting to /chat`
- No session errors

---

## Rollback Plan

### If Issues Occur:

**Quick Check**:
```bash
# Verify environment variable is set
npx supabase secrets list | grep APP_URL

# Check edge function logs
# Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/functions/send-user-invite/logs
```

**Revert Code** (if needed):
```bash
git checkout HEAD~1 supabase/functions/send-user-invite/index.ts
npx supabase functions deploy send-user-invite
```

**Test SMTP**:
- Supabase Dashboard → Auth → SMTP Settings → "Send Test Email"

---

## Success Metrics (After Deployment)

### Expected Outcomes:
- ✅ Invite emails contain correct domain (`grouphome4newbies.com`)
- ✅ New users can click invite link and complete signup
- ✅ Magic links work for existing users
- ✅ Google OAuth redirects correctly
- ✅ All auth flows redirect to proper callback URL
- ✅ SMTP sends emails reliably (100% delivery rate)

### Key Metrics to Monitor:
- **Invite email delivery rate**: Should be 100%
- **Signup completion rate**: Should increase significantly
- **Auth callback success rate**: Should be 100%
- **SMTP errors**: Should be 0

---

## Next Steps

1. ✅ Complete manual SMTP configuration (Step 1)
2. ✅ Update Supabase Auth URL settings (Step 2)
3. ✅ Update email templates (Step 3)
4. ✅ Update Cloudflare Pages env vars (Step 4 - if using)
5. ✅ Run all test scenarios
6. ✅ Monitor logs for 24-48 hours
7. ✅ Verify no user complaints about broken links

---

## Support

**If you encounter issues**:
1. Check Supabase Edge Function logs first
2. Verify SMTP configuration is correct
3. Test with "Send Test Email" in Supabase Dashboard
4. Verify redirect URLs are whitelisted
5. Check browser console for session errors

**Common Issues**:
- **Emails not sending**: SMTP not configured or incorrect credentials
- **Wrong redirect**: Auth URL configuration not updated
- **Signup fails**: Email not in `gh_approved_users` allowlist
- **Session errors**: Redirect URLs not whitelisted

---

**Last Updated**: December 2, 2025
**Author**: Claude (Multi-Agent Team - Coordinator)
**Status**: Code deployed, manual configuration required

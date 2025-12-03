# Supabase Dashboard Configuration Guide

**Project**: Mind Insurance (Grouphomes4newbies)
**Supabase URL**: `https://hpyodaugrkctagkrfofj.supabase.co`
**Production Domain**: `https://grouphome4newbies.com`

---

## Quick Links

- **Dashboard**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj
- **Edge Functions**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/functions
- **Auth Settings**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/auth/users
- **Logs**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/logs/explorer

---

## 1. SMTP Configuration (CRITICAL - Required for Email Delivery)

### Why This is Critical:
Without SMTP, users will NOT receive:
- Invite emails from admin console
- Magic link login emails
- Password reset emails
- Email verification links

### Navigation:
Dashboard → Project Settings → Authentication → SMTP Settings

### Configuration Steps:

1. **Enable Custom SMTP**
   - Toggle: **ON** (Enable Custom SMTP)

2. **SMTP Host**
   - Recommended: `smtp.gmail.com` (Gmail)
   - Alternative: `smtp.sendgrid.net` (SendGrid)
   - Alternative: `smtp.resend.com` (Resend)

3. **Port Number**
   - **587** (TLS - Recommended)
   - Or 465 (SSL)

4. **Username**
   - Gmail: `your-email@gmail.com`
   - SendGrid: `apikey` (literal string)
   - Resend: `resend` (literal string)

5. **Password**
   - Gmail: Use [App Password](https://myaccount.google.com/apppasswords) (NOT regular password)
   - SendGrid: Your API key
   - Resend: Your API key

6. **Sender Email**
   - `noreply@grouphome4newbies.com`
   - Or: `no-reply@grouphome4newbies.com`
   - Must be verified with your SMTP provider

7. **Sender Name**
   - `Grouphomes4newbies`
   - Or: `Mind Insurance`

### Gmail-Specific Setup (If Using Gmail):

**Prerequisites**:
- 2-Factor Authentication (2FA) must be enabled
- Generate an App Password (NOT your regular Gmail password)

**Steps**:
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with your Google account
3. Select "Mail" and "Other" (Custom name)
4. Enter name: "Grouphomes4newbies Supabase"
5. Click "Generate"
6. Copy the 16-character password
7. Use this password in Supabase SMTP settings

**Gmail Settings**:
- Host: `smtp.gmail.com`
- Port: `587`
- Username: Your Gmail address (e.g., `admin@grouphome4newbies.com`)
- Password: The 16-character app password (no spaces)
- Sender Email: Same as username
- Sender Name: `Grouphomes4newbies`

### Test SMTP Configuration:

1. Click **Save** (bottom of SMTP settings)
2. Wait for "Settings saved" confirmation
3. Click **Send Test Email**
4. Enter your email address
5. Check inbox (and spam folder)
6. Verify email received from configured sender

**Expected Test Email**:
- From: `Grouphomes4newbies <noreply@grouphome4newbies.com>`
- Subject: "Confirm your email"
- Body: Supabase email verification template

**If test fails**:
- Check username/password are correct
- Verify port is 587 (not 465)
- Ensure sender email is verified with provider
- Check Gmail "Less secure app access" is OFF (use app password instead)
- Wait 5 minutes for changes to propagate

---

## 2. Authentication URL Configuration

### Navigation:
Dashboard → Authentication → URL Configuration

### 2.1 Site URL

**Field**: Site URL
**Value**: `https://grouphome4newbies.com`

**Purpose**: Primary domain for OAuth redirects and default auth flows

**How to Set**:
1. Navigate to: Auth → URL Configuration
2. Find "Site URL" field
3. Enter: `https://grouphome4newbies.com`
4. Click "Save"

### 2.2 Redirect URLs (Allowlist)

**Field**: Redirect URLs
**Purpose**: Whitelist allowed domains for OAuth callbacks

**Add these URLs** (one per line):
```
https://grouphome4newbies.com/**
https://mindhouse-prodigy.pages.dev/**
http://localhost:5173/**
```

**Why Each URL**:
- `grouphome4newbies.com/**` - Production custom domain
- `mindhouse-prodigy.pages.dev/**` - Cloudflare Pages deployment
- `localhost:5173/**` - Local development (Vite dev server)

**How to Set**:
1. Navigate to: Auth → URL Configuration
2. Scroll to "Redirect URLs"
3. Click "Add URL"
4. Paste each URL (one at a time)
5. Click "Add" for each
6. Click "Save" at bottom

**Pattern Rules**:
- Use `**` to allow all subpaths
- Don't include query parameters
- Must include protocol (`http://` or `https://`)

---

## 3. Email Templates Configuration

### Navigation:
Dashboard → Authentication → Email Templates

### Why This Matters:
Email templates contain the redirect URLs that users click. If these use the wrong domain, auth will fail.

### Templates to Update:

#### Template 1: Confirm Signup
**Purpose**: New user email verification

**Update**:
1. Click "Confirm signup" template
2. Find `{{ .ConfirmationURL }}`
3. Verify redirect URL: `https://grouphome4newbies.com/auth/callback`
4. Update subject/body if needed
5. Click "Save"

**Subject**: `Confirm Your Email - Grouphomes4newbies`

**Body** (key parts):
```html
<a href="{{ .ConfirmationURL }}">Verify Email</a>
```

**Test**: Send test email, verify link redirects to `grouphome4newbies.com`

---

#### Template 2: Invite User
**Purpose**: Admin-generated user invites

**Update**:
1. Click "Invite user" template
2. Find `{{ .ConfirmationURL }}`
3. Verify redirect: `https://grouphome4newbies.com/auth/callback`
4. Update branding to "Grouphomes4newbies"
5. Click "Save"

**Subject**: `You're Invited to Grouphomes4newbies`

**Body** (suggested):
```html
<h2>Welcome to Grouphomes4newbies!</h2>
<p>You've been invited to join our Mind Insurance platform.</p>
<a href="{{ .ConfirmationURL }}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
  Accept Invitation
</a>
```

---

#### Template 3: Magic Link
**Purpose**: OTP-based login (passwordless)

**Update**:
1. Click "Magic Link" template
2. Find `{{ .TokenURL }}`
3. Verify redirect: `https://grouphome4newbies.com/chat`
4. Update branding
5. Click "Save"

**Subject**: `Your Sign-In Link for Grouphomes4newbies`

**Body**:
```html
<p>Click the link below to sign in:</p>
<a href="{{ .TokenURL }}">Sign In to Grouphomes4newbies</a>
<p>This link expires in 1 hour.</p>
```

---

#### Template 4: Reset Password
**Purpose**: Password recovery

**Update**:
1. Click "Reset Password" template
2. Find `{{ .ConfirmationURL }}`
3. Verify redirect: `https://grouphome4newbies.com/reset-password`
4. Click "Save"

**Subject**: `Reset Your Password - Grouphomes4newbies`

---

#### Template 5: Change Email Address
**Purpose**: When user changes email

**Update**:
1. Click "Change Email Address" template
2. Find `{{ .ConfirmationURL }}`
3. Verify redirect: `https://grouphome4newbies.com/auth/callback`
4. Click "Save"

---

### Testing Email Templates:

**For each template**:
1. Click template name
2. Scroll to bottom
3. Click "Send test email"
4. Enter your email
5. Check inbox
6. Verify:
   - Email received
   - Link uses `grouphome4newbies.com` domain
   - Link works when clicked
   - Redirects to correct page

---

## 4. OAuth Providers Configuration

### Google OAuth Setup

**Navigation**: Auth → Providers → Google

**Current Status**: Should already be configured

**Verify Settings**:
1. **Enabled**: Toggle should be ON
2. **Client ID**: Starts with numbers, ends in `.apps.googleusercontent.com`
3. **Client Secret**: Should be filled (hidden)
4. **Authorized redirect URI**:
   ```
   https://hpyodaugrkctagkrfofj.supabase.co/auth/v1/callback
   ```

**If Not Configured**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI (from above)
4. Copy Client ID and Secret
5. Paste in Supabase Google provider settings
6. Save

**Authorized JavaScript Origins** (in Google Console):
- `https://grouphome4newbies.com`
- `https://mindhouse-prodigy.pages.dev`
- `http://localhost:5173` (for development)

**Authorized Redirect URIs** (in Google Console):
- `https://hpyodaugrkctagkrfofj.supabase.co/auth/v1/callback`

---

## 5. Rate Limiting Configuration

### Navigation:
Auth → Rate Limits

**Recommended Settings**:
- **Email sent per hour**: `60` (increased from default 10)
- **SMS sent per hour**: `10` (default)
- **Anonymous sign-ins per hour**: `100` (default)

**Why Increase Email Rate**:
- Bulk user invites can send many emails at once
- Admin actions shouldn't be rate-limited too aggressively
- Edge function already has built-in 200ms delay between emails

**How to Update**:
1. Navigate to: Auth → Rate Limits
2. Find "Email sent per hour"
3. Change from `10` to `60`
4. Click "Save"

---

## 6. Security Settings

### Navigation:
Auth → Policies

### Recommended Settings:

**Enable Email Confirmations**: ON
- Users must verify email before accessing app

**Enable Signup**: ON
- Allow new users to register

**Enable Password**: ON (if using password auth)
- Or OFF if using only magic links/OAuth

**Minimum Password Length**: `8` characters

**Password Requirements**:
- ☑ Lowercase characters
- ☑ Uppercase characters
- ☑ Numbers
- ☐ Special characters (optional)

---

## 7. Monitoring & Logging

### Edge Function Logs

**Navigation**: Edge Functions → send-user-invite → Logs

**What to Monitor**:
- ✅ Successful invites: `Successfully sent invite to: user@example.com`
- ✅ Correct URL: `Using app URL: https://grouphome4newbies.com`
- ❌ SMTP errors: `SMTP connection failed`
- ❌ Rate limit errors: `Rate limit exceeded`

**How to Check**:
1. Go to: Functions → send-user-invite
2. Click "Logs" tab
3. Set time range: Last 24 hours
4. Look for errors or warnings

---

### Authentication Logs

**Navigation**: Authentication → Logs

**What to Monitor**:
- User signups
- Login attempts
- OAuth callback successes/failures
- Magic link generation
- Email sending status

**How to Check**:
1. Go to: Auth → Logs
2. Filter by event type
3. Look for failed authentications
4. Investigate errors

---

## 8. Database Access (For Troubleshooting)

### SQL Editor

**Navigation**: SQL Editor

**Useful Queries**:

**Check approved users with invite status**:
```sql
SELECT
  email,
  tier,
  user_id,
  is_active,
  invited_at,
  last_access_at
FROM gh_approved_users
ORDER BY created_at DESC
LIMIT 20;
```

**Find users not yet synced** (user_id is NULL):
```sql
SELECT email, tier, created_at
FROM gh_approved_users
WHERE user_id IS NULL
AND is_active = true;
```

**Check recent auth users**:
```sql
SELECT id, email, created_at, confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;
```

---

## 9. Troubleshooting Checklist

### Issue: Invite emails not sending

**Check**:
- ☐ SMTP configured in Dashboard
- ☐ SMTP credentials correct
- ☐ Sender email verified with provider
- ☐ "Send Test Email" works
- ☐ Edge function logs show no SMTP errors
- ☐ Rate limits not exceeded

### Issue: Wrong domain in email links

**Check**:
- ☐ `APP_URL` environment variable set: `npx supabase secrets list`
- ☐ Edge function deployed after setting variable
- ☐ Email template redirect URLs updated
- ☐ Site URL set to `grouphome4newbies.com`

### Issue: OAuth callback fails

**Check**:
- ☐ Redirect URLs whitelisted in Supabase
- ☐ Authorized redirect URI in Google Console matches Supabase
- ☐ Google OAuth credentials valid
- ☐ Site URL set correctly

### Issue: Users can't sign in after signup

**Check**:
- ☐ User in `gh_approved_users` with `is_active = true`
- ☐ User's `user_id` synced (not NULL)
- ☐ RLS policies allow user access
- ☐ Session established (check browser localStorage)

---

## 10. Backup & Recovery

### Export Current Configuration

**Email Templates**:
- Navigate to each template
- Copy HTML content
- Save to local file

**SMTP Settings**:
- Take screenshot of configuration
- Store securely (do NOT commit to git)

**Redirect URLs**:
- Copy list of whitelisted URLs
- Save to documentation

### Recovery Steps (If Needed):

1. **Reset SMTP**: Re-enter credentials from secure storage
2. **Reset Email Templates**: Restore from saved HTML files
3. **Reset Redirect URLs**: Re-add from saved list
4. **Reset Site URL**: Set to `https://grouphome4newbies.com`
5. **Test**: Send test emails, verify OAuth works

---

## Summary Checklist

### Critical Configuration Items:
- ☐ SMTP configured and tested
- ☐ Site URL: `https://grouphome4newbies.com`
- ☐ Redirect URLs whitelisted (all 3)
- ☐ Email templates updated with correct domain
- ☐ Google OAuth configured
- ☐ Rate limits adjusted (60 emails/hour)
- ☐ Test invite sent successfully
- ☐ Test magic link works
- ☐ Test Google OAuth works

### Post-Configuration Verification:
- ☐ Edge function logs show correct URL
- ☐ Auth logs show successful signups
- ☐ No SMTP errors in logs
- ☐ Users receiving emails
- ☐ Links redirect to correct domain

---

**Last Updated**: December 2, 2025
**Configuration Status**: Manual setup required
**Support**: Check logs first, then verify SMTP configuration

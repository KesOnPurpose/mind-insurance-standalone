# Supabase Email Template Instructions

## How to Update Email Templates in Supabase Dashboard

### 1. Navigate to Email Templates
1. Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj
2. Click: **Authentication** (left sidebar)
3. Click: **Email Templates** (sub-menu)

---

## Template 1: Invite User (PRIORITY)

### Steps to Update:
1. Click **"Invite user"** template
2. Replace the **Subject** field with:
   ```
   You're Invited to Grouphomes4newbies
   ```

3. Replace the **Body** field with the HTML from `invite-user-template.html`

4. **CRITICAL**: Verify the redirect URL
   - Supabase automatically sets `{{ .ConfirmationURL }}`
   - This should redirect to: `https://grouphome4newbies.com/auth/callback`
   - To verify: Click "Send test email" and check the link destination

5. Click **Save**

6. **Test**:
   - Click "Send test email"
   - Enter your email
   - Verify email looks correct
   - Click the link and verify it goes to `grouphome4newbies.com`

---

## Template 2: Confirm Signup

### Subject:
```
Confirm Your Email - Grouphomes4newbies
```

### Body:
```html
<h2>Welcome to Grouphomes4newbies!</h2>

<p>Thanks for signing up! We're excited to help you build your group home business.</p>

<p>Please confirm your email address by clicking the button below:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 16px 0;">
    Verify Email Address
  </a>
</p>

<p style="color: #666; font-size: 14px;">
  Or copy and paste this link into your browser:<br>
  <a href="{{ .ConfirmationURL }}" style="color: #0066cc; word-break: break-all;">{{ .ConfirmationURL }}</a>
</p>

<p style="color: #666; font-size: 14px; margin-top: 24px;">
  This link will expire in 24 hours.
</p>

<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

<p style="color: #999; font-size: 12px;">
  If you didn't create an account, you can safely ignore this email.
</p>

<p style="color: #999; font-size: 12px;">
  © 2025 Grouphomes4newbies. All rights reserved.
</p>
```

**Redirect URL**: Should go to `https://grouphome4newbies.com/auth/callback`

---

## Template 3: Magic Link

### Subject:
```
Your Sign-In Link for Grouphomes4newbies
```

### Body:
```html
<h2>Sign In to Grouphomes4newbies</h2>

<p>Click the link below to sign in to your account:</p>

<p>
  <a href="{{ .TokenURL }}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 16px 0;">
    Sign In to Your Account
  </a>
</p>

<p style="color: #666; font-size: 14px;">
  Or copy and paste this link into your browser:<br>
  <a href="{{ .TokenURL }}" style="color: #0066cc; word-break: break-all;">{{ .TokenURL }}</a>
</p>

<p style="color: #666; font-size: 14px; margin-top: 24px;">
  This link will expire in 1 hour for security purposes.
</p>

<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

<p style="color: #999; font-size: 12px;">
  If you didn't request this sign-in link, you can safely ignore this email.
</p>

<p style="color: #999; font-size: 12px;">
  © 2025 Grouphomes4newbies. All rights reserved.
</p>
```

**Redirect URL**: Should go to `https://grouphome4newbies.com/chat`

---

## Template 4: Reset Password

### Subject:
```
Reset Your Password - Grouphomes4newbies
```

### Body:
```html
<h2>Reset Your Password</h2>

<p>You requested to reset your password for your Grouphomes4newbies account.</p>

<p>Click the button below to set a new password:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 16px 0;">
    Reset Password
  </a>
</p>

<p style="color: #666; font-size: 14px;">
  Or copy and paste this link into your browser:<br>
  <a href="{{ .ConfirmationURL }}" style="color: #0066cc; word-break: break-all;">{{ .ConfirmationURL }}</a>
</p>

<p style="color: #666; font-size: 14px; margin-top: 24px;">
  This link will expire in 1 hour.
</p>

<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

<p style="color: #999; font-size: 12px;">
  If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
</p>

<p style="color: #999; font-size: 12px;">
  © 2025 Grouphomes4newbies. All rights reserved.
</p>
```

**Redirect URL**: Should go to `https://grouphome4newbies.com/reset-password`

---

## Template 5: Change Email Address

### Subject:
```
Confirm Your New Email - Grouphomes4newbies
```

### Body:
```html
<h2>Email Address Change Request</h2>

<p>You requested to change your email address for your Grouphomes4newbies account.</p>

<p>Click the button below to confirm this change:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 16px 0;">
    Confirm Email Change
  </a>
</p>

<p style="color: #666; font-size: 14px;">
  Or copy and paste this link into your browser:<br>
  <a href="{{ .ConfirmationURL }}" style="color: #0066cc; word-break: break-all;">{{ .ConfirmationURL }}</a>
</p>

<p style="color: #666; font-size: 14px; margin-top: 24px;">
  This link will expire in 24 hours.
</p>

<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

<p style="color: #999; font-size: 12px;">
  If you didn't request this change, please contact support immediately.
</p>

<p style="color: #999; font-size: 12px;">
  © 2025 Grouphomes4newbies. All rights reserved.
</p>
```

**Redirect URL**: Should go to `https://grouphome4newbies.com/auth/callback`

---

## Key Redirect URLs Summary

Make sure these redirect URLs are configured in **Authentication → URL Configuration**:

### Site URL:
```
https://grouphome4newbies.com
```

### Redirect URLs (Allowlist):
```
https://grouphome4newbies.com/**
https://mindhouse-prodigy.pages.dev/**
http://localhost:5173/**
```

---

## Testing Checklist

After updating each template:

- [ ] **Subject** updated with "Grouphomes4newbies" branding
- [ ] **Body** HTML pasted correctly
- [ ] **Redirect URL** verified (check test email link destination)
- [ ] **Clicked "Save"** at bottom of template editor
- [ ] **Sent test email** to verify
- [ ] **Checked inbox** (and spam folder)
- [ ] **Clicked link** in test email
- [ ] **Verified redirect** goes to correct `grouphome4newbies.com` page
- [ ] **No errors** in browser console

---

## Common Issues

### Issue: Link goes to wrong domain
**Fix**: Check Authentication → URL Configuration → Site URL is set to `https://grouphome4newbies.com`

### Issue: Link broken/404 error
**Fix**: Verify redirect URLs are whitelisted in Authentication → URL Configuration

### Issue: Email not received
**Fix**: Check SMTP configuration in Project Settings → Auth → SMTP Settings

### Issue: Template variables not working ({{ .ConfirmationURL }} shows literally)
**Fix**: Make sure you're editing the HTML body field, not preview. Variables only render in sent emails, not in editor.

---

## Brand Colors Reference

Use these colors for consistency:

- **Primary Blue**: `#0066cc`
- **Text Dark**: `#333333`
- **Text Gray**: `#666666`
- **Text Light Gray**: `#999999`
- **Border**: `#e5e5e5`
- **Background**: `#ffffff`

---

## Support

If you encounter issues:
1. Check Supabase Dashboard → Authentication → Logs
2. Verify SMTP is configured
3. Test with "Send test email" button
4. Check browser console for redirect errors

**Last Updated**: December 2, 2025

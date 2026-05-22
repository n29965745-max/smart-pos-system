# Authenticator App (TOTP) Setup Guide
**Smart POS System - Security Documentation**

---

## What You Need

An authenticator app on your phone. Choose one:

### Recommended Apps:

1. **Google Authenticator** (Free)
   - Android: https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2
   - iOS: https://apps.apple.com/app/google-authenticator/id388497605

2. **Microsoft Authenticator** (Free)
   - Android: https://play.google.com/store/apps/details?id=com.azure.authenticator
   - iOS: https://apps.apple.com/app/microsoft-authenticator/id983156458

3. **Authy** (Free, has cloud backup)
   - Android: https://play.google.com/store/apps/details?id=com.authy.authy
   - iOS: https://apps.apple.com/app/authy/id494168017

---

## Step-by-Step Setup

### Step 1: Install Authenticator App
- Open your phone's app store
- Search for "Google Authenticator" or "Microsoft Authenticator"
- Install the app
- Open it

### Step 2: On Your Computer
1. On the "Secure Your Account" screen
2. Click **"Set Up"** next to "Authenticator App (TOTP)"

### Step 3: You'll See a QR Code
The screen will show:
- A QR code (square barcode)
- A text code (backup, in case QR doesn't work)
- Instructions

### Step 4: Scan QR Code with Your Phone
1. Open your authenticator app
2. Tap the **"+"** or **"Add account"** button
3. Choose **"Scan QR code"**
4. Point your phone camera at the QR code on your computer screen
5. The app will automatically add the account

### Step 5: Enter the 6-Digit Code
1. Your authenticator app now shows a 6-digit code
2. The code changes every 30 seconds
3. Type the current code into the verification box on your computer
4. Click "Verify" or "Continue"

### Step 6: CRITICAL - Save Backup Codes
After verification, you'll see **recovery/backup codes**:
- Usually 10-16 codes like: `a3f9-2k8d-9m4p`
- **Screenshot these or write them down**
- Store them securely (password manager, encrypted file, or safe)
- These are your ONLY way to recover if you lose your phone

---

## What If QR Code Doesn't Work?

### Manual Entry Method:
1. In your authenticator app, choose **"Enter a setup key"** instead of scan
2. Enter these details:
   - **Account name**: GitHub (or whatever service)
   - **Your email**: your-email@example.com
   - **Key**: The long text code shown on screen (like: JBSWY3DPEHPK3PXP)
   - **Type of key**: Time-based
3. Tap "Add"

---

## How It Works After Setup

### Every Login:
1. Enter your username and password
2. You'll be asked for a code
3. Open your authenticator app
4. Find the account (e.g., "GitHub - your-email@example.com")
5. Type the 6-digit code shown
6. The code changes every 30 seconds, so use the current one
7. Click "Verify"

---

## Troubleshooting

### "Invalid code" error:
- **Check time sync**: Your phone's time must be accurate
  - Go to phone Settings → Date & Time → Set automatically
- **Use current code**: Codes expire every 30 seconds
- **Try next code**: If one doesn't work, wait for the next one

### Lost your phone?
- Use one of your backup/recovery codes
- Each backup code works only once
- After using all backup codes, contact support

### New phone?
- You'll need to set up 2FA again
- Use a backup code to log in first
- Then set up 2FA on your new phone
- Get new backup codes

---

## Best Practices

### ✅ DO:
- Set up on 2+ devices (phone + tablet)
- Save backup codes in password manager
- Keep phone time synced automatically
- Test login once after setup

### ❌ DON'T:
- Share your QR code or setup key
- Screenshot QR code and leave it in photos
- Ignore backup codes
- Use same authenticator for personal and work without backup

---

## For Smart POS System

Set up 2FA on these accounts:

1. **GitHub** (Priority 1)
   - Your code repository
   - If compromised: attacker can modify your app

2. **Vercel** (Priority 1)
   - Your deployment platform
   - If compromised: attacker can deploy malicious code

3. **Supabase** (Priority 1)
   - Your database
   - If compromised: customer data stolen

4. **Domain registrar** (Priority 2)
   - Where you bought your domain
   - If compromised: attacker can redirect your site

5. **Email account** (Priority 1)
   - Used for password resets
   - If compromised: attacker can reset all other accounts

---

## Quick Reference Card

**Save this for future logins:**

```
Service: [GitHub/Vercel/Supabase]
Email: [your-email@example.com]
2FA Method: Authenticator App
Backup Codes Location: [Password Manager/Safe/etc]
Setup Date: May 22, 2026
```

---

## What to Do Right Now

1. ✅ Install authenticator app on your phone
2. ✅ Click "Set Up" on the Authenticator App option
3. ✅ Scan the QR code with your phone
4. ✅ Enter the 6-digit code to verify
5. ✅ **SAVE THE BACKUP CODES** (most important!)
6. ✅ Test login once to confirm it works

---

**Created:** May 22, 2026
**For:** Smart POS System Security
**Status:** Ready to use


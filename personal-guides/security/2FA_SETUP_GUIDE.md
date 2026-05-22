# 2FA Setup Guide - Passkeys (Biometric)
**Smart POS System - Security Documentation**

---

## What You're Setting Up

**Passkeys** = Modern authentication using:
- 🔐 Fingerprint (Touch ID/Fingerprint sensor)
- 👤 Face recognition (Face ID)
- 🔑 Security key (YubiKey, etc.)

---

## Step-by-Step Instructions

### Step 1: Click "Create" Button
On the "Secure Your Account" screen, click the **"Create"** button next to "Passkeys"

### Step 2: Browser Will Prompt You
Your browser will show a popup asking:
- "Create a passkey for [service name]?"
- Options will appear based on your device

### Step 3: Choose Your Method

**On Mac:**
- Use Touch ID (fingerprint)
- Use Apple Watch
- Use iPhone/iPad nearby

**On Windows:**
- Use Windows Hello (fingerprint/face)
- Use security key
- Use phone

**On Linux:**
- Use security key (YubiKey, etc.)
- Use phone as authenticator

### Step 4: Authenticate
- Place your finger on the sensor, OR
- Look at the camera for Face ID, OR
- Insert and tap your security key

### Step 5: Confirmation
- You'll see "Passkey created successfully"
- Your account is now secured with biometric authentication

---

## What Happens Next?

### Future Logins:
1. Enter your username/email
2. Browser asks for biometric verification
3. Use fingerprint/face/security key
4. Instant login - no password needed!

---

## Important Notes

### ✅ Advantages:
- **Fast** - Login in 2 seconds
- **Secure** - Biometric data never leaves your device
- **Convenient** - No codes to type
- **Phishing-resistant** - Can't be stolen or intercepted

### ⚠️ Considerations:
- **Device-specific** - Tied to this computer/phone
- **Backup needed** - Set up on multiple devices or keep backup codes
- **Hardware required** - Need fingerprint sensor, camera, or security key

---

## Backup Plan

After setting up Passkeys, also set up:

1. **Recovery codes** - Save them securely
2. **Second device** - Add passkey on your phone too
3. **Authenticator app** - As backup option

---

## For Smart POS System Accounts

Set up Passkeys on:
- ✅ **GitHub** (where your code is stored)
- ✅ **Vercel** (where your app is deployed)
- ✅ **Supabase** (where your database is)
- ✅ **Any production accounts**

---

## Troubleshooting

**"No compatible authenticator found"**
- Your device doesn't have biometric hardware
- Use Authenticator App (TOTP) instead

**"Passkey creation failed"**
- Check browser permissions
- Try different browser (Chrome/Edge work best)
- Update your operating system

**"Can't use passkey on another device"**
- Passkeys are device-specific
- Set up new passkey on each device
- Or use phone as roaming authenticator

---

## Security Best Practices

1. **Set up on 2+ devices** - Don't lock yourself out
2. **Save recovery codes** - Store in password manager
3. **Keep OS updated** - Security patches are critical
4. **Use strong password too** - Passkey is 2nd factor, not replacement

---

## What to Do Right Now

1. Click **"Create"** on the Passkeys option
2. Follow the browser prompts
3. Use your fingerprint/face/security key
4. **Save the recovery codes** shown after setup
5. Test login once to confirm it works

---

**Created:** May 22, 2026
**For:** Smart POS System Security
**Status:** Ready to use


# 🐦 Twitter Authentication Setup Guide

## ✅ What We Built

Twitter OAuth integration that allows users to:
1. Sign in with their Twitter account
2. Link their TopStrike wallet address (one time)
3. Auto-load portfolio on future logins

---

## 🔑 Step 1: Get Twitter OAuth Credentials

### **1.1 Go to Twitter Developer Portal**
Visit: https://developer.twitter.com/en/portal/dashboard

### **1.2 Sign In**
Use your Twitter account

### **1.3 Create a Project** (if you don't have one)
- Click **"+ Create Project"**
- Name: `TopStrike Squad Viewer` (or anything)
- Use case: Choose appropriate option
- Description: Add any description

### **1.4 Create an App**
- Inside your project, click **"+ Add App"**
- Environment: **Production** (or Development for testing)
- App name: `TopStrike Viewer` (must be unique)

### **1.5 Save Your API Keys**
You'll see:
- **API Key**
- **API Key Secret**

**Save these somewhere safe!** (You won't see them again)

### **1.6 Set Up OAuth 2.0**

**Important: Click "Set up" under OAuth 2.0 Client ID and Client Secret**

1. **App Info:**
   - Callback URI: `http://localhost:3001/api/auth/callback/twitter`
   - Website URL: `http://localhost:3001`

2. **App Permissions:**
   - Check: **Read** (we only need to read username)

3. **Click "Save"**

4. **Copy Your OAuth 2.0 Credentials:**
   - **Client ID** (starts with `a1b2c3...`)
   - **Client Secret** (longer string)

---

## 🔧 Step 2: Configure Environment Variables

### **2.1 Open Your `.env.local` File**

It should already exist with your MegaETH config. Add these new lines:

```bash
# Twitter OAuth
TWITTER_CLIENT_ID=your_client_id_from_step_1.6
TWITTER_CLIENT_SECRET=your_client_secret_from_step_1.6

# NextAuth
NEXTAUTH_SECRET=generate_random_secret_below
NEXTAUTH_URL=http://localhost:3001
```

### **2.2 Generate NEXTAUTH_SECRET**

Run this in your terminal (Git Bash on Windows):
```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET`.

---

## ✅ Step 3: Verify Your .env.local

Your complete `.env.local` should look like:

```bash
# Twitter OAuth (NEW)
TWITTER_CLIENT_ID=a1b2c3d4e5f6g7h8i9j0
TWITTER_CLIENT_SECRET=long_secret_string_here

# NextAuth (NEW)
NEXTAUTH_SECRET=random_base64_string_here
NEXTAUTH_URL=http://localhost:3001

# Existing TopStrike config (keep as-is)
# ... your existing variables ...
```

---

## 🚀 Step 4: Test It!

### **4.1 Restart Dev Server**

If your server is already running, stop it (Ctrl+C) and restart:
```bash
npm run dev
```

### **4.2 Open the App**

Navigate to: http://localhost:3001

### **4.3 Test Twitter Login**

1. You should see a **"Sign in with Twitter"** button in the header
2. Click it
3. Twitter OAuth popup appears
4. Authorize the app
5. You'll be redirected back to your app
6. You should see a **"Link Your TopStrike Wallet"** modal
7. Enter your wallet address (the one from TopStrike)
8. Click **"Link Wallet"**
9. Portfolio loads automatically! 🎉

### **4.4 Test Auto-Load**

1. Close the browser tab
2. Open http://localhost:3001 again
3. Click **"Sign in with Twitter"**
4. Portfolio loads automatically without entering wallet! ✅

---

## 🐛 Troubleshooting

### **Error: "Invalid callback URL"**

**Fix:** Check these match exactly:
- Twitter Developer Portal → App Settings → Callback URL
- Should be: `http://localhost:3001/api/auth/callback/twitter`

### **Error: "NEXTAUTH_SECRET not defined"**

**Fix:**
1. Make sure `.env.local` has `NEXTAUTH_SECRET=...`
2. Restart dev server
3. Check no typos in variable name

### **Error: "Twitter authorization failed"**

**Fix:**
1. Check `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are correct
2. Make sure you're using **OAuth 2.0** credentials (not API Key)
3. Check app permissions include **Read**

### **Wallet doesn't save**

**Fix:** This is using in-memory storage for development. When you restart the server, links are lost. This is normal for testing. For production, we'll use Vercel KV or a database.

---

## 📊 How It Works

### **First Login:**
```
1. User clicks "Sign in with Twitter"
   ↓
2. Twitter OAuth → User authorizes
   ↓
3. App receives Twitter ID and username
   ↓
4. Check database: No linked wallet found
   ↓
5. Show "Link Your Wallet" modal
   ↓
6. User enters wallet address
   ↓
7. Save to database: @username → 0x123...
   ↓
8. Load portfolio automatically
```

### **Future Logins:**
```
1. User clicks "Sign in with Twitter"
   ↓
2. Twitter OAuth → User authorizes
   ↓
3. App receives Twitter ID
   ↓
4. Check database: Found wallet 0x123...
   ↓
5. Auto-load portfolio ✅
```

---

## 🎯 What's Next?

### **For Production:**

When you deploy to Vercel:

1. **Add environment variables in Vercel dashboard:**
   - All the same variables from `.env.local`

2. **Update Twitter callback URL:**
   - Change to: `https://your-domain.vercel.app/api/auth/callback/twitter`
   - Update in both:
     - Twitter Developer Portal
     - `.env` variable: `NEXTAUTH_URL=https://your-domain.vercel.app`

3. **Upgrade to persistent storage:**
   - Use Vercel KV (free tier available)
   - Or connect a database (PostgreSQL, MongoDB)

---

## ✅ Checklist

- [ ] Created Twitter Developer account
- [ ] Created project & app
- [ ] Set up OAuth 2.0
- [ ] Got Client ID and Client Secret
- [ ] Added credentials to `.env.local`
- [ ] Generated `NEXTAUTH_SECRET`
- [ ] Restarted dev server
- [ ] Tested "Sign in with Twitter"
- [ ] Successfully linked wallet
- [ ] Portfolio loaded automatically
- [ ] Tested auto-load on second login

---

## 🎉 You're Done!

Users can now sign in with Twitter and their portfolio loads automatically!

**Share your Twitter credentials with me and I'll verify everything works!**

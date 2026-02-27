# 📅 Fixtures Setup Guide

## Why Fixtures Don't Work Yet

TopStrike's fixtures API requires authentication cookies. The tokens you provided have **expired** (JWT tokens expire after 1 hour).

## ✅ How to Enable Fixtures

### **Step 1: Get Fresh Cookies**

1. Open https://play.topstrike.io in your browser
2. Log in to your account
3. Press **F12** to open DevTools
4. Go to **Application** tab → **Cookies** → `play.topstrike.io`
5. Copy these cookie values:
   - `privy-session`
   - `cf_clearance`
   - `privy-token`
   - `privy-id-token`

### **Step 2: Update .env.local**

Open `.env.local` and replace the `TOPSTRIKE_COOKIES` value:

```bash
TOPSTRIKE_COOKIES="privy-session=YOUR_NEW_VALUE; cf_clearance=YOUR_NEW_VALUE; privy-token=YOUR_NEW_TOKEN; privy-id-token=YOUR_NEW_TOKEN"
```

**Format:** `cookie1=value1; cookie2=value2; cookie3=value3`

### **Step 3: Restart Dev Server**

```bash
# Stop server (Ctrl+C)
npm run dev
```

Fixtures should now load! 🎉

## ⏰ Token Expiration

Tokens expire after **~1 hour**. When fixtures stop loading:
1. Get fresh cookies (repeat Step 1)
2. Update `.env.local` (repeat Step 2)
3. Restart server (repeat Step 3)

## 🔒 Security Notes

- ✅ `.env.local` is in `.gitignore` (won't be committed)
- ✅ Tokens are server-side only (not exposed to browser)
- ⚠️ Never share your tokens publicly
- ⚠️ Tokens give access to your TopStrike account

## 🧪 Test Without Fixtures

The app works perfectly **without** fixtures enabled:
- Portfolio summary ✅
- Player pool ✅
- Squad builder ✅
- All features functional ✅

Fixtures are a **bonus feature** - the core app doesn't need them!

## 📊 Alternative: Mock Data

If you don't want to deal with tokens, I can add **mock fixtures data** for display purposes. Let me know!

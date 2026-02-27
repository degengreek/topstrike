# 🔍 TopStrike API Investigation

## Goal
Find if TopStrike has an API endpoint that maps Twitter accounts to wallet addresses.

## How to Investigate

### Step 1: Inspect TopStrike App Network Requests

1. **Open TopStrike app** in Chrome/Firefox
2. **Open DevTools** (F12)
3. **Go to Network tab**
4. **Filter by "Fetch/XHR"**
5. **Log in with Twitter** on TopStrike
6. **Look for API calls** that contain:
   - Your Twitter username
   - Your wallet address
   - Terms like: `user`, `profile`, `account`, `twitter`, `wallet`, `address`

### What to Look For:

**Example API patterns:**
```
GET /api/user/profile
GET /api/user/twitter/{username}
GET /api/user/{twitter_id}
POST /api/auth/twitter
GET /api/player/wallet/{address}
GET /api/player/twitter/{username}
```

**Response might look like:**
```json
{
  "twitter_username": "john_doe",
  "twitter_id": "123456789",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "display_name": "John Doe"
}
```

### Step 2: Check API Headers

Look for these in the request headers:
```
Authorization: Bearer {token}
X-API-Key: {key}
Cookie: session={...}
```

If there's an auth token, we might need:
- Twitter OAuth to get similar token
- API key (might be public in the JavaScript)
- Session cookies (harder to replicate)

---

## Possible Scenarios

### ✅ Scenario A: Public API Available

**If TopStrike has a public endpoint:**
```
GET https://api.topstrike.io/user/twitter/username
→ Returns: { wallet: "0x..." }
```

**Implementation:**
```typescript
// lib/topstrike-api.ts
export async function getWalletByTwitter(username: string) {
  const response = await fetch(
    `https://api.topstrike.io/user/twitter/${username}`
  )
  const data = await response.json()
  return data.wallet_address
}
```

**Easy!** ✅ We can implement this immediately.

---

### ⚠️ Scenario B: Authenticated API (Token Required)

**If the API requires authentication:**
```
GET https://api.topstrike.io/user/profile
Headers: { Authorization: "Bearer {token}" }
```

**Options:**
1. **Use same OAuth flow** - Get Twitter token, use TopStrike's auth
2. **Reverse engineer** - Extract API key from TopStrike's JavaScript
3. **Contact TopStrike** - Ask for official API access

**Medium complexity** ⚠️

---

### ❌ Scenario C: No Public Mapping API

**If TopStrike doesn't expose Twitter→Wallet mapping:**

**Workarounds:**
1. **Build our own database** - Users manually link once
2. **Check on-chain data** - See if Twitter handles stored in smart contract
3. **Partner with TopStrike** - Official integration

**More work needed** ❌

---

## Step 3: Check Smart Contract Data

**Could Twitter handles be on-chain?**

```typescript
// Check if contract stores Twitter data
const contract = getContract()

// Try these functions (if they exist):
await contract.getPlayerTwitter(playerId)
await contract.getUserByTwitter("@username")
await contract.userProfiles(walletAddress) // might return Twitter handle
```

**Check contract on Blockscout:**
- Contract: `0xf3393dC9E747225FcA0d61BfE588ba2838AFb077`
- URL: https://megaeth.blockscout.com/address/0xf3393dC9E747225FcA0d61BfE588ba2838AFb077

Look for:
- Read functions that mention "twitter", "social", "profile"
- Events emitted when linking Twitter accounts
- Mappings in the contract storage

---

## Step 4: Check TopStrike Documentation

**Places to look:**
- TopStrike website footer (API docs, Developer portal)
- TopStrike GitHub (if they have one)
- TopStrike Discord/Telegram (ask in developer channel)
- TopStrike whitepaper/docs

---

## What We Need to Find

**Minimum info needed:**
1. **API endpoint** that accepts Twitter username/ID
2. **Returns** wallet address
3. **Authentication method** (if any)
   - Public (no auth) ✅
   - API key (might be in JS code) ⚠️
   - OAuth token (need Twitter login) ⚠️
   - Private (need permission) ❌

---

## Next Steps

### Action Items:
1. [ ] Open TopStrike app in DevTools
2. [ ] Log in with Twitter
3. [ ] Capture all API requests
4. [ ] Find Twitter→Wallet mapping endpoint
5. [ ] Test endpoint with `curl` or Postman
6. [ ] Document auth requirements
7. [ ] Report findings here

### If You Find an Endpoint:

**Share with me:**
- URL pattern
- Request method (GET/POST)
- Headers needed
- Example response
- Rate limits (if any)

**I'll implement it immediately!**

---

## Example: How to Test an Endpoint

```bash
# If you find something like:
# GET https://api.topstrike.io/user/twitter/elonmusk

# Test it with curl:
curl https://api.topstrike.io/user/twitter/elonmusk

# Or with headers if needed:
curl -H "Authorization: Bearer {token}" \
     https://api.topstrike.io/user/profile
```

---

## Fallback Plan

**If no API exists, we can:**

1. **Build our own mapping service**
   - Users link Twitter once
   - We store in our database
   - Future logins auto-load

2. **Chrome Extension approach**
   - Extension reads TopStrike app data
   - Syncs to our app

3. **Partner integration**
   - Contact TopStrike team
   - Official API access
   - Better for users

---

## Status: 🔍 Investigation Needed

**Your mission (if you choose to accept it):**
1. Open TopStrike app
2. Open DevTools → Network tab
3. Log in with Twitter
4. Find the API calls
5. Report back what you find!

Then I can implement the integration! 🚀

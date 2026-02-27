# ⚽ Football API-Sports Setup Guide

## 🎯 Overview

We've integrated **Football API-Sports** to show live games and upcoming fixtures for your players' teams!

**Features:**
- ✅ Live scores (auto-updates)
- ✅ Upcoming fixtures (next 5 games per team)
- ✅ Filtered to only your players' teams
- ✅ Smart rate limiting (10 requests/minute)
- ✅ 5-minute caching

---

## 🔑 Step 1: Get API Key

### **1.1 Sign Up**
Visit: https://www.api-football.com/

### **1.2 Choose Plan**
- **Free Plan:** 10 requests/minute, 100 requests/day
- Perfect for our use case!

### **1.3 Get Your API Key**
1. After signing up, go to **Dashboard**
2. Find your **API Key** (looks like: `a1b2c3d4e5f6g7h8i9j0...`)
3. Copy it

---

## 🔧 Step 2: Add to Environment Variables

**Open `.env.local` and add:**

```bash
# Football API-Sports
NEXT_PUBLIC_FOOTBALL_API_KEY=your_api_key_here
```

**Example:**
```bash
NEXT_PUBLIC_FOOTBALL_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

---

## 🚀 Step 3: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## ✅ Step 4: Test It!

1. **Sign in with Twitter** (or search a wallet)
2. **Load your portfolio**
3. **Check the Fixtures panel** on the right
4. You should see:
   - **Upcoming tab:** Next fixtures for your players' teams
   - **Live tab:** Any live games (if happening now)

---

## 📊 How It Works

### **Data Flow:**

```
1. User loads portfolio
   ↓
2. Extract team names from players
   ↓
3. Map team names → API-Football team IDs
   ↓
4. Fetch data:
   - Live games (1 request) - all live matches globally
   - Upcoming fixtures (1 request per team, max 9 teams) - next 60 days per team
   ↓
5. Filter & display in UI
   ↓
6. Cache for 5 minutes
```

### **Rate Limiting:**

**Free tier:** 10 requests/minute

**Our strategy:**
- 1 request for all live games
- Max 9 requests for upcoming fixtures (first 9 teams)
- Total: Max 10 requests per portfolio load
- 5-minute cache prevents repeated calls

**Example with 5 teams:**
```
Request 1: Live games (all leagues)
Request 2: Team A upcoming (5 fixtures)
Request 3: Team B upcoming (5 fixtures)
Request 4: Team C upcoming (5 fixtures)
Request 5: Team D upcoming (5 fixtures)
Request 6: Team E upcoming (5 fixtures)
Total: 6 requests
Remaining: 4 requests available
```

**Example with 15 teams:**
```
Request 1: Live games
Request 2-10: First 9 teams' upcoming fixtures
Total: 10 requests (at limit)
Teams 10-15: Skipped (rate limit protection)
```

---

## 🏟️ Team Mapping

We've mapped **80+ teams** to their API-Football IDs:

### **Premier League:**
- Manchester City, Liverpool, Arsenal, Chelsea, etc.

### **La Liga:**
- Real Madrid, Barcelona, Atletico Madrid, etc.

### **Serie A:**
- Inter, AC Milan, Juventus, Napoli, Roma, etc.

### **Bundesliga:**
- Bayern Munich, Dortmund, Leipzig, Leverkusen, etc.

### **Ligue 1:**
- PSG, Marseille, Monaco, Lyon, etc.

**Location:** `lib/football-api-sports.ts` → `TEAM_ID_MAP`

### **Adding New Teams:**

If a team is missing, add to the map:

```typescript
export const TEAM_ID_MAP: Record<string, number> = {
  // ... existing teams
  "Your Team Name": 123, // Find ID on api-football.com
}
```

**How to find team ID:**
1. Go to https://www.api-football.com/documentation-v3
2. Use "Teams" endpoint
3. Search for your team
4. Copy the `team.id`

---

## 💾 Caching System

**5-minute cache** to avoid hitting rate limits:

```
First load: API call (uses 1-10 requests)
    ↓
Cache for 5 minutes
    ↓
Subsequent loads (< 5 min): Use cache (0 requests)
    ↓
After 5 minutes: Fresh API call
```

**Benefits:**
- Saves API quota
- Faster loading
- Live scores update every 5 minutes

---

## 🎨 UI Features

### **Tabs:**
- **Upcoming:** Next fixtures sorted by date
- **Live:** Currently playing games (auto-highlighted in red)

### **Live Games:**
- Real-time scores
- Match time (minute)
- Pulsing animation
- Red highlight

### **Upcoming Fixtures:**
- Date & time
- League name
- Team logos
- Home/Away labels

---

## 📈 Performance

### **Load Times:**

**Without cache:**
- 10 teams = ~3-5 seconds (10 API calls)

**With cache:**
- Cached data = ~100ms (instant)

**Rate limiting:**
- If hit limit, waits automatically
- Shows countdown in console

---

## 🐛 Troubleshooting

### **"Unable to load fixtures"**

**Check:**
1. API key in `.env.local`
2. Correct variable name: `NEXT_PUBLIC_FOOTBALL_API_KEY`
3. Server restarted after adding key

### **Live games work but no upcoming fixtures**

**Fixed:** The API requires BOTH `season` AND date range parameters.

**Solution:** Use season + from/to dates together:
```typescript
// Wrong: Season only (returns ALL fixtures, past + future)
`/fixtures?team=${teamId}&season=2025`

// Wrong: Dates only (API error: "The Season field is required")
`/fixtures?team=${teamId}&from=2026-02-27&to=2026-04-28`

// Correct: Season + dates (returns only upcoming fixtures) ✅
`/fixtures?team=${teamId}&season=2025&from=2026-02-27&to=2026-04-28`
```

The API requires the `season` parameter even when filtering by date range.

### **"Rate limit exceeded"**

**Solution:**
- Wait 1 minute
- Refresh page (uses cache)
- Free tier limits:
  - 10 requests/minute
  - 100 requests/day

### **"No teams found in your portfolio"**

**Cause:** Player teams not in `TEAM_ID_MAP`

**Solution:**
1. Check console for warnings: `⚠️ Team ID not found for: [team name]`
2. Add missing teams to `lib/football-api-sports.ts`

### **Fixtures not updating**

**Remember:** 5-minute cache

**To force refresh:**
1. Clear browser cache
2. Or wait 5 minutes

---

## 🎯 Rate Limit Management

**Built-in protections:**

1. **Auto-throttling:** Waits if approaching limit
2. **Team limiting:** Max 9 teams per request (10 total with live)
3. **Caching:** 5-minute cache reduces calls
4. **Error handling:** Graceful degradation if API fails

**Console output:**
```
🔍 Fetching data for 5 teams...
⚡ Rate limit: 10/10 requests available
📡 Fetching live games...
✅ Found 2 live games
📡 Fetching upcoming fixtures for 5 teams...
✅ Found 15 upcoming fixtures
⚡ Rate limit: 4/10 requests remaining
```

---

## 📝 Files Created

- ✅ `lib/football-api-sports.ts` - Core API integration
- ✅ `app/api/football-data/route.ts` - API route
- ✅ `app/components/FixturesNew.tsx` - New Fixtures component
- ✅ `FOOTBALL_API_SETUP.md` - This guide

---

## ✅ Checklist

- [ ] Signed up at api-football.com
- [ ] Got API key
- [ ] Added `NEXT_PUBLIC_FOOTBALL_API_KEY` to `.env.local`
- [ ] Restarted dev server
- [ ] Loaded portfolio
- [ ] Saw fixtures in right panel
- [ ] Live tab works (if games are live)
- [ ] Upcoming tab shows next matches

---

## 🎉 You're Done!

Your app now shows **live scores and upcoming fixtures** for all your players' teams!

**Features unlocked:**
- ✅ Real-time match updates
- ✅ Next 5 games per team
- ✅ Filtered to your portfolio
- ✅ Professional UI with team logos
- ✅ Smart rate limiting

**Enjoy! ⚽🚀**

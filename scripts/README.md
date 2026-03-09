# Local Score Fetcher

This script runs on your local machine to fetch player scores from TopStrike API and update your Supabase database.

## Why Local?

Cloudflare blocks server requests from Vercel, but local requests work fine. This script:
- ✅ Runs on your computer (bypasses Cloudflare)
- ✅ Fetches scores for ALL TopStrike players (not wallet-specific)
- ✅ Updates Supabase database directly
- ✅ Benefits ALL users of your app
- ✅ Can run continuously in the background
- ✅ Your Vercel app reads scores from database automatically

## Key Feature: Universal Scores

**Fetches scores for ALL players** (ID 1-200 by default), so:
- All users can see their player scores
- No need to know individual wallet addresses
- Run once, everyone benefits!

## Setup

**Make sure `.env.local` has these variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://kricmstshlkaxpbzeucb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

That's it! No other setup needed.

## Usage

### Run Once (Manual Fetch)
```bash
node scripts/fetch-scores-local.js
```

### Run Continuously (Every Hour)
```bash
node scripts/fetch-scores-local.js --watch
```

## Example Output

```
🚀 Starting score fetch...
⏰ 3/7/2026, 10:30:00 AM

📊 Fetching scores for ALL players (ID 1 to 200)
   This benefits all users, not just one wallet!

  [10/200] ✅ Player 14: 34 pts
  [20/200] ✅ Player 23: 28 pts
  [30/200] ✅ Player 35: 15 pts
  ...

📊 Fetch complete: 87 players found, 113 skipped

💾 Saving scores to database...

✅ Successfully updated scores!
📈 Total: 1,842 pts | Average: 21 pts
📊 87/87 players with scores
```

*Note: The script automatically skips player IDs that don't exist.*

## Tips

- **First time?** Run once to test
- **Leave running?** Use `--watch` mode and minimize the terminal
- **Check it's working?** Refresh your Vercel app and see scores appear
- **Stop the script?** Press `Ctrl+C`

## Automation Options

### Windows Task Scheduler
Run every hour automatically:
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at startup
4. Action: Start program
5. Program: `node`
6. Arguments: `C:\Users\eLab\soccer\scripts\fetch-scores-local.js --watch`

### Manual Schedule
Just run with `--watch` and leave the terminal open!

---

## Gameweek Points System

### Complete Workflow (3 Steps)

**Step 1: Lock Squads (Friday 14:00 UTC)**
```bash
node scripts/lock-gameweek-squads.js
```
This snapshots all users' squads at lock time. Users cannot cheat by changing squads after seeing match results!

**Step 2: Fetch Scores (During Gameweek - Fri-Mon)**
```bash
node scripts/fetch-scores-local.js
```
Run this multiple times during the gameweek to get latest player scores.

**Step 3: Calculate Points (After Monday 22:00 UTC)**
```bash
node scripts/calculate-gameweek-points.js
```
Calculates final points for all users based on their locked squads.

### Important Notes

- **ALWAYS lock squads first** (Friday 14:00) before matches start
- Calculate points uses the **locked snapshot** from lock time, not current squads
- This prevents cheating - users can't change squads after seeing scores

### Manual Gameweek Number

You can specify gameweek number for any script:
```bash
node scripts/lock-gameweek-squads.js 1
node scripts/calculate-gameweek-points.js 1
```

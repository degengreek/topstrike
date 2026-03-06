# Local Score Fetcher

This script runs on your local machine to fetch player scores from TopStrike API and update your Supabase database.

## Why Local?

Cloudflare blocks server requests from Vercel, but local requests work fine. This script:
- ✅ Runs on your computer (bypasses Cloudflare)
- ✅ Fetches real scores from TopStrike API
- ✅ Updates Supabase database directly
- ✅ Can run continuously in the background
- ✅ Your Vercel app reads scores from database automatically

## Setup

1. **Make sure `.env.local` has these variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://kricmstshlkaxpbzeucb.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Add player IDs to database first** (one-time setup):
   - The script will automatically detect players from the `player_scores` table
   - Or you can manually add them via Supabase dashboard

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

📊 Found 22 players in database

  🔍 Fetching Reece James (ID: 14)...
  ✅ Reece James: 34 pts vs Arsenal

  🔍 Fetching Jamal Musiala (ID: 70)...
  ✅ Jamal Musiala: 28 pts vs Dortmund

💾 Saving scores to database...

✅ Successfully updated scores!
📈 Total: 450 pts | Average: 20 pts
📊 22/22 players with scores
```

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

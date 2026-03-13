# Injury Tracking System - Setup & Testing Guide

## ✅ Implementation Complete!

The injury tracking system has been fully implemented. Here's what was built:

### 📁 Files Created

1. **`supabase/migrations/create_injury_status_table.sql`**
   - SQL migration to create the `injury_status` table
   - Includes RLS policies and indexes

2. **`lib/injury-data.ts`**
   - Contains 78 injuries from SportsGambler
   - Update this file weekly with fresh data

3. **`scripts/sync-injuries.ts`**
   - Syncs injury data to Supabase
   - Fuzzy matches player names
   - Logs matched and unmatched injuries

4. **`daily_update.bat`**
   - Batch file to run sync script
   - For manual and automated runs

5. **`app/components/InjuriesTab.tsx`**
   - UI component showing injuries/suspensions
   - Fetches from Supabase in real-time

### 🔄 Files Modified

- **`package.json`** - Added `sync-injuries` script
- **`app/components/MainDashboard.tsx`** - Added Injuries tab
- **`app/components/Header.tsx`** - Added "Injuries/Suspensions" tab button

---

## 🚀 Setup Instructions

### Step 1: Create Supabase Table

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/create_injury_status_table.sql`
4. Copy all the SQL and paste into Supabase SQL Editor
5. Click **Run** to create the table

**Verify:**
- Go to **Table Editor** → you should see `injury_status` table

### Step 2: Test the Sync Script (Manual Run)

Open terminal in `C:\Users\eLab\soccer` and run:

```bash
npm run sync-injuries
```

**Expected Output:**
```
🏥 TopStrike Injury Sync
============================================================
Injury data last updated: 2026-03-13
Total injuries to process: 78

📊 Loaded 176 valid TopStrike players

🔍 Matching injuries to players...

  ✅ 🤕 Erling Haaland → ID 134 (Erling Haaland)
  ✅ 🤕 Bruno Guimaraes → ID 27 (Bruno Guimaraes)
  ✅ ⛔ Micky van de Ven → ID 33 (Micky van de Ven)
  ...

============================================================
✅ Matched: 21 injuries
❌ Unmatched: 57 injuries (not in TopStrike DB)

❌ Unmatched Injuries:
  • Reiss Nelson (Arsenal) - Calf injury
  • Leandro Trossard (Arsenal) - Knock
  ...

☁️  Updating Supabase...
✅ Supabase updated successfully!

📊 Summary:
   • Total injuries processed: 78
   • Matched to TopStrike players: 21
   • Not in database: 57
   • Injured: 18
   • Suspended: 3

🎉 Sync complete!
```

**Verify in Supabase:**
- Go to **Table Editor** → `injury_status` table
- Should see ~21 rows with player data

### Step 3: Test the UI

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open: http://localhost:3000

3. Sign in with Twitter (if needed)

4. Link your wallet (if needed)

5. Click the **"🤕 Injuries/Suspensions"** tab

**Expected:**
- See stats cards showing injured/suspended counts
- See list of injured players with details
- See list of suspended players with details
- Shows expected return dates

---

## 🤖 Automate Daily Sync

### Windows Task Scheduler Setup

1. Open **Task Scheduler** (search in Start menu)

2. Click **"Create Basic Task"**

3. Name: `TopStrike Injury Sync`

4. Trigger: **Daily** at **6:00 AM**

5. Action: **Start a Program**
   - Program: `C:\Users\eLab\soccer\daily_update.bat`
   - Arguments: `auto` (prevents pause)
   - Start in: `C:\Users\eLab\soccer`

6. Click **Finish**

**Test it:**
- Right-click task → **Run**
- Check if it runs successfully

---

## 📅 Weekly Workflow

### Update Injury Data (Every Monday)

1. Visit: https://www.sportsgambler.com/injuries/football/

2. Open: `lib/injury-data.ts`

3. Update the `INJURY_DATA` array with fresh injuries:
   ```typescript
   { player: "Player Name", team: "Team", position: "Position", injury: "Type", return_date: "2026-04-11" },
   ```

4. Update `LAST_UPDATED` date

5. Run sync manually:
   ```bash
   npm run sync-injuries
   ```

6. Verify in UI that data is updated

---

## 🧪 Testing Checklist

Before going live, verify:

- [ ] Supabase table created successfully
- [ ] Sync script runs without errors
- [ ] ~21 injuries matched to TopStrike players
- [ ] Unmatched injuries logged (57 players not in DB)
- [ ] Website loads without errors
- [ ] Injuries tab appears in header
- [ ] Injuries tab shows data from Supabase
- [ ] Injured players display with red emoji 🤕
- [ ] Suspended players display with orange emoji ⛔
- [ ] Return dates show correctly
- [ ] Empty state shows when no injuries
- [ ] Last updated timestamp displays
- [ ] Task Scheduler runs daily automation

---

## 🔧 Troubleshooting

### "Missing Supabase credentials"
- Check `.env.local` has:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  ```

### "Table doesn't exist"
- Run the SQL migration in Supabase dashboard
- Check Table Editor to verify `injury_status` exists

### "No injuries showing in UI"
- Check browser console for errors
- Verify sync script ran successfully
- Check Supabase table has data

### "Player not matching"
Example: "Mohamed Salah" vs "Mo Salah"

The fuzzy matching should handle this (90%+ similarity), but if it doesn't:
- Check the exact spelling in `lib/injury-data.ts`
- Check the exact spelling in `public/player-database.json`
- They should be similar enough for matching

### "Daily automation not running"
- Check Task Scheduler shows "Ready" status
- Run task manually to test
- Check task history for errors

---

## 📊 Expected Match Rate

**Current Database:**
- 185 TopStrike players
- 78 injuries tracked
- ~21 expected matches (27% match rate)

**Why only 27%?**
- SportsGambler covers ALL teams
- TopStrike DB focuses on fantasy-relevant players
- Many injured players aren't in your database

**To improve match rate:**
- Add more players to TopStrike database
- Or ignore unmatched injuries (they're not relevant)

---

## 🎯 Success Metrics

The system is working if:

✅ Sync runs daily without errors
✅ ~21 injuries show in UI
✅ Return dates are accurate
✅ UI updates automatically after sync
✅ No manual Vercel deploys needed
✅ Weekly data updates take < 10 minutes

---

## 📝 Next Steps (Optional Enhancements)

Future improvements you could add:

1. **Squad Builder Integration**
   - Show injury warning when selecting injured player
   - Highlight injured players in player pool

2. **Notifications**
   - Email when key player gets injured
   - Discord webhook with daily injury report

3. **Historical Tracking**
   - Track injury history over time
   - Show injury-prone players

4. **More Leagues**
   - Add La Liga injuries
   - Add more European leagues

5. **Auto-Scraping**
   - Automate SportsGambler data fetch (requires Playwright/Selenium)
   - Eliminate manual weekly updates

---

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Check sync script output for clues
3. Verify Supabase table structure matches schema
4. Test with manual sync first before automation

---

**System is ready to use!** 🎉

Run `npm run sync-injuries` to test it now.

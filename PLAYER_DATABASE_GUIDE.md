# 🗄️ Player Database System

## Overview

Instead of querying TheSportsDB API on every wallet search, we now use a **cached player database** that's built once and reused!

## How It Works

```
┌─────────────────────────┐
│ 1. Build Database       │ ← Run once (or periodically)
│    npm run build-db     │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│ TopStrike Contract      │
│ • Fetch all 148 players │
│ • Get their names       │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│ TheSportsDB API         │
│ • Search each player    │
│ • Get image/position    │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│ player-database.json    │
│ • Saved in /public      │
│ • 148 players cached    │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│ 2. User Searches Wallet │
│    On the website       │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│ Load from Cache         │
│ • Instant lookup by ID  │
│ • No API calls needed!  │
└─────────────────────────┘
```

## Benefits

✅ **Fast** - No waiting for TheSportsDB API calls
✅ **Reliable** - No rate limiting during wallet searches
✅ **Offline-ready** - Works even if TheSportsDB is down
✅ **Consistent** - Same data for all users
✅ **Scalable** - Handle thousands of wallet searches

## Commands

### Build the Database (First Time Setup)

```bash
npm run build-db
```

**What it does:**
1. Connects to TopStrike contract on MegaETH
2. Fetches all player names
3. Searches TheSportsDB for each player
4. Saves to `public/player-database.json`

**Time:** ~2-3 minutes (148 players × 1 second delay)

**Note:** TheSportsDB free tier has rate limits. Some players may not be found due to:
- Rate limiting (gets HTML error page)
- Player not in database (Nico O'Reilly, etc.)
- Name mismatch (apostrophes, special characters)

### Rebuild the Database (Update)

Run the same command to refresh the data:

```bash
npm run build-db
```

**When to rebuild:**
- TopStrike adds new players
- Player transfers to new teams
- Need to retry failed lookups

## Files

### `scripts/build-player-database.ts`
The script that builds the database.

### `public/player-database.json`
The cached database (auto-generated).

**Structure:**
```json
[
  {
    "id": 1,
    "name": "Trent Alexander-Arnold",
    "imageUrl": "https://...",
    "position": "Right-Back",
    "team": "Liverpool",
    "sportsDbId": "34161586"
  },
  ...
]
```

### `lib/player-cache.ts`
Helper functions to load and use the cache.

**Functions:**
- `loadPlayerDatabase()` - Loads cache from `/player-database.json`
- `getPlayerFromCache(playerId)` - Lookup by TopStrike ID
- `isDatabaseLoaded()` - Check if cache is ready

### `app/components/Dashboard.tsx`
Uses the cache when available, falls back to live API if not.

## Database Format

Each player entry contains:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | number | TopStrike player ID | 1 |
| `name` | string | Player full name | "Trent Alexander-Arnold" |
| `imageUrl` | string\|null | Player image URL | "https://..." |
| `position` | string\|null | Position from SportsDB | "Right-Back" |
| `team` | string\|null | Current team | "Liverpool" |
| `sportsDbId` | string\|null | TheSportsDB player ID | "34161586" |

## Missing Players (Manual Overrides)

For players not found by the script, add to `lib/player-overrides.ts`:

```typescript
export const PLAYER_OVERRIDES: Record<string, string> = {
  "Nico O'Reilly": "34244585",
  // Add more here
}
```

The app will use these IDs to lookup players via TheSportsDB's lookup API.

## Rate Limiting

TheSportsDB free API limits:
- **Unknown exact limit** (likely ~50-100 requests per minute)
- **Response:** HTML error page instead of JSON
- **Mitigation:** 1 second delay between requests (controlled in script)

## Fallback Behavior

1. **Cache loaded** → Use cached data ⚡
2. **Cache not loaded** → Query TheSportsDB live API 🌐
3. **Player not in cache** → Query TheSportsDB live API 🌐
4. **Player has override** → Use lookup API with override ID 🔧

## Stats

After running `npm run build-db`, you'll see stats:

```
✅ Player database saved to: /path/to/public/player-database.json
📊 Stats:
   Total players: 148
   Found on SportsDB: 95
   Not found: 53
```

## Troubleshooting

### "Player database not found" warning in console
- **Cause:** You haven't run `npm run build-db` yet
- **Fix:** Run `npm run build-db`
- **Impact:** App still works, just uses live API (slower)

### Many players showing as "Not found"
- **Cause:** TheSportsDB rate limiting during build
- **Fix:** Wait a few minutes and run `npm run build-db` again
- **Alternative:** Add manual overrides for important players

### Database is outdated
- **Cause:** Database was built weeks/months ago
- **Fix:** Run `npm run build-db` to refresh

### Specific player always missing
- **Cause:** Player not in TheSportsDB or name mismatch
- **Fix:** Add to `lib/player-overrides.ts` with their SportsDB ID

## Performance Comparison

### Before (Live API)
- Search wallet with 11 players
- 11 × TheSportsDB API calls
- ~2-5 seconds total
- Rate limit risk
- Can fail if API is down

### After (Cached Database)
- Search wallet with 11 players
- 0 API calls
- ~instant lookups
- No rate limits
- Works offline

## Future Improvements

1. **Auto-rebuild** - Scheduled task to rebuild database daily
2. **Incremental updates** - Only fetch new/changed players
3. **Multiple sources** - Combine TheSportsDB + other APIs
4. **User contributions** - Let users submit correct player data
5. **Versioning** - Track database version for cache invalidation

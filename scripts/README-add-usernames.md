# Add TopStrike Usernames Script

Quick script to extract wallet addresses and usernames from TopStrike activity JSON.

## Usage

1. **Run the script:**
   ```bash
   node scripts/add-usernames.js
   ```

2. **Paste the activity JSON** from TopStrike API response

3. **Press Enter twice** (empty line) to process

4. **Repeat** for more entries or type `exit` to quit

## Example Input

Paste JSON like this:
```json
{
  "activity": [
    {
      "type": "trade",
      "trade": {
        "trader": "0xcea46daf960e65a56350b6968c40bb9cb1fb81a4",
        ...
      },
      "username": "xxbozohead"
    }
  ]
}
```

## What It Does

- ✅ Extracts `trader` (wallet) and `username` from each activity
- ✅ Automatically updates `lib/topstrike-usernames.ts`
- ✅ Skips duplicates (only adds new wallets)
- ✅ Updates existing entries if username changed
- ✅ Sorts entries alphabetically

## Output

```
✅ Adding: 0xcea46daf... -> xxbozohead
💾 Saved! Added: 1, Updated: 0
📈 Total usernames: 15
```

/**
 * Interactive script to add TopStrike usernames from activity JSON
 *
 * Usage:
 * 1. Run: node scripts/add-usernames.js
 * 2. Paste the activity JSON
 * 3. Press Enter twice (empty line to process)
 * 4. Repeat or type 'exit' to quit
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const USERNAMES_FILE = path.join(__dirname, '../lib/topstrike-usernames.ts')

// Read existing usernames
function readExistingUsernames() {
  try {
    const content = fs.readFileSync(USERNAMES_FILE, 'utf8')
    const match = content.match(/export const TOPSTRIKE_USERNAMES[^{]*{([^}]*)}/s)

    if (!match) return {}

    const entries = {}
    const lines = match[1].split('\n')

    for (const line of lines) {
      const entryMatch = line.match(/"(0x[a-fA-F0-9]+)":\s*"([^"]+)"/)
      if (entryMatch) {
        entries[entryMatch[1].toLowerCase()] = entryMatch[2]
      }
    }

    return entries
  } catch (err) {
    console.error('Error reading file:', err.message)
    return {}
  }
}

// Write updated usernames
function writeUsernames(usernames) {
  const entries = Object.entries(usernames)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([wallet, username]) => `  "${wallet}": "${username}",`)
    .join('\n')

  const content = `/**
 * TopStrike Username Mapping
 * Manual mapping of wallet addresses to TopStrike usernames
 *
 * Add entries as you discover users' TopStrike usernames:
 * "walletAddress": "topStrikeUsername"
 */

export const TOPSTRIKE_USERNAMES: Record<string, string> = {
${entries}
}

/**
 * Get TopStrike username for a wallet address
 * Returns null if no mapping exists
 */
export function getTopStrikeUsername(walletAddress: string): string | null {
  const normalizedAddress = walletAddress.toLowerCase()
  return TOPSTRIKE_USERNAMES[normalizedAddress] || null
}
`

  fs.writeFileSync(USERNAMES_FILE, content, 'utf8')
}

// Extract usernames from activity JSON
function extractUsernames(jsonText) {
  try {
    const data = JSON.parse(jsonText)
    const usernames = {}

    if (!data.activity || !Array.isArray(data.activity)) {
      console.log('⚠️  No activity array found in JSON')
      return usernames
    }

    for (const item of data.activity) {
      if (item.trade && item.trade.trader && item.username) {
        const wallet = item.trade.trader.toLowerCase()
        const username = item.username
        usernames[wallet] = username
      }
    }

    return usernames
  } catch (err) {
    console.error('❌ Error parsing JSON:', err.message)
    return {}
  }
}

// Main interactive loop
async function main() {
  console.log('🎯 TopStrike Username Extractor')
  console.log('================================\n')
  console.log('Paste activity JSON, then press Enter twice to process')
  console.log('Type "exit" to quit\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  let buffer = []
  let waitingForEmpty = false

  rl.on('line', (line) => {
    if (line.trim().toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!')
      rl.close()
      return
    }

    if (line.trim() === '') {
      if (buffer.length > 0) {
        // Process the buffered input
        const jsonText = buffer.join('\n')
        console.log('\n📊 Processing...')

        const existing = readExistingUsernames()
        const extracted = extractUsernames(jsonText)

        let added = 0
        let updated = 0

        for (const [wallet, username] of Object.entries(extracted)) {
          if (existing[wallet]) {
            if (existing[wallet] !== username) {
              console.log(`🔄 Updating: ${wallet} -> ${username} (was: ${existing[wallet]})`)
              existing[wallet] = username
              updated++
            }
          } else {
            console.log(`✅ Adding: ${wallet} -> ${username}`)
            existing[wallet] = username
            added++
          }
        }

        if (added > 0 || updated > 0) {
          writeUsernames(existing)
          console.log(`\n💾 Saved! Added: ${added}, Updated: ${updated}`)
          console.log(`📈 Total usernames: ${Object.keys(existing).length}\n`)
        } else {
          console.log('\n⚠️  No new usernames found\n')
        }

        buffer = []
        console.log('Paste next JSON or type "exit":\n')
      }
    } else {
      buffer.push(line)
    }
  })

  rl.on('close', () => {
    process.exit(0)
  })
}

main()

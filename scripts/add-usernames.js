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

// Extract usernames from any text (flexible, no strict JSON needed)
function extractUsernames(text) {
  const usernames = {}

  // Find all wallet addresses (trader)
  const traderMatches = text.matchAll(/"trader":\s*"(0x[a-fA-F0-9]{40})"/g)
  const traders = [...traderMatches].map(m => m[1].toLowerCase())

  // Find all usernames
  const usernameMatches = text.matchAll(/"username":\s*"([^"]+)"/g)
  const usernamesList = [...usernameMatches].map(m => m[1])

  console.log(`🔍 Found ${traders.length} trader(s), ${usernamesList.length} username(s)`)

  // Match them up (assuming they appear in same order)
  const minLength = Math.min(traders.length, usernamesList.length)

  for (let i = 0; i < minLength; i++) {
    usernames[traders[i]] = usernamesList[i]
    console.log(`   👉 ${traders[i]} -> ${usernamesList[i]}`)
  }

  if (Object.keys(usernames).length === 0) {
    console.log('⚠️  No trader/username pairs found')
    console.log('💡 Make sure text contains: "trader": "0x..." and "username": "..."')
  }

  return usernames
}

// Main interactive loop
async function main() {
  console.log('🎯 TopStrike Username Extractor')
  console.log('================================\n')
  console.log('Instructions:')
  console.log('1. Paste ANY text containing "trader" and "username" fields')
  console.log('2. Press Enter twice (empty line) to process')
  console.log('3. Type "exit" to quit\n')

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

        console.log(`📦 Existing entries: ${Object.keys(existing).length}`)
        console.log(`📦 Extracted entries: ${Object.keys(extracted).length}`)

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

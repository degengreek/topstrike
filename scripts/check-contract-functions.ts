/**
 * Check all available contract functions to find player metadata
 */

import { ethers } from 'ethers'

const RPC_URL = 'https://rpc-megaeth-mainnet.globalstake.io'
const CONTRACT_ADDRESS = '0xf3393dC9E747225FcA0d61BfE588ba2838AFb077'

// Try to get contract interface to see all functions
async function checkContractFunctions() {
  const provider = new ethers.JsonRpcProvider(RPC_URL)

  // Get contract code to analyze
  const code = await provider.getCode(CONTRACT_ADDRESS)
  console.log('Contract has code:', code !== '0x')

  // Try calling a test player to see available data
  const testABI = [
    'function players(uint256) view returns (string name, bool tradingEnabled, uint256 ipoWindowStartTimestamp, uint256 ipoWindowEndTimestamp)',
    'function tokenURI(uint256 tokenId) view returns (string)',
  ]

  const contract = new ethers.Contract(CONTRACT_ADDRESS, testABI, provider)

  try {
    const player10 = await contract.players(10)
    console.log('\nPlayer 10 data:', player10)
  } catch (err) {
    console.log('Players function:', err)
  }

  try {
    const uri = await contract.tokenURI(10)
    console.log('\nToken URI:', uri)
  } catch (err) {
    console.log('No tokenURI function or error:', err)
  }
}

checkContractFunctions().catch(console.error)

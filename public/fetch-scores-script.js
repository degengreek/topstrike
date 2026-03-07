/**
 * TopStrike Score Fetcher
 * Run this script on https://play.topstrike.io in the browser console
 * It will fetch all player scores and send them to your app
 */

(async function() {
  const API_URL = 'https://topstrike-squad-viewer.vercel.app/api/scores/save-scores'; // Update with your domain
  const PLAYER_IDS = [14, 70, 86]; // Add your player IDs here

  console.log('🚀 Starting TopStrike Score Fetch...');
  console.log(`📊 Fetching scores for ${PLAYER_IDS.length} players...`);

  const scores = [];

  for (const playerId of PLAYER_IDS) {
    try {
      console.log(`🔍 Fetching player ${playerId}...`);

      const response = await fetch(
        `https://play.topstrike.io/api/fapi-server/player-match-history?tokenId=${playerId}&limit=1`
      );

      if (!response.ok) {
        console.error(`❌ Failed for player ${playerId}: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const match = data[0];
        scores.push({
          player_id: playerId.toString(),
          player_name: `Player ${playerId}`,
          most_recent_score: match.totalScore,
          match_date: match.matchDate,
          match_opponent: match.opponentName,
          match_state: match.matchState
        });
        console.log(`✅ Player ${playerId}: ${match.totalScore} points`);
      } else {
        console.log(`⚠️ No matches for player ${playerId}`);
        scores.push({
          player_id: playerId.toString(),
          player_name: `Player ${playerId}`,
          most_recent_score: 0,
          match_date: null,
          match_opponent: null,
          match_state: null
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error fetching player ${playerId}:`, error);
    }
  }

  console.log('📦 Fetched scores:', scores);
  console.log('💾 Sending to database...');

  // Send to your API
  try {
    const saveResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ scores })
    });

    if (saveResponse.ok) {
      console.log('✅ Successfully saved scores to database!');
      console.log('🎉 Done! You can close this tab and refresh your app.');
    } else {
      console.error('❌ Failed to save scores:', await saveResponse.text());
      console.log('📋 Copy this data and paste it in the admin page:');
      console.log(JSON.stringify(scores, null, 2));
    }
  } catch (error) {
    console.error('❌ Error saving scores:', error);
    console.log('📋 Copy this data and paste it in the admin page:');
    console.log(JSON.stringify(scores, null, 2));
  }
})();

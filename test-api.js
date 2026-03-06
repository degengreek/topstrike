// Test TopStrike player scores API
const cookies = "privy-session=privy.topstrike.io; cf_clearance=6pN8bmx6HUqupsEM_iA7fv_IAKfwtU_djcwpNKfrNow-1772023637-1.2.1.1-2yLXScwkku6mh7vyfAyQwgnHJTiLY2PPnL_5nSCNWNGQA92l7UqH6KmzwqQK8aSWpWsVQ0XX.wan7ICFjcFkEiXTG_yDmt.gDlwVwYgcpQ_by1XHaOhylCbhMNfu5Ls43Jsmf5uai58Vbvf.pEWK0LiFowLMmA_M.hhuDFD0eTWzNsCNqTceVCn2cRaIFbyFKY1pjiI0o4VzUO0ZX_QeE8E8a8ieg.FgRtHFs1qtFEQ; privy-token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjBuSlA5dXBITUlsaEtXcTZ4a1E2QUMxcmNWcHRwbE15Vi1tRzlLNEx6cEUifQ.eyJzaWQiOiJjbWxpYWRwM3kwMW4wamswYzFwa3NxdjVoIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzI2MjI0NzMsImF1ZCI6ImNtYm5iM2NtNzAxZXRsYTBsMnJjN3JmY3YiLCJzdWIiOiJkaWQ6cHJpdnk6Y21oZmFvYzR3MDBsZWw1MGNvc2RrM2M0YyIsImV4cCI6MTc3MjYyNjA3M30.-vsfGhAiRg8LC3ekgFP3sypu7HEtGEOnNxdung21Ys1WisLWJKRGOYlVe9WQf81siCes5GmJLzOb_Q_DInFnLA; privy-id-token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjBuSlA5dXBITUlsaEtXcTZ4a1E2QUMxcmNWcHRwbE15Vi1tRzlLNEx6cEUifQ.eyJjciI6IjE3NjE5NDE4MzQiLCJsaW5rZWRfYWNjb3VudHMiOiJbe1widHlwZVwiOlwidHdpdHRlcl9vYXV0aFwiLFwic3ViamVjdFwiOlwiMTQ2OTk1ODY5Nzg3NTA4NzM2MlwiLFwidXNlcm5hbWVcIjpcIm5mdF9waWxvdFwiLFwibmFtZVwiOlwiS3JvdVwiLFwicGZwXCI6XCJodHRwczovL3Bicy50d2ltZy5jb20vcHJvZmlsZV9pbWFnZXMvMTgxNDM0Njc3MjI1NDE4NzUyMC84R3U0OU9fdl9ub3JtYWwuanBnXCIsXCJsdlwiOjE3NzA4Mjk4NjV9LHtcImlkXCI6XCJoMTJ6bDRvbmxsbGI5eWRjOGFxMmx4bTZcIixcInR5cGVcIjpcIndhbGxldFwiLFwiYWRkcmVzc1wiOlwiMHgxMEYwZTY0NEQyZEFDOWY1MzExQmY2N2M3NWM4QTY3ZDA4MzAyRDhDXCIsXCJjaGFpbl90eXBlXCI6XCJldGhlcmV1bVwiLFwid2FsbGV0X2NsaWVudF90eXBlXCI6XCJwcml2eVwiLFwibHZcIjoxNzYxOTQxODM1fV0iLCJpc3MiOiJwcml2eS5pbyIsImlhdCI6MTc3MjYyMjQ3NywiYXVkIjoiY21ibmIzY203MDFldGxhMGwycmM3cmZjdiIsInN1YiI6ImRpZDpwcml2eTpjbWhmYW9jNHcwMGxlbDUwY29zZGszYzRjIiwiZXhwIjoxNzcyNjI2MDc3fQ.nAfh0xT7Uko2GZzM3ycn0Wbr23Gb3HvWJiVeexOSyN_o8UUo1oSc8CPLYbMv0HlLHpX8logGXD0ykHjwfClH2w";

async function testAPI() {
  try {
    console.log('Testing TopStrike player scores API...');
    console.log('Date: 2026-03-03\n');

    const response = await fetch(
      'https://play.topstrike.io/api/fapi-server/playerScoresForDate?date=2026-03-03',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Cookie': cookies,
          'Origin': 'https://play.topstrike.io',
          'Referer': 'https://play.topstrike.io/',
        }
      }
    );

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.log('\nError response:');
      console.log(text.substring(0, 500));
      return;
    }

    const data = await response.json();
    console.log('\n✅ SUCCESS! Got data:');
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));
    console.log('\n... (truncated)');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();

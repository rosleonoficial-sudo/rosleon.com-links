async function testYtAnalytics() {
  const ytKey = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || "AIzaSyC2iaAWsA_rE_7-asbQiI0Aso6Cu3OBXn0";
  console.log('Testing YouTube Analytics API with API Key...');
  
  // Endpoint for YouTube Analytics API:
  // https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=2020-01-01&endDate=2026-08-25&metrics=shares&dimensions=video&key=...
  const url = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=2020-01-01&endDate=2026-08-25&metrics=shares&dimensions=video&key=${ytKey}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

testYtAnalytics().catch(console.error);

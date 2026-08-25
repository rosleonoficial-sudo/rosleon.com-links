const http = require('http');

function apiCall(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${path}`, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function auditAll833() {
  console.log('Fetching all 833 contents from server...');
  let allContents = [];
  let page = 1;
  while (true) {
    const res = await apiCall(`/api/results/search?page=${page}&limit=100`);
    if (!res.contents || res.contents.length === 0) break;
    allContents.push(...res.contents);
    if (allContents.length >= res.pagination.total) break;
    page++;
  }

  console.log(`TOTAL CONTENTS FETCHED: ${allContents.length}`);

  // Check how many have empty primaryBrands
  const emptyPrimary = allContents.filter(c => {
    const pBrands = c.classification?.primaryBrands || [];
    return pBrands.length === 0;
  });

  console.log(`Contents with EMPTY primaryBrands: ${emptyPrimary.length}`);

  console.log('\n--- SAMPLE CONTENTS WITH EMPTY primaryBrands ---');
  emptyPrimary.slice(0, 50).forEach((c, idx) => {
    console.log(`[${idx+1}] ID: ${c.id} | Platform: ${c.platform} | Title: "${c.title}"`);
    console.log(`    PrimaryProds: ${JSON.stringify(c.classification?.primaryProducts)} | SecBrands: ${JSON.stringify(c.classification?.secondaryBrands)}`);
  });

  // Collect potential brand names appearing in titles
  // Common brands/words in titles:
  const wordFrequency = {};
  allContents.forEach(c => {
    const words = (c.title || '').replace(/[^\w\s-]/gi, ' ').split(/\s+/);
    words.forEach(w => {
      if (w.length >= 3) {
        const cleanW = w.toLowerCase();
        wordFrequency[cleanW] = (wordFrequency[cleanW] || 0) + 1;
      }
    });
  });

  console.log('\nTop words in titles:');
  const sortedWords = Object.entries(wordFrequency).sort((a,b) => b[1] - a[1]).slice(0, 60);
  console.log(sortedWords.map(([w, count]) => `${w}: ${count}`).join(', '));
}

auditAll833();

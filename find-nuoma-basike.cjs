const http = require('http');

function apiCall(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function searchAll() {
  let allContents = [];
  let page = 1;
  while (true) {
    const res = await apiCall(`/api/results?page=${page}&limit=100`);
    const items = res.contents || [];
    if (items.length === 0) break;
    allContents.push(...items);
    if (allContents.length >= res.pagination.total) break;
    page++;
  }

  const matches = allContents.filter(c => {
    const t = c.title || '';
    const d = c.description || '';
    const text = (t + ' ' + d).toLowerCase();
    return text.includes('nuoma') || text.includes('basike') || text.includes('ip501') || text.includes('rad 289') || text.includes('289') || text.includes('x75') || text.includes('x39');
  });

  console.log(`Found ${matches.length} matching contents:`);
  matches.forEach(m => {
    console.log(`[ID ${m.id}] Platform: ${m.platform}`);
    console.log(`   Title: "${m.title}"`);
    console.log(`   Description: "${(m.description || '').slice(0, 100)}"`);
    console.log(`   PrimaryBrands: ${JSON.stringify(m.classification?.primaryBrands)} | PrimaryProds: ${JSON.stringify(m.classification?.primaryProducts)}`);
    console.log(`   SecondaryBrands: ${JSON.stringify(m.classification?.secondaryBrands)} | SecondaryProds: ${JSON.stringify(m.classification?.secondaryProducts)}`);
    console.log('---');
  });
}

searchAll();

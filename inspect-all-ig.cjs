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

async function inspectAllIg() {
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

  console.log(`Total contents retrieved: ${allContents.length}`);
  const igItems = allContents.filter(c => c.platform === 'instagram');
  console.log(`Total Instagram items: ${igItems.length}`);

  igItems.forEach(c => {
    console.log(`[ID ${c.id}] Title: "${c.title}"`);
    console.log(`   URL: ${c.url}`);
    console.log(`   Brands: ${JSON.stringify(c.brands)}`);
    console.log(`   Classification: ${JSON.stringify(c.classification)}`);
    console.log(`   Description: "${(c.description || '').slice(0, 150)}"`);
    console.log('---');
  });
}

inspectAllIg();

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

async function inspectTitles() {
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

  console.log(`Inspecting all ${allContents.length} items for white label/equivalent patterns...`);
  allContents.forEach(c => {
    const title = c.title || '';
    const desc = c.description || '';
    const full = (title + ' ' + desc).toLowerCase();

    if (full.includes('nuoma') || full.includes('ip501') || full.includes('rad 289') || full.includes('x75') || full.includes('x39') || full.includes('conhecida') || full.includes('projeto') || full.includes('equivalente') || full.includes('white label') || full.includes('whitelabel')) {
      console.log(`[ID ${c.id}] Platform: ${c.platform}`);
      console.log(`   Title: "${title}"`);
      console.log(`   Brands: ${JSON.stringify(c.brands)}`);
      console.log(`   Classification: ${JSON.stringify(c.classification)}`);
      console.log('---');
    }
  });
}

inspectTitles();

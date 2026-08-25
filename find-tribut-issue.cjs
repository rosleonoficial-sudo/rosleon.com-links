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

async function inspect() {
  const bomberRes = await apiCall('/api/results?q=Bomber&limit=100');
  const items = bomberRes.data || bomberRes.contents || [];
  console.log(`Searching q=Bomber returned ${items.length} results:`);
  items.forEach(c => {
    console.log(`[ID ${c.id}] Platform: ${c.platform} | Title: "${c.title}"`);
    console.log(`  PrimaryBrands: ${JSON.stringify(c.classification ? c.classification.primaryBrands : c.brands)}`);
    console.log(`  PrimaryProducts: ${JSON.stringify(c.classification ? c.classification.primaryProducts : [])}`);
  });

  console.log('\n--- Searching q=Tribut ---');
  const tributRes = await apiCall('/api/results?q=Tribut&limit=100');
  const tributItems = tributRes.data || tributRes.contents || [];
  console.log(`Searching q=Tribut returned ${tributItems.length} results:`);
  tributItems.forEach(c => {
    console.log(`[ID ${c.id}] Platform: ${c.platform} | Title: "${c.title}"`);
    console.log(`  PrimaryBrands: ${JSON.stringify(c.classification ? c.classification.primaryBrands : c.brands)}`);
  });

  console.log('\n--- Searching q=Tribit ---');
  const tribitRes = await apiCall('/api/results?q=Tribit&limit=100');
  const tribitItems = tribitRes.data || tribitRes.contents || [];
  console.log(`Searching q=Tribit returned ${tribitItems.length} results:`);
  tribitItems.forEach(c => {
    console.log(`[ID ${c.id}] Platform: ${c.platform} | Title: "${c.title}"`);
    console.log(`  PrimaryBrands: ${JSON.stringify(c.classification ? c.classification.primaryBrands : c.brands)}`);
  });
}

inspect();

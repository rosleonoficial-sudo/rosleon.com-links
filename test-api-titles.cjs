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

async function findInCatalog() {
  const allRes = await apiCall('/api/results?limit=1000');
  console.log(`Total contents in API: ${allRes.contents.length}`);

  const terms = ['AIWA', 'Golden', 'Boombox 4', 'Boombox', 'JBL', 'Hopestar', 'WAAW', 'JOG', 'Joog'];

  terms.forEach(term => {
    const matched = allRes.contents.filter(item => item.title.toLowerCase().includes(term.toLowerCase()));
    console.log(`\n=== Matches for raw title containing "${term}": ${matched.length} ===`);
    matched.slice(0, 10).forEach(item => {
      console.log(`[ID ${item.id}] "${item.title}"`);
      console.log(`   -> Primary Brands: ${JSON.stringify(item.classification?.primaryBrands)} | Primary Prods: ${JSON.stringify(item.classification?.primaryProducts)}`);
      console.log(`   -> Sec Brands    : ${JSON.stringify(item.classification?.secondaryBrands)} | Sec Prods    : ${JSON.stringify(item.classification?.secondaryProducts)}`);
    });
  });
}

findInCatalog();

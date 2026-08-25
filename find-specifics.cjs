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

async function findSpecifics() {
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

  const triggers = [
    'nuoma', 'ip501', 'rad 289', 'rad289', 'x75', 'x39',
    'conhecida', 'projeto', 'equivalente', 'white label', 'whitelabel',
    'referencia', 'referência', 'mesma', 'mesmo'
  ];

  const found = allContents.filter(c => {
    const text = ((c.title || '') + ' ' + (c.description || '')).toLowerCase();
    return triggers.some(tr => text.includes(tr));
  });

  console.log(`Found ${found.length} items with triggers:`);
  found.forEach(c => {
    console.log(`ID ${c.id} | Title: "${c.title}"`);
    console.log(`  Class: ${JSON.stringify(c.classification)}`);
  });
}

findSpecifics();

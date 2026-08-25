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

async function debugServerItems() {
  console.log('1. Fetching all items (limit 100 per page)...');
  let allContents = [];
  let page = 1;
  while (true) {
    const res = await apiCall(`/api/results/search?page=${page}&limit=100`);
    if (!res.contents || res.contents.length === 0) break;
    allContents.push(...res.contents);
    if (allContents.length >= res.pagination.total) break;
    page++;
  }

  console.log(`TOTAL CONTENTS FETCHED FROM SERVER: ${allContents.length}`);

  console.log('\n=================== CHECK 1: ALL ITEMS WITH "IMENSO" IN CARD TAGS (item.brands) ===================');
  let countImensoTags = 0;
  allContents.forEach(item => {
    const brandNames = item.brands || [];
    const pBrands = item.classification?.primaryBrands || [];
    const sBrands = item.classification?.secondaryBrands || [];

    const hasImensoInTags = brandNames.some((b) => b.toLowerCase() === 'imenso');
    const hasImensoInPrimary = pBrands.some((b) => b.toLowerCase() === 'imenso');

    if (hasImensoInTags) {
      countImensoTags++;
      if (!hasImensoInPrimary) {
        console.log(`[ID ${item.id}] TITLE: "${item.title}"`);
        console.log(`   CARD TAGS (item.brands): ${JSON.stringify(brandNames)}`);
        console.log(`   primaryBrands: ${JSON.stringify(pBrands)} | primaryProducts: ${JSON.stringify(item.classification?.primaryProducts)}`);
        console.log(`   secondaryBrands: ${JSON.stringify(sBrands)} | secondaryProducts: ${JSON.stringify(item.classification?.secondaryProducts)}`);
        console.log(`   isPrimaryImenso? ❌ NO! (TAGGED WITH IMENSO BUT NOT PRIMARY!)`);
      }
    }
  });
  console.log(`Total items with IMENSO in CARD TAGS: ${countImensoTags}`);

  console.log('\n=================== CHECK 2: ITEMS WITH "IMENSO" IN PRIMARY BRANDS THAT MENTION OTHER BRANDS ===================');
  allContents.forEach(item => {
    const pBrands = item.classification?.primaryBrands || [];
    const pProds = item.classification?.primaryProducts || [];
    const sBrands = item.classification?.secondaryBrands || [];
    const sProds = item.classification?.secondaryProducts || [];
    const titleLower = (item.title || '').toLowerCase();

    if (pBrands.some((b) => b.toLowerCase() === 'imenso')) {
      const otherBrands = ['nuoma', 'zealot', 'basike', 'hopestar', 'xdobo', 'waaw', 'jbl', 'kaidi', 'kimaster'].filter(b => titleLower.includes(b));
      if (otherBrands.length > 0) {
        console.log(`\n[ID ${item.id}] TITLE: "${item.title}"`);
        console.log(`   primaryBrands: ${JSON.stringify(pBrands)} | primaryProducts: ${JSON.stringify(pProds)}`);
        console.log(`   secondaryBrands: ${JSON.stringify(sBrands)} | secondaryProducts: ${JSON.stringify(sProds)}`);
        console.log(`   isComparison: ${item.classification?.isComparison}`);
        console.log(`   CARD TAGS: ${JSON.stringify(item.brands)}`);
        console.log(`   DESC INTRO: ${(item.description || '').slice(0, 150)}`);
      }
    }
  });

  console.log('\n=================== CHECK 3: SEARCH FOR "IMENSO" ACROSS ALL PAGES ===================');
  let imensoSearchContents = [];
  page = 1;
  while (true) {
    const res = await apiCall(`/api/results/search?q=imenso&page=${page}&limit=100`);
    if (!res.contents || res.contents.length === 0) break;
    imensoSearchContents.push(...res.contents);
    if (imensoSearchContents.length >= res.pagination.total) break;
    page++;
  }

  console.log(`Total contents returned for q=imenso: ${imensoSearchContents.length}`);
  imensoSearchContents.forEach((item, idx) => {
    const pBrands = item.classification?.primaryBrands || [];
    const pProds = item.classification?.primaryProducts || [];
    const sBrands = item.classification?.secondaryBrands || [];
    const sProds = item.classification?.secondaryProducts || [];
    const titleLower = (item.title || '').toLowerCase();

    const hasPrimaryImenso = pBrands.some(b => b.toLowerCase() === 'imenso');
    if (!hasPrimaryImenso) {
      console.log(`\n🚨 FALSE POSITIVE #${idx + 1} [ID ${item.id}] TITLE: "${item.title}"`);
      console.log(`   pBrands: ${JSON.stringify(pBrands)} | pProds: ${JSON.stringify(pProds)}`);
      console.log(`   sBrands: ${JSON.stringify(sBrands)} | sProds: ${JSON.stringify(sProds)}`);
      console.log(`   aliases: ${JSON.stringify(item.classification?.aliases)}`);
      console.log(`   CARD TAGS: ${JSON.stringify(item.brands)}`);
      console.log(`   DESC INTRO: ${(item.description || '').slice(0, 150)}`);
    } else {
      // Check if title actually is primarily about another brand
      const otherBrands = ['nuoma', 'zealot', 'basike', 'hopestar', 'xdobo'].filter(b => titleLower.includes(b));
      if (otherBrands.length > 0) {
        console.log(`\n⚠️ QUESTIONABLE PRIMARY #${idx + 1} [ID ${item.id}] TITLE: "${item.title}"`);
        console.log(`   TITLE: "${item.title}"`);
        console.log(`   pBrands: ${JSON.stringify(pBrands)} | pProds: ${JSON.stringify(pProds)}`);
        console.log(`   sBrands: ${JSON.stringify(sBrands)} | sProds: ${JSON.stringify(sProds)}`);
        console.log(`   isComparison: ${item.classification?.isComparison}`);
        console.log(`   CARD TAGS: ${JSON.stringify(item.brands)}`);
      }
    }
  });
}

debugServerItems();

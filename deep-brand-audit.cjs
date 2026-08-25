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

async function deepBrandAudit() {
  let allContents = [];
  let page = 1;
  while (true) {
    const res = await apiCall(`/api/results/search?page=${page}&limit=100`);
    if (!res.contents || res.contents.length === 0) break;
    allContents.push(...res.contents);
    if (allContents.length >= res.pagination.total) break;
    page++;
  }

  console.log(`Total contents to analyze: ${allContents.length}`);

  // Fetch all brands currently registered
  const brandsRes = await apiCall('/api/brands');
  const catalogBrands = brandsRes.brands || [];
  console.log(`Catalog brands (${catalogBrands.length}):`, catalogBrands.map(b => b.name).join(', '));

  // Let's analyze every title and find words or multi-words that look like brand names
  // but are either missing from catalog, unclassified, or misplaced into secondary.

  const missingBrandCandidates = {};

  allContents.forEach(c => {
    const title = c.title || '';
    const desc = c.description || '';
    const pBrands = c.classification?.primaryBrands || [];
    const pProds = c.classification?.primaryProducts || [];
    const sBrands = c.classification?.secondaryBrands || [];
    const sProds = c.classification?.secondaryProducts || [];

    // Let's tokenize title
    const tokens = title.replace(/[^\w\s-]/gi, ' ').split(/\s+/).filter(t => t.length > 1);

    // Let's check known brand names in title vs pBrands
    // List of candidate brands to check in titles:
    const knownBrandList = [
      'Xdobo', 'Tribit', 'Sabala', 'Nuoma', 'Bomber', 'Basike', 'Imenso', 'JBL', 'WAAW', 
      'Tronsmart', 'Anker', 'Soundcore', 'Stage', 'EarFun', 'FAM', 'Kaidi', 'Kimaster',
      'Hmaston', "H'maston", 'AOC', 'Realme', 'Zealot', 'Joog', 'Pulse', 'Agold', 'Danx',
      'Mifa', 'Infinix', 'LG', 'Beats', 'W-king', 'Wking', 'Mlove', 'Fifine', 'Hopestar',
      'Armer', 'Byintek', 'Mercado Livre', 'UOL', 'SoundFi', 'KST', 'Lito', 'Awei'
    ];

    knownBrandList.forEach(brandCandidate => {
      const regex = new RegExp(`\\b${brandCandidate.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');
      if (regex.test(title)) {
        const pBrandsLower = pBrands.map(b => b.toLowerCase());
        const normCandidate = brandCandidate.toLowerCase();

        // Is it in primaryBrands?
        const isPrimary = pBrandsLower.includes(normCandidate) || 
          (normCandidate === 'bomber' && pBrandsLower.some(b => b.includes('bomber'))) ||
          (normCandidate === 'soundcore' && pBrandsLower.includes('anker')) ||
          (normCandidate === 'wking' && pBrandsLower.includes('w-king'));

        if (!isPrimary) {
          if (!missingBrandCandidates[brandCandidate]) {
            missingBrandCandidates[brandCandidate] = {
              candidate: brandCandidate,
              affectedCount: 0,
              examples: [],
              currentPBrands: [],
              causes: new Set()
            };
          }

          missingBrandCandidates[brandCandidate].affectedCount++;
          if (missingBrandCandidates[brandCandidate].examples.length < 3) {
            missingBrandCandidates[brandCandidate].examples.push({
              id: c.id,
              title: c.title,
              pBrands,
              sBrands
            });
          }
        }
      }
    });
  });

  console.log('\n=================== GLOBAL MISSING/MISCLASSIFIED BRAND AUDIT ===================');
  Object.values(missingBrandCandidates).forEach(item => {
    console.log(`\nMarca: "${item.candidate}" | Afetados: ${item.affectedCount}`);
    console.log('Exemplos de Títulos:');
    item.examples.forEach(ex => {
      console.log(`  - [ID ${ex.id}] "${ex.title}"`);
      console.log(`    Primary: ${JSON.stringify(ex.pBrands)} | Secondary: ${JSON.stringify(ex.sBrands)}`);
    });
  });
}

deepBrandAudit();

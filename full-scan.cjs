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

async function fullScan() {
  let allContents = [];
  let page = 1;
  while (true) {
    const res = await apiCall(`/api/results/search?page=${page}&limit=100`);
    if (!res.contents || res.contents.length === 0) break;
    allContents.push(...res.contents);
    if (allContents.length >= res.pagination.total) break;
    page++;
  }

  console.log(`TOTAL CONTENTS: ${allContents.length}`);

  // Expanded list of legitimate electronics/audio brands present in title/channel content
  const LEGIT_BRANDS = [
    { canonical: 'Xdobo', aliases: ['xdobo', 'xdobo prince', 'xdobo wow'] },
    { canonical: 'Tribit', aliases: ['tribit', 'tribit stormbox', 'tribit blast', 'tribit lava', 'stormbox'] },
    { canonical: 'Tronsmart', aliases: ['tronsmart', 'bang max', 'element mega'] },
    { canonical: 'Stage', aliases: ['stage', 'stage gofree', 'gofree', 'stage sound', 'earfun stage'] },
    { canonical: 'Anker', aliases: ['anker', 'soundcore', 'motion+', 'motion boom'] },
    { canonical: 'EarFun', aliases: ['earfun'] },
    { canonical: 'Sabala', aliases: ['sabala', 'dr-909', 'dr-300', 'dr909', 'dr300', 'dr107'] },
    { canonical: 'Nuoma', aliases: ['nuoma', 'nm-aip603', 'nm-aip601', 'aip603', 'aip601', 'aip-603', 'aip-601'] },
    { canonical: 'Bomber', aliases: ['bomber', 'bomberbass', 'bomberbox', 'bombertrolley', 'boomberbass', 'boomberbox', 'bomber trolley', 'bomber bass', 'bomber box'] },
    { canonical: 'Basike', aliases: ['basike', 'ba-rad', 'rad289', 'rad133', 'rad304', 'rad440', 'rad439', 'rad438'] },
    { canonical: 'Imenso', aliases: ['imenso', 'imenso x39', 'imenso x26', 'imenso x75', 'x39', 'x26', 'x75'] },
    { canonical: 'JBL', aliases: ['jbl', 'partybox', 'boombox', 'xtreme', 'charge', 'flip', 'gofree'] },
    { canonical: 'WAAW', aliases: ['waaw', 'waaw by alok', 'boombug'] },
    { canonical: 'Pulse', aliases: ['pulse', 'pulse x'] },
    { canonical: 'AOC', aliases: ['aoc'] },
    { canonical: 'Zealot', aliases: ['zealot', 'zealot s78', 'zealot s89'] },
    { canonical: 'Joog', aliases: ['joog', 'joog air'] },
    { canonical: 'Hopestar', aliases: ['hopestar', 'hopestar a60'] },
    { canonical: 'Kimaster', aliases: ['kimaster'] },
    { canonical: 'Kaidi', aliases: ['kaidi'] },
    { canonical: 'H\'Maston', aliases: ['hmaston', "h'maston", 'hmaston', 'h-maston'] },
    { canonical: 'FAM', aliases: ['fam'] },
    { canonical: 'Agold', aliases: ['agold'] },
    { canonical: 'Danx', aliases: ['danx'] },
    { canonical: 'Mifa', aliases: ['mifa', 'mirtune'] },
    { canonical: 'Infinix', aliases: ['infinix'] },
    { canonical: 'LG', aliases: ['lg', 'xboom'] },
    { canonical: 'Realme', aliases: ['realme'] },
    { canonical: 'Beats', aliases: ['beats'] },
    { canonical: 'W-King', aliases: ['w-king', 'wking', 'w king'] },
    { canonical: 'MLove', aliases: ['mlove'] },
    { canonical: 'Fifine', aliases: ['fifine'] },
    { canonical: 'Armer', aliases: ['armer'] },
    { canonical: 'Byintek', aliases: ['byintek'] },
    { canonical: 'SoundFi', aliases: ['soundfi'] },
    { canonical: 'OEK', aliases: ['oek'] },
    { canonical: 'Bigme', aliases: ['bigme'] },
    { canonical: 'Mercado Livre', aliases: ['mercado livre', 'mercadolivre'] },
    { canonical: 'UOL', aliases: ['uol', 'meunegocio'] }
  ];

  // Map to hold results per canonical brand
  const reportByBrand = {};

  allContents.forEach(c => {
    const title = c.title || '';
    const pBrands = c.classification?.primaryBrands || [];
    const pProds = c.classification?.primaryProducts || [];

    LEGIT_BRANDS.forEach(brandDef => {
      // Check if any alias matches in title
      let matchedInTitle = false;
      for (const alias of brandDef.aliases) {
        const regex = new RegExp(`\\b${alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');
        if (regex.test(title)) {
          matchedInTitle = true;
          break;
        }
      }

      if (matchedInTitle) {
        const pBrandsLower = pBrands.map(b => b.toLowerCase());
        const canonicalLower = brandDef.canonical.toLowerCase();

        const hasCanonicalInPrimary = pBrandsLower.includes(canonicalLower) ||
          pBrandsLower.some(b => b.includes(canonicalLower) || canonicalLower.includes(b));

        if (!reportByBrand[brandDef.canonical]) {
          reportByBrand[brandDef.canonical] = {
            canonical: brandDef.canonical,
            totalWithTitleMatch: 0,
            hasPrimaryCount: 0,
            missingPrimaryCount: 0,
            examplesMissing: [],
            examplesCorrect: []
          };
        }

        const stats = reportByBrand[brandDef.canonical];
        stats.totalWithTitleMatch++;

        if (hasCanonicalInPrimary) {
          stats.hasPrimaryCount++;
          if (stats.examplesCorrect.length < 2) {
            stats.examplesCorrect.push({ id: c.id, title, pBrands, pProds });
          }
        } else {
          stats.missingPrimaryCount++;
          if (stats.examplesMissing.length < 3) {
            stats.examplesMissing.push({ id: c.id, title, pBrands, sBrands: c.classification?.secondaryBrands, pProds });
          }
        }
      }
    });
  });

  console.log('\n=================== COMPREHENSIVE BRAND COVERAGE REPORT ===================\n');
  Object.values(reportByBrand).sort((a,b) => b.missingPrimaryCount - a.missingPrimaryCount).forEach(stats => {
    console.log(`Marca: [${stats.canonical}] | Total no Título: ${stats.totalWithTitleMatch} | Em primaryBrands: ${stats.hasPrimaryCount} | Ausentes de primaryBrands: ${stats.missingPrimaryCount}`);
    if (stats.missingPrimaryCount > 0) {
      console.log('   Exemplos Ausentes:');
      stats.examplesMissing.forEach(ex => {
        console.log(`     - [ID ${ex.id}] "${ex.title}"`);
        console.log(`       Atual pBrands: ${JSON.stringify(ex.pBrands)} | sBrands: ${JSON.stringify(ex.sBrands)}`);
      });
    }
    console.log('');
  });
}

fullScan();

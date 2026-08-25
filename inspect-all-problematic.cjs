const http = require('http');

async function inspectAllProblematic() {
  http.get('http://localhost:3000/api/results/search?limit=1000', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const allItems = json.contents || [];
        console.log(`TOTAL ITEMS IN DATABASE: ${allItems.length}`);

        console.log('\n=================== CHECK 1: ITEMS WITH "IMENSO" IN CARD TAGS (item.brands) ===================');
        allItems.forEach(item => {
          if (item.brands && item.brands.some(b => b.toLowerCase() === 'imenso')) {
            const pBrands = item.classification?.primaryBrands || [];
            const isPrimary = pBrands.some(b => b.toLowerCase() === 'imenso');
            console.log(`[ID ${item.id}] TITLE: "${item.title}"`);
            console.log(`   CARD TAGS: ${JSON.stringify(item.brands)}`);
            console.log(`   primaryBrands: ${JSON.stringify(pBrands)} | primaryProducts: ${JSON.stringify(item.classification?.primaryProducts)}`);
            console.log(`   secondaryBrands: ${JSON.stringify(item.classification?.secondaryBrands)} | secondaryProducts: ${JSON.stringify(item.classification?.secondaryProducts)}`);
            console.log(`   isPrimaryImenso? ${isPrimary ? 'YES' : '❌ NO! (TAGGED WITH IMENSO BUT NOT PRIMARY!)'}`);
          }
        });

        console.log('\n=================== CHECK 2: ITEMS WITH "IMENSO" IN PRIMARY BRANDS (Are any wrong?) ===================');
        allItems.forEach(item => {
          const pBrands = item.classification?.primaryBrands || [];
          if (pBrands.some(b => b.toLowerCase() === 'imenso')) {
            const titleLower = item.title.toLowerCase();
            // Check if title mentions other brands like Nuoma, Zealot, Basike, Hopestar, Xdobo
            const mentionsOther = ['nuoma', 'zealot', 'basike', 'hopestar', 'xdobo', 'waaw', 'jbl', 'kaidi', 'kimaster'].filter(b => titleLower.includes(b));
            if (mentionsOther.length > 0) {
              console.log(`[ID ${item.id}] TITLE: "${item.title}"`);
              console.log(`   primaryBrands: ${JSON.stringify(pBrands)} | primaryProducts: ${JSON.stringify(item.classification?.primaryProducts)}`);
              console.log(`   secondaryBrands: ${JSON.stringify(item.classification?.secondaryBrands)} | secondaryProducts: ${JSON.stringify(item.classification?.secondaryProducts)}`);
              console.log(`   isComparison: ${item.classification?.isComparison}`);
            }
          }
        });

      } catch (e) {
        console.error(e);
      }
    });
  }).on('error', console.error);
}

inspectAllProblematic();

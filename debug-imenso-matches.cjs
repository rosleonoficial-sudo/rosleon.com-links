const http = require('http');

async function debugImenso() {
  http.get('http://localhost:3000/api/results/search?q=imenso&limit=100', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`TOTAL FOUND FOR "imenso": ${json.pagination.total}`);
        
        json.contents.forEach((item, index) => {
          const pBrands = item.classification?.primaryBrands || [];
          const hasImensoInPrimary = pBrands.some(b => b.toLowerCase() === 'imenso');
          
          if (!hasImensoInPrimary) {
            console.log(`\n🚨 FALSE POSITIVE ITEM #${index + 1} (ID: ${item.id}) ---`);
            console.log(`TITLE: ${item.title}`);
            console.log(`TAGS (content.brands): ${JSON.stringify(item.brands)}`);
            console.log(`primaryBrands: ${JSON.stringify(item.classification?.primaryBrands)}`);
            console.log(`primaryProducts: ${JSON.stringify(item.classification?.primaryProducts)}`);
            console.log(`secondaryBrands: ${JSON.stringify(item.classification?.secondaryBrands)}`);
            console.log(`secondaryProducts: ${JSON.stringify(item.classification?.secondaryProducts)}`);
            console.log(`aliases: ${JSON.stringify(item.classification?.aliases)}`);
            console.log(`isComparison: ${item.classification?.isComparison}`);
            console.log(`DESCRIPTION (first 100 chars): ${(item.description || '').slice(0, 100)}`);
          }
        });
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    });
  }).on('error', console.error);
}

debugImenso();

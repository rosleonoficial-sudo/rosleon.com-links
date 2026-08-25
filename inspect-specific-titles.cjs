const http = require('http');

async function inspectMore() {
  http.get('http://localhost:3000/api/results/search?limit=1000', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const allItems = json.contents || [];

        const targets = [
          'hopestar a60 ultra',
          'nuoma ip-501',
          'zealot s78',
          'basike rad 289',
          'imenso x75',
          'imenso x26'
        ];

        allItems.forEach((item) => {
          const tLower = (item.title || '').toLowerCase();
          const dLower = (item.description || '').toLowerCase();

          const hit = targets.some(tgt => tLower.includes(tgt) || dLower.includes(tgt));
          if (hit) {
            console.log(`\n----------------------------------------`);
            console.log(`ID: ${item.id} | Platform: ${item.platform}`);
            console.log(`TITLE: "${item.title}"`);
            console.log(`CARD TAGS (item.brands): ${JSON.stringify(item.brands)}`);
            if (item.classification) {
              console.log(`primaryBrands: ${JSON.stringify(item.classification.primaryBrands)}`);
              console.log(`primaryProducts: ${JSON.stringify(item.classification.primaryProducts)}`);
              console.log(`secondaryBrands: ${JSON.stringify(item.classification.secondaryBrands)}`);
              console.log(`secondaryProducts: ${JSON.stringify(item.classification.secondaryProducts)}`);
              console.log(`aliases: ${JSON.stringify(item.classification.aliases)}`);
              console.log(`isComparison: ${item.classification.isComparison}`);
            }
            if (dLower.length > 0) {
              console.log(`DESC: ${dLower.slice(0, 200)}`);
            }
          }
        });

      } catch (e) {
        console.error(e);
      }
    });
  }).on('error', console.error);
}

inspectMore();

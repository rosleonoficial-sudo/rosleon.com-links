import { getMemoryStore } from './server/db';
import { searchContents } from './server/resultsService';

async function inspectMemory() {
  const memoryDb = getMemoryStore();
  console.log(`TOTAL MEMORY STORE CONTENTS: ${memoryDb.contents.length}`);
  console.log(`TOTAL MEMORY STORE CONTENT_BRANDS: ${memoryDb.content_brands.length}`);

  // Fetch all contents via searchContents with limit 1000
  const res = await searchContents({ limit: 1000 });
  console.log(`TOTAL SEARCH CONTENTS RETURNED: ${res.contents.length}`);

  console.log('\n=== CHECK 1: ALL ITEMS WHERE "IMENSO" IS IN CARD TAGS (item.brands) ===');
  let countImensoTags = 0;
  res.contents.forEach(item => {
    const brandNames = item.brands || [];
    const pBrands = item.classification?.primaryBrands || [];
    const sBrands = item.classification?.secondaryBrands || [];

    const hasImensoInTags = brandNames.some((b: string) => b.toLowerCase() === 'imenso');
    const hasImensoInPrimary = pBrands.some((b: string) => b.toLowerCase() === 'imenso');

    if (hasImensoInTags) {
      countImensoTags++;
      console.log(`[ID ${item.id}] TITLE: "${item.title}"`);
      console.log(`   CARD TAGS (item.brands): ${JSON.stringify(brandNames)}`);
      console.log(`   primaryBrands: ${JSON.stringify(pBrands)} | primaryProducts: ${JSON.stringify(item.classification?.primaryProducts)}`);
      console.log(`   secondaryBrands: ${JSON.stringify(sBrands)} | secondaryProducts: ${JSON.stringify(item.classification?.secondaryProducts)}`);
      console.log(`   isPrimaryImenso? ${hasImensoInPrimary ? 'YES' : '❌ NO! (TAGGED WITH IMENSO BUT NOT PRIMARY!)'}`);
    }
  });

  console.log(`\nTotal items with IMENSO in item.brands: ${countImensoTags}`);

  console.log('\n=== CHECK 2: ITEMS WITH "IMENSO" IN PRIMARY BRANDS THAT MENTION OTHER BRANDS ===');
  res.contents.forEach(item => {
    const pBrands = item.classification?.primaryBrands || [];
    const pProds = item.classification?.primaryProducts || [];
    const sBrands = item.classification?.secondaryBrands || [];
    const sProds = item.classification?.secondaryProducts || [];
    const titleLower = (item.title || '').toLowerCase();

    if (pBrands.some((b: string) => b.toLowerCase() === 'imenso')) {
      const otherBrands = ['nuoma', 'zealot', 'basike', 'hopestar', 'xdobo', 'waaw', 'jbl', 'kaidi', 'kimaster'].filter(b => titleLower.includes(b));
      if (otherBrands.length > 0) {
        console.log(`[ID ${item.id}] TITLE: "${item.title}"`);
        console.log(`   primaryBrands: ${JSON.stringify(pBrands)} | primaryProducts: ${JSON.stringify(pProds)}`);
        console.log(`   secondaryBrands: ${JSON.stringify(sBrands)} | secondaryProducts: ${JSON.stringify(sProds)}`);
        console.log(`   isComparison: ${item.classification?.isComparison}`);
      }
    }
  });

  console.log('\n=== CHECK 3: SEARCH FOR "IMENSO" AND INSPECT EVERY RESULT ===');
  const searchImenso = await searchContents({ q: 'imenso', limit: 1000 });
  console.log(`Total returned for q=imenso: ${searchImenso.contents.length}`);
  searchImenso.contents.forEach((item, idx) => {
    const pBrands = item.classification?.primaryBrands || [];
    const pProds = item.classification?.primaryProducts || [];
    const sBrands = item.classification?.secondaryBrands || [];
    const sProds = item.classification?.secondaryProducts || [];
    const titleLower = (item.title || '').toLowerCase();

    const hasPrimaryImenso = pBrands.some(b => b.toLowerCase() === 'imenso');
    if (!hasPrimaryImenso) {
      console.log(`🚨 FALSE POSITIVE #${idx + 1} [ID ${item.id}] TITLE: "${item.title}"`);
      console.log(`   pBrands: ${JSON.stringify(pBrands)} | pProds: ${JSON.stringify(pProds)}`);
      console.log(`   sBrands: ${JSON.stringify(sBrands)} | sProds: ${JSON.stringify(sProds)}`);
      console.log(`   aliases: ${JSON.stringify(item.classification?.aliases)}`);
      console.log(`   CARD TAGS: ${JSON.stringify(item.brands)}`);
    } else {
      // Check if title actually is primarily about another brand
      const otherBrands = ['nuoma', 'zealot', 'basike', 'hopestar', 'xdobo'].filter(b => titleLower.includes(b));
      if (otherBrands.length > 0) {
        console.log(`⚠️ QUESTIONABLE PRIMARY #${idx + 1} [ID ${item.id}] TITLE: "${item.title}"`);
        console.log(`   pBrands: ${JSON.stringify(pBrands)} | pProds: ${JSON.stringify(pProds)}`);
        console.log(`   sBrands: ${JSON.stringify(sBrands)} | sProds: ${JSON.stringify(sProds)}`);
        console.log(`   isComparison: ${item.classification?.isComparison}`);
      }
    }
  });
}

inspectMemory();

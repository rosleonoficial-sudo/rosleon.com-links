const pg = require('pg');
const { Pool } = pg;

async function inspectDbDirect() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('No DATABASE_URL set');
    return;
  }
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  const res = await pool.query(`
    SELECT 
      c.id, c.platform, c.title, c.description,
      COALESCE(json_agg(b.name) FILTER (WHERE b.name IS NOT NULL), '[]') as brand_names,
      cl.primary_brands, cl.primary_products, cl.secondary_brands, cl.secondary_products, cl.aliases, cl.is_comparison
    FROM contents c
    LEFT JOIN content_brands cb ON c.id = cb.content_id
    LEFT JOIN brands b ON cb.brand_id = b.id
    LEFT JOIN content_classifications cl ON c.id = cl.content_id
    GROUP BY c.id, cl.primary_brands, cl.primary_products, cl.secondary_brands, cl.secondary_products, cl.aliases, cl.is_comparison
    ORDER BY c.id ASC
  `);

  console.log(`TOTAL DB CONTENTS: ${res.rows.length}`);

  console.log('\n=== CHECK 1: ALL ITEMS WHERE "IMENSO" IS IN brand_names (CARD TAGS) ===');
  let countImensoTags = 0;
  res.rows.forEach(r => {
    const brandNames = Array.isArray(r.brand_names) ? r.brand_names : JSON.parse(r.brand_names || '[]');
    const pBrands = Array.isArray(r.primary_brands) ? r.primary_brands : JSON.parse(r.primary_brands || '[]');
    const sBrands = Array.isArray(r.secondary_brands) ? r.secondary_brands : JSON.parse(r.secondary_brands || '[]');

    const hasImensoInTags = brandNames.some(b => b.toLowerCase() === 'imenso');
    const hasImensoInPrimary = pBrands.some(b => b.toLowerCase() === 'imenso');

    if (hasImensoInTags) {
      countImensoTags++;
      console.log(`[ID ${r.id}] TITLE: "${r.title}"`);
      console.log(`   CARD TAGS (brand_names): ${JSON.stringify(brandNames)}`);
      console.log(`   primaryBrands: ${JSON.stringify(pBrands)} | primaryProducts: ${JSON.stringify(r.primary_products)}`);
      console.log(`   secondaryBrands: ${JSON.stringify(sBrands)} | secondaryProducts: ${JSON.stringify(r.secondary_products)}`);
      console.log(`   isPrimaryImenso? ${hasImensoInPrimary ? 'YES' : '❌ NO! (TAGGED WITH IMENSO BUT NOT PRIMARY!)'}`);
    }
  });

  console.log(`\nTotal items with IMENSO in brand_names: ${countImensoTags}`);

  console.log('\n=== CHECK 2: ITEMS WITH "IMENSO" IN PRIMARY BRANDS THAT MENTION OTHER BRANDS ===');
  res.rows.forEach(r => {
    const pBrands = Array.isArray(r.primary_brands) ? r.primary_brands : JSON.parse(r.primary_brands || '[]');
    const pProds = Array.isArray(r.primary_products) ? r.primary_products : JSON.parse(r.primary_products || '[]');
    const sBrands = Array.isArray(r.secondary_brands) ? r.secondary_brands : JSON.parse(r.secondary_brands || '[]');
    const sProds = Array.isArray(r.secondary_products) ? r.secondary_products : JSON.parse(r.secondary_products || '[]');
    const titleLower = (r.title || '').toLowerCase();

    if (pBrands.some(b => b.toLowerCase() === 'imenso')) {
      const otherBrands = ['nuoma', 'zealot', 'basike', 'hopestar', 'xdobo', 'waaw', 'jbl', 'kaidi', 'kimaster'].filter(b => titleLower.includes(b));
      if (otherBrands.length > 0) {
        console.log(`[ID ${r.id}] TITLE: "${r.title}"`);
        console.log(`   primaryBrands: ${JSON.stringify(pBrands)} | primaryProducts: ${JSON.stringify(pProds)}`);
        console.log(`   secondaryBrands: ${JSON.stringify(sBrands)} | secondaryProducts: ${JSON.stringify(sProds)}`);
        console.log(`   isComparison: ${r.is_comparison}`);
      }
    }
  });

  await pool.end();
}

inspectDbDirect();

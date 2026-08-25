import { initDatabase, getPool } from './server/db.js';

async function main() {
  await initDatabase();
  const pool = getPool();
  if (!pool) {
    console.log('No pool!');
    process.exit(1);
  }

  const res = await pool.query(`
    SELECT c.id, c.platform, c.title, c.description, cl.primary_brands, cl.secondary_brands
    FROM contents c
    LEFT JOIN content_classifications cl ON c.id = cl.content_id
    WHERE c.platform = 'instagram'
  `);

  console.log(`Total Instagram items in DB: ${res.rows.length}`);
  res.rows.forEach(r => {
    const title = r.title || '';
    const desc = r.description || '';
    const pBrands = r.primary_brands || [];
    console.log(`[IG ID ${r.id}] Title: "${title}"`);
    console.log(`   Brands: ${JSON.stringify(pBrands)}`);
    if (title.toLowerCase().includes('trib') || desc.toLowerCase().includes('trib') || title.toLowerCase().includes('bomb') || desc.toLowerCase().includes('bomb')) {
      console.log(`   *** MATCHES TRIB/BOMB *** Title: "${title}" | Desc: "${desc.slice(0, 200)}"`);
    }
  });

  process.exit(0);
}

main();

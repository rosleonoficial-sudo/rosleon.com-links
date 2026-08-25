const { getPool, isPostgresActive, getMemoryStore } = require('./server/db.js');

async function inspectAllIg() {
  if (isPostgresActive()) {
    const pool = getPool();
    const res = await pool.query(`
      SELECT c.id, c.platform, c.title, c.description, cl.primary_brands, cl.secondary_brands
      FROM contents c
      LEFT JOIN content_classifications cl ON c.id = cl.content_id
      WHERE c.platform = 'instagram'
    `);
    console.log(`Total Instagram items in DB: ${res.rows.length}`);
    res.rows.forEach(r => {
      console.log(`[IG ID ${r.id}] Title: "${r.title}"`);
      console.log(`   Description: "${(r.description || '').slice(0, 150)}"`);
      console.log(`   primary_brands: ${JSON.stringify(r.primary_brands)}`);
      console.log(`   secondary_brands: ${JSON.stringify(r.secondary_brands)}`);
      console.log('---');
    });
  }
}

inspectAllIg().then(() => process.exit(0));

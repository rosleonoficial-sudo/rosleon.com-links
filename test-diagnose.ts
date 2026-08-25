import { initDatabase, getPool, isPostgresActive, getMemoryStore } from './server/db.js';
import { classifyContent, refreshCatalog } from './server/classifierService.js';

async function checkTitles() {
  await initDatabase();
  await refreshCatalog();

  let contents: { id: number; title: string; description: string }[] = [];
  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      const res = await pool.query('SELECT id, title, description FROM contents ORDER BY id ASC');
      contents = res.rows;
    }
  } else {
    const mem = getMemoryStore();
    contents = mem.contents;
  }

  console.log(`Total contents in DB: ${contents.length}`);

  const testQueries = ['AIWA', 'Golden', 'Boombox 4', 'JBL', 'Hopestar', 'WAAW', 'JOG', 'Joog'];
  for (const q of testQueries) {
    const matches = contents.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
    console.log(`\n--- Matches for "${q}" in raw title (${matches.length}) ---`);
    matches.slice(0, 10).forEach(c => {
      const cls = classifyContent(c.title, c.description);
      console.log(`[ID ${c.id}] "${c.title}"`);
      console.log(`   -> Primary Brands:`, cls.primaryBrands, `| Primary Prods:`, cls.primaryProducts);
      console.log(`   -> Sec Brands    :`, cls.secondaryBrands, `| Sec Prods    :`, cls.secondaryProducts);
    });
  }
}

checkTitles();

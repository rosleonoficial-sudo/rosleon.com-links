import { getPool, initDatabase, getSafeDatabaseIdentity } from './server/db.js';
import { saveTikTokTokenRecord, getTikTokStatus, initTikTokTable, HANDLER_VERSION, BUILD_MARKER } from './server/tiktokService.js';

async function runTest() {
  console.log('=== TESTE DE PERSISTÊNCIA CRUZADA DO TIKTOK ===');
  console.log(`Versão: ${HANDLER_VERSION} | BuildMarker: ${BUILD_MARKER}`);

  await initDatabase();
  const dbIdentity = getSafeDatabaseIdentity();
  console.log('Identidade da Base de Dados:', JSON.stringify(dbIdentity));

  const pool = getPool();
  if (!pool) {
    console.error('ERRO: Pool do PostgreSQL não foi inicializado.');
    process.exit(1);
  }

  await initTikTokTable();

  const testOpenId = 'test_cross_conn_' + Date.now();
  console.log(`\n1. Criando registro de teste via Conexão A com COMMIT explícito... (openId: ${testOpenId})`);

  const clientA = await pool.connect();
  try {
    await clientA.query('BEGIN');
    await clientA.query(`
      INSERT INTO tiktok_tokens (
        open_id, display_name, avatar_url, access_token, expires_at,
        refresh_token, refresh_expires_at, scope, followers_count,
        following_count, likes_count, video_count, last_synced_at, updated_at
      ) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 day', $5, NOW() + INTERVAL '30 days', $6, 100, 50, 500, 10, NOW(), NOW())
      ON CONFLICT (open_id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        updated_at = NOW()
    `, [testOpenId, 'Test User Cross Conn', 'https://example.com/avatar.png', 'access_test_token_123', 'refresh_test_token_456', 'user.info.basic']);
    
    await clientA.query('COMMIT');
    console.log('   COMMIT realizado com sucesso na Conexão A.');
  } finally {
    clientA.release();
    console.log('   Conexão A liberada para o pool.');
  }

  console.log('\n2. Lendo registro via NOVA Conexão B independente...');
  const clientB = await pool.connect();
  let foundOnClientB = false;
  try {
    const res = await clientB.query('SELECT open_id, display_name, access_token FROM tiktok_tokens WHERE open_id = $1', [testOpenId]);
    if (res.rows.length > 0 && res.rows[0].access_token === 'access_test_token_123') {
      foundOnClientB = true;
      console.log('   SUCESSO! Conexão B encontrou o registro e confirmou a persistência física no PostgreSQL:');
      console.log('  ', res.rows[0]);
    } else {
      console.error('   FALHA! Conexão B não encontrou o registro gravado pela Conexão A.');
    }
  } finally {
    clientB.release();
    console.log('   Conexão B liberada para o pool.');
  }

  console.log('\n3. Testando getTikTokStatus()...');
  const status = await getTikTokStatus();
  console.log('   Resultado de getTikTokStatus():', JSON.stringify({
    success: status.success,
    connected: status.connected,
    account: status.account,
    tokenStatus: status.tokenStatus,
    dbInfo: status.dbInfo,
    lastError: status.lastError
  }, null, 2));

  console.log('\n4. Limpando registro de teste...');
  const clientCleanup = await pool.connect();
  try {
    await clientCleanup.query('DELETE FROM tiktok_tokens WHERE open_id = $1', [testOpenId]);
    console.log('   Limpeza concluída.');
  } finally {
    clientCleanup.release();
  }

  if (foundOnClientB && status.connected) {
    console.log('\n✅ PROVA FINAL CONCLUÍDA COM SUCESSO! Persistência garantida entre conexões e instâncias.');
    process.exit(0);
  } else {
    console.error('\n❌ TESTE FALHOU.');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Erro na execução do teste:', err);
  process.exit(1);
});

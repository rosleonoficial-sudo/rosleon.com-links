import { saveTikTokTokenRecord, getTikTokTokenRecord, getTikTokStatus, TikTokTokenRecord } from './server/tiktokService.js';
import { getPool, initDatabase, getDatabaseInfoSafe } from './server/db.js';

async function runPersistenceTest() {
  console.log('=== INICIANDO TESTE ISOLADO DE PERSISTÊNCIA DO TIKTOK ===');

  console.log('1. Verificando configuração do PostgreSQL...');
  await initDatabase();
  const safeInfo = getDatabaseInfoSafe();
  console.log('   Safe Database Info:', safeInfo);

  const pool = getPool();
  if (!pool) {
    console.log('⚠️ PostgreSQL não está configurado via DATABASE_URL/POSTGRES_URL no ambiente local.');
    console.log('   O código foi ajustado para exigir PostgreSQL em produção.');
    return;
  }

  const dummyOpenId = 'test_dummy_openid_' + Date.now();
  const dummyRecord: TikTokTokenRecord = {
    open_id: dummyOpenId,
    display_name: 'Conta Teste Automático',
    avatar_url: 'https://example.com/avatar.jpg',
    access_token: 'test_access_token_12345',
    expires_at: new Date(Date.now() + 86400 * 1000).toISOString(),
    refresh_token: 'test_refresh_token_67890',
    refresh_expires_at: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    scope: 'user.info.basic',
    followers_count: 100,
    following_count: 50,
    likes_count: 500,
    video_count: 10,
    last_synced_at: new Date().toISOString(),
    last_error: null
  };

  try {
    console.log('2. Testando INSERT/UPSERT no PostgreSQL com confirmação imediata...');
    const savedSuccess = await saveTikTokTokenRecord(dummyRecord);
    console.log('   Resultado saveTikTokTokenRecord:', savedSuccess);

    console.log('3. Testando LEITURA via getTikTokTokenRecord()...');
    const readRecord = await getTikTokTokenRecord();
    console.log('   Registro lido do PostgreSQL:', readRecord ? {
      open_id: readRecord.open_id,
      display_name: readRecord.display_name,
      access_token: readRecord.access_token.substring(0, 10) + '...'
    } : null);

    if (!readRecord || readRecord.open_id !== dummyOpenId) {
      throw new Error(`Falha: Registro lido do banco (${readRecord?.open_id}) não bate com o inserido (${dummyOpenId})`);
    }

    console.log('4. Testando getTikTokStatus()...');
    const status = await getTikTokStatus();
    console.log('   Status retornado:', {
      connected: status.connected,
      account: status.account,
      tokenStatus: status.tokenStatus,
      dbInfo: status.dbInfo
    });

    if (!status.connected) {
      throw new Error('Falha: getTikTokStatus retornou connected=false mesmo após salvar no banco!');
    }

    console.log('5. Testando ATUALIZAÇÃO (UPSERT ON CONFLICT)...');
    dummyRecord.display_name = 'Conta Teste Atualizada';
    await saveTikTokTokenRecord(dummyRecord);

    const updatedRecord = await getTikTokTokenRecord();
    console.log('   Registro atualizado:', updatedRecord?.display_name);

    if (updatedRecord?.display_name !== 'Conta Teste Atualizada') {
      throw new Error('Falha na atualização do registro via UPSERT!');
    }

    console.log('6. Limpando registro de teste...');
    await pool.query('DELETE FROM tiktok_tokens WHERE open_id = $1', [dummyOpenId]);
    console.log('   Registro de teste excluído com sucesso.');

    console.log('=== TESTE DE PERSISTÊNCIA CONCLUÍDO COM SUCESSO! ===');
  } catch (err: any) {
    console.error('❌ ERRO NO TESTE DE PERSISTÊNCIA:', err.message);
    // Cleanup if needed
    try {
      await pool.query('DELETE FROM tiktok_tokens WHERE open_id = $1', [dummyOpenId]);
    } catch (e) {}
    process.exit(1);
  }
}

runPersistenceTest();

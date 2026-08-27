import pg from 'pg';
import { saveTikTokTokenRecord, getTikTokTokenRecord, getTikTokStatus, TikTokTokenRecord } from './server/tiktokService.js';
import { getPool, initDatabase } from './server/db.js';

// Test database connection string or environment check
async function testWithDb() {
  console.log('Testing Postgres logic...');
  const dummyOpenId = 'test_openid_' + Date.now();
  const dummyRecord: TikTokTokenRecord = {
    open_id: dummyOpenId,
    display_name: 'ROSLEON Test Account',
    avatar_url: 'https://example.com/avatar.jpg',
    access_token: 'test_access_token_abc123',
    expires_at: new Date(Date.now() + 86400 * 1000).toISOString(),
    refresh_token: 'test_refresh_token_def456',
    refresh_expires_at: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    scope: 'user.info.basic',
    followers_count: 500,
    following_count: 100,
    likes_count: 2500,
    video_count: 15,
    last_synced_at: new Date().toISOString(),
    last_error: null
  };

  console.log('Dummy record prepared:', dummyRecord.open_id);
}

testWithDb();

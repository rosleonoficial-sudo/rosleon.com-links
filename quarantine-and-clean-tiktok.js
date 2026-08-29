import fs from 'fs';
import path from 'path';

// 1. Read current snapshot
const snapshotPath = './server/data/results_catalog_snapshot.json';
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

// 2. Create timestamped backup
const backupPath = `./server/data/backup_snapshot_pre_tiktok_cleanup_${Date.now()}.json`;
fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2), 'utf8');
console.log(`Backup criado em: ${backupPath}`);

// 3. Separate authentic vs synthetic/quarantined TikTok items
const youtubeItems = snapshot.contents.filter(c => c.platform === 'youtube');
const instagramItems = snapshot.contents.filter(c => c.platform === 'instagram');
const tiktokItems = snapshot.contents.filter(c => c.platform === 'tiktok');

const quarantinedTikTok = [];
const authenticTikTok = [];

for (const item of tiktokItems) {
  const isSyntheticId = item.externalId.startsWith('731000000000');
  const isGenericThumb = item.thumbnailUrl.includes('ChatGPT_Image') || item.thumbnailUrl.includes('res.cloudinary.com');
  const isSyntheticTitle = item.title.startsWith('Testei a ') && item.title.includes('no volume máximo!');

  if (isSyntheticId || isGenericThumb || isSyntheticTitle) {
    quarantinedTikTok.push({
      quarantineId: `QUARANTINE-TT-${item.externalId}`,
      quarantinedAt: new Date().toISOString(),
      reason: 'Registro sintético/simulado gerado indevidamente por template de placeholder',
      flags: {
        syntheticExternalId: isSyntheticId,
        genericPlaceholderThumbnail: isGenericThumb,
        templatedTitle: isSyntheticTitle
      },
      originalData: item
    });
  } else {
    authenticTikTok.push(item);
  }
}

// 4. Save Quarantine Log
const quarantineLogPath = './server/data/quarantined_synthetic_tiktok_records.json';
fs.writeFileSync(quarantineLogPath, JSON.stringify({
  auditDate: new Date().toISOString(),
  totalQuarantined: quarantinedTikTok.length,
  records: quarantinedTikTok
}, null, 2), 'utf8');
console.log(`Quarentena salva em: ${quarantineLogPath} (${quarantinedTikTok.length} registros)`);

// 5. Clean snapshot to ONLY authentic items
const cleanContents = [...youtubeItems, ...instagramItems, ...authenticTikTok];

const cleanSnapshot = {
  generatedAt: new Date().toISOString(),
  version: '2026-08-29-audited-authentic-v1',
  summary: {
    totalContents: cleanContents.length,
    youtubeCount: youtubeItems.length,
    instagramCount: instagramItems.length,
    tiktokCount: authenticTikTok.length
  },
  contents: cleanContents
};

fs.writeFileSync(snapshotPath, JSON.stringify(cleanSnapshot, null, 2), 'utf8');
console.log(`Snapshot limpo e salvo. Total: ${cleanContents.length} (YouTube: ${youtubeItems.length}, Instagram: ${instagramItems.length}, TikTok autêntico: ${authenticTikTok.length})`);

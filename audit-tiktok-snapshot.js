import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./server/data/results_catalog_snapshot.json', 'utf8'));
const yt = data.contents.filter(c => c.platform === 'youtube');
const ig = data.contents.filter(c => c.platform === 'instagram');
const tt = data.contents.filter(c => c.platform === 'tiktok');

console.log('=== AUDITORIA DO SNAPSHOT ATUAL ===');
console.log('Total de itens:', data.contents.length);
console.log('YouTube:', yt.length);
console.log('Instagram:', ig.length);
console.log('TikTok:', tt.length);

const syntheticItems = [];
const authenticItems = [];

for (const item of tt) {
  const isSyntheticId = item.externalId.startsWith('731000000000');
  const isGenericThumb = item.thumbnailUrl.includes('ChatGPT_Image') || item.thumbnailUrl.includes('res.cloudinary.com');
  const isSyntheticTitle = item.title.startsWith('Testei a ') && item.title.includes('no volume máximo! Veja o grave');

  if (isSyntheticId || isGenericThumb || isSyntheticTitle) {
    syntheticItems.push({
      externalId: item.externalId,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      url: item.url,
      brand: item.brands,
      reason: [
        isSyntheticId ? 'ID sequencial sintético (731000000000...)' : null,
        isGenericThumb ? 'Thumbnail genérica repetida' : null,
        isSyntheticTitle ? 'Título gerado por template' : null
      ].filter(Boolean).join(', ')
    });
  } else {
    authenticItems.push(item);
  }
}

console.log('\n--- RESULTADO DA AUDITORIA DO TIKTOK ---');
console.log('Itens autênticos identificados:', authenticItems.length);
console.log('Itens sintéticos/inválidos identificados:', syntheticItems.length);

console.log('\n--- ITENS AUTÊNTICOS: ---');
console.log(JSON.stringify(authenticItems, null, 2));

console.log('\n--- AMOSTRA DE ITENS SINTÉTICOS ENCONTRADOS (PRIMEIROS 15): ---');
console.log(JSON.stringify(syntheticItems.slice(0, 15), null, 2));

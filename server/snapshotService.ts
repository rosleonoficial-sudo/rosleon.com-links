import fs from 'fs';
import path from 'path';
import { ContentItem } from '../src/types.js';
import { classifyContent } from './classifierService.js';

const SNAPSHOT_FILE_PATH = path.join(process.cwd(), 'server', 'data', 'results_catalog_snapshot.json');

export interface CatalogSnapshot {
  generatedAt: string;
  version: string;
  summary: {
    totalContents: number;
    youtubeCount: number;
    instagramCount: number;
    tiktokCount: number;
  };
  contents: ContentItem[];
}

let inMemorySnapshotCache: CatalogSnapshot | null = null;

/**
 * Load the latest valid catalog snapshot from disk or in-memory cache
 */
export function loadCatalogSnapshot(): CatalogSnapshot {
  if (inMemorySnapshotCache && inMemorySnapshotCache.contents.length > 0) {
    return inMemorySnapshotCache;
  }

  try {
    if (fs.existsSync(SNAPSHOT_FILE_PATH)) {
      const raw = fs.readFileSync(SNAPSHOT_FILE_PATH, 'utf-8');
      const parsed: CatalogSnapshot = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.contents) && parsed.contents.length > 0) {
        inMemorySnapshotCache = parsed;
        return parsed;
      }
    }
  } catch (err: any) {
    console.error('Erro ao ler snapshot do catálogo do disco:', err.message);
  }

  // If file does not exist or failed to load, return empty fallback structure
  return {
    generatedAt: new Date().toISOString(),
    version: 'emergency-empty',
    summary: { totalContents: 0, youtubeCount: 0, instagramCount: 0, tiktokCount: 0 },
    contents: []
  };
}

/**
 * Save or update catalog snapshot safely with atomic file write and platform partition isolation
 */
export function saveCatalogSnapshot(
  newContents: ContentItem[],
  platformScope?: 'youtube' | 'instagram' | 'tiktok' | 'all'
): boolean {
  try {
    const current = loadCatalogSnapshot();
    let mergedContents: ContentItem[] = [];

    if (!platformScope || platformScope === 'all') {
      // If newContents is unexpectedly small compared to current, guard against erasing
      if (current.contents.length >= 100 && newContents.length < Math.round(current.contents.length * 0.5)) {
        console.warn(`[SnapshotService Protection] Recusado salvamento global com apenas ${newContents.length} conteúdos (existentes: ${current.contents.length}). MANTENDO ESTADO SEGURO ANTERIOR.`);
        return false;
      }
      mergedContents = newContents;
    } else {
      // Platform-specific partition update: preserve other platforms strictly
      const otherPlatformsContents = current.contents.filter(c => c.platform !== platformScope);
      const existingPlatformContents = current.contents.filter(c => c.platform === platformScope);

      // Incremental UPSERT map for target platform
      const platformMap = new Map<string, ContentItem>();
      for (const item of existingPlatformContents) {
        platformMap.set(item.externalId || item.id, item);
      }
      for (const item of newContents) {
        if (item.externalId || item.id) {
          platformMap.set(item.externalId || item.id, item);
        }
      }

      const mergedPlatformContents = Array.from(platformMap.values());

      // If new collection is zero or abnormally dropped, retain historical platform items
      if (existingPlatformContents.length >= 50 && mergedPlatformContents.length < existingPlatformContents.length) {
        console.warn(`[SnapshotService Protection] Queda anormal detectada para ${platformScope}: ${mergedPlatformContents.length} < ${existingPlatformContents.length}. MANTENDO CATÁLOGO COMPLETO ANTERIOR DA PLATAFORMA.`);
        mergedContents = [...otherPlatformsContents, ...existingPlatformContents];
      } else {
        mergedContents = [...otherPlatformsContents, ...mergedPlatformContents];
      }
    }

    // Deduplicate by platform:externalId
    const uniqueMap = new Map<string, ContentItem>();
    for (const item of mergedContents) {
      const key = `${item.platform}:${item.externalId || item.id}`;
      uniqueMap.set(key, item);
    }
    const finalContents = Array.from(uniqueMap.values());

    const ytCount = finalContents.filter(c => c.platform === 'youtube').length;
    const igCount = finalContents.filter(c => c.platform === 'instagram').length;
    const ttCount = finalContents.filter(c => c.platform === 'tiktok').length;

    const payload: CatalogSnapshot = {
      generatedAt: new Date().toISOString(),
      version: '2026-08-29-resilient-v1',
      summary: {
        totalContents: finalContents.length,
        youtubeCount: ytCount,
        instagramCount: igCount,
        tiktokCount: ttCount
      },
      contents: finalContents
    };

    inMemorySnapshotCache = payload;

    const dir = path.dirname(SNAPSHOT_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tempFilePath = `${SNAPSHOT_FILE_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFilePath, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tempFilePath, SNAPSHOT_FILE_PATH);

    console.log(`[SnapshotService] Snapshot atualizado com sucesso. Total: ${finalContents.length} (YT: ${ytCount}, IG: ${igCount}, TT: ${ttCount})`);
    return true;
  } catch (err: any) {
    console.error('Erro ao salvar snapshot do catálogo:', err.message);
    return false;
  }
}

/**
 * Sync snapshot contents into PostgreSQL database to ensure tables are always warm and populated
 */
export async function syncSnapshotToPostgres(pool: any): Promise<number> {
  if (!pool) return 0;
  const snapshot = loadCatalogSnapshot();
  if (!snapshot.contents || snapshot.contents.length === 0) return 0;

  let insertedCount = 0;
  try {
    for (const item of snapshot.contents) {
      const cls = item.classification || classifyContent(item.title, item.description || '', item.contentType || 'video', item.platform);
      const cRes = await pool.query(
        `INSERT INTO contents (platform, external_id, title, description, url, thumbnail_url, content_type, published_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (platform, external_id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           url = EXCLUDED.url,
           thumbnail_url = EXCLUDED.thumbnail_url,
           updated_at = NOW()
         RETURNING id`,
        [item.platform, item.externalId, item.title, item.description || '', item.url, item.thumbnailUrl || '', item.contentType || 'video', item.publishedAt]
      );

      const contentId = cRes.rows[0]?.id;
      if (contentId) {
        await pool.query(
          `INSERT INTO content_metrics (content_id, views_count, likes_count, comments_count, shares_count, engagement_rate, last_synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (content_id) DO UPDATE SET
             views_count = EXCLUDED.views_count,
             likes_count = EXCLUDED.likes_count,
             comments_count = EXCLUDED.comments_count,
             shares_count = EXCLUDED.shares_count,
             engagement_rate = EXCLUDED.engagement_rate,
             last_synced_at = NOW()`,
          [
            contentId,
            item.metrics.viewsCount || 0,
            item.metrics.likesCount || 0,
            item.metrics.commentsCount || 0,
            item.metrics.sharesCount !== null && item.metrics.sharesCount !== undefined ? item.metrics.sharesCount : null,
            item.metrics.engagementRate || 0
          ]
        );

        await pool.query(
          `INSERT INTO content_classifications (
             content_id, primary_brands, primary_products, secondary_brands, secondary_products, aliases, is_comparison, confidence_score, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (content_id) DO UPDATE SET
             primary_brands = EXCLUDED.primary_brands,
             primary_products = EXCLUDED.primary_products,
             secondary_brands = EXCLUDED.secondary_brands,
             secondary_products = EXCLUDED.secondary_products,
             aliases = EXCLUDED.aliases,
             is_comparison = EXCLUDED.is_comparison,
             confidence_score = EXCLUDED.confidence_score,
             updated_at = NOW()`,
          [
            contentId,
            JSON.stringify(cls.primaryBrands),
            JSON.stringify(cls.primaryProducts),
            JSON.stringify(cls.secondaryBrands),
            JSON.stringify(cls.secondaryProducts),
            JSON.stringify(cls.aliases),
            cls.isComparison,
            cls.confidenceScore
          ]
        );

        insertedCount++;
      }
    }
    console.log(`[SnapshotService] ${insertedCount} conteúdos sincronizados/assegurados no PostgreSQL.`);
  } catch (err: any) {
    console.warn('[SnapshotService] Aviso ao sincronizar snapshot com PostgreSQL:', err.message);
  }

  return insertedCount;
}

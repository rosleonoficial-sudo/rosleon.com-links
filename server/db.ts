import pg from 'pg';
import crypto from 'crypto';
import { fixBomberBrandOnly } from './classifierService.js';
import { initTikTokTable } from './tiktokService.js';
const { Pool } = pg;

export interface DbBrand {
  id: number;
  name: string;
  slug: string;
  keywords: string[];
  created_at?: string;
  updated_at?: string;
}

export interface DbContent {
  id: number;
  platform: 'youtube' | 'instagram' | 'tiktok';
  external_id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  content_type: 'video' | 'shorts' | 'reels';
  published_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbContentMetrics {
  content_id: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number | null;
  engagement_rate: number | null;
  last_synced_at: string;
}

// Initial seed brands - Brand names and brand variations only
export const INITIAL_BRANDS: Omit<DbBrand, 'id'>[] = [
  { name: 'AIWA', slug: 'aiwa', keywords: ['aiwa'] },
  { name: 'Golden Pro', slug: 'golden-pro', keywords: ['golden pro', 'goldenpro', 'golden pro power box', 'golden'] },
  { name: 'WAAW', slug: 'waaw', keywords: ['waaw', 'waaw by alok'] },
  { name: 'UOL', slug: 'uol', keywords: ['uol', 'uol meu negocio', 'uolhost', 'uol host', 'uol play', 'meunegocio'] },
  { name: 'JBL', slug: 'jbl', keywords: ['jbl'] },
  { name: 'Basike', slug: 'basike', keywords: ['basike', 'ba-rad', 'ba rad'] },
  { name: 'Pulse', slug: 'pulse', keywords: ['pulse'] },
  { name: 'Mercado Livre', slug: 'mercado-livre', keywords: ['mercado livre', 'mercadolivre', 'meli'] },
  { name: 'Bomber', slug: 'bomber', keywords: ['bomber', 'bomberbass', 'bomberbox', 'bombertrolley', 'boomber'] },
  { name: 'Tribit', slug: 'tribit', keywords: ['tribit', 'tribut'] },
  { name: 'Tronsmart', slug: 'tronsmart', keywords: ['tronsmart'] },
  { name: 'Stage', slug: 'stage', keywords: ['stage', 'stage gofree'] },
  { name: 'Xdobo', slug: 'xdobo', keywords: ['xdobo'] },
  { name: 'Sabala', slug: 'sabala', keywords: ['sabala'] },
  { name: 'Nuoma', slug: 'nuoma', keywords: ['nuoma'] },
  { name: 'Imenso', slug: 'imenso', keywords: ['imenso'] },
  { name: 'Anker', slug: 'anker', keywords: ['anker', 'soundcore'] },
  { name: 'Mifa', slug: 'mifa', keywords: ['mifa'] },
  { name: 'Zealot', slug: 'zealot', keywords: ['zealot'] },
  { name: 'Hopestar', slug: 'hopestar', keywords: ['hopestar'] },
  { name: 'Joog', slug: 'joog', keywords: ['joog', 'jog'] },
  { name: 'Kimaster', slug: 'kimaster', keywords: ['kimaster'] },
  { name: 'Kaidi', slug: 'kaidi', keywords: ['kaidi'] },
  { name: 'H\'Maston', slug: 'hmaston', keywords: ['hmaston', "h'maston", 'h-maston', 'h maston'] },
  { name: 'FAM', slug: 'fam', keywords: ['fam'] },
  { name: 'Agold', slug: 'agold', keywords: ['agold'] },
  { name: 'Danx', slug: 'danx', keywords: ['danx'] },
  { name: 'AOC', slug: 'aoc', keywords: ['aoc'] },
  { name: 'Realme', slug: 'realme', keywords: ['realme'] },
  { name: 'LG', slug: 'lg', keywords: ['lg', 'xboom'] },
  { name: 'Beats', slug: 'beats', keywords: ['beats'] },
  { name: 'W-King', slug: 'w-king', keywords: ['w-king', 'wking', 'w king'] },
  { name: 'MLove', slug: 'mlove', keywords: ['mlove'] },
  { name: 'Fifine', slug: 'fifine', keywords: ['fifine'] },
  { name: 'Armer', slug: 'armer', keywords: ['armer'] },
  { name: 'Byintek', slug: 'byintek', keywords: ['byintek'] },
  { name: 'Bigme', slug: 'bigme', keywords: ['bigme'] },
  { name: 'Infinix', slug: 'infinix', keywords: ['infinix'] },
  { name: 'OEK', slug: 'oek', keywords: ['oek'] }
];

// In-memory fallback store
interface MemoryStore {
  brands: DbBrand[];
  contents: DbContent[];
  content_brands: { content_id: number; brand_id: number }[];
  metrics: Map<number, DbContentMetrics>;
  nextBrandId: number;
  nextContentId: number;
}

const memoryDb: MemoryStore = {
  brands: [],
  contents: [],
  content_brands: [],
  metrics: new Map(),
  nextBrandId: 1,
  nextContentId: 1
};

export function getDatabaseUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

export function getDatabaseInfoSafe() {
  return getSafeDatabaseIdentity();
}

export function getSafeDatabaseIdentity() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    return { hostHash: null, database: null, schema: 'public', configured: false };
  }
  try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname || '';
    const database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : '';
    const hostHash = host ? crypto.createHash('sha256').update(host).digest('hex').substring(0, 12) : null;
    return {
      hostHash,
      database: database || 'default',
      schema: 'public',
      configured: true
    };
  } catch (e) {
    return { hostHash: 'configured', database: 'configured', schema: 'public', configured: true };
  }
}

let pool: pg.Pool | null = null;
let isPgAvailable = false;
let initPromise: Promise<void> | null = null;

export async function initDatabase() {
  if (isPgAvailable && pool) {
    return;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const databaseUrl = getDatabaseUrl();

    if (databaseUrl) {
      try {
        if (!pool) {
          pool = new Pool({
            connectionString: databaseUrl,
            ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
          });
        }

        // Test connection
        const client = await pool.connect();
        client.release();
        isPgAvailable = true;
        console.log('PostgreSQL Database conectado com sucesso via DATABASE_URL');

        // Create Tables
        await pool.query(`
          CREATE TABLE IF NOT EXISTS brands (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            slug VARCHAR(255) NOT NULL UNIQUE,
            keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS contents (
            id SERIAL PRIMARY KEY,
            platform VARCHAR(50) NOT NULL,
            external_id VARCHAR(255) NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            url TEXT NOT NULL,
            thumbnail_url TEXT,
            content_type VARCHAR(50) DEFAULT 'video',
            published_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_platform_external_id UNIQUE(platform, external_id)
          );

          CREATE TABLE IF NOT EXISTS content_brands (
            content_id INT REFERENCES contents(id) ON DELETE CASCADE,
            brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
            PRIMARY KEY (content_id, brand_id)
          );

          CREATE TABLE IF NOT EXISTS content_metrics (
            content_id INT PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
            views_count BIGINT DEFAULT 0,
            likes_count BIGINT DEFAULT 0,
            comments_count BIGINT DEFAULT 0,
            shares_count BIGINT DEFAULT NULL,
            engagement_rate REAL DEFAULT 0,
            last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            model_code VARCHAR(100),
            aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS content_classifications (
            content_id INT PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
            primary_brands JSONB NOT NULL DEFAULT '[]'::jsonb,
            primary_products JSONB NOT NULL DEFAULT '[]'::jsonb,
            secondary_brands JSONB NOT NULL DEFAULT '[]'::jsonb,
            secondary_products JSONB NOT NULL DEFAULT '[]'::jsonb,
            aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
            is_comparison BOOLEAN DEFAULT FALSE,
            confidence_score REAL DEFAULT 1.0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_contents_published_at ON contents(published_at DESC);
          CREATE INDEX IF NOT EXISTS idx_contents_platform ON contents(platform);
          CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
          CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
          CREATE INDEX IF NOT EXISTS idx_classifications_comparison ON content_classifications(is_comparison);
        `);

        // Seed & update Postgres brands with clean keywords
        for (const b of INITIAL_BRANDS) {
          const res = await pool.query(
            `UPDATE brands SET keywords = $1 WHERE name = $2 OR slug = $3`,
            [JSON.stringify(b.keywords), b.name, b.slug]
          );
          if ((res.rowCount ?? 0) === 0) {
            await pool.query(
              `INSERT INTO brands (name, slug, keywords) VALUES ($1, $2, $3)
               ON CONFLICT DO NOTHING`,
              [b.name, b.slug, JSON.stringify(b.keywords)]
            );
          }
        }

        // PURGE ALL MOCK/DEMO CONTENTS FROM POSTGRES IF THEY EXIST
        await pool.query(`
          DELETE FROM contents 
          WHERE external_id LIKE '%_yt' 
             OR external_id LIKE '%_ig' 
             OR external_id = 'OmoZTIh7DCs'
             OR external_id = 'waaw_hyper100_yt'
             OR external_id = 'jbl_vs_waaw_yt'
             OR external_id = 'uol_meunegocio_ig'
             OR external_id = 'basike_fone_ig'
             OR external_id = 'jbl_partybox_ig'
             OR external_id = 'waaw_vibe100_shorts'
             OR external_id = 'waaw_meli_ig'
        `);

        // Audit and fix Bomber brand contents
        await fixBomberBrandOnly();

        // Ensure TikTok tables (tiktok_tokens, tiktok_oauth_states) exist
        await initTikTokTable();

        return;
      } catch (e: any) {
        console.warn('Não foi possível conectar ao PostgreSQL via DATABASE_URL. Utilizando in-memory DB fallback:', e.message);
        isPgAvailable = false;
        initPromise = null;
      }
    }

    // Fallback to In-Memory Store
    seedMemoryDatabase();
    await fixBomberBrandOnly();
  })();

  return initPromise;
}

function seedMemoryDatabase() {
  if (memoryDb.brands.length > 0) return;

  for (const b of INITIAL_BRANDS) {
    const brand: DbBrand = {
      id: memoryDb.nextBrandId++,
      name: b.name,
      slug: b.slug,
      keywords: b.keywords,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryDb.brands.push(brand);
  }
}

export function isPostgresActive(): boolean {
  return isPgAvailable || Boolean(getDatabaseUrl());
}

export function getPool(): pg.Pool | null {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    isPgAvailable = true;
  }
  return pool;
}

export function getMemoryStore(): MemoryStore {
  return memoryDb;
}

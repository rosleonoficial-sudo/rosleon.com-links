import pg from 'pg';
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

// Initial seed brands - SPECIFIC keywords only, no generic words
export const INITIAL_BRANDS: Omit<DbBrand, 'id'>[] = [
  { name: 'WAAW', slug: 'waaw', keywords: ['waaw', 'waaw by alok', 'boombug', 'waaw300'] },
  { name: 'UOL', slug: 'uol', keywords: ['uol', 'uol meu negocio', 'uolhost', 'uol host', 'uol play', 'meunegocio'] },
  { name: 'JBL', slug: 'jbl', keywords: ['jbl', 'jbl boombox', 'jbl flip', 'jbl charge', 'jbl partybox', 'jbl tune', 'jbl go'] },
  { name: 'Basike', slug: 'basike', keywords: ['basike'] },
  { name: 'Pulse', slug: 'pulse', keywords: ['pulse'] },
  { name: 'Mercado Livre', slug: 'mercado-livre', keywords: ['mercado livre', 'mercadolivre', 'meli'] }
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

let pool: pg.Pool | null = null;
let isPgAvailable = false;

export async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

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
        await pool.query(
          `INSERT INTO brands (name, slug, keywords) VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE SET keywords = EXCLUDED.keywords`,
          [b.name, b.slug, JSON.stringify(b.keywords)]
        );
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

      return;
    } catch (e: any) {
      console.warn('Não foi possível conectar ao PostgreSQL via DATABASE_URL. Utilizando in-memory DB fallback:', e.message);
      isPgAvailable = false;
    }
  }

  // Fallback to In-Memory Store
  seedMemoryDatabase();
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
  return isPgAvailable;
}

export function getPool(): pg.Pool | null {
  return pool;
}

export function getMemoryStore(): MemoryStore {
  return memoryDb;
}

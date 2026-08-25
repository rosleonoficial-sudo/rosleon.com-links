import { getPool, isPostgresActive, getMemoryStore, DbBrand } from './db';

export interface DbProduct {
  id: number;
  brand_id: number;
  name: string;
  slug: string;
  model_code: string;
  aliases: string[];
  created_at?: string;
}

export interface DbClassification {
  content_id: number;
  primary_brands: string[];
  primary_products: string[];
  secondary_brands: string[];
  secondary_products: string[];
  aliases: string[];
  is_comparison: boolean;
  confidence_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClassificationResult {
  primaryBrands: string[];
  primaryProducts: string[];
  secondaryBrands: string[];
  secondaryProducts: string[];
  aliases: string[];
  isComparison: boolean;
  confidenceScore: number;
}

// Category Stopwords & Generic terms that must NEVER be treated as brands or products
const CATEGORY_STOPWORDS = new Set([
  'caixa', 'caixas', 'caixinha', 'caixinhas', 'som', 'soms', 'fone', 'fones',
  'headphone', 'headphones', 'earbud', 'earbuds', 'áudio', 'audio', 'bluetooth',
  'grave', 'graves', 'subgrave', 'subgraves', 'bateria', 'baterias', 'potente',
  'potentes', 'potência', 'potencia', 'rms', 'w', 'watt', 'watts', 'karaoke',
  'karaokê', 'microfone', 'microfones', 'portátil', 'portatil', 'portáteis',
  'água', 'agua', 'waterproof', 'smartwatch', 'relógio', 'relogio', 'celular',
  'smartphone', 'notebook', 'pila', 'reais', 'real', 'volume', 'bruta', 'bruto',
  'ultra', 'pro', 'max', 'mini', 'plus', 'super', 'sorteio', 'gigante', 'pequena',
  'grande', 'mudanças', 'mudancas', 'atualização', 'atualizacao', 'dura', 'quanto',
  'veja', 'agora', 'paaaauleeera', 'paauleeera', 'fim', 'linha', 'teste', 'detalhes',
  'unboxing', 'análise', 'analise', 'review', 'completo', 'completa', 'caixadesom',
  'caixade', 'máximo', 'maximo'
]);

const COMMERCIAL_STOPWORDS = new Set([
  'mercado', 'livre', 'mercadolivre', 'shopee', 'shoppee', 'amazon', 'aliexpress',
  'magalu', 'cupom', 'cupons', 'oferta', 'ofertas', 'promoção', 'promocao',
  'preço', 'preco', 'barata', 'barato', 'custo', 'benefício', 'beneficio',
  'vale', 'pena', 'comprar', 'unboxing', 'análise', 'analise', 'review',
  'teste', 'testei', 'dura', 'quanto', 'lançamento', 'lancamento', 'atualização',
  'atualizacao', 'novo', 'nova', 'monstra', 'cara', 'chegou', 'brasil',
  'destaque', 'vivo', 'live', 'bate', 'papo', 'agradecer', 'canal', 'rosleon',
  'vídeo', 'video', 'post', 'reels', 'shorts', 'short', 'parte', 'detalhes',
  'dicas', 'top', 'melhor', 'melhores', 'pior', 'piores', 'escolher', 'escolha',
  'antes', 'depois', 'anos', 'meses', 'dias', 'veja', 'agora', 'hoje', 'atenção',
  'atencao', 'cuidado', 'alerta', 'segredo', 'verdade', 'muda', 'mudou', 'mudanças',
  'qual', 'quem', 'assim', 'onde', 'como', 'tudo', 'nada', 'aqui', 'ali'
]);

const NOISE_STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'ou', 'e', 'vs',
  'versus', 'x', 'que', 'qual', 'como', 'mais', 'menos', 'já', 'ja', 'era', 'será',
  'sera', 'pode', 'vai', 'tem', 'sua', 'seu', 'suas', 'seus', 'esse', 'essa',
  'esses', 'essas', 'este', 'esta', 'estes', 'estas', 'aquele', 'aquela'
]);

// Secondary / Alias Phrase Triggers
const ALIAS_TRIGGERS = [
  'mais conhecida como',
  'também conhecida como',
  'tambem conhecida como',
  'conhecida como',
  'vendida como',
  'nome internacional',
  'outro nome',
  'equivalente a',
  'similar a',
  'mesma que',
  'versão brasileira de',
  'versao brasileira de',
  'versão de',
  'versao de',
  'substituta de',
  'substituta da',
  'substituta do',
  'substitui a',
  'substitui o',
  'substitui',
  'será que substitui',
  'sera que substitui',
  'sucessora de',
  'sucessora da',
  'sucessora do',
  'sucessor de',
  'novo nome de',
  'novo nome da',
  'baseada em',
  'parecida com',
  'cópia de',
  'copia de',
  'outra cópia',
  'outra copia',
  'concorrente da',
  'concorrente do',
  'concorrente de',
  'mesmo projeto da',
  'mesmo projeto do',
  'mesma caixa da',
  'mesma caixa do',
  'oem de'
];

// Explicit Comparison Regex (strict match for real comparisons only)
const EXPLICIT_COMPARISON_REGEX = /\b(vs\.?|versus|\b\s+x\s+|\bvs\b|qual é melhor|qual e melhor|qual escolher|um ou outro|duelo|batalha|teste lado a lado|quem leva a melhor|disputa)\b/i;

// Regex for model codes (e.g., RAD-441, RAD 441, NM-IP501, NM IP501, S78, DR-908, X39, GP13000, ZE41, ACS6331, IP-601M)
const MODEL_CODE_REGEX = /\b([a-z]{1,4}[- ]?\d{2,5}[a-z]?|\d{3,5}[a-z]{1,3}|[a-z]{2,5}\d{1,4}[a-z]?)\b/i;

// Standard Product Line names
const KNOWN_LINE_REGEX = /\b(boombox\s*\d*|hyperboom\s*\d*|infinite\s*\d+|beat\s*\d+|partybox\s*\d*|stormbox\s*\w+|power\s*box\s*\d*|premium\s*\d+|go\s*free\s*\d*|sound\s*outdoor|mirtune\s*\w+|charge\s*\d*|flip\s*\d*|xtreme\s*\d*)\b/i;

// Global catalog of known brands and models
let brandCatalog: { id: number; name: string; keywords: string[] }[] = [];
let modelToBrandMap: Map<string, string> = new Map(); // normalized model code -> Brand name

export function normalizeToken(token: string): string {
  return token.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeModelCode(code: string): string {
  return code.toUpperCase().replace(/[\s\-_]+/g, '');
}

export function isGenericWord(word: string): boolean {
  const norm = normalizeToken(word);
  if (!norm || norm.length <= 1) return true;
  return CATEGORY_STOPWORDS.has(norm) || COMMERCIAL_STOPWORDS.has(norm) || NOISE_STOPWORDS.has(norm);
}

// Clean title from emojis and decorative markers
export function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
    .replace(/[⭐🔥🚨😱📦🌟📌🔹#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Load / Refresh Brand and Product Catalog from Database or Memory
 */
export async function refreshCatalog() {
  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        const bRes = await pool.query('SELECT id, name, keywords FROM brands ORDER BY name ASC');
        brandCatalog = bRes.rows.map(r => ({
          id: r.id,
          name: r.name,
          keywords: Array.isArray(r.keywords) ? r.keywords : JSON.parse(r.keywords || '[]')
        }));

        const pRes = await pool.query(`
          SELECT p.name, p.model_code, b.name as brand_name
          FROM products p
          JOIN brands b ON p.brand_id = b.id
        `);
        modelToBrandMap.clear();
        for (const row of pRes.rows) {
          if (row.model_code) {
            modelToBrandMap.set(normalizeModelCode(row.model_code), row.brand_name);
          }
        }
        return;
      } catch (e) {
        console.warn('Erro ao atualizar catálogo via Postgres:', e);
      }
    }
  }

  // Memory fallback
  const memoryDb = getMemoryStore();
  brandCatalog = memoryDb.brands.map(b => ({
    id: b.id,
    name: b.name,
    keywords: b.keywords
  }));

  if ((memoryDb as any).products) {
    modelToBrandMap.clear();
    for (const p of (memoryDb as any).products) {
      const b = memoryDb.brands.find(br => br.id === p.brand_id);
      if (b && p.model_code) {
        modelToBrandMap.set(normalizeModelCode(p.model_code), b.name);
      }
    }
  }
}

/**
 * Add a newly discovered brand or product model into catalog
 */
export async function registerBrandAndProduct(brandName: string, modelCode?: string, fullProductName?: string) {
  if (!brandName || isGenericWord(brandName)) return;

  const bNameClean = brandName.trim();
  const normBName = normalizeToken(bNameClean);
  if (normBName.length <= 1) return;

  let brandObj = brandCatalog.find(b => normalizeToken(b.name) === normBName);

  if (!brandObj) {
    // Register brand in Postgres or Memory
    const slug = normBName;
    if (isPostgresActive()) {
      const pool = getPool();
      if (pool) {
        try {
          const res = await pool.query(
            `INSERT INTO brands (name, slug, keywords) VALUES ($1, $2, $3)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING id, name, keywords`,
            [bNameClean, slug, JSON.stringify([normBName])]
          );
          if (res.rows[0]) {
            brandObj = {
              id: res.rows[0].id,
              name: res.rows[0].name,
              keywords: [normBName]
            };
            brandCatalog.push(brandObj);
          }
        } catch (e) {}
      }
    } else {
      const memoryDb = getMemoryStore();
      const newId = memoryDb.nextBrandId++;
      brandObj = { id: newId, name: bNameClean, keywords: [normBName] };
      memoryDb.brands.push({ id: newId, name: bNameClean, slug, keywords: [normBName] });
      brandCatalog.push(brandObj);
    }
  }

  if (modelCode && brandObj) {
    const normCode = normalizeModelCode(modelCode);
    if (normCode.length >= 2) {
      modelToBrandMap.set(normCode, brandObj.name);

      const pName = fullProductName || `${brandObj.name} ${modelCode.toUpperCase()}`;
      const pSlug = `${normalizeToken(brandObj.name)}-${normalizeToken(modelCode)}`;

      if (isPostgresActive()) {
        const pool = getPool();
        if (pool) {
          try {
            await pool.query(
              `INSERT INTO products (brand_id, name, slug, model_code, aliases)
               VALUES ($1, $2, $3, $4, '[]'::jsonb)
               ON CONFLICT (slug) DO NOTHING`,
              [brandObj.id, pName, pSlug, modelCode.toUpperCase()]
            );
          } catch (e) {}
        }
      } else {
        const memoryDb = getMemoryStore();
        if (!(memoryDb as any).products) (memoryDb as any).products = [];
        if (!(memoryDb as any).products.some((p: any) => p.slug === pSlug)) {
          (memoryDb as any).products.push({
            id: (memoryDb as any).products.length + 1,
            brand_id: brandObj.id,
            name: pName,
            slug: pSlug,
            model_code: modelCode.toUpperCase(),
            aliases: []
          });
        }
      }
    }
  }
}

/**
 * Extract Brands and Products from a raw clause segment
 */
function extractEntitiesFromSegment(segmentText: string): { brands: string[]; products: string[] } {
  const text = cleanText(segmentText);
  if (!text) return { brands: [], products: [] };

  const extractedBrands = new Set<string>();
  const extractedProducts = new Set<string>();

  // 1. Check existing Catalog Brands first
  for (const b of brandCatalog) {
    const normB = normalizeToken(b.name);
    if (!normB) continue;

    // Boundary check for brand name in text
    const regex = new RegExp(`\\b${b.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      extractedBrands.add(b.name);
    }
  }

  // 2. Look for Model Code patterns in the text
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[:,\(\)!\?]/g, '');
    const modelMatch = word.match(MODEL_CODE_REGEX);

    if (modelMatch && !isGenericWord(word)) {
      const modelCode = modelMatch[0];
      const normModelCode = normalizeModelCode(modelCode);

      // Check if previous word or two words prior is a brand
      let brandFound: string | null = null;
      if (i > 0) {
        const prev1 = words[i - 1].replace(/[:,\(\)!\?]/g, '');
        if (!isGenericWord(prev1) && prev1.length >= 2) {
          brandFound = prev1;
        }
      }
      if (!brandFound && i > 1) {
        const prev2 = words[i - 2].replace(/[:,\(\)!\?]/g, '');
        const prev1 = words[i - 1].replace(/[:,\(\)!\?]/g, '');
        const combo = `${prev2} ${prev1}`;
        if (!isGenericWord(prev2) && !isGenericWord(prev1)) {
          brandFound = combo;
        }
      }

      // If brand was not immediately preceding, check modelToBrandMap from catalog
      if (!brandFound && modelToBrandMap.has(normModelCode)) {
        brandFound = modelToBrandMap.get(normModelCode)!;
      }

      if (brandFound && !isGenericWord(brandFound)) {
        // Capitalize brand cleanly
        const brandClean = brandFound.charAt(0).toUpperCase() + brandFound.slice(1);
        extractedBrands.add(brandClean);

        const prodName = `${brandClean} ${modelCode.toUpperCase()}`;
        extractedProducts.add(prodName);

        // Auto-register brand and product to catalog
        registerBrandAndProduct(brandClean, modelCode, prodName);
      } else {
        // Model code alone found without explicit brand
        extractedProducts.add(modelCode.toUpperCase());
      }
    }
  }

  // 3. Look for Known Product Line patterns (e.g., Hyperboom 1000, Infinite 100, Boombox 4, Stormbox Blast)
  const lineMatch = text.match(KNOWN_LINE_REGEX);
  if (lineMatch) {
    const lineName = lineMatch[0];
    // Check if brand is nearby
    let matchedBrand: string | null = null;
    for (const b of brandCatalog) {
      const regex = new RegExp(`\\b${b.name}\\b`, 'i');
      if (regex.test(text)) {
        matchedBrand = b.name;
        break;
      }
    }

    if (matchedBrand) {
      extractedBrands.add(matchedBrand);
      const fullProd = `${matchedBrand} ${lineName.charAt(0).toUpperCase() + lineName.slice(1)}`;
      extractedProducts.add(fullProd);
    } else {
      extractedProducts.add(lineName.charAt(0).toUpperCase() + lineName.slice(1));
    }
  }

  // 4. Standalone Brand Detection (if a brand is named without a specific model)
  for (const word of words) {
    const cleanW = word.replace(/[:,\(\)!\?]/g, '');
    if (!isGenericWord(cleanW) && cleanW.length >= 3 && /^[A-Z][a-zA-Z0-9]+$/.test(cleanW)) {
      // Check if it matches an existing catalog brand
      const matchingCatalog = brandCatalog.find(b => normalizeToken(b.name) === normalizeToken(cleanW));
      if (matchingCatalog) {
        extractedBrands.add(matchingCatalog.name);
      }
    }
  }

  return {
    brands: Array.from(extractedBrands),
    products: Array.from(extractedProducts)
  };
}

/**
 * SEMANTIC CLASSIFIER FUNCTION
 * 
 * Classifies any content title & description semantically:
 * - Identifies primary brands & primary products
 * - Identifies secondary / alias mentions (e.g., "mais conhecida como", parentheses reference)
 * - Identifies comparison videos ("vs", "versus", "x")
 * - Calculates confidence score
 */
export function classifyContent(
  title: string,
  description: string = '',
  contentType: string = 'video',
  platform: string = 'youtube'
): ClassificationResult {
  const cleanT = cleanText(title);
  if (!cleanT) {
    return {
      primaryBrands: [],
      primaryProducts: [],
      secondaryBrands: [],
      secondaryProducts: [],
      aliases: [],
      isComparison: false,
      confidenceScore: 1.0
    };
  }

  let primaryText = cleanT;
  const secondaryParts: string[] = [];

  // 1. EXTRACT PARENTHESES (e.g. "(Xdobo WOW MAX)" or "(Imenso X75)")
  primaryText = primaryText.replace(/\(([^)]+)\)/g, (match, inner) => {
    const trimmed = inner.trim();
    if (trimmed) {
      const isGenericInside = trimmed.split(/\s+/).every(w => isGenericWord(w) || /^\d+w?$/i.test(w));
      if (!isGenericInside && trimmed.length >= 2) {
        secondaryParts.push(trimmed);
      }
    }
    return ' ';
  }).replace(/\s+/g, ' ').trim();

  // 2. CHECK FOR HOOK PATTERN "Fim da <Sec>? Agora <Pri>!" or "Fim do <Sec>?"
  const fimDaMatch = primaryText.match(/^fim\s+d[aoe]s?\s+([^?!]+)[?!]+\s*(?:agora\s+)?(.*)$/i);
  if (fimDaMatch && fimDaMatch[2].trim()) {
    secondaryParts.push(fimDaMatch[1].trim());
    primaryText = fimDaMatch[2].trim();
  }

  // 3. CHECK FOR HOOK PATTERNS "a nova <Sec>?" or "o novo <Sec>?" AT END OF TITLE
  const hookPhrases = [' a nova ', ' o novo ', ' nova '];
  for (const hp of hookPhrases) {
    const lowerP = primaryText.toLowerCase();
    const lastIdx = lowerP.lastIndexOf(hp);
    if (lastIdx > 0) {
      const afterHook = primaryText.slice(lastIdx + hp.length).replace(/\?$/, '').trim();
      if (afterHook) {
        secondaryParts.push(afterHook);
        primaryText = primaryText.slice(0, lastIdx).trim();
        break;
      }
    }
  }

  // 4. SPLIT BY ALIAS / SECONDARY TRIGGERS (e.g. "mais conhecida como", "substituta da", "versão de")
  for (const trigger of ALIAS_TRIGGERS) {
    const lowerP = primaryText.toLowerCase();
    const idx = lowerP.indexOf(trigger);
    if (idx !== -1) {
      const mainPart = primaryText.slice(0, idx).trim();
      const secPart = primaryText.slice(idx + trigger.length).trim();
      primaryText = mainPart;
      if (secPart) secondaryParts.push(secPart);
      break;
    }
  }

  // 5. HANDLE HYPHEN '-' OR SLASH '/' IN TITLE
  // Check if primaryText has an explicit comparison trigger
  const hasExplicitComp = EXPLICIT_COMPARISON_REGEX.test(primaryText);

  if (hasExplicitComp) {
    // Check if there is a trailing clause after '-' (e.g., "Hopestar A60 Ultra vs Nuoma IP-501 - Imenso X75/Xdobo WOW MAX")
    const dashIdx = primaryText.indexOf(' - ');
    if (dashIdx > 0) {
      const beforeDash = primaryText.slice(0, dashIdx).trim();
      const afterDash = primaryText.slice(dashIdx + 3).trim();
      // If the explicit comparison word is BEFORE the dash, then afterDash is secondary
      if (EXPLICIT_COMPARISON_REGEX.test(beforeDash)) {
        primaryText = beforeDash;
        if (afterDash) secondaryParts.push(afterDash);
      }
    }
  } else {
    // NO explicit comparison trigger. Check if '-' separates a primary subject from a secondary reference
    // Example: "Teste de Bateria Basike RAD 289 - Imenso x39 e Basike RAD 133 Vol: 100%"
    if (primaryText.includes(' - ')) {
      const parts = primaryText.split(' - ').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const sideA = extractEntitiesFromSegment(parts[0]);
        if (sideA.brands.length > 0 || sideA.products.length > 0) {
          primaryText = parts[0];
          for (let i = 1; i < parts.length; i++) {
            secondaryParts.push(parts[i]);
          }
        }
      }
    }
  }

  // 6. EVALUATE IS_COMPARISON (STRICT MATCH FOR REAL COMPARISONS ONLY)
  const isComparison = EXPLICIT_COMPARISON_REGEX.test(primaryText);

  const primaryBrandsSet = new Set<string>();
  const primaryProductsSet = new Set<string>();

  if (isComparison) {
    // Split primary text into comparison sides
    const sides = primaryText.split(/\b(?:vs\.?|versus|\b\s+x\s+|\bvs\b|ou|duelo|batalha)\b/i).map(s => s.trim()).filter(Boolean);

    for (const side of sides) {
      const res = extractEntitiesFromSegment(side);
      res.brands.forEach(b => primaryBrandsSet.add(b));
      res.products.forEach(p => primaryProductsSet.add(p));
    }
  } else {
    // Single Primary Clause
    const res = extractEntitiesFromSegment(primaryText);
    res.brands.forEach(b => primaryBrandsSet.add(b));
    res.products.forEach(p => primaryProductsSet.add(p));
  }

  // 7. EXTRACT SECONDARY / ALIAS ENTITIES
  const secondaryBrandsSet = new Set<string>();
  const secondaryProductsSet = new Set<string>();
  const aliasesSet = new Set<string>();

  const secondaryCombinedText = secondaryParts.join(' ').trim();
  if (secondaryCombinedText) {
    const secRes = extractEntitiesFromSegment(secondaryCombinedText);
    secRes.brands.forEach(b => {
      if (!primaryBrandsSet.has(b)) {
        secondaryBrandsSet.add(b);
      }
    });
    secRes.products.forEach(p => {
      if (!primaryProductsSet.has(p)) {
        secondaryProductsSet.add(p);
        aliasesSet.add(p);
      }
    });
    if (secRes.products.length === 0 && secondaryCombinedText.length > 2) {
      aliasesSet.add(cleanText(secondaryCombinedText));
    }
  }

  // 8. CONFIDENCE SCORE CALCULATION
  const confidenceScore = (primaryBrandsSet.size > 0 || primaryProductsSet.size > 0) ? 0.95 : 1.0;

  return {
    primaryBrands: Array.from(primaryBrandsSet),
    primaryProducts: Array.from(primaryProductsSet),
    secondaryBrands: Array.from(secondaryBrandsSet),
    secondaryProducts: Array.from(secondaryProductsSet),
    aliases: Array.from(aliasesSet),
    isComparison,
    confidenceScore
  };
}

/**
 * RECLASSIFY ALL DATABASE CONTENTS
 * Iterates over every content in DB, runs classification, stores results persistently.
 */
export async function reclassifyAllDatabaseContents() {
  console.log('Iniciando reclassificação semântica do catálogo completo...');
  await refreshCatalog();

  let totalReclassified = 0;
  let uniqueBrandsIdentified = new Set<string>();
  let uniqueProductsIdentified = new Set<string>();
  let singleTopicCount = 0;
  let comparisonCount = 0;
  let withSecondaryAliasesCount = 0;
  let associationsRemovedCount = 0;

  let contentsList: { id: number; title: string; description: string; platform: string; content_type: string }[] = [];

  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT id, title, description, platform, content_type FROM contents ORDER BY id ASC');
        contentsList = res.rows.map(r => ({
          id: r.id,
          title: r.title || '',
          description: r.description || '',
          platform: r.platform || 'youtube',
          content_type: r.content_type || 'video'
        }));
      } catch (e) {
        console.warn('Erro ao carregar conteúdos para reclassificação no Postgres:', e);
      }
    }
  }

  if (contentsList.length === 0) {
    const memoryDb = getMemoryStore();
    contentsList = memoryDb.contents.map(c => ({
      id: c.id,
      title: c.title || '',
      description: c.description || '',
      platform: c.platform,
      content_type: c.content_type || 'video'
    }));
  }

  // Purge old content_brands associations to rebuild clean primary-only brand associations
  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        const cbCountRes = await pool.query('SELECT COUNT(*)::int as count FROM content_brands');
        associationsRemovedCount = cbCountRes.rows[0]?.count || 0;
        await pool.query('DELETE FROM content_brands');
      } catch (e) {}
    }
  } else {
    const memoryDb = getMemoryStore();
    associationsRemovedCount = memoryDb.content_brands.length;
    memoryDb.content_brands = [];
  }

  // Process every content item
  for (const item of contentsList) {
    const result = classifyContent(item.title, item.description, item.content_type, item.platform);

    totalReclassified++;

    if (result.isComparison) {
      comparisonCount++;
    } else if (result.primaryBrands.length === 1 || result.primaryProducts.length === 1) {
      singleTopicCount++;
    }

    if (result.secondaryBrands.length > 0 || result.secondaryProducts.length > 0 || result.aliases.length > 0) {
      withSecondaryAliasesCount++;
    }

    result.primaryBrands.forEach(b => uniqueBrandsIdentified.add(b));
    result.primaryProducts.forEach(p => uniqueProductsIdentified.add(p));

    // Save classification persistently
    if (isPostgresActive()) {
      const pool = getPool();
      if (pool) {
        try {
          await pool.query(`
            INSERT INTO content_classifications (
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
              updated_at = NOW()
          `, [
            item.id,
            JSON.stringify(result.primaryBrands),
            JSON.stringify(result.primaryProducts),
            JSON.stringify(result.secondaryBrands),
            JSON.stringify(result.secondaryProducts),
            JSON.stringify(result.aliases),
            result.isComparison,
            result.confidenceScore
          ]);

          // Connect ONLY primary brands in content_brands table
          for (const bName of result.primaryBrands) {
            const bObj = brandCatalog.find(b => normalizeToken(b.name) === normalizeToken(bName));
            if (bObj) {
              await pool.query(
                'INSERT INTO content_brands (content_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [item.id, bObj.id]
              );
            }
          }
        } catch (e) {
          console.warn(`Erro ao salvar classificação para content_id ${item.id}:`, e);
        }
      }
    } else {
      // Memory fallback
      const memoryDb = getMemoryStore();
      if (!(memoryDb as any).content_classifications) {
        (memoryDb as any).content_classifications = new Map<number, DbClassification>();
      }
      (memoryDb as any).content_classifications.set(item.id, {
        content_id: item.id,
        primary_brands: result.primaryBrands,
        primary_products: result.primaryProducts,
        secondary_brands: result.secondaryBrands,
        secondary_products: result.secondaryProducts,
        aliases: result.aliases,
        is_comparison: result.isComparison,
        confidence_score: result.confidenceScore
      });

      for (const bName of result.primaryBrands) {
        const bObj = brandCatalog.find(b => normalizeToken(b.name) === normalizeToken(bName));
        if (bObj) {
          memoryDb.content_brands.push({ content_id: item.id, brand_id: bObj.id });
        }
      }
    }
  }

  const report = {
    totalReclassified,
    uniqueBrandsIdentifiedCount: uniqueBrandsIdentified.size,
    uniqueProductsIdentifiedCount: uniqueProductsIdentified.size,
    singleTopicCount,
    comparisonCount,
    withSecondaryAliasesCount,
    associationsRemovedCount,
    uniqueBrandsList: Array.from(uniqueBrandsIdentified),
    uniqueProductsList: Array.from(uniqueProductsIdentified)
  };

  console.log('Reclassificação concluída com sucesso:', report);
  return report;
}

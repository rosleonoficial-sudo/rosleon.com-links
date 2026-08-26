import { getPool, isPostgresActive, getMemoryStore, DbBrand } from './db.js';

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
  'qual', 'quem', 'assim', 'onde', 'como', 'tudo', 'nada', 'aqui', 'ali',
  'abaixo', 'acima', 'reais', '2026', '2025', '2024', 'dura', 'quanto', 'pena', 'vale'
]);

const NOISE_STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'ou', 'e', 'vs',
  'versus', 'x', 'que', 'qual', 'como', 'mais', 'menos', 'já', 'ja', 'era', 'será',
  'sera', 'pode', 'vai', 'tem', 'sua', 'seu', 'suas', 'seus', 'esse', 'essa',
  'esses', 'essas', 'este', 'esta', 'estes', 'estas', 'aquele', 'aquela'
]);

// Secondary / Alias Phrase Triggers
export const ALIAS_TRIGGERS = [
  'mais conhecida como', 'mais conhecido como',
  'também conhecida como', 'também conhecido como',
  'tambem conhecida como', 'tambem conhecido como',
  'conhecida como', 'conhecido como',
  'vendida como', 'vendido como',
  'nome internacional', 'outro nome', 'nome comercial',
  'com referência a', 'com referencia a',
  'com referência da', 'com referencia da',
  'com referência do', 'com referencia do',
  'com referência', 'com referencia', 'com ref.', 'com ref',
  'referência a', 'referencia a',
  'referência da', 'referencia da',
  'referência do', 'referencia do',
  'referência', 'referencia', 'ref.', 'ref',
  'equivalente a', 'equivalente da', 'equivalente do', 'equivalentes', 'equivalente',
  'similar a', 'similar da', 'similar do', 'similares', 'similar',
  'mesmo projeto de', 'mesmo projeto da', 'mesmo projeto do', 'mesmo projeto',
  'mesma caixa de', 'mesma caixa da', 'mesma caixa do', 'mesma caixa',
  'mesma que', 'mesmo que',
  'white label de', 'white label da', 'white label do', 'white label',
  'whitelabel de', 'whitelabel da', 'whitelabel do', 'whitelabel',
  'oem de', 'oem da', 'oem do', 'oem',
  'versão brasileira de', 'versao brasileira de', 'versão de', 'versao de',
  'substituta de', 'substituta da', 'substituta do', 'substitui a', 'substitui o', 'substitui',
  'será que substitui', 'sera que substitui',
  'sucessora de', 'sucessora da', 'sucessora do', 'sucessor de',
  'novo nome de', 'novo nome da', 'novo nome do',
  'baseada em', 'baseado em',
  'parecida com', 'parecido com', 'parece com',
  'a nova', 'a nova caixa', 'é a nova', 'e a nova',
  'estilo', 'formato', 'tipo',
  'cópia de', 'copia de', 'cópia da', 'copia da', 'cópia do', 'copia do', 'outra cópia', 'outra copia',
  'concorrente da', 'concorrente do', 'concorrente de',
  'destruidora de', 'destruidora da', 'destruidora do',
  'matadora de', 'matadora da', 'matadora do', 'mata jbl',
  'réplica de', 'replica de', 'réplica da', 'replica da', 'réplica do', 'replica do'
].sort((a, b) => b.length - a.length);

// Canonical Brands & Aliases definition - Brand names and brand variations only
export const CANONICAL_BRANDS = [
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

// Explicit Comparison Regex (strict match for real comparisons only)
const EXPLICIT_COMPARISON_REGEX = /\b(vs\.?|versus|\b\s+x\s+|\bvs\b|\bvc\b|qual é melhor|qual e melhor|qual escolher|um ou outro|duelo|batalha|teste lado a lado|quem leva a melhor|disputa)\b/i;

// Regex for model codes (e.g., RAD-441, RAD 441, NM-IP501, NM IP501, S78, DR-908, X39, GP13000, ZE41, ACS6331, IP-601M)
const MODEL_CODE_REGEX = /\b([a-z]{1,4}[- ]?\d{2,5}[a-z]?|\d{3,5}[a-z]{1,3}|[a-z]{2,5}\d{1,4}[a-z]?)\b/i;

// Standard Product Line names
const KNOWN_LINE_REGEX = /\b(boombox\s*\d*|hyperboom\s*\d*|infinite\s*\d+|beat\s*\d+|partybox\s*\d*|stormbox\s*\w+|power\s*box\s*\d*|premium\s*\d+|go\s*free\s*\d*|sound\s*outdoor|mirtune\s*\w+|charge\s*\d*|flip\s*\d*|xtreme\s*\d*)\b/i;

// Canonical Model Code to Brand Map (canonical dictionary)
export const CANONICAL_MODEL_TO_BRAND: Record<string, string> = {
  // BASIKE MODELS
  'RAD441': 'Basike', 'RAD-441': 'Basike', 'BARAD441': 'Basike', 'BA-RAD441': 'Basike', 'BARAD-441': 'Basike',
  'RAD439': 'Basike', 'RAD-439': 'Basike', 'BARAD439': 'Basike', 'BA-RAD439': 'Basike',
  'RAD438': 'Basike', 'RAD-438': 'Basike', 'BARAD438': 'Basike', 'BA-RAD438': 'Basike',
  'RAD304': 'Basike', 'RAD-304': 'Basike', 'BARAD304': 'Basike', 'BA-RAD304': 'Basike',
  'RAD289': 'Basike', 'RAD-289': 'Basike', 'BARAD289': 'Basike', 'BA-RAD289': 'Basike',
  'RAD133': 'Basike', 'RAD-133': 'Basike', 'BARAD133': 'Basike', 'BA-RAD133': 'Basike',
  'RAD252': 'Basike', 'RAD-252': 'Basike', 'BARAD252': 'Basike', 'BA-RAD252': 'Basike',
  'BARAD171': 'Basike', 'BA-RAD171': 'Basike', 'RAD171': 'Basike', 'RAD-171': 'Basike',
  'RAD8633': 'Basike', 'RAD-8633': 'Basike', 'RAD8636': 'Basike', 'RAD-8636': 'Basike',
  'FN17': 'Basike', 'FN-17': 'Basike',

  // SABALA MODELS
  'DR909': 'Sabala', 'DR-909': 'Sabala',
  'DR908': 'Sabala', 'DR-908': 'Sabala',
  'DR300': 'Sabala', 'DR-300': 'Sabala',
  'DR107': 'Sabala', 'DR-107': 'Sabala',
  'DR52': 'Sabala', 'DR-52': 'Sabala',
  'DR58': 'Sabala', 'DR-58': 'Sabala',

  // IMENSO MODELS
  'X75': 'Imenso', 'X-75': 'Imenso', 'IMSX75': 'Imenso', 'IMS-X75': 'Imenso',
  'X73': 'Imenso', 'X-73': 'Imenso', 'IMSX73': 'Imenso', 'IMS-X73': 'Imenso',
  'X64': 'Imenso', 'X-64': 'Imenso', 'IMSX64': 'Imenso', 'IMS-X64': 'Imenso',
  'X56': 'Imenso', 'X-56': 'Imenso', 'IMSX56': 'Imenso', 'IMS-X56': 'Imenso',
  'X41': 'Imenso', 'X-41': 'Imenso', 'IMSX41': 'Imenso', 'IMS-X41': 'Imenso',
  'X39': 'Imenso', 'X-39': 'Imenso', 'IMSX39': 'Imenso', 'IMS-X39': 'Imenso',
  'X38': 'Imenso', 'X-38': 'Imenso', 'IMSX38': 'Imenso', 'IMS-X38': 'Imenso',
  'X32': 'Imenso', 'X-32': 'Imenso', 'IMSX32': 'Imenso', 'IMS-X32': 'Imenso',
  'X29': 'Imenso', 'X-29': 'Imenso', 'IMSX29': 'Imenso', 'IMS-X29': 'Imenso',
  'X26': 'Imenso', 'X-26': 'Imenso', 'IMSX26': 'Imenso', 'IMS-X26': 'Imenso',
  'X22': 'Imenso', 'X-22': 'Imenso', 'IMSX22': 'Imenso', 'IMS-X22': 'Imenso',
  'X82': 'Imenso', 'X-82': 'Imenso', 'IMSX82': 'Imenso', 'IMS-X82': 'Imenso',

  // NUOMA MODELS
  'NMIP501': 'Nuoma', 'NM-IP501': 'Nuoma', 'IP501': 'Nuoma', 'IP-501': 'Nuoma',
  'AIP603': 'Nuoma', 'AIP-603': 'Nuoma', 'NMAIP603': 'Nuoma', 'NM-AIP603': 'Nuoma',
  'AIP601': 'Nuoma', 'AIP-601': 'Nuoma', 'NMAIP601': 'Nuoma', 'NM-AIP601': 'Nuoma',
  'IP601M': 'Nuoma', 'IP-601M': 'Nuoma',

  // ZEALOT MODELS
  'S78': 'Zealot', 'S-78': 'Zealot',
  'S89': 'Zealot', 'S-89': 'Zealot',
  'S67': 'Zealot', 'S-67': 'Zealot',
  'S53': 'Zealot', 'S-53': 'Zealot',
  'S32': 'Zealot', 'S-32': 'Zealot',
  'S51': 'Zealot', 'S-51': 'Zealot',
  'S97': 'Zealot', 'S-97': 'Zealot',
  'ZE41': 'Zealot', 'ZE-41': 'Zealot',

  // XDOBO MODELS
  'WOWMAX': 'Xdobo', 'PRINCE1995': 'Xdobo', 'WING2020': 'Xdobo', 'KING1995': 'Xdobo',

  // GOLDEN PRO MODELS
  'GP13000': 'Golden Pro', 'GP-13000': 'Golden Pro', 'BOX19': 'Golden Pro',

  // AOC MODELS
  'ACS6331': 'AOC', 'ACS-6331': 'AOC',

  // WAAW MODELS
  'INFINITE100': 'WAAW', 'INFINITE200': 'WAAW', 'BEAT1000': 'WAAW',

  // BOMBER MODELS
  'BOMBERBOXPRO': 'Bomber', 'BOMBERBASS': 'Bomber', 'BOMBERBASSPLUS': 'Bomber', 'BOMBERTROLLEY850': 'Bomber',

  // TRIBIT MODELS
  'STORMBOXBLAST': 'Tribit', 'STORMBOXBLAST2': 'Tribit', 'STORMBOXBLAST1': 'Tribit',

  // PULSE MODELS
  'SP614': 'Pulse', 'SP626': 'Pulse',

  // KIMASTER MODELS
  'K400': 'Kimaster', 'K-400': 'Kimaster', 'K450': 'Kimaster', 'K-450': 'Kimaster', 'TWS100': 'Kimaster',

  // HMASTON
  'LY101': "H'Maston", 'LY101PRO': "H'Maston",

  // FAM
  'A022': 'FAM', 'A20': 'FAM', 'A11': 'FAM', 'A042': 'FAM'
};

/**
 * Resolve brand name for a given model code via dictionary or regex patterns
 */
export function resolveBrandForModelCode(rawCode: string): string | null {
  if (!rawCode) return null;
  const norm = normalizeModelCode(rawCode);
  if (CANONICAL_MODEL_TO_BRAND[norm]) {
    return CANONICAL_MODEL_TO_BRAND[norm];
  }
  if (CANONICAL_MODEL_TO_BRAND[rawCode.toUpperCase()]) {
    return CANONICAL_MODEL_TO_BRAND[rawCode.toUpperCase()];
  }

  // Regex pattern rules
  if (/^(BARAD|RAD)\d+/i.test(norm)) return 'Basike';
  if (/^DR\d{2,4}$/i.test(norm)) return 'Sabala';
  if (/^(IMS)?X(75|73|64|56|41|39|38|32|29|26|22|82)$/i.test(norm)) return 'Imenso';
  if (/^(NM)?(IP|AIP)\d{3}[A-Z]?$/i.test(norm)) return 'Nuoma';
  if (/^S(78|89|67|53|32|51|97)$/i.test(norm) || /^ZE41$/i.test(norm)) return 'Zealot';

  return modelToBrandMap.get(norm) || null;
}

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
  if (/^\d+$/.test(norm)) return true;
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

  // 1. Check known brands in CANONICAL_BRANDS and brandCatalog
  const allKnownBrands = [
    ...CANONICAL_BRANDS.map(b => ({ name: b.name, keywords: b.keywords })),
    ...brandCatalog.map(b => ({ name: b.name, keywords: b.keywords }))
  ];

  for (const b of allKnownBrands) {
    // Handling Portuguese adjective "imenso"
    if (b.name === 'Imenso') {
      const isAdjectiveImenso = /\b(?:grave|graves|som|soms|potência|potencia|sucesso|tamanho|paixão|paixao|desconto|valor|custo)\s+imenso\b/i.test(text)
        || /\bimenso\s+(?:grave|graves|som|soms|potência|potencia|sucesso|tamanho|desconto|valor|custo)\b/i.test(text);
      const hasImensoModel = /\b(?:ims[- ]?)?x(75|73|64|56|41|39|38|32|29|26|22|82)\b/i.test(text) || /@imensobr/i.test(text);

      if (isAdjectiveImenso && !hasImensoModel) {
        continue; // Skip treating "imenso" as a brand name when used as an adjective
      }
    }

    for (const kw of b.keywords) {
      const escaped = kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'i');
      if (regex.test(text)) {
        extractedBrands.add(b.name);
        break;
      }
    }
  }

  // 2. Generic & Specific Model Code Matching
  const modelCodeMatches = text.match(/\b([a-zA-Z]{1,4}(?:-[a-zA-Z]{1,4})?[- ]?\d{1,5}[a-zA-Z0-9]*|\d{2,5}[a-zA-Z]{1,4})\b/gi);
  if (modelCodeMatches) {
    for (const rawCode of modelCodeMatches) {
      const cleanCode = rawCode.trim().toUpperCase();
      const normCode = normalizeToken(cleanCode);
      if (!normCode || isGenericWord(normCode)) continue;

      // Skip wattage, specification, year patterns
      if (/^\d+\s*(w|watt|watts|rms|mah)$/i.test(rawCode)) continue;
      if (/^(2024|2025|2026|2027|2028)$/.test(cleanCode)) continue;

      // Check if this model code resolves to a canonical brand
      const resolvedBrand = resolveBrandForModelCode(cleanCode);
      if (resolvedBrand) {
        extractedBrands.add(resolvedBrand);
        extractedProducts.add(`${resolvedBrand} ${cleanCode}`);
      } else {
        extractedProducts.add(cleanCode);
      }
    }
  }

  // 3. Known product line matching for identified or implicit brands
  const lowerText = text.toLowerCase();
  if (lowerText.includes('boombox')) {
    if (extractedBrands.has('JBL') || lowerText.includes('jbl')) {
      extractedBrands.add('JBL');
      extractedProducts.add('JBL Boombox');
    }
  }
  if (lowerText.includes('stormbox')) {
    extractedBrands.add('Tribit');
    extractedProducts.add('Tribit StormBox');
  }
  if (lowerText.includes('partybox')) {
    extractedBrands.add('JBL');
    extractedProducts.add('JBL Partybox');
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

  // 1. EXTRACT PARENTHESES
  primaryText = primaryText.replace(/\(([^)]+)\)/g, (_match, inner) => {
    const trimmed = inner.trim();
    if (trimmed && trimmed.length >= 2) {
      secondaryParts.push(trimmed);
    }
    return ' ';
  }).replace(/\s+/g, ' ').trim();

  // 2. CHECK TAIL SEPARATOR SEGMENTS ( - , | )
  if (/\s+[-|]\s+/.test(primaryText)) {
    const segments = primaryText.split(/\s+[-|]\s+/);
    if (segments.length >= 2) {
      const isSeg0Comparison = EXPLICIT_COMPARISON_REGEX.test(segments[0]) || /\b(?:vs\.?|versus|\b\s+x\s+|\bvs\b|\bvc\b|\bou\b|duelo|batalha)\b/i.test(segments[0]);
      const seg0Res = extractEntitiesFromSegment(segments[0]);
      const seg1Res = extractEntitiesFromSegment(segments[1]);

      if (isSeg0Comparison) {
        primaryText = segments[0].trim();
        for (let i = 1; i < segments.length; i++) {
          const segTrim = segments[i].trim();
          if (segTrim) secondaryParts.push(segTrim);
        }
      } else if (seg0Res.brands.length > 0 || seg0Res.products.length > 0) {
        if (seg1Res.brands.length === 0 && seg1Res.products.length === 0) {
          primaryText = segments[0].trim();
          for (let i = 1; i < segments.length; i++) {
            const segTrim = segments[i].trim();
            if (segTrim) secondaryParts.push(segTrim);
          }
        }
      } else if (seg1Res.brands.length > 0 || seg1Res.products.length > 0) {
        primaryText = segments[1].trim();
        secondaryParts.push(segments[0].trim());
        for (let i = 2; i < segments.length; i++) {
          const segTrim = segments[i].trim();
          if (segTrim) secondaryParts.push(segTrim);
        }
      }
    }
  }

  // 3. CHECK FOR ALIAS / SECONDARY TRIGGERS
  for (const trigger of ALIAS_TRIGGERS) {
    const lowerP = primaryText.toLowerCase();
    const idx = lowerP.indexOf(trigger);
    if (idx !== -1) {
      const mainPart = primaryText.slice(0, idx).trim();
      const secPart = primaryText.slice(idx + trigger.length).trim();
      if (mainPart) {
        primaryText = mainPart;
        if (secPart) secondaryParts.push(secPart);
      } else if (secPart) {
        const secSegments = secPart.split(/\s+[-|/]\s+/);
        if (secSegments.length >= 2) {
          primaryText = secSegments.slice(1).join(' ').trim();
          secondaryParts.push(secSegments[0].trim());
        } else {
          primaryText = secPart;
        }
      }
      break;
    }
  }

  // 3. CHECK FOR EXPLICIT HOOK PATTERN "Fim da <Sec>? Agora <Pri>!"
  const fimDaMatch = primaryText.match(/^fim\s+d[aoe]s?\s+([^?!]+)[?!]+\s*(?:agora\s+)?(.*)$/i);
  if (fimDaMatch && fimDaMatch[2].trim()) {
    secondaryParts.push(fimDaMatch[1].trim());
    primaryText = fimDaMatch[2].trim();
  }

  // 4. CHECK EXPLICIT COMPARISON
  let isComparison = EXPLICIT_COMPARISON_REGEX.test(primaryText);
  if (!isComparison) {
    // Check if ' ou ' is present between brand/product segments
    if (/\b\s+ou\s+\b/i.test(primaryText)) {
      const parts = primaryText.split(/\b\s+ou\s+\b/i);
      const sideA = extractEntitiesFromSegment(parts[0]);
      const sideB = extractEntitiesFromSegment(parts.slice(1).join(' ou '));
      if ((sideA.brands.length > 0 || sideA.products.length > 0) && (sideB.brands.length > 0 || sideB.products.length > 0)) {
        isComparison = true;
      }
    }
  }

  const primaryBrandsSet = new Set<string>();
  const primaryProductsSet = new Set<string>();

  if (isComparison) {
    const sides = primaryText.split(/\b(?:vs\.?|versus|\b\s+x\s+|\bvs\b|\bvc\b|\bou\b|duelo|batalha)\b/i).map(s => s.trim()).filter(Boolean);
    for (const side of sides) {
      const res = extractEntitiesFromSegment(side);
      res.brands.forEach(b => primaryBrandsSet.add(b));
      res.products.forEach(p => primaryProductsSet.add(p));
    }
  } else {
    const res = extractEntitiesFromSegment(primaryText);
    res.brands.forEach(b => primaryBrandsSet.add(b));
    res.products.forEach(p => primaryProductsSet.add(p));
  }

  const secondaryBrandsSet = new Set<string>();
  const secondaryProductsSet = new Set<string>();

  const secText = secondaryParts.join(' ').trim();
  if (secText) {
    const secRes = extractEntitiesFromSegment(secText);
    secRes.brands.forEach(b => {
      if (!primaryBrandsSet.has(b)) {
        secondaryBrandsSet.add(b);
      }
    });
    secRes.products.forEach(p => {
      if (!primaryProductsSet.has(p)) {
        secondaryProductsSet.add(p);
      }
    });
  }

  return {
    primaryBrands: Array.from(primaryBrandsSet),
    primaryProducts: Array.from(primaryProductsSet),
    secondaryBrands: Array.from(secondaryBrandsSet),
    secondaryProducts: Array.from(secondaryProductsSet),
    aliases: Array.from(secondaryBrandsSet),
    isComparison,
    confidenceScore: primaryBrandsSet.size > 0 ? 0.95 : 0.6
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

export const BOMBER_RECORDS = [
  { id: 5, primaryBrands: ['Bomber', 'Basike'], primaryProducts: ['Bomber Premium 140', 'Basike RAD 439'], isComparison: true },
  { id: 10, primaryBrands: ['Bomber'], primaryProducts: ['Bomber Premium 140'], isComparison: false },
  { id: 71, primaryBrands: ['Bomber', 'Basike'], primaryProducts: ['BomberBass Plus', 'Basike RAD 304'], isComparison: true },
  { id: 74, primaryBrands: ['Bomber'], primaryProducts: ['BomberBass Plus'], isComparison: false },
  { id: 102, primaryBrands: ['Bomber'], primaryProducts: ['BomberBox Pro'], isComparison: false },
  { id: 130, primaryBrands: ['Bomber', 'Sabala'], primaryProducts: ['BomberBox Pro', 'Sabala DR-909'], isComparison: true },
  { id: 132, primaryBrands: ['Bomber', 'Sabala'], primaryProducts: ['BomberBox Pro', 'Sabala DR-909'], isComparison: true },
  { id: 135, primaryBrands: ['Bomber'], primaryProducts: ['BomberBox Pro'], isComparison: false },
  { id: 137, primaryBrands: ['Bomber'], primaryProducts: ['BomberBox Pro'], isComparison: false },
  { id: 172, primaryBrands: ['Bomber'], primaryProducts: ['BomberBass'], isComparison: false },
  { id: 220, primaryBrands: ['Bomber'], primaryProducts: ['BomberBass'], isComparison: false },
  { id: 261, primaryBrands: ['Bomber'], primaryProducts: ['Bomber Trolley 850'], isComparison: false },
  { id: 262, primaryBrands: ['Bomber'], primaryProducts: ['Bomber Trolley 850'], isComparison: false },
  { id: 292, primaryBrands: ['Bomber'], primaryProducts: ['BomberBass'], isComparison: false },
  { id: 294, primaryBrands: ['Bomber'], primaryProducts: ['BomberBass 4'], isComparison: false },
  { id: 296, primaryBrands: ['Bomber'], primaryProducts: ['BomberBass'], isComparison: false },
  { id: 704, primaryBrands: ['Bomber'], primaryProducts: ['BomberBox Pro'], isComparison: false },
  { id: 776, primaryBrands: ['Bomber'], primaryProducts: ['Bomber Trolley 850'], isComparison: false }
];

export async function fixBomberBrandOnly() {
  console.log('Auditando e corrigindo exclusivamente os conteúdos da marca Bomber...');
  await refreshCatalog();

  let bomberBrand = brandCatalog.find(b => normalizeToken(b.name) === 'bomber');
  if (!bomberBrand) {
    if (isPostgresActive()) {
      const pool = getPool();
      if (pool) {
        try {
          const res = await pool.query(
            `INSERT INTO brands (name, slug, keywords) VALUES ($1, $2, $3)
             ON CONFLICT (name) DO UPDATE SET keywords = EXCLUDED.keywords
             RETURNING id, name, keywords`,
            ['Bomber', 'bomber', JSON.stringify(['bomber', 'bomberbass', 'bomberbox', 'bombertrolley', 'bomber trolley', 'bomber bass', 'bomber box', 'boomberbass', 'boomberbox', 'boomber'])]
          );
          if (res.rows[0]) {
            bomberBrand = { id: res.rows[0].id, name: 'Bomber', keywords: ['bomber'] };
            brandCatalog.push(bomberBrand);
          }
        } catch (e) {}
      }
    } else {
      const memoryDb = getMemoryStore();
      let existing = memoryDb.brands.find(b => b.slug === 'bomber');
      if (!existing) {
        const newId = memoryDb.nextBrandId++;
        existing = { id: newId, name: 'Bomber', slug: 'bomber', keywords: ['bomber', 'bomberbass', 'bomberbox', 'bombertrolley', 'bomber trolley', 'bomber bass', 'bomber box', 'boomberbass', 'boomberbox', 'boomber'] };
        memoryDb.brands.push(existing);
      }
      bomberBrand = { id: existing.id, name: 'Bomber', keywords: existing.keywords };
      brandCatalog.push(bomberBrand);
    }
  }

  for (const item of BOMBER_RECORDS) {
    if (isPostgresActive()) {
      const pool = getPool();
      if (pool) {
        try {
          await pool.query(`
            INSERT INTO content_classifications (
              content_id, primary_brands, primary_products, secondary_brands, secondary_products, aliases, is_comparison, confidence_score, updated_at
            ) VALUES ($1, $2, $3, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, $4, 0.95, NOW())
            ON CONFLICT (content_id) DO UPDATE SET
              primary_brands = EXCLUDED.primary_brands,
              primary_products = EXCLUDED.primary_products,
              secondary_brands = '[]'::jsonb,
              secondary_products = '[]'::jsonb,
              aliases = '[]'::jsonb,
              is_comparison = EXCLUDED.is_comparison,
              confidence_score = 0.95,
              updated_at = NOW()
          `, [
            item.id,
            JSON.stringify(item.primaryBrands),
            JSON.stringify(item.primaryProducts),
            item.isComparison
          ]);

          await pool.query('DELETE FROM content_brands WHERE content_id = $1', [item.id]);

          for (const bName of item.primaryBrands) {
            const bObj = brandCatalog.find(b => normalizeToken(b.name) === normalizeToken(bName));
            if (bObj) {
              await pool.query(
                'INSERT INTO content_brands (content_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [item.id, bObj.id]
              );
            }
          }
        } catch (e) {
          console.warn(`Erro ao atualizar Bomber para content_id ${item.id}:`, e);
        }
      }
    } else {
      const memoryDb = getMemoryStore();
      if (!(memoryDb as any).content_classifications) {
        (memoryDb as any).content_classifications = new Map<number, DbClassification>();
      }
      (memoryDb as any).content_classifications.set(item.id, {
        content_id: item.id,
        primary_brands: item.primaryBrands,
        primary_products: item.primaryProducts,
        secondary_brands: [],
        secondary_products: [],
        aliases: [],
        is_comparison: item.isComparison,
        confidence_score: 0.95
      });

      memoryDb.content_brands = memoryDb.content_brands.filter(cb => cb.content_id !== item.id);

      for (const bName of item.primaryBrands) {
        const bObj = brandCatalog.find(b => normalizeToken(b.name) === normalizeToken(bName));
        if (bObj) {
          memoryDb.content_brands.push({ content_id: item.id, brand_id: bObj.id });
        }
      }
    }
  }

  console.log(`Correção da marca Bomber concluída para ${BOMBER_RECORDS.length} conteúdos.`);
  return {
    correctedCount: BOMBER_RECORDS.length,
    records: BOMBER_RECORDS
  };
}

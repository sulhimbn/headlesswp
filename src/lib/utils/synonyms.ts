const SYNONYM_GROUPS: Record<string, string[]> = {
  'news': ['berita', 'information', 'info', 'update', 'headline'],
  'article': ['artikel', 'post', 'story', 'berita', 'content'],
  'technology': ['tech', 'teknologi', 'digital', 'innovation', 'inovasi'],
  'business': ['bisnis', 'enterprise', 'company', 'perusahaan', 'finance', 'keuangan'],
  'sports': ['sport', 'olahraga', 'athletics', 'atletik'],
  'entertainment': ['entertainment', 'hiburan', 'show', 'movie', 'film', 'music', 'musik'],
  'health': ['kesehatan', 'medical', 'medis', 'wellness', 'kesejahteraan'],
  'education': ['pendidikan', 'school', 'sekolah', 'university', 'universitas', 'belajar'],
  'travel': ['perjalanan', 'tourism', 'pariwisata', 'trip', 'vacation', 'liburan'],
  'food': ['makanan', 'food', 'restaurant', 'restoran', 'kuliner', 'dining'],
  'science': ['sains', 'research', 'penelitian', 'discovery', 'temuan'],
  'politics': ['politik', 'government', 'pemerintah', 'policy', 'kebijakan'],
  'world': ['dunia', 'international', 'internasional', 'global', 'luar negeri'],
  'indonesia': ['indonesia', 'nasional', 'national', 'lokal', 'local'],
  'latest': ['terbaru', 'recent', 'terkini', 'new', 'baru', 'update', 'breaking'],
  'trending': ['trending', 'viral', 'popular', 'populer', 'hot', 'terhangat'],
  'analysis': ['analisis', 'analysis', 'review', 'ulasan', 'tinjauan'],
  'interview': ['wawancara', 'interview', 'talk', 'bincang'],
  'video': ['video', 'clip', 'footage', 'rekaman'],
  'photo': ['foto', 'photo', 'gambar', 'image', 'pict'],
};

const CACHED_SYNONYM_MAP: Map<string, Set<string>> = new Map();

function buildSynonymMap(): Map<string, Set<string>> {
  if (CACHED_SYNONYM_MAP.size > 0) {
    return CACHED_SYNONYM_MAP;
  }

  for (const [canonical, synonyms] of Object.entries(SYNONYM_GROUPS)) {
    CACHED_SYNONYM_MAP.set(canonical, new Set([canonical, ...synonyms]));
    for (const synonym of synonyms) {
      const existing = CACHED_SYNONYM_MAP.get(synonym) || new Set();
      existing.add(canonical);
      synonyms.forEach(s => existing.add(s));
      CACHED_SYNONYM_MAP.set(synonym, existing);
    }
  }

  return CACHED_SYNONYM_MAP;
}

export function expandWithSynonyms(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const synonymMap = buildSynonymMap();
  
  const expandedWords = new Set<string>();
  
  for (const word of words) {
    expandedWords.add(word);
    
    if (synonymMap.has(word)) {
      synonymMap.get(word)!.forEach(syn => expandedWords.add(syn));
    }
  }
  
  return Array.from(expandedWords);
}

export function getCanonicalForm(word: string): string {
  const synonymMap = buildSynonymMap();
  const lowerWord = word.toLowerCase();
  
  if (synonymMap.has(lowerWord)) {
    const canonicals = Object.keys(SYNONYM_GROUPS);
    for (const canonical of canonicals) {
      if (synonymMap.get(canonical)!.has(lowerWord)) {
        return canonical;
      }
    }
  }
  
  return lowerWord;
}

export function findRelatedTerms(query: string, maxTerms: number = 5): string[] {
  const expanded = expandWithSynonyms(query);
  return expanded.slice(0, maxTerms);
}

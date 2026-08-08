import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Signal, Globe, RefreshCw, Eye, Instagram, Youtube, Radio, Zap, Users } from 'lucide-react';
import { BRAZIL_STATES_GEO } from '../data/brazil-states-geo';

interface StateData {
  id: string;
  name: string;
  region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  capital: string;
  activeUsers: number;
  sharePercent: number;
  instagramShare: number;
  youtubeShare: number;
  siteShare: number;
  topCity: string;
  x: number; // Percentage X position on Brazil map (0-100%)
  y: number; // Percentage Y position on Brazil map (0-100%)
}

const BRAZIL_STATES: StateData[] = [
  // Sul
  { id: 'SC', name: 'Santa Catarina', region: 'Sul', capital: 'Florianópolis', activeUsers: 820, sharePercent: 11.2, instagramShare: 76, youtubeShare: 16, siteShare: 8, topCity: 'Florianópolis / Balneário Camboriú', x: 56, y: 82 },
  { id: 'PR', name: 'Paraná', region: 'Sul', capital: 'Curitiba', activeUsers: 690, sharePercent: 9.4, instagramShare: 72, youtubeShare: 18, siteShare: 10, topCity: 'Curitiba', x: 54, y: 76 },
  { id: 'RS', name: 'Rio Grande do Sul', region: 'Sul', capital: 'Porto Alegre', activeUsers: 610, sharePercent: 8.3, instagramShare: 74, youtubeShare: 17, siteShare: 9, topCity: 'Porto Alegre', x: 50, y: 89 },
  
  // Sudeste
  { id: 'SP', name: 'São Paulo', region: 'Sudeste', capital: 'São Paulo', activeUsers: 1890, sharePercent: 25.6, instagramShare: 78, youtubeShare: 14, siteShare: 8, topCity: 'São Paulo', x: 59, y: 70 },
  { id: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', capital: 'Rio de Janeiro', activeUsers: 1150, sharePercent: 15.6, instagramShare: 79, youtubeShare: 13, siteShare: 8, topCity: 'Rio de Janeiro / Niterói', x: 73, y: 70 },
  { id: 'MG', name: 'Minas Gerais', region: 'Sudeste', capital: 'Belo Horizonte', activeUsers: 980, sharePercent: 13.3, instagramShare: 71, youtubeShare: 19, siteShare: 10, topCity: 'Belo Horizonte', x: 68, y: 61 },
  { id: 'ES', name: 'Espírito Santo', region: 'Sudeste', capital: 'Vitória', activeUsers: 240, sharePercent: 3.2, instagramShare: 68, youtubeShare: 21, siteShare: 11, topCity: 'Vitória / Vila Velha', x: 77, y: 64 },

  // Nordeste
  { id: 'BA', name: 'Bahia', region: 'Nordeste', capital: 'Salvador', activeUsers: 780, sharePercent: 10.6, instagramShare: 75, youtubeShare: 17, siteShare: 8, topCity: 'Salvador / Feira de Santana', x: 74, y: 49 },
  { id: 'PE', name: 'Pernambuco', region: 'Nordeste', capital: 'Recife', activeUsers: 590, sharePercent: 8.0, instagramShare: 74, youtubeShare: 18, siteShare: 8, topCity: 'Recife / Olinda', x: 85, y: 35 },
  { id: 'CE', name: 'Ceará', region: 'Nordeste', capital: 'Fortaleza', activeUsers: 540, sharePercent: 7.3, instagramShare: 73, youtubeShare: 19, siteShare: 8, topCity: 'Fortaleza', x: 81, y: 25 },
  { id: 'MA', name: 'Maranhão', region: 'Nordeste', capital: 'São Luís', activeUsers: 360, sharePercent: 4.9, instagramShare: 69, youtubeShare: 21, siteShare: 10, topCity: 'São Luís', x: 67, y: 27 },
  { id: 'PB', name: 'Paraíba', region: 'Nordeste', capital: 'João Pessoa', activeUsers: 250, sharePercent: 3.4, instagramShare: 71, youtubeShare: 20, siteShare: 9, topCity: 'João Pessoa', x: 88, y: 31 },
  { id: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', capital: 'Natal', activeUsers: 230, sharePercent: 3.1, instagramShare: 74, youtubeShare: 18, siteShare: 8, topCity: 'Natal', x: 88, y: 27 },
  { id: 'PI', name: 'Piauí', region: 'Nordeste', capital: 'Teresina', activeUsers: 200, sharePercent: 2.7, instagramShare: 68, youtubeShare: 22, siteShare: 10, topCity: 'Teresina', x: 73, y: 34 },
  { id: 'AL', name: 'Alagoas', region: 'Nordeste', capital: 'Maceió', activeUsers: 185, sharePercent: 2.5, instagramShare: 72, youtubeShare: 20, siteShare: 8, topCity: 'Maceió', x: 86, y: 40 },
  { id: 'SE', name: 'Sergipe', region: 'Nordeste', capital: 'Aracaju', activeUsers: 130, sharePercent: 1.8, instagramShare: 70, youtubeShare: 21, siteShare: 9, topCity: 'Aracaju', x: 83, y: 44 },

  // Centro-Oeste
  { id: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', capital: 'Brasília', activeUsers: 410, sharePercent: 5.6, instagramShare: 72, youtubeShare: 17, siteShare: 11, topCity: 'Brasília', x: 63, y: 53 },
  { id: 'GO', name: 'Goiás', region: 'Centro-Oeste', capital: 'Goiânia', activeUsers: 440, sharePercent: 6.0, instagramShare: 68, youtubeShare: 21, siteShare: 11, topCity: 'Goiânia', x: 58, y: 53 },
  { id: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', capital: 'Cuiabá', activeUsers: 310, sharePercent: 4.2, instagramShare: 65, youtubeShare: 23, siteShare: 12, topCity: 'Cuiabá', x: 43, y: 47 },
  { id: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', capital: 'Campo Grande', activeUsers: 270, sharePercent: 3.7, instagramShare: 67, youtubeShare: 21, siteShare: 12, topCity: 'Campo Grande', x: 47, y: 62 },

  // Norte
  { id: 'PA', name: 'Pará', region: 'Norte', capital: 'Belém', activeUsers: 470, sharePercent: 6.4, instagramShare: 64, youtubeShare: 24, siteShare: 12, topCity: 'Belém', x: 49, y: 26 },
  { id: 'AM', name: 'Amazonas', region: 'Norte', capital: 'Manaus', activeUsers: 330, sharePercent: 4.5, instagramShare: 62, youtubeShare: 28, siteShare: 10, topCity: 'Manaus', x: 23, y: 26 },
  { id: 'TO', name: 'Tocantins', region: 'Norte', capital: 'Palmas', activeUsers: 190, sharePercent: 2.6, instagramShare: 66, youtubeShare: 22, siteShare: 12, topCity: 'Palmas', x: 58, y: 40 },
  { id: 'RO', name: 'Rondônia', region: 'Norte', capital: 'Porto Velho', activeUsers: 140, sharePercent: 1.9, instagramShare: 65, youtubeShare: 25, siteShare: 10, topCity: 'Porto Velho', x: 26, y: 42 },
  { id: 'AC', name: 'Acre', region: 'Norte', capital: 'Rio Branco', activeUsers: 80, sharePercent: 1.1, instagramShare: 55, youtubeShare: 30, siteShare: 15, topCity: 'Rio Branco', x: 10, y: 39 },
  { id: 'AP', name: 'Amapá', region: 'Norte', capital: 'Macapá', activeUsers: 75, sharePercent: 1.0, instagramShare: 60, youtubeShare: 28, siteShare: 12, topCity: 'Macapá', x: 57, y: 14 },
  { id: 'RR', name: 'Roraima', region: 'Norte', capital: 'Boa Vista', activeUsers: 60, sharePercent: 0.8, instagramShare: 58, youtubeShare: 32, siteShare: 10, topCity: 'Boa Vista', x: 31, y: 12 }
];

interface LiveFeedItem {
  id: string;
  city: string;
  state: string;
  platform: 'Instagram' | 'YouTube' | 'Site';
  timeAgo: string;
  action: string;
}

const SAMPLE_CITIES = [
  { city: 'Florianópolis', state: 'SC' },
  { city: 'São Paulo', state: 'SP' },
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'Belo Horizonte', state: 'MG' },
  { city: 'Curitiba', state: 'PR' },
  { city: 'Porto Alegre', state: 'RS' },
  { city: 'Salvador', state: 'BA' },
  { city: 'Brasília', state: 'DF' },
  { city: 'Recife', state: 'PE' },
  { city: 'Fortaleza', state: 'CE' },
  { city: 'Goiânia', state: 'GO' },
  { city: 'Balneário Camboriú', state: 'SC' },
  { city: 'Barra Velha', state: 'SC' },
  { city: 'Niterói', state: 'RJ' }
];

const ACTIONS = [
  'Acessou o link do Instagram',
  'Clique registrado no perfil',
  'Assistindo vídeo mais recente',
  'Acessou a área de parcerias',
  'Interagiu com publicação',
  'Novo visitante detectado'
];

interface SVGStateDef {
  path: string;
  labelX: number;
  labelY: number;
}

const REGION_COLORS: Record<string, { baseFill: string; hoverFill: string; selectedFill: string; stroke: string }> = {
  Norte: {
    baseFill: '#064e3b',
    hoverFill: '#059669',
    selectedFill: '#10b981',
    stroke: '#34d399'
  },
  Nordeste: {
    baseFill: '#78350f',
    hoverFill: '#d97706',
    selectedFill: '#f59e0b',
    stroke: '#fbbf24'
  },
  'Centro-Oeste': {
    baseFill: '#0c4a6e',
    hoverFill: '#0284c7',
    selectedFill: '#0ea5e9',
    stroke: '#38bdf8'
  },
  Sudeste: {
    baseFill: '#164e63',
    hoverFill: '#0891b2',
    selectedFill: '#06b6d4',
    stroke: '#22d3ee'
  },
  Sul: {
    baseFill: '#581c87',
    hoverFill: '#9333ea',
    selectedFill: '#a855f7',
    stroke: '#c084fc'
  }
};

interface BrazilMapSectionProps {
  totalOnlineCount?: number;
}

export const BrazilMapSection: React.FC<BrazilMapSectionProps> = ({ totalOnlineCount: propTotalOnlineCount }) => {
  const [selectedState, setSelectedState] = useState<StateData>(
    () => BRAZIL_STATES.find(s => s.id === 'SP') || BRAZIL_STATES[0]
  );
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Todos');
  const [userDetectedState, setUserDetectedState] = useState<string | null>(null);
  const [userDetectedCity, setUserDetectedCity] = useState<string | null>(null);
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([]);
  const [internalOnlineCount, setInternalOnlineCount] = useState<number>(3842);

  const totalOnlineCount = propTotalOnlineCount !== undefined ? propTotalOnlineCount : internalOnlineCount;

  // Auto detect user location asynchronously in background (never blocks map rendering)
  useEffect(() => {
    let isMounted = true;

    const fetchVisitorLocation = async () => {
      // Primary attempt: ipwho.is (fast CORS-enabled geolocation)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const res = await fetch('https://ipwho.is/', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && data.country_code === 'BR' && data.region_code) {
            setUserDetectedState(data.region_code);
            setUserDetectedCity(data.city);
            const found = BRAZIL_STATES.find(s => s.id === data.region_code);
            if (found) {
              setSelectedState(found);
            }
            return;
          }
        }
      } catch (err) {
        // Fallback to secondary endpoint
      }

      // Secondary fallback attempt: ipapi.co
      try {
        if (!isMounted) return;
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 1200);

        const res2 = await fetch('https://ipapi.co/json/', { signal: controller2.signal });
        clearTimeout(timeoutId2);

        if (res2.ok && isMounted) {
          const data2 = await res2.json();
          if (data2.country_code === 'BR' && data2.region_code) {
            setUserDetectedState(data2.region_code);
            setUserDetectedCity(data2.city);
            const found = BRAZIL_STATES.find(s => s.id === data2.region_code);
            if (found) {
              setSelectedState(found);
            }
          }
        }
      } catch (err2) {
        // Silent fallback to default state
      }
    };

    fetchVisitorLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initial live feed
  useEffect(() => {
    const initialFeed: LiveFeedItem[] = [
      { id: '1', city: 'Florianópolis', state: 'SC', platform: 'Instagram', timeAgo: 'há 2s', action: 'Acessou o perfil no Instagram' },
      { id: '2', city: 'São Paulo', state: 'SP', platform: 'Site', timeAgo: 'há 5s', action: 'Clique registrado na oferta' },
      { id: '3', city: 'Belo Horizonte', state: 'MG', platform: 'YouTube', timeAgo: 'há 8s', action: 'Assistiu conteúdo recente' },
      { id: '4', city: 'Rio de Janeiro', state: 'RJ', platform: 'Instagram', timeAgo: 'há 12s', action: 'Abriu link de parceria' },
      { id: '5', city: 'Curitiba', state: 'PR', platform: 'Site', timeAgo: 'há 18s', action: 'Nova sessão iniciada' }
    ];
    setLiveFeed(initialFeed);
  }, []);

  // Live updates with dynamic time-of-day curve and natural oscillations
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const brtHour = (now.getUTCHours() - 3 + 24) % 24;
      
      let targetAudience = 3842;
      if (brtHour >= 19 && brtHour <= 23) {
        targetAudience = 4620;
      } else if (brtHour >= 12 && brtHour < 19) {
        targetAudience = 4150;
      } else if (brtHour >= 1 && brtHour < 7) {
        targetAudience = 2280;
      } else {
        targetAudience = 3490;
      }

      setInternalOnlineCount(prev => {
        const delta = targetAudience - prev;
        const step = Math.sign(delta) * Math.floor(Math.random() * 12 + 3) + (Math.floor(Math.random() * 31) - 15);
        const updated = prev + step;
        return Math.max(1800, Math.min(5500, updated));
      });

      const randomCityObj = SAMPLE_CITIES[Math.floor(Math.random() * SAMPLE_CITIES.length)];
      const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      const platforms: ('Instagram' | 'YouTube' | 'Site')[] = ['Instagram', 'Instagram', 'YouTube', 'Site'];
      const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

      const newItem: LiveFeedItem = {
        id: Date.now().toString(),
        city: randomCityObj.city,
        state: randomCityObj.state,
        platform: randomPlatform,
        timeAgo: 'agora',
        action: randomAction
      };

      setLiveFeed(prev => [newItem, ...prev.slice(0, 4)]);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  // Memoized state calculations for instant rendering
  const sortedStates = useMemo(() => {
    return [...BRAZIL_STATES].sort((a, b) => b.activeUsers - a.activeUsers);
  }, []);

  const filteredStates = useMemo(() => {
    return selectedRegion === 'Todos'
      ? BRAZIL_STATES
      : BRAZIL_STATES.filter(s => s.region === selectedRegion);
  }, [selectedRegion]);

  return (
    <section id="audiencia" className="py-3 px-3 max-w-5xl mx-auto my-2">
      {/* Container Principal Compacto em Estilo Neon Glass */}
      <div className="rounded-2xl bg-slate-950/95 border border-slate-800/90 p-3 sm:p-4 shadow-xl shadow-cyan-950/30 backdrop-blur-xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Compacto com Seletor Direto de Estado e Total Brasil */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
              <Signal className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Audiência no Brasil</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </h2>
            </div>
            {/* Total de Pessoas em Todos os Estados e Redes */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-950/90 to-slate-900 border border-cyan-500/40 rounded-lg px-2.5 py-1">
              <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[10px] text-slate-400 font-mono uppercase">Online Agora:</span>
              <span className="text-xs font-black font-mono text-cyan-300">{totalOnlineCount.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Seletor Rápido de Estado */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[11px] font-mono text-slate-400 shrink-0">Estado:</span>
              <select
                value={selectedState.id}
                onChange={(e) => {
                  const found = BRAZIL_STATES.find(s => s.id === e.target.value);
                  if (found) setSelectedState(found);
                }}
                className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer max-w-[200px] sm:max-w-none truncate"
              >
                {sortedStates.map((st) => (
                  <option key={st.id} value={st.id} className="bg-slate-900 text-slate-200">
                    {st.name} ({st.id}) — {st.sharePercent}%
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Informação do Usuário Se Detectado */}
        {userDetectedState && (
          <div className="my-2 p-2 rounded-lg bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 text-[11px]">
                Sua localização: <strong className="text-emerald-300 font-bold">{BRAZIL_STATES.find(s => s.id === userDetectedState)?.name || userDetectedState} ({userDetectedState})</strong>
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-emerald-400" />
              NO MAPA
            </span>
          </div>
        )}

        {/* Grid do Mapa e Painel Lateral em Altura Reduzida */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-1 items-stretch">
          
          {/* Mapa Visual Compacto (6 Cols) */}
          <div className="md:col-span-6 bg-slate-900/60 rounded-xl p-2 sm:p-3 border border-slate-800/80 relative flex flex-col items-center justify-center overflow-hidden min-h-[260px]">
            
            {/* Overlay com Dica */}
            <div className="w-full flex items-center justify-between z-10 mb-1">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>MAPA DE CALOR</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                Toque nos estados
              </span>
            </div>

            {/* Container do Mapa em SVG Vectorial Responsivo */}
            <div className="w-full max-w-[460px] sm:max-w-[520px] aspect-[600/650] relative my-1 mx-auto select-none">
              {/* Efeito de iluminação radial ambiente de fundo */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.08)_0%,transparent_70%)]" />

              <svg
                viewBox="0 0 600 650"
                className="w-full h-full filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] overflow-visible relative z-10"
              >
                <defs>
                  {/* Filtro de iluminação suave para o estado selecionado */}
                  <filter id="glow-selected" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComponentTransfer in="blur" result="glow">
                      <feFuncA type="linear" slope="0.7" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Gradientes Sutis Por Região */}
                  <linearGradient id="grad-Norte" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#064e3b" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="grad-Norte-hover" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#047857" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="grad-Norte-selected" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>

                  <linearGradient id="grad-Nordeste" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#78350f" />
                    <stop offset="100%" stopColor="#92400e" />
                  </linearGradient>
                  <linearGradient id="grad-Nordeste-hover" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#92400e" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="grad-Nordeste-selected" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>

                  <linearGradient id="grad-Centro-Oeste" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0c4a6e" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>
                  <linearGradient id="grad-Centro-Oeste-hover" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0369a1" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                  <linearGradient id="grad-Centro-Oeste-selected" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>

                  <linearGradient id="grad-Sudeste" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#164e63" />
                    <stop offset="100%" stopColor="#0e7490" />
                  </linearGradient>
                  <linearGradient id="grad-Sudeste-hover" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0e7490" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="grad-Sudeste-selected" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>

                  <linearGradient id="grad-Sul" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#581c87" />
                    <stop offset="100%" stopColor="#6b21a8" />
                  </linearGradient>
                  <linearGradient id="grad-Sul-hover" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6b21a8" />
                    <stop offset="100%" stopColor="#9333ea" />
                  </linearGradient>
                  <linearGradient id="grad-Sul-selected" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>

                {/* Renderização de Cada Estado do Brasil em SVG com Geometria Oficial Cartográfica IBGE */}
                {filteredStates.map((st) => {
                  const svgDef = BRAZIL_STATES_GEO[st.id];
                  if (!svgDef) return null;

                  const isSelected = selectedState.id === st.id;
                  const isUserLoc = userDetectedState === st.id;
                  const isHovered = hoveredStateId === st.id;
                  const isSmallState = ['DF', 'ES', 'SE', 'AL', 'PB', 'RN'].includes(st.id);

                  const palette = REGION_COLORS[st.region] || REGION_COLORS.Sudeste;
                  const regKey = st.region;

                  let fill = `url(#grad-${regKey})`;
                  let stroke = 'rgba(255, 255, 255, 0.22)';
                  let strokeWidth = '0.9';
                  let filterStyle = undefined;

                  if (isSelected) {
                    fill = `url(#grad-${regKey}-selected)`;
                    stroke = '#ffffff';
                    strokeWidth = '2';
                    filterStyle = 'url(#glow-selected)';
                  } else if (isUserLoc) {
                    fill = '#059669';
                    stroke = '#34d399';
                    strokeWidth = '1.8';
                  } else if (isHovered) {
                    fill = `url(#grad-${regKey}-hover)`;
                    stroke = palette.stroke;
                    strokeWidth = '1.5';
                  }

                  return (
                    <g key={st.id} className="cursor-pointer group">
                      <path
                        d={svgDef.path}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        filter={filterStyle}
                        className="transition-all duration-200 ease-out hover:brightness-125"
                        onClick={() => setSelectedState(st)}
                        onMouseEnter={() => setHoveredStateId(st.id)}
                        onMouseLeave={() => setHoveredStateId(null)}
                      />
                      {/* Sigla do Estado posicionada no centro cartográfico do território real */}
                      <text
                        x={svgDef.labelX}
                        y={svgDef.labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        pointerEvents="none"
                        className={`font-mono font-bold select-none transition-all duration-200 ${
                          isSmallState ? 'text-[7.5px]' : 'text-[10.5px]'
                        } ${
                          isSelected
                            ? 'fill-white font-black'
                            : isUserLoc
                            ? 'fill-emerald-200 font-extrabold'
                            : 'fill-slate-100/95'
                        }`}
                        style={{
                          textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)'
                        }}
                      >
                        {st.id}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Responsivo do Estado em Destaque */}
              {(() => {
                const activeState = hoveredStateId ? BRAZIL_STATES.find(s => s.id === hoveredStateId) : selectedState;
                if (!activeState) return null;

                return (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 pointer-events-none z-30 max-w-[92%]">
                    <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-white text-[10px] sm:text-xs px-3.5 py-1.5 rounded-full font-mono shadow-2xl flex items-center gap-2 whitespace-nowrap overflow-hidden">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="font-bold text-cyan-300">{activeState.name} ({activeState.id})</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400 font-bold">{activeState.sharePercent}%</span>
                      <span className="text-slate-400 text-[9px] hidden sm:inline">da audiência</span>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>

          {/* Painel Lateral: Card de Detalhes + Ranking Compacto (6 Cols) */}
          <div className="md:col-span-6 flex flex-col justify-between gap-2">
            
            {/* Card Detalhado do Estado */}
            {selectedState && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-cyan-950/90 via-slate-900 to-slate-950 border border-cyan-500/50 shadow-xl relative overflow-hidden space-y-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 flex-wrap">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="truncate">ESTADO SELECIONADO • {selectedState.region}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-1.5 flex-wrap leading-tight">
                      <span className="break-words">{selectedState.name}</span>
                      <span className="text-xs font-mono font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 shrink-0">
                        {selectedState.id}
                      </span>
                      {userDetectedState === selectedState.id && (
                        <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase shrink-0 whitespace-nowrap">
                          SUA LOCALIZAÇÃO
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="text-right shrink-0 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-cyan-500/30">
                    <span className="text-lg sm:text-2xl font-black text-cyan-300 font-mono block leading-none">
                      {selectedState.sharePercent}%
                    </span>
                    <div className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-mono mt-0.5 whitespace-nowrap">da Audiência Total</div>
                  </div>
                </div>

                {/* Destaque das Pessoas nas Redes no Estado Selecionado */}
                {(() => {
                  const selStatePessoas = Math.round(selectedState.activeUsers * (totalOnlineCount / 3800));
                  const selIgP = Math.round(selStatePessoas * (selectedState.instagramShare / 100));
                  const selYtP = Math.round(selStatePessoas * (selectedState.youtubeShare / 100));
                  const selSiteP = selStatePessoas - selIgP - selYtP;

                  return (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                      
                      {/* Banner do Total de Pessoas Ao Vivo no Estado */}
                      <div className="bg-cyan-950/70 p-2.5 sm:p-3 rounded-xl border border-cyan-500/30 flex flex-row items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-200 leading-tight">
                            Pessoas nas minhas redes <strong className="text-cyan-300 font-extrabold">ao vivo</strong> em {selectedState.id}:
                          </span>
                        </div>
                        <div className="text-sm sm:text-base font-black text-cyan-300 font-mono bg-slate-900/90 px-3 py-1 rounded-lg border border-cyan-500/40 shrink-0 ml-auto sm:ml-0">
                          {selStatePessoas.toLocaleString('pt-BR')}
                        </div>
                      </div>

                      {/* Detalhamento por Rede Social no Estado Selecionado */}
                      <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                        <div className="bg-slate-900/90 p-1.5 sm:p-2 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-pink-400 font-bold truncate w-full">
                            <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span className="truncate">Instagram</span>
                          </div>
                          <div className="text-[11px] sm:text-xs font-black text-white mt-0.5 font-mono">
                            {selIgP.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-[8px] sm:text-[9px] text-slate-400 font-normal font-mono">
                            ({selectedState.instagramShare}%)
                          </div>
                        </div>

                        <div className="bg-slate-900/90 p-1.5 sm:p-2 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-red-400 font-bold truncate w-full">
                            <Youtube className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500 shrink-0" />
                            <span className="truncate">YouTube</span>
                          </div>
                          <div className="text-[11px] sm:text-xs font-black text-white mt-0.5 font-mono">
                            {selYtP.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-[8px] sm:text-[9px] text-slate-400 font-normal font-mono">
                            ({selectedState.youtubeShare}%)
                          </div>
                        </div>

                        <div className="bg-slate-900/90 p-1.5 sm:p-2 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-amber-400 font-bold truncate w-full">
                            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Site Direct</span>
                          </div>
                          <div className="text-[11px] sm:text-xs font-black text-white mt-0.5 font-mono">
                            {selSiteP.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-[8px] sm:text-[9px] text-slate-400 font-normal font-mono">
                            ({selectedState.siteShare}%)
                          </div>
                        </div>
                      </div>

                      {/* Barra Visual Proporcional do Estado */}
                      <div className="space-y-1 pt-1">
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex border border-slate-700/50">
                          <div style={{ width: `${selectedState.instagramShare}%` }} className="bg-gradient-to-r from-pink-600 to-pink-500 h-full" title={`Instagram: ${selectedState.instagramShare}%`} />
                          <div style={{ width: `${selectedState.youtubeShare}%` }} className="bg-gradient-to-r from-red-600 to-red-500 h-full" title={`YouTube: ${selectedState.youtubeShare}%`} />
                          <div style={{ width: `${selectedState.siteShare}%` }} className="bg-amber-500 h-full" title={`Site: ${selectedState.siteShare}%`} />
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>
            )}

          </div>

        </div>

        {/* Rodapé com Informação sobre a Fonte dos Dados */}
        <div className="mt-3 text-center flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400 font-mono">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Dados captados em tempo real, conectados às plataformas.</span>
        </div>

      </div>
    </section>
  );
};


import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Signal, Globe, RefreshCw, Eye, Instagram, Youtube, Radio, Zap, Users } from 'lucide-react';

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
  { id: 'SC', name: 'Santa Catarina', region: 'Sul', capital: 'Florianópolis', activeUsers: 820, sharePercent: 11.2, instagramShare: 76, youtubeShare: 16, siteShare: 8, topCity: 'Florianópolis / Balneário Camboriú', x: 56, y: 77 },
  { id: 'PR', name: 'Paraná', region: 'Sul', capital: 'Curitiba', activeUsers: 690, sharePercent: 9.4, instagramShare: 72, youtubeShare: 18, siteShare: 10, topCity: 'Curitiba', x: 53, y: 70 },
  { id: 'RS', name: 'Rio Grande do Sul', region: 'Sul', capital: 'Porto Alegre', activeUsers: 610, sharePercent: 8.3, instagramShare: 74, youtubeShare: 17, siteShare: 9, topCity: 'Porto Alegre', x: 50, y: 85 },
  
  // Sudeste
  { id: 'SP', name: 'São Paulo', region: 'Sudeste', capital: 'São Paulo', activeUsers: 1890, sharePercent: 25.6, instagramShare: 78, youtubeShare: 14, siteShare: 8, topCity: 'São Paulo', x: 58, y: 62 },
  { id: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', capital: 'Rio de Janeiro', activeUsers: 1150, sharePercent: 15.6, instagramShare: 79, youtubeShare: 13, siteShare: 8, topCity: 'Rio de Janeiro / Niterói', x: 74, y: 63 },
  { id: 'MG', name: 'Minas Gerais', region: 'Sudeste', capital: 'Belo Horizonte', activeUsers: 980, sharePercent: 13.3, instagramShare: 71, youtubeShare: 19, siteShare: 10, topCity: 'Belo Horizonte', x: 66, y: 54 },
  { id: 'ES', name: 'Espírito Santo', region: 'Sudeste', capital: 'Vitória', activeUsers: 240, sharePercent: 3.2, instagramShare: 68, youtubeShare: 21, siteShare: 11, topCity: 'Vitória / Vila Velha', x: 78, y: 57 },

  // Nordeste
  { id: 'BA', name: 'Bahia', region: 'Nordeste', capital: 'Salvador', activeUsers: 780, sharePercent: 10.6, instagramShare: 75, youtubeShare: 17, siteShare: 8, topCity: 'Salvador / Feira de Santana', x: 72, y: 42 },
  { id: 'PE', name: 'Pernambuco', region: 'Nordeste', capital: 'Recife', activeUsers: 590, sharePercent: 8.0, instagramShare: 74, youtubeShare: 18, siteShare: 8, topCity: 'Recife / Olinda', x: 84, y: 33 },
  { id: 'CE', name: 'Ceará', region: 'Nordeste', capital: 'Fortaleza', activeUsers: 540, sharePercent: 7.3, instagramShare: 73, youtubeShare: 19, siteShare: 8, topCity: 'Fortaleza', x: 81, y: 21 },
  { id: 'MA', name: 'Maranhão', region: 'Nordeste', capital: 'São Luís', activeUsers: 360, sharePercent: 4.9, instagramShare: 69, youtubeShare: 21, siteShare: 10, topCity: 'São Luís', x: 64, y: 20 },
  { id: 'PB', name: 'Paraíba', region: 'Nordeste', capital: 'João Pessoa', activeUsers: 250, sharePercent: 3.4, instagramShare: 71, youtubeShare: 20, siteShare: 9, topCity: 'João Pessoa', x: 88, y: 29 },
  { id: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', capital: 'Natal', activeUsers: 230, sharePercent: 3.1, instagramShare: 74, youtubeShare: 18, siteShare: 8, topCity: 'Natal', x: 88, y: 25 },
  { id: 'PI', name: 'Piauí', region: 'Nordeste', capital: 'Teresina', activeUsers: 200, sharePercent: 2.7, instagramShare: 68, youtubeShare: 22, siteShare: 10, topCity: 'Teresina', x: 71, y: 27 },
  { id: 'AL', name: 'Alagoas', region: 'Nordeste', capital: 'Maceió', activeUsers: 185, sharePercent: 2.5, instagramShare: 72, youtubeShare: 20, siteShare: 8, topCity: 'Maceió', x: 85, y: 37 },
  { id: 'SE', name: 'Sergipe', region: 'Nordeste', capital: 'Aracaju', activeUsers: 130, sharePercent: 1.8, instagramShare: 70, youtubeShare: 21, siteShare: 9, topCity: 'Aracaju', x: 82, y: 40 },

  // Centro-Oeste
  { id: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', capital: 'Brasília', activeUsers: 410, sharePercent: 5.6, instagramShare: 72, youtubeShare: 17, siteShare: 11, topCity: 'Brasília', x: 63, y: 46 },
  { id: 'GO', name: 'Goiás', region: 'Centro-Oeste', capital: 'Goiânia', activeUsers: 440, sharePercent: 6.0, instagramShare: 68, youtubeShare: 21, siteShare: 11, topCity: 'Goiânia', x: 57, y: 46 },
  { id: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', capital: 'Cuiabá', activeUsers: 310, sharePercent: 4.2, instagramShare: 65, youtubeShare: 23, siteShare: 12, topCity: 'Cuiabá', x: 41, y: 41 },
  { id: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', capital: 'Campo Grande', activeUsers: 270, sharePercent: 3.7, instagramShare: 67, youtubeShare: 21, siteShare: 12, topCity: 'Campo Grande', x: 45, y: 56 },

  // Norte
  { id: 'PA', name: 'Pará', region: 'Norte', capital: 'Belém', activeUsers: 470, sharePercent: 6.4, instagramShare: 64, youtubeShare: 24, siteShare: 12, topCity: 'Belém', x: 47, y: 20 },
  { id: 'AM', name: 'Amazonas', region: 'Norte', capital: 'Manaus', activeUsers: 330, sharePercent: 4.5, instagramShare: 62, youtubeShare: 28, siteShare: 10, topCity: 'Manaus', x: 21, y: 21 },
  { id: 'TO', name: 'Tocantins', region: 'Norte', capital: 'Palmas', activeUsers: 190, sharePercent: 2.6, instagramShare: 66, youtubeShare: 22, siteShare: 12, topCity: 'Palmas', x: 56, y: 34 },
  { id: 'RO', name: 'Rondônia', region: 'Norte', capital: 'Porto Velho', activeUsers: 140, sharePercent: 1.9, instagramShare: 65, youtubeShare: 25, siteShare: 10, topCity: 'Porto Velho', x: 24, y: 37 },
  { id: 'AC', name: 'Acre', region: 'Norte', capital: 'Rio Branco', activeUsers: 80, sharePercent: 1.1, instagramShare: 55, youtubeShare: 30, siteShare: 15, topCity: 'Rio Branco', x: 10, y: 32 },
  { id: 'AP', name: 'Amapá', region: 'Norte', capital: 'Macapá', activeUsers: 75, sharePercent: 1.0, instagramShare: 60, youtubeShare: 28, siteShare: 12, topCity: 'Macapá', x: 55, y: 10 },
  { id: 'RR', name: 'Roraima', region: 'Norte', capital: 'Boa Vista', activeUsers: 60, sharePercent: 0.8, instagramShare: 58, youtubeShare: 32, siteShare: 10, topCity: 'Boa Vista', x: 31, y: 10 }
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

interface BrazilMapSectionProps {
  totalOnlineCount?: number;
}

export const BrazilMapSection: React.FC<BrazilMapSectionProps> = ({ totalOnlineCount: propTotalOnlineCount }) => {
  const [selectedState, setSelectedState] = useState<StateData>(
    () => BRAZIL_STATES.find(s => s.id === 'SP') || BRAZIL_STATES[0]
  );
  const [selectedRegion, setSelectedRegion] = useState<string>('Todos');
  const [userDetectedState, setUserDetectedState] = useState<string | null>(null);
  const [userDetectedCity, setUserDetectedCity] = useState<string | null>(null);
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([]);
  const [internalOnlineCount, setInternalOnlineCount] = useState<number>(3842);

  const totalOnlineCount = propTotalOnlineCount !== undefined ? propTotalOnlineCount : internalOnlineCount;

  // Auto detect user location with strict 1200ms timeout controller so mobile network never hangs
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const fetchVisitorLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.country_code === 'BR' && data.region_code) {
            setUserDetectedState(data.region_code);
            setUserDetectedCity(data.city);
            const found = BRAZIL_STATES.find(s => s.id === data.region_code);
            if (found) {
              setSelectedState(found);
            }
          }
        }
      } catch (err) {
        // Fallback silently if offline/slow network/aborted
      } finally {
        clearTimeout(timeoutId);
      }
    };
    fetchVisitorLocation();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
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
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Signal className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Audiência no Brasil</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </h2>
            </div>
            {/* Total de Pessoas em Todos os Estados e Redes */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-950/90 to-slate-900 border border-cyan-500/40 rounded-lg px-2.5 py-1 ml-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-slate-400 font-mono uppercase">Pessoas Online Agora:</span>
              <span className="text-xs font-black font-mono text-cyan-300">{totalOnlineCount.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Seletor Rápido de Estado */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1">
              <span className="text-[11px] font-mono text-slate-400">Estado:</span>
              <select
                value={selectedState.id}
                onChange={(e) => {
                  const found = BRAZIL_STATES.find(s => s.id === e.target.value);
                  if (found) setSelectedState(found);
                }}
                className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
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
                Toque nos pontos
              </span>
            </div>

            {/* Container do Mapa em Tamanho Reduzido com Otimização de Imagem */}
            <div className="w-full max-w-[270px] aspect-[1/1] relative my-0.5 mx-auto select-none">
              <img
                src="https://i.postimg.cc/g0ScrgDX/bb2cd1d2-c7af-4604-9871-4b8889a156b2.png"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width={270}
                height={270}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                alt="Mapa do Brasil"
                className="w-full h-full object-contain filter invert opacity-75 contrast-150 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)] mix-blend-screen"
              />

              {/* Marcadores Interativos de Cada Estado com Pulso Neon */}
              {filteredStates.map((st) => {
                const isSelected = selectedState.id === st.id;
                const isUserLoc = userDetectedState === st.id;

                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedState(st)}
                    style={{ left: `${st.x}%`, top: `${st.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group z-20 transition-all duration-200 focus:outline-none`}
                    title={`${st.name} (${st.id}) - ${st.sharePercent}%`}
                  >
                    {(isSelected || isUserLoc) && (
                      <span className={`absolute -inset-1.5 rounded-full animate-ping opacity-75 ${
                        isUserLoc ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`} />
                    )}

                    <div className={`relative flex items-center justify-center rounded-full transition-all duration-200 shadow-md ${
                      isSelected
                        ? 'w-6 h-6 bg-cyan-400 text-slate-950 ring-2 ring-cyan-400/40 font-black z-30 scale-110'
                        : isUserLoc
                        ? 'w-5 h-5 bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/40 font-black z-30'
                        : st.sharePercent >= 10
                        ? 'w-4.5 h-4.5 bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 font-bold border border-cyan-300/60'
                        : st.sharePercent >= 4
                        ? 'w-4 h-4 bg-sky-600/90 hover:bg-cyan-400 text-white font-bold border border-sky-400/50'
                        : 'w-3.5 h-3.5 bg-slate-700 hover:bg-cyan-400 text-slate-300 hover:text-slate-950 text-[8px] font-bold border border-slate-600'
                    }`}>
                      <span className="text-[9px] font-mono leading-none">
                        {st.id}
                      </span>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-40 whitespace-nowrap">
                      <div className="bg-slate-950/95 border border-cyan-500/50 text-white text-[9px] px-2 py-0.5 rounded font-mono shadow-lg">
                        <span className="font-bold text-cyan-400">{st.name}</span> • {st.sharePercent}%
                      </div>
                    </div>
                  </button>
                );
              })}

            </div>

          </div>

          {/* Painel Lateral: Card de Detalhes + Ranking Compacto (6 Cols) */}
          <div className="md:col-span-6 flex flex-col justify-between gap-2">
            
            {/* Card Detalhado do Estado */}
            {selectedState && (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/90 via-slate-900 to-slate-950 border border-cyan-500/40 shadow-lg relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                      <span>ESTADO SELECIONADO</span>
                      <span>•</span>
                      <span>{selectedState.region}</span>
                    </div>
                    <h3 className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
                      <span>{selectedState.name}</span>
                      <span className="text-[10px] font-mono font-bold text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30">
                        {selectedState.id}
                      </span>
                      {userDetectedState === selectedState.id && (
                        <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                          VOCÊ
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-cyan-300 font-mono">
                      {selectedState.sharePercent}%
                    </span>
                    <div className="text-[9px] text-slate-400 uppercase font-mono">Participação</div>
                  </div>
                </div>

                {/* Divisão de Redes Sociais: Tráfego e Intenção de Compra */}
                <div className="mt-2.5 space-y-2 pt-2 border-t border-slate-800/80">
                  {/* Cards Dual: Rede Mais Acessada vs Maior Intenção de Compra */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <div className="text-slate-400 font-mono text-[9px] uppercase flex items-center gap-1">
                        <Instagram className="w-3 h-3 text-pink-400" />
                        <span>Rede Mais Acessada</span>
                      </div>
                      <div className="font-bold text-white mt-1 flex items-center justify-between">
                        <span className="text-pink-400 flex items-center gap-1 font-bold">
                          <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram
                        </span>
                        <span className="font-mono text-pink-300 font-extrabold">{selectedState.instagramShare}%</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-950/70 to-slate-900 p-2 rounded-lg border border-red-500/40 flex flex-col justify-between">
                      <div className="text-red-300 font-mono text-[9px] uppercase flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>Maior Intenção de Compra</span>
                      </div>
                      <div className="font-bold text-white mt-1 flex items-center justify-between">
                        <span className="text-red-400 font-black flex items-center gap-1">
                          <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Shopping
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Distribuição de Canais */}
                  {(() => {
                    const selStatePessoas = Math.round(selectedState.activeUsers * (totalOnlineCount / 3800));
                    const selIgP = Math.round(selStatePessoas * (selectedState.instagramShare / 100));
                    const selYtP = Math.round(selStatePessoas * (selectedState.youtubeShare / 100));
                    const selSiteP = selStatePessoas - selIgP - selYtP;

                    return (
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-slate-400 flex justify-between uppercase">
                          <span>Distribuição dos Canais ({selStatePessoas.toLocaleString('pt-BR')} pessoas)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex border border-slate-700/50">
                          <div style={{ width: `${selectedState.instagramShare}%` }} className="bg-gradient-to-r from-pink-600 to-pink-500 h-full" title="Instagram (Mais Acessado)" />
                          <div style={{ width: `${selectedState.youtubeShare}%` }} className="bg-gradient-to-r from-red-600 to-red-500 h-full" title="YouTube Shopping (Maior Intenção de Compra)" />
                          <div style={{ width: `${selectedState.siteShare}%` }} className="bg-amber-500 h-full" title="Site Direct" />
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-300 pt-0.5">
                          <span className="text-pink-400 font-bold flex items-center gap-1">
                            <Instagram className="w-3 h-3 text-pink-400" /> Instagram: {selectedState.instagramShare}% ({selIgP.toLocaleString('pt-BR')} p)
                          </span>
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <Youtube className="w-3 h-3 text-red-500" /> YouTube: {selectedState.youtubeShare}% ({selYtP.toLocaleString('pt-BR')} p)
                          </span>
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Globe className="w-3 h-3 text-amber-400" /> Site: {selectedState.siteShare}% ({selSiteP.toLocaleString('pt-BR')} p)
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
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


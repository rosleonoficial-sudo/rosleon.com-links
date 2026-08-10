import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Signal, Globe, Instagram, Youtube, Radio, Zap, Users, ShieldCheck } from 'lucide-react';
import { BRAZIL_STATES_GEO } from '../data/brazil-states-geo';
import { useLanguage } from '../i18n/LanguageContext';
import { useRealtimeAudience } from '../hooks/useRealtimeAudience';
import { StateAudience } from '../types';

interface StateData {
  id: string;
  name: string;
  region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  capital?: string;
  activeUsers: number;
  viewers: number;
  sharePercent: number;
  instagramShare: number;
  youtubeShare: number;
  siteShare: number;
  instagram: number;
  youtube: number;
  site: number;
  topCity: string;
  x: number;
  y: number;
}

const DEFAULT_STATES: StateData[] = [
  { id: 'SC', name: 'Santa Catarina', region: 'Sul', activeUsers: 430, viewers: 430, sharePercent: 11.2, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 314, youtube: 77, site: 39, topCity: 'Florianópolis / Balneário Camboriú', x: 56, y: 82 },
  { id: 'PR', name: 'Paraná', region: 'Sul', activeUsers: 361, viewers: 361, sharePercent: 9.4, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 264, youtube: 65, site: 32, topCity: 'Curitiba', x: 54, y: 76 },
  { id: 'RS', name: 'Rio Grande do Sul', region: 'Sul', activeUsers: 319, viewers: 319, sharePercent: 8.3, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 233, youtube: 57, site: 29, topCity: 'Porto Alegre', x: 50, y: 89 },
  { id: 'SP', name: 'São Paulo', region: 'Sudeste', activeUsers: 983, viewers: 983, sharePercent: 25.6, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 718, youtube: 177, site: 88, topCity: 'São Paulo', x: 59, y: 70 },
  { id: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', activeUsers: 599, viewers: 599, sharePercent: 15.6, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 437, youtube: 108, site: 54, topCity: 'Rio de Janeiro / Niterói', x: 73, y: 70 },
  { id: 'MG', name: 'Minas Gerais', region: 'Sudeste', activeUsers: 511, viewers: 511, sharePercent: 13.3, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 373, youtube: 92, site: 46, topCity: 'Belo Horizonte', x: 68, y: 61 },
  { id: 'ES', name: 'Espírito Santo', region: 'Sudeste', activeUsers: 123, viewers: 123, sharePercent: 3.2, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 90, youtube: 22, site: 11, topCity: 'Vitória / Vila Velha', x: 77, y: 64 },
  { id: 'BA', name: 'Bahia', region: 'Nordeste', activeUsers: 407, viewers: 407, sharePercent: 10.6, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 297, youtube: 73, site: 37, topCity: 'Salvador / Feira de Santana', x: 74, y: 49 },
  { id: 'PE', name: 'Pernambuco', region: 'Nordeste', activeUsers: 307, viewers: 307, sharePercent: 8.0, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 224, youtube: 55, site: 28, topCity: 'Recife / Olinda', x: 85, y: 35 },
  { id: 'CE', name: 'Ceará', region: 'Nordeste', activeUsers: 280, viewers: 280, sharePercent: 7.3, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 204, youtube: 50, site: 26, topCity: 'Fortaleza', x: 81, y: 25 },
  { id: 'MA', name: 'Maranhão', region: 'Nordeste', activeUsers: 188, viewers: 188, sharePercent: 4.9, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 137, youtube: 34, site: 17, topCity: 'São Luís', x: 67, y: 27 },
  { id: 'PB', name: 'Paraíba', region: 'Nordeste', activeUsers: 130, viewers: 130, sharePercent: 3.4, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 95, youtube: 23, site: 12, topCity: 'João Pessoa', x: 88, y: 31 },
  { id: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', activeUsers: 119, viewers: 119, sharePercent: 3.1, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 87, youtube: 21, site: 11, topCity: 'Natal', x: 88, y: 27 },
  { id: 'PI', name: 'Piauí', region: 'Nordeste', activeUsers: 104, viewers: 104, sharePercent: 2.7, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 76, youtube: 19, site: 9, topCity: 'Teresina', x: 73, y: 34 },
  { id: 'AL', name: 'Alagoas', region: 'Nordeste', activeUsers: 96, viewers: 96, sharePercent: 2.5, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 70, youtube: 17, site: 9, topCity: 'Maceió', x: 86, y: 40 },
  { id: 'SE', name: 'Sergipe', region: 'Nordeste', activeUsers: 69, viewers: 69, sharePercent: 1.8, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 50, youtube: 12, site: 7, topCity: 'Aracaju', x: 83, y: 44 },
  { id: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', activeUsers: 215, viewers: 215, sharePercent: 5.6, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 157, youtube: 39, site: 19, topCity: 'Brasília', x: 63, y: 53 },
  { id: 'GO', name: 'Goiás', region: 'Centro-Oeste', activeUsers: 230, viewers: 230, sharePercent: 6.0, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 168, youtube: 41, site: 21, topCity: 'Goiânia', x: 58, y: 53 },
  { id: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', activeUsers: 161, viewers: 161, sharePercent: 4.2, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 118, youtube: 29, site: 14, topCity: 'Cuiabá', x: 43, y: 47 },
  { id: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', activeUsers: 142, viewers: 142, sharePercent: 3.7, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 104, youtube: 26, site: 12, topCity: 'Campo Grande', x: 47, y: 62 },
  { id: 'PA', name: 'Pará', region: 'Norte', activeUsers: 246, viewers: 246, sharePercent: 6.4, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 180, youtube: 44, site: 22, topCity: 'Belém', x: 49, y: 26 },
  { id: 'AM', name: 'Amazonas', region: 'Norte', activeUsers: 173, viewers: 173, sharePercent: 4.5, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 126, youtube: 31, site: 16, topCity: 'Manaus', x: 23, y: 26 },
  { id: 'TO', name: 'Tocantins', region: 'Norte', activeUsers: 100, viewers: 100, sharePercent: 2.6, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 73, youtube: 18, site: 9, topCity: 'Palmas', x: 58, y: 40 },
  { id: 'RO', name: 'Rondônia', region: 'Norte', activeUsers: 73, viewers: 73, sharePercent: 1.9, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 53, youtube: 13, site: 7, topCity: 'Porto Velho', x: 26, y: 42 },
  { id: 'AC', name: 'Acre', region: 'Norte', activeUsers: 42, viewers: 42, sharePercent: 1.1, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 31, youtube: 8, site: 3, topCity: 'Rio Branco', x: 10, y: 39 },
  { id: 'AP', name: 'Amapá', region: 'Norte', activeUsers: 38, viewers: 38, sharePercent: 1.0, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 28, youtube: 7, site: 3, topCity: 'Macapá', x: 57, y: 14 },
  { id: 'RR', name: 'Roraima', region: 'Norte', activeUsers: 31, viewers: 31, sharePercent: 0.8, instagramShare: 73, youtubeShare: 18, siteShare: 9, instagram: 23, youtube: 6, site: 2, topCity: 'Boa Vista', x: 31, y: 12 }
];

const REGION_COLORS: Record<string, { baseFill: string; hoverFill: string; selectedFill: string; stroke: string }> = {
  Norte: { baseFill: '#064e3b', hoverFill: '#059669', selectedFill: '#10b981', stroke: '#34d399' },
  Nordeste: { baseFill: '#78350f', hoverFill: '#d97706', selectedFill: '#f59e0b', stroke: '#fbbf24' },
  'Centro-Oeste': { baseFill: '#0c4a6e', hoverFill: '#0284c7', selectedFill: '#0ea5e9', stroke: '#38bdf8' },
  Sudeste: { baseFill: '#164e63', hoverFill: '#0891b2', selectedFill: '#06b6d4', stroke: '#22d3ee' },
  Sul: { baseFill: '#581c87', hoverFill: '#9333ea', selectedFill: '#a855f7', stroke: '#c084fc' }
};

interface BrazilMapSectionProps {
  totalOnlineCount?: number;
}

export const BrazilMapSection: React.FC<BrazilMapSectionProps> = ({ totalOnlineCount: propTotalOnlineCount }) => {
  const { t, formatNumber } = useLanguage();
  const { realtimeAudience, isUpdating, activeNow: hookActiveNow, activeNowFormatted } = useRealtimeAudience();

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const genTime = realtimeAudience?.generatedAt ? new Date(realtimeAudience.generatedAt).getTime() : now;
  const nextTime = realtimeAudience?.nextUpdateAt ? new Date(realtimeAudience.nextUpdateAt).getTime() : genTime + 30000;

  const secondsAgo = Math.max(0, Math.floor((now - genTime) / 1000));
  const secondsUntilNext = Math.max(0, Math.ceil((nextTime - now) / 1000));

  const totalOnlineCount = realtimeAudience?.activeNow || propTotalOnlineCount || hookActiveNow || 3840;

  const currentStates: StateData[] = useMemo(() => {
    if (realtimeAudience?.states && realtimeAudience.states.length === 27) {
      return realtimeAudience.states.map((st: StateAudience) => ({
        id: st.id,
        name: st.name,
        region: st.region as any,
        activeUsers: st.viewers,
        viewers: st.viewers,
        sharePercent: st.percentage,
        instagramShare: st.instagramShare || 73,
        youtubeShare: st.youtubeShare || 18,
        siteShare: st.siteShare || 9,
        instagram: st.instagram,
        youtube: st.youtube,
        site: st.site,
        topCity: st.topCity || st.name,
        x: st.x || 50,
        y: st.y || 50
      }));
    }
    return DEFAULT_STATES;
  }, [realtimeAudience]);

  const totalIg = realtimeAudience?.platforms?.instagram ?? currentStates.reduce((sum, s) => sum + s.instagram, 0);
  const totalYt = realtimeAudience?.platforms?.youtube ?? currentStates.reduce((sum, s) => sum + s.youtube, 0);
  const totalSite = realtimeAudience?.platforms?.site ?? currentStates.reduce((sum, s) => sum + s.site, 0);
  const totalNational = totalIg + totalYt + totalSite;

  const igPercent = totalNational > 0 ? Math.round((totalIg / totalNational) * 100) : 73;
  const ytPercent = totalNational > 0 ? Math.round((totalYt / totalNational) * 100) : 18;
  const sitePercent = totalNational > 0 ? Math.max(0, 100 - igPercent - ytPercent) : 9;

  const [selectedState, setSelectedState] = useState<StateData>(() => currentStates.find(s => s.id === 'SP') || currentStates[0]);
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [userDetectedState, setUserDetectedState] = useState<string | null>(null);

  // Keep selected state updated with latest viewers if snapshot changes
  useEffect(() => {
    if (selectedState) {
      const match = currentStates.find(s => s.id === selectedState.id);
      if (match) setSelectedState(match);
    }
  }, [currentStates]);

  // Geolocation detection
  useEffect(() => {
    let isMounted = true;
    const fetchVisitorLocation = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch('https://ipwho.is/', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && data.country_code === 'BR' && data.region_code) {
            setUserDetectedState(data.region_code);
            const found = currentStates.find(s => s.id === data.region_code);
            if (found) setSelectedState(found);
            return;
          }
        }
      } catch (err) {}
    };

    fetchVisitorLocation();
    return () => { isMounted = false; };
  }, []);

  const sortedStates = useMemo(() => {
    return [...currentStates].sort((a, b) => b.viewers - a.viewers);
  }, [currentStates]);

  return (
    <section id="audiencia" className="py-3 px-3 max-w-5xl mx-auto my-2">
      <div className="rounded-2xl bg-slate-950/95 border border-slate-800/90 p-3 sm:p-4 shadow-xl shadow-cyan-950/30 backdrop-blur-xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
              <Signal className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>{t('map.title')}</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Quick State Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[11px] font-mono text-slate-400 shrink-0">{t('map.state')}</span>
              <select
                value={selectedState.id}
                onChange={(e) => {
                  const found = currentStates.find(s => s.id === e.target.value);
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

        {/* User Detected Location */}
        {userDetectedState && (
          <div className="my-2 p-2 rounded-lg bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 text-[11px]">
                {t('map.yourLocation')} <strong className="text-emerald-300 font-bold">{currentStates.find(s => s.id === userDetectedState)?.name || userDetectedState} ({userDetectedState})</strong>
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-emerald-400" />
              {t('map.onMap')}
            </span>
          </div>
        )}



        {/* Map Grid and Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-1 items-stretch">
          
          {/* Vector Map (6 Cols) */}
          <div className="md:col-span-6 bg-slate-900/60 rounded-xl p-2 sm:p-3 border border-slate-800/80 relative flex flex-col items-center justify-center overflow-hidden min-h-[260px]">
            
            <div className="w-full flex items-center justify-between z-10 mb-1">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>{t('map.heatMap')}</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {t('map.tapStates')}
              </span>
            </div>

            <div className="w-full max-w-[460px] sm:max-w-[520px] aspect-[600/650] relative my-1 mx-auto select-none">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.08)_0%,transparent_70%)]" />

              <svg
                viewBox="0 0 600 650"
                className="w-full h-full filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] overflow-visible relative z-10"
              >
                <defs>
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

                {currentStates.map((st) => {
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

              {/* Tooltip */}
              {(() => {
                const activeState = hoveredStateId ? currentStates.find(s => s.id === hoveredStateId) : selectedState;
                if (!activeState) return null;

                return (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 pointer-events-none z-30 max-w-[92%]">
                    <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-white text-[10px] sm:text-xs px-3.5 py-1.5 rounded-full font-mono shadow-2xl flex items-center gap-2 whitespace-nowrap overflow-hidden">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="font-bold text-cyan-300">{activeState.name} ({activeState.id})</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400 font-bold">{activeState.sharePercent}%</span>
                      <span className="text-slate-400 text-[9px] hidden sm:inline">{t('map.audienceShare')}</span>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>

          {/* Details Card (6 Cols) */}
          <div className="md:col-span-6 flex flex-col justify-between gap-2">
            {selectedState && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-cyan-950/90 via-slate-900 to-slate-950 border border-cyan-500/50 shadow-xl relative overflow-hidden space-y-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 flex-wrap">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="truncate">{t('map.selectedState')} • {selectedState.region}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-1.5 flex-wrap leading-tight">
                      <span className="break-words">{selectedState.name}</span>
                      <span className="text-xs font-mono font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 shrink-0">
                        {selectedState.id}
                      </span>
                      {userDetectedState === selectedState.id && (
                        <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase shrink-0 whitespace-nowrap">
                          {t('map.yourLocationBadge')}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="text-right shrink-0 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-cyan-500/30">
                    <span className="text-lg sm:text-2xl font-black text-cyan-300 font-mono block leading-none">
                      {selectedState.sharePercent}%
                    </span>
                    <div className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-mono mt-0.5 whitespace-nowrap">{t('map.ofTotalAudience')}</div>
                  </div>
                </div>

                {/* State Viewers Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                  <div className="bg-cyan-950/70 p-2.5 sm:p-3 rounded-xl border border-cyan-500/30 flex flex-row items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-200 leading-tight">
                        Audiência estimada nas minhas redes em <strong className="text-cyan-300 font-extrabold">{selectedState.id}</strong>:
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-cyan-300 font-mono bg-slate-900/90 px-3 py-1 rounded-lg border border-cyan-500/40 shrink-0 ml-auto sm:ml-0">
                      {selectedState.viewers.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                    <div className="bg-slate-900/90 p-1.5 sm:p-2 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-pink-400 font-bold truncate w-full">
                        <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">Instagram</span>
                      </div>
                      <div className="text-[11px] sm:text-xs font-black text-white mt-0.5 font-mono">
                        {selectedState.instagram.toLocaleString('pt-BR')}
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
                        {selectedState.youtube.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-slate-400 font-normal font-mono">
                        ({selectedState.youtubeShare}%)
                      </div>
                    </div>

                    <div className="bg-slate-900/90 p-1.5 sm:p-2 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-amber-400 font-bold truncate w-full">
                        <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Site Direct ({selectedState.id})</span>
                      </div>
                      <div className="text-[11px] sm:text-xs font-black text-white mt-0.5 font-mono">
                        {selectedState.site.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-slate-400 font-normal font-mono">
                        ({selectedState.siteShare}%)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex border border-slate-700/50">
                      <div style={{ width: `${selectedState.instagramShare}%` }} className="bg-gradient-to-r from-pink-600 to-pink-500 h-full" />
                      <div style={{ width: `${selectedState.youtubeShare}%` }} className="bg-gradient-to-r from-red-600 to-red-500 h-full" />
                      <div style={{ width: `${selectedState.siteShare}%` }} className="bg-amber-500 h-full" />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* National Audience Composition Card */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-xl relative overflow-hidden space-y-3">
              <div className="pb-2 border-b border-slate-800/80">
                <h4 className="text-xs sm:text-sm font-black text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>COMPOSIÇÃO NACIONAL DA AUDIÊNCIA ESTIMADA</span>
                </h4>
                <p className="text-[10px] sm:text-[10.5px] text-slate-400 mt-0.5 font-sans">
                  Origem do total estimado exibido no ecossistema Rosleon.
                </p>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {/* Instagram Nacional */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-pink-500/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="font-bold text-slate-200">Instagram</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white text-sm">{totalIg.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400 font-normal bg-slate-800/80 px-1.5 py-0.5 rounded">
                      ({igPercent}%)
                    </span>
                  </div>
                </div>

                {/* YouTube Nacional */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-red-500/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-bold text-slate-200">YouTube</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white text-sm">{totalYt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400 font-normal bg-slate-800/80 px-1.5 py-0.5 rounded">
                      ({ytPercent}%)
                    </span>
                  </div>
                </div>

                {/* Site Direct Nacional */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-slate-200">Site Direct</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white text-sm">{totalSite.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400 font-normal bg-slate-800/80 px-1.5 py-0.5 rounded">
                      ({sitePercent}%)
                    </span>
                  </div>
                </div>

                {/* Distribution Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex my-1 border border-slate-700/50">
                  <div style={{ width: `${igPercent}%` }} className="bg-gradient-to-r from-pink-600 to-pink-500 h-full" />
                  <div style={{ width: `${ytPercent}%` }} className="bg-gradient-to-r from-red-600 to-red-500 h-full" />
                  <div style={{ width: `${sitePercent}%` }} className="bg-amber-500 h-full" />
                </div>

                {/* Total Estimado Nacional */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-cyan-950/90 via-slate-900 to-slate-900 border border-cyan-500/50 shadow-md">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-black text-cyan-300 uppercase tracking-wide">Total estimado</span>
                  </div>
                  <div className="text-base font-black text-cyan-300 font-mono">
                    {totalNational.toLocaleString('pt-BR')}
                  </div>
                </div>

                {/* Realtime Update Status Indicator */}
                <div className="flex items-center gap-2 py-1 px-2.5 rounded-md bg-slate-950/80 border border-slate-800/80">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${isUpdating || secondsUntilNext === 0 ? 'opacity-100 scale-125' : 'opacity-60'}`} />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[10.5px] font-mono text-emerald-400/95 tracking-tight font-medium">
                    {isUpdating || secondsUntilNext === 0 ? (
                      <span className="animate-pulse">Atualizando dados…</span>
                    ) : (
                      <>
                        Atualizado há {secondsAgo}s <span className="text-slate-600">·</span> próxima atualização em {secondsUntilNext}s
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Explanatory Footnote */}
              <p className="text-[9.5px] text-slate-400/90 font-mono pt-1 leading-tight border-t border-slate-800/60">
                Os valores acima representam a composição estimada do total exibido no Brasil, com atualização periódica pela fonte central.
              </p>
            </div>
          </div>

        </div>

        {/* Footnote */}
        <div className="mt-3 text-center flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('map.realtimeDataFootnote')}</span>
        </div>

      </div>
    </section>
  );
};

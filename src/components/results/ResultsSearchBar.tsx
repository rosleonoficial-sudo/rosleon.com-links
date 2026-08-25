import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Youtube, Instagram, Sparkles } from 'lucide-react';
import { PlatformType, SortOption, ResultsFilterState } from '../../types';

interface ResultsSearchBarProps {
  filters: ResultsFilterState;
  onFilterChange: (updated: Partial<ResultsFilterState>) => void;
  onOpenFilterModal: () => void;
  activeFilterCount: number;
}

export const ResultsSearchBar: React.FC<ResultsSearchBarProps> = ({
  filters,
  onFilterChange,
  onOpenFilterModal,
  activeFilterCount
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.q || '');

  // Debounce search term update
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.q) {
        onFilterChange({ q: searchTerm, page: 1 });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync back if filters.q changes externally
  useEffect(() => {
    setSearchTerm(filters.q || '');
  }, [filters.q]);

  const handleClearSearch = () => {
    setSearchTerm('');
    onFilterChange({ q: '', page: 1 });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar Input Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        
        {/* Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-cyan-400" />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquise por empresa, marca (ex: WAAW, JBL, UOL), produto ou palavra-chave..."
            className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder-slate-400 text-sm font-medium transition-all shadow-inner outline-none"
          />

          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
              title="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption, page: 1 })}
            className="py-3.5 px-4 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-xs sm:text-sm font-bold focus:border-cyan-400 outline-none cursor-pointer"
          >
            <option value="recent">Ordenar: Mais Recentes</option>
            <option value="views">Ordenar: Mais Visualizados</option>
            <option value="likes">Ordenar: Mais Curtidos</option>
            <option value="comments">Ordenar: Mais Comentados</option>
            <option value="shares">Ordenar: Mais Compartilhados</option>
            <option value="engagement">Ordenar: Maior Engajamento</option>
          </select>

          {/* More Filters Modal Trigger Button */}
          <button
            onClick={onOpenFilterModal}
            className={`inline-flex items-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
              activeFilterCount > 0
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-900/30'
                : 'bg-slate-900 border-slate-700/80 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 text-[11px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Platform Network Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onFilterChange({ platform: 'all', page: 1 })}
          className={`py-2 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
            filters.platform === 'all'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/20'
              : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          TODAS AS REDES
        </button>

        <button
          onClick={() => onFilterChange({ platform: 'youtube', page: 1 })}
          className={`inline-flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
            filters.platform === 'youtube'
              ? 'bg-red-600 text-white font-black shadow-md shadow-red-600/30'
              : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Youtube className="w-4 h-4 text-red-400" />
          YOUTUBE
        </button>

        <button
          onClick={() => onFilterChange({ platform: 'instagram', page: 1 })}
          className={`inline-flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
            filters.platform === 'instagram'
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black shadow-md shadow-pink-600/30'
              : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Instagram className="w-4 h-4 text-pink-400" />
          INSTAGRAM
        </button>

        <button
          onClick={() => onFilterChange({ platform: 'tiktok', page: 1 })}
          className={`inline-flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
            filters.platform === 'tiktok'
              ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 font-black'
              : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <svg className="w-3.5 h-3.5 fill-current text-cyan-400" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.32V9.4a8.16 8.16 0 0 0 4.92 1.62V7.57a4.85 4.85 0 0 1-1-.88z"/>
          </svg>
          TIKTOK
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-semibold border border-amber-500/30">
            EM INTEGRAÇÃO
          </span>
        </button>
      </div>

    </div>
  );
};

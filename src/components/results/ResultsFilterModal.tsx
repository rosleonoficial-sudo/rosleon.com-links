import React from 'react';
import { X, Filter, RotateCcw, Check, Calendar, Tag, Eye } from 'lucide-react';
import { PeriodFilter, ContentType, ResultsFilterState, Brand } from '../../types';

interface ResultsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ResultsFilterState;
  onApplyFilters: (updated: Partial<ResultsFilterState>) => void;
  onResetFilters: () => void;
  brands: Brand[];
}

export const ResultsFilterModal: React.FC<ResultsFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  brands
}) => {
  if (!isOpen) return null;

  const [localFilters, setLocalFilters] = React.useState<ResultsFilterState>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  const handleApply = () => {
    onApplyFilters({ ...localFilters, page: 1 });
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black text-white">Filtros Avançados</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Filter */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            Período de Publicação
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'Todo o Período' },
              { id: '7d', label: 'Últimos 7 dias' },
              { id: '30d', label: 'Últimos 30 dias' },
              { id: '90d', label: 'Últimos 90 dias' },
              { id: 'year', label: 'Este Ano' },
              { id: 'custom', label: 'Personalizado' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLocalFilters(prev => ({ ...prev, period: p.id as PeriodFilter }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  localFilters.period === p.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-sm'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range inputs */}
          {localFilters.period === 'custom' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={localFilters.startDate || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Data Final</label>
                <input
                  type="date"
                  value={localFilters.endDate || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Type Filter */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            Formatos e Tipos de Conteúdo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'video', label: 'Vídeos' },
              { id: 'shorts', label: 'Shorts' },
              { id: 'reels', label: 'Reels' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setLocalFilters(prev => ({ ...prev, contentType: t.id as ContentType }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  localFilters.contentType === t.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Selector */}
        {brands.length > 0 && (
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              Filtrar por Marca / Empresa
            </label>
            <select
              value={localFilters.brand || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full py-3 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-medium outline-none cursor-pointer"
            >
              <option value="">Todas as Marcas ({brands.length})</option>
              {brands.map(b => (
                <option key={b.id} value={b.slug}>
                  {b.name} ({b.contentCount || 0} conteúdos)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Min Views */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Mínimo de Visualizações
            </label>
            <span className="text-xs font-extrabold text-cyan-400 font-mono">
              {localFilters.minViews ? `${localFilters.minViews.toLocaleString('pt-BR')} views` : 'Sem mínimo'}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="300000"
            step="10000"
            value={localFilters.minViews || 0}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, minViews: parseInt(e.target.value, 10) || undefined }))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0</span>
            <span>100k</span>
            <span>200k</span>
            <span>300k+</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar Filtros
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Aplicar Filtros
          </button>
        </div>

      </div>
    </div>
  );
};

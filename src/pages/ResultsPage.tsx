import React, { useState, useEffect, useCallback } from 'react';
import { ResultsHeader } from '../components/results/ResultsHeader';
import { ResultsSearchBar } from '../components/results/ResultsSearchBar';
import { ResultsFilterModal } from '../components/results/ResultsFilterModal';
import { ResultsSummary } from '../components/results/ResultsSummary';
import { BrandRankingWidget } from '../components/results/BrandRankingWidget';
import { ContentCard } from '../components/results/ContentCard';
import {
  ResultsApiResponse,
  ResultsStatusResponse,
  ResultsFilterState,
  Brand,
  ContentItem
} from '../types';
import { SearchX, Loader2, RefreshCw } from 'lucide-react';

interface ResultsPageProps {
  onNavigateHome: () => void;
}

const DEFAULT_FILTERS: ResultsFilterState = {
  q: '',
  platform: 'all',
  sortBy: 'recent',
  period: 'all',
  contentType: 'all',
  brand: '',
  minViews: undefined,
  page: 1,
  limit: 20
};

export const ResultsPage: React.FC<ResultsPageProps> = ({ onNavigateHome }) => {
  const [filters, setFilters] = useState<ResultsFilterState>(DEFAULT_FILTERS);
  const [data, setData] = useState<ResultsApiResponse | null>(null);
  const [status, setStatus] = useState<ResultsStatusResponse | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [accumulatedContents, setAccumulatedContents] = useState<ContentItem[]>([]);

  // Fetch Brands list
  useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(bRes => {
        if (bRes.success && Array.isArray(bRes.brands)) {
          setBrands(bRes.brands);
        }
      })
      .catch(err => console.warn('Erro ao carregar marcas:', err));
  }, []);

  // Fetch Sync Status
  const fetchStatus = useCallback(() => {
    fetch('/api/results/status')
      .then(res => res.json())
      .then(sData => {
        setStatus(sData);
      })
      .catch(err => console.warn('Erro ao carregar status:', err));
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Query Results API
  const fetchResults = useCallback((filterState: ResultsFilterState, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const params = new URLSearchParams();
    if (filterState.q) params.set('q', filterState.q);
    if (filterState.platform) params.set('platform', filterState.platform);
    if (filterState.sortBy) params.set('sortBy', filterState.sortBy);
    if (filterState.period) params.set('period', filterState.period);
    if (filterState.startDate) params.set('startDate', filterState.startDate);
    if (filterState.endDate) params.set('endDate', filterState.endDate);
    if (filterState.contentType) params.set('contentType', filterState.contentType);
    if (filterState.brand) params.set('brand', filterState.brand);
    if (filterState.minViews) params.set('minViews', String(filterState.minViews));
    params.set('page', String(filterState.page));
    params.set('limit', String(filterState.limit));

    fetch(`/api/results?${params.toString()}`)
      .then(res => res.json())
      .then((resData: ResultsApiResponse) => {
        setData(resData);
        if (append) {
          setAccumulatedContents(prev => [...prev, ...(resData.contents || [])]);
        } else {
          setAccumulatedContents(resData.contents || []);
        }
      })
      .catch(err => {
        console.error('Erro ao buscar resultados:', err);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    fetchResults(filters, filters.page > 1);
  }, [filters, fetchResults]);

  // Handle Manual Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/results/sync', { method: 'POST' });
      // Short delay then refresh status and data
      setTimeout(() => {
        fetchStatus();
        fetchResults(filters, false);
        setIsRefreshing(false);
      }, 1500);
    } catch (e) {
      console.warn('Erro ao disparar refresh manual:', e);
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (updated: Partial<ResultsFilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...updated,
      page: updated.page !== undefined ? updated.page : 1
    }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Count active filters for badge count
  const countActiveFilters = () => {
    let count = 0;
    if (filters.period !== 'all') count++;
    if (filters.contentType !== 'all') count++;
    if (filters.brand) count++;
    if (filters.minViews) count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-[#070a14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden antialiased flex flex-col justify-between">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-600/15 via-blue-700/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[50%] right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1">
        
        {/* Header */}
        <ResultsHeader
          onNavigateHome={onNavigateHome}
          status={status}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Main Content Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Search Controls */}
          <ResultsSearchBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onOpenFilterModal={() => setIsFilterModalOpen(true)}
            activeFilterCount={countActiveFilters()}
          />

          {/* Results Summary Box */}
          {data?.summary && (
            <ResultsSummary
              summary={data.summary}
              filters={filters}
            />
          )}

          {/* Ranking de Marcas Component */}
          <BrandRankingWidget />

          {/* Content Items Feed Header & Grid */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-200">
                {filters.sortBy === 'recent'
                  ? 'CONTEÚDOS MAIS RECENTES'
                  : filters.sortBy === 'engagement'
                  ? 'CONTEÚDOS (PERFORMANCE SCORE)'
                  : filters.sortBy === 'views'
                  ? 'CONTEÚDOS MAIS VISUALIZADOS'
                  : filters.sortBy === 'likes'
                  ? 'CONTEÚDOS MAIS CURTIDOS'
                  : filters.sortBy === 'comments'
                  ? 'CONTEÚDOS MAIS COMENTADOS'
                  : filters.sortBy === 'shares'
                  ? 'CONTEÚDOS MAIS COMPARTILHADOS'
                  : 'CONTEÚDOS DO CATÁLOGO'}
              </h3>
              {data?.pagination && (
                <span className="text-xs text-slate-400 font-medium">
                  {accumulatedContents.length} de {data.pagination.total} conteúdos
                </span>
              )}
            </div>

            {loading && !loadingMore ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <p className="text-sm font-bold text-slate-300">Consultando banco de conteúdos e métricas...</p>
              </div>
            ) : accumulatedContents.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {accumulatedContents.map((item, idx) => (
                    <ContentCard key={`${item.id}-${idx}`} content={item} />
                  ))}
                </div>

                {/* Pagination / Load More */}
                {data?.pagination?.hasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => handleFilterChange({ page: filters.page + 1 })}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-slate-700 text-cyan-400 font-extrabold text-xs sm:text-sm shadow-xl active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                          <span>Carregando mais...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 text-cyan-400" />
                          <span>CARREGAR MAIS RESULTADOS</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Empty State */
              filters.platform !== 'tiktok' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-xl">
                  <SearchX className="w-12 h-12 text-slate-500 mx-auto" />
                  <h3 className="text-lg font-black text-white">Nenhum conteúdo encontrado</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Não encontramos vídeos ou postagens correspondentes aos termos ou filtros selecionados. Tente buscar por outros termos como <strong className="text-cyan-400">WAAW, JBL, UOL</strong> ou limpar os filtros.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    Limpar Filtros e Pesquisa
                  </button>
                </div>
              )
            )}
          </div>

        </main>

      </div>

      {/* Filter Modal / Drawer */}
      <ResultsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={handleFilterChange}
        onResetFilters={handleResetFilters}
        brands={brands}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ROSLEON. Portal Público de Métricas e Resultados.</p>
          <button
            onClick={onNavigateHome}
            className="text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            Voltar para o Media Kit
          </button>
        </div>
      </footer>

    </div>
  );
};

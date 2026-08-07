import React, { useState } from 'react';
import { SiteConfig, CouponItem } from '../types';
import { 
  X, Save, RotateCcw, Download, Upload, Plus, Trash2, 
  Link as LinkIcon, User, Layers, Sparkles, Check, FileText 
} from 'lucide-react';

interface EditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  onSaveConfig: (newConfig: SiteConfig) => void;
  onResetDefault: () => void;
}

export const EditDrawer: React.FC<EditDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetDefault
}) => {
  const [activeTab, setActiveTab] = useState<'links' | 'feed' | 'creator' | 'hero' | 'backup'>('links');
  const [formData, setFormData] = useState<SiteConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  if (!isOpen) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: keyof SiteConfig, child: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as object),
        [child]: value
      }
    }));
  };

  const handleSave = () => {
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddCoupon = () => {
    const newCoupon: CouponItem = {
      id: Date.now().toString(),
      category: "NOVA CATEGORIA",
      discount: "Desconto até 20%",
      timeAgo: "há 1 min",
      activeUsers: "5,0K",
      active: true
    };
    setFormData(prev => ({
      ...prev,
      couponsFeed: [newCoupon, ...prev.couponsFeed]
    }));
  };

  const handleUpdateCoupon = (index: number, field: keyof CouponItem, value: any) => {
    const updatedFeed = [...formData.couponsFeed];
    updatedFeed[index] = { ...updatedFeed[index], [field]: value };
    setFormData(prev => ({ ...prev, couponsFeed: updatedFeed }));
  };

  const handleRemoveCoupon = (index: number) => {
    const updatedFeed = formData.couponsFeed.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, couponsFeed: updatedFeed }));
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed && typeof parsed === 'object') {
        setFormData(parsed);
        onSaveConfig(parsed);
        setJsonError('');
        alert('Configuração importada com sucesso!');
      } else {
        setJsonError('JSON inválido');
      }
    } catch (e) {
      setJsonError('Formato JSON incorreto');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Slide-Over Panel */}
      <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full flex flex-col text-slate-100 shadow-2xl">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Painel de Edição Rápida</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 overflow-x-auto text-xs font-semibold no-scrollbar">
          <button
            onClick={() => setActiveTab('links')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'links' ? 'border-cyan-400 text-cyan-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" /> Links & Redes
          </button>
          <button
            onClick={() => setActiveTab('hero')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'hero' ? 'border-cyan-400 text-cyan-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Destaque & Textos
          </button>
          <button
            onClick={() => setActiveTab('creator')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'creator' ? 'border-cyan-400 text-cyan-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Perfil & Bio
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'feed' ? 'border-cyan-400 text-cyan-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Feed Celular
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'backup' ? 'border-cyan-400 text-cyan-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Backup JSON
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* TAB 1: LINKS & REDES */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              <h3 className="font-bold text-amber-400 text-sm mb-2">Editar URLs e Botões das Redes</h3>
              
              {/* Telegram Link */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-blue-400 flex items-center gap-1">✈️ Telegram</span>
                <div>
                  <label className="text-slate-400 block mb-1">URL do Grupo Telegram</label>
                  <input
                    type="text"
                    value={formData.telegramLink.url}
                    onChange={(e) => handleNestedChange('telegramLink', 'url', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    value={formData.telegramLink.buttonText}
                    onChange={(e) => handleNestedChange('telegramLink', 'buttonText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* WhatsApp Link */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1">💬 WhatsApp (Comunidade / Canal)</span>
                <div>
                  <label className="text-slate-400 block mb-1">URL do Canal WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsappLink.url}
                    onChange={(e) => handleNestedChange('whatsappLink', 'url', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    value={formData.whatsappLink.buttonText}
                    onChange={(e) => handleNestedChange('whatsappLink', 'buttonText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* WhatsApp Suporte Link */}
              {formData.whatsappSupportLink && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-teal-400 flex items-center gap-1">🎧 WhatsApp Suporte ao Seguidor</span>
                  <div>
                    <label className="text-slate-400 block mb-1">URL do WhatsApp de Suporte (wa.me/...)</label>
                    <input
                      type="text"
                      value={formData.whatsappSupportLink.url}
                      onChange={(e) => handleNestedChange('whatsappSupportLink', 'url', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* YouTube Channel Link */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-red-400 flex items-center gap-1">▶️ Canal do YouTube</span>
                <div>
                  <label className="text-slate-400 block mb-1">URL do Canal</label>
                  <input
                    type="text"
                    value={formData.youtubeSection.url}
                    onChange={(e) => handleNestedChange('youtubeSection', 'url', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Texto do Banner YouTube</label>
                  <input
                    type="text"
                    value={formData.youtubeSection.bannerText}
                    onChange={(e) => handleNestedChange('youtubeSection', 'bannerText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* Instagram Link */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-pink-400 flex items-center gap-1">📸 Instagram</span>
                <div>
                  <label className="text-slate-400 block mb-1">URL do Instagram</label>
                  <input
                    type="text"
                    value={formData.instagramLink.url}
                    onChange={(e) => handleNestedChange('instagramLink', 'url', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Descrição</label>
                  <input
                    type="text"
                    value={formData.instagramLink.subtitle}
                    onChange={(e) => handleNestedChange('instagramLink', 'subtitle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* TikTok Link */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-cyan-400 flex items-center gap-1">🎵 TikTok</span>
                <div>
                  <label className="text-slate-400 block mb-1">URL do TikTok</label>
                  <input
                    type="text"
                    value={formData.tiktokLink.url}
                    onChange={(e) => handleNestedChange('tiktokLink', 'url', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Descrição</label>
                  <input
                    type="text"
                    value={formData.tiktokLink.subtitle}
                    onChange={(e) => handleNestedChange('tiktokLink', 'subtitle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO & TEXTOS */}
          {activeTab === 'hero' && (
            <div className="space-y-4">
              <h3 className="font-bold text-amber-400 text-sm mb-2">Textos Principais do Topo</h3>
              
              <div>
                <label className="text-slate-400 block mb-1">Logo Marca</label>
                <input
                  type="text"
                  value={formData.logoText}
                  onChange={(e) => handleChange('logoText', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Selo Mercado Livre / Parceria Topo</label>
                <input
                  type="text"
                  value={formData.badgeText}
                  onChange={(e) => handleChange('badgeText', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Palavra Destacada 1 (Dourada)</label>
                <input
                  type="text"
                  value={formData.heroTitleHighlight1}
                  onChange={(e) => handleChange('heroTitleHighlight1', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Palavra Destacada 2 (Dourada)</label>
                <input
                  type="text"
                  value={formData.heroTitleHighlight2}
                  onChange={(e) => handleChange('heroTitleHighlight2', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Subtítulo do Hero</label>
                <textarea
                  rows={3}
                  value={formData.heroSubtitle}
                  onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CREATOR & BIO */}
          {activeTab === 'creator' && (
            <div className="space-y-4">
              <h3 className="font-bold text-amber-400 text-sm mb-2">Informações do Criador (Leonardo Mey)</h3>

              <div>
                <label className="text-slate-400 block mb-1">Nome do Criador</label>
                <input
                  type="text"
                  value={formData.creator.name}
                  onChange={(e) => handleNestedChange('creator', 'name', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Título / Função</label>
                <input
                  type="text"
                  value={formData.creator.title}
                  onChange={(e) => handleNestedChange('creator', 'title', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Estatística: Inscritos no YouTube</label>
                <input
                  type="text"
                  value={formData.stats.subscribers}
                  onChange={(e) => handleNestedChange('stats', 'subscribers', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Estatística: Total de Visualizações</label>
                <input
                  type="text"
                  value={formData.stats.views}
                  onChange={(e) => handleNestedChange('stats', 'views', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bio Título (Quem Sou Eu)</label>
                <textarea
                  rows={2}
                  value={formData.creator.bioHeadline}
                  onChange={(e) => handleNestedChange('creator', 'bioHeadline', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bio Parágrafo 1</label>
                <textarea
                  rows={3}
                  value={formData.creator.bioParagraph1}
                  onChange={(e) => handleNestedChange('creator', 'bioParagraph1', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bio Parágrafo 2</label>
                <textarea
                  rows={3}
                  value={formData.creator.bioParagraph2}
                  onChange={(e) => handleNestedChange('creator', 'bioParagraph2', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bio Parágrafo 3</label>
                <textarea
                  rows={3}
                  value={formData.creator.bioParagraph3 || ''}
                  onChange={(e) => handleNestedChange('creator', 'bioParagraph3', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-cyan-400 block text-xs">🖼️ Imagens do Criador (Independentes)</span>
                <div>
                  <label className="text-slate-400 block text-xs mb-1">Foto da Seção "Parcerias & Mídia Kit"</label>
                  <input
                    type="text"
                    value={formData.creator.photoUrl || ''}
                    onChange={(e) => handleNestedChange('creator', 'photoUrl', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-xs mb-1">Foto da Seção "Quem Sou Eu"</label>
                  <input
                    type="text"
                    value={formData.creator.aboutPhotoUrl || ''}
                    onChange={(e) => handleNestedChange('creator', 'aboutPhotoUrl', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FEED DO CELULAR */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-400 text-sm">Notificações do Feed do Celular</h3>
                <button
                  onClick={handleAddCoupon}
                  className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded-lg font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              {formData.couponsFeed.map((item, index) => (
                <div key={item.id || index} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Item #{index + 1}</span>
                    <button
                      onClick={() => handleRemoveCoupon(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block text-[10px]">Categoria</label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => handleUpdateCoupon(index, 'category', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[10px]">Tempo Decorrido</label>
                      <input
                        type="text"
                        value={item.timeAgo}
                        onChange={(e) => handleUpdateCoupon(index, 'timeAgo', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block text-[10px]">Desconto / Mensagem</label>
                    <input
                      type="text"
                      value={item.discount}
                      onChange={(e) => handleUpdateCoupon(index, 'discount', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: BACKUP & RESTAURAR */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <h3 className="font-bold text-amber-400 text-sm mb-2">Exportar / Importar Configurações</h3>

              <div>
                <label className="text-slate-400 block mb-1">Cole aqui o JSON de Configuração:</label>
                <textarea
                  rows={6}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`{"siteTitle": "ROSLEON", ...}`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-[10px]"
                />
                {jsonError && <p className="text-red-400 text-[11px] mt-1">{jsonError}</p>}
                
                <button
                  onClick={handleImportJson}
                  className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg border border-cyan-500/30 flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Importar JSON
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
                    alert('JSON copiado para a área de transferência!');
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-amber-400" /> Copiar Configuração JSON Atual
                </button>

                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja restaurar as configurações originais do ROSLEON?')) {
                      onResetDefault();
                      onClose();
                    }
                  }}
                  className="w-full py-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 font-bold rounded-lg border border-red-800/40 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Restaurar Padrões da Página
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Action Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" /> Salvo com Sucesso!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Salvar Alterações
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

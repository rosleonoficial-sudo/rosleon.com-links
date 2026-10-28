import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertTriangle, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';

interface InstagramTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenUpdated?: () => void;
}

export const InstagramTokenModal: React.FC<InstagramTokenModalProps> = ({
  isOpen,
  onClose,
  onTokenUpdated
}) => {
  const [tokenInput, setTokenInput] = useState<string>('');
  const [userIdInput, setUserIdInput] = useState<string>('17841461297140253');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setError('Por favor, cole o token de acesso do Instagram gerado no Meta for Developers.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/instagram/update-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: cleanToken,
          userId: userIdInput.trim() || '17841461297140253'
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao validar o token na Meta');
      }

      setSuccessMessage(data.message || 'Token do Instagram atualizado e validado com sucesso!');
      setTokenInput('');
      
      if (onTokenUpdated) {
        onTokenUpdated();
      }

      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao atualizar token:', err);
      setError(err.message || 'Erro ao validar o token na Meta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-left space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Atualizar Token do Instagram
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Conexão oficial via Meta Graph API (@rosleonoficial)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Por que atualizar?</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            Os tokens de longa duração da Meta possuem validade de 60 dias. Quando o token expira, a API do Instagram deixa de responder com novos posts e métricas em tempo real.
          </p>
          <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Para gerar um novo token: acesse o</span>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-0.5"
            >
              Meta Developers <ExternalLink className="w-3 h-3" />
            </a>
            <span>ou o Graph API Explorer.</span>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Falha ao validar token:</p>
              <p className="text-[11px] text-rose-200">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Novo Access Token da Meta (Instagram Graph API)</span>
              <span className="text-[11px] text-slate-500 font-normal">Obrigatório</span>
            </label>
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Cole aqui o token (começa com IGAA... ou EAAB...)"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Instagram User ID</span>
              <span className="text-[11px] text-slate-500 font-normal">Padrão: @rosleonoficial</span>
            </label>
            <input
              type="text"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              disabled={loading}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white text-xs font-black shadow-lg shadow-pink-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando na Meta...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Testar e Salvar Token</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

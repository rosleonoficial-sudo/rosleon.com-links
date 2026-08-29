import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Mail, Handshake, ExternalLink, Sparkles } from 'lucide-react';

interface PartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnershipModal: React.FC<PartnershipModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Lock scroll on body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const whatsappUrl = "https://wa.me/5547997826666?text=Ol%C3%A1%21%20Vi%20o%20site%20de%20m%C3%A9tricas%20da%20ROSLEON%20e%20quero%20falar%20sobre%20uma%20poss%C3%ADvel%20parceria.";
  
  const emailSubject = encodeURIComponent("Parceria — Portal de Métricas ROSLEON");
  const emailBody = encodeURIComponent("Olá! Vi o Portal de Métricas da ROSLEON e gostaria de conversar sobre uma possível parceria.");
  const mailtoUrl = `mailto:contato@rosleon.com?subject=${emailSubject}&body=${emailBody}`;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-amber-500/30 rounded-2xl w-[calc(100%-24px)] sm:w-full max-w-[560px] max-h-[90vh] overflow-y-auto relative p-5 sm:p-6 shadow-2xl shadow-amber-950/40 space-y-5 text-left"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Copy */}
        <div className="space-y-3 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Fale diretamente com a ROSLEON</span>
          </div>

          <h2 id="modal-title" className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
            Quer aumentar a visibilidade e as vendas da sua marca?
          </h2>

          <div className="space-y-2 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            <p>
              Apresente seus produtos para uma audiência engajada e acompanhe resultados reais no Portal de Métricas da ROSLEON.
            </p>
            <p className="text-amber-200/90 font-medium">
              Vamos criar uma parceria estratégica para gerar alcance, confiança e novas oportunidades para sua marca.
            </p>
          </div>
        </div>

        {/* Options Stack */}
        <div className="space-y-3 pt-1 border-t border-slate-800/80">
          
          {/* Option A: WhatsApp */}
          <div className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-3.5 sm:p-4 space-y-2.5 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                WhatsApp Oficial
              </span>
              <span className="font-mono text-[11px] text-slate-400 font-semibold">+55 47 99782-6666</span>
            </div>
            
            <p className="text-xs text-slate-300 italic bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
              "Olá! Vi o site de métricas da ROSLEON e quero falar sobre uma possível parceria."
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/50 active:scale-95 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>FALAR PELO WHATSAPP</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>

          {/* Option B: E-mail */}
          <div className="bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl p-3.5 sm:p-4 space-y-2.5 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Mail className="w-4 h-4 text-cyan-400" />
                E-mail Corporativo
              </span>
              <span className="font-mono text-[11px] text-slate-400 font-semibold">contato@rosleon.com</span>
            </div>

            <a
              href={mailtoUrl}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-cyan-950/50 active:scale-95 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>ENVIAR E-MAIL</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Share2, Send, MessageCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteTitle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, siteTitle }) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://rosleon.app';

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Confira os melhores cupons e ofertas no ${siteTitle}!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl p-6 text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            <Share2 className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-extrabold text-white">Compartilhar Página</h3>
          <p className="text-xs text-slate-300">
            Envie este link para amigos e economize com as melhores ofertas e cupons!
          </p>

          {/* Copy URL Input Box */}
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-2xl border border-slate-800">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-cyan-300 truncate focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar
                </>
              )}
            </button>
          </div>

          {/* Quick Direct Sharing Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
            </a>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
            >
              <Send className="w-4 h-4 fill-current" /> Telegram
            </a>
          </div>

          {/* QR Code Graphic Representation */}
          <div className="pt-4 border-t border-slate-800 flex flex-col items-center justify-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <QrCode className="w-4 h-4 text-amber-400" /> Escaneie para abrir no celular
            </span>
            <div className="p-3 bg-white rounded-2xl shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(currentUrl)}`}
                alt="QR Code da Página"
                className="w-32 h-32 rounded"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

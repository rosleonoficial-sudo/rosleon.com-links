import React from 'react';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { SocialLink } from '../types';

interface SupportSectionProps {
  supportLink?: SocialLink;
  onTrackClick?: (linkName: string) => void;
}

export const SupportSection: React.FC<SupportSectionProps> = ({ supportLink, onTrackClick }) => {
  const whatsappUrl = supportLink?.url || "https://wa.me/5547997785876?text=Ol%C3%A1%20ROSLEON,%20sou%20seu%20seguidor%20e%20preciso%20de%20suporte!";

  return (
    <section id="suporte" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto my-6">
      {/* Container Principal Simplificado e Elegante */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/60 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl shadow-emerald-950/20 backdrop-blur-xl">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          
          {/* Texto Direto e Simples */}
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 hidden xs:flex">
              <MessageCircle className="w-6 h-6 fill-emerald-400/20" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs tracking-wider uppercase mb-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Suporte Direto</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Suporte para meus seguidores e inscritos!
              </h3>
            </div>
          </div>

          {/* Botão Fale Comigo Aqui */}
          <div className="w-full sm:w-auto shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackClick?.('WhatsApp Suporte')}
              className="relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-950/40 active:scale-95 transition-all duration-200 w-full sm:w-auto border border-emerald-300/50 hover:scale-[1.02] cursor-pointer group"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950 text-emerald-400 shrink-0" />
              <span className="tracking-wide uppercase font-black text-slate-950 whitespace-nowrap">
                Fale comigo aqui
              </span>
              <ArrowRight className="w-4 h-4 text-slate-950 shrink-0 transition-transform group-hover:translate-x-1 duration-200" />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
};

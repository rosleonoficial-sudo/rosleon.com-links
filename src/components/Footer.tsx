import React from 'react';

interface FooterProps {
  logoText: string;
  clickCounts?: Record<string, number>;
  onOpenEdit?: () => void;
  onOpenShare?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  logoText
}) => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 py-10 px-4 text-center text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto">
        {/* CNPJ & Location & Copyright */}
        <div className="space-y-1.5">
          <p className="text-slate-400 text-[11px] font-medium">
            CNPJ: 59.100.225/0001-62 • Barra Velha - SC
          </p>
          <p className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} {logoText || "ROSLEON"}. Todos os direitos reservados. Cupons, ofertas e reviews testados e aprovados.
          </p>
        </div>
      </div>
    </footer>
  );
};

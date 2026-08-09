import React from 'react';
import { CreatorProfile } from '../types';
import { User, Tag, ShieldCheck, BarChart3, Heart, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { ImageWithFallback } from './ImageWithFallback';

interface AboutSectionProps {
  creator: CreatorProfile;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ creator }) => {
  const { t } = useLanguage();

  const getPillarIcon = (iconName: string) => {
    switch (iconName) {
      case 'award':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-amber-400 fill-amber-400/20" />;
      case 'shield':
        return <ShieldCheck className="w-5 h-5 text-amber-400" />;
      case 'tag':
        return <Tag className="w-5 h-5 text-amber-400" />;
      case 'chart':
        return <BarChart3 className="w-5 h-5 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-amber-400" />;
    }
  };

  // Helper to translate default bio paragraphs & quote
  const getBio1 = () => {
    if (!creator.bioParagraph1 || creator.bioParagraph1.includes('Leonardo Mey, criador de conteúdo') || creator.bioParagraph1.includes('formado em Processos Gerenciais')) {
      return t('about.bio1');
    }
    return creator.bioParagraph1;
  };

  const getBio2 = () => {
    if (!creator.bioParagraph2 || creator.bioParagraph2.includes('Ao longo desses anos, construí meu trabalho')) {
      return t('about.bio2');
    }
    return creator.bioParagraph2;
  };

  const getBio3 = () => {
    if (!creator.bioParagraph3 || creator.bioParagraph3.includes('Sou cristão, marido da Janaína')) {
      return t('about.bio3');
    }
    return creator.bioParagraph3;
  };

  const getPillarTitle = (title: string, idx: number) => {
    if (idx === 0 && (title.includes('10 Anos') || title.includes('Experiência'))) return t('about.pillar1Title');
    if (idx === 1 && (title.includes('Análises') || title.includes('Criteriosas'))) return t('about.pillar2Title');
    if (idx === 2 && (title.includes('Fé') || title.includes('Princípios'))) return t('about.pillar3Title');
    if (idx === 3 && (title.includes('Transparência') || title.includes('Total'))) return t('about.pillar4Title');
    return title;
  };

  const getPillarSubtitle = (subtitle: string | undefined, idx: number) => {
    if (idx === 0 && (!subtitle || subtitle.includes('Copywriting'))) return t('about.pillar1Sub');
    if (idx === 1 && (!subtitle || subtitle.includes('Recomendações'))) return t('about.pillar2Sub');
    if (idx === 2 && (!subtitle || subtitle.includes('Compromisso'))) return t('about.pillar3Sub');
    if (idx === 3 && (!subtitle || subtitle.includes('Respeito'))) return t('about.pillar4Sub');
    return subtitle || '';
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto my-8">
      <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-950/20">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Creator Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl group flex items-center justify-center bg-slate-900">
              <ImageWithFallback
                src={creator.aboutPhotoUrl || "/images/rosleon-jul.webp"}
                backupSrc="/images/rosleon-ago.webp"
                alt={creator.name || "Leonardo Mey"}
                initials="ROSLEON"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width={384}
                height={480}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 pointer-events-none" />
            </div>
          </div>

          {/* Right Column: Bio Content */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400 font-extrabold text-xs sm:text-sm tracking-wider uppercase bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/25 shrink-0 self-start sm:self-auto">
                <User className="w-4 h-4 text-amber-400" />
                <span>{t('sections.whoAmI')}</span>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <h3 className="text-2xl sm:text-3xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                {creator.name || "Leonardo Mey"}
              </h3>

              <p className="text-slate-200 text-sm sm:text-base lg:text-[17px] leading-relaxed lg:leading-relaxed font-normal">
                {getBio1()}
              </p>

              <p className="text-slate-200 text-sm sm:text-base lg:text-[17px] leading-relaxed lg:leading-relaxed font-normal">
                {getBio2()}
              </p>

              <p className="text-slate-200 text-sm sm:text-base lg:text-[17px] leading-relaxed lg:leading-relaxed font-normal">
                {getBio3()}
              </p>

              <div className="relative border-l-4 border-amber-400 bg-gradient-to-r from-amber-500/15 via-slate-900/80 to-slate-950/60 p-4 rounded-r-2xl border-y border-r border-amber-500/20 shadow-md my-2">
                <p className="text-amber-300 text-sm sm:text-base lg:text-[16px] leading-relaxed font-semibold italic">
                  "{t('about.quote')}"
                </p>
              </div>
            </div>

            {/* 4 Copywriting Authority Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
              {creator.pillars && creator.pillars.map((pillar, idx) => (
                <div 
                  key={idx}
                  className="flex flex-col items-start p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all duration-200 text-left shadow-sm group w-full min-w-0 overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 mb-1 w-full min-w-0">
                    <div className="p-1.5 rounded-lg bg-amber-400/10 group-hover:bg-amber-400/20 transition-colors shrink-0">
                      {getPillarIcon(pillar.icon)}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-amber-300 leading-snug break-words min-w-0 flex-1">
                      {getPillarTitle(pillar.title, idx)}
                    </span>
                  </div>
                  {pillar.subtitle && (
                    <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-snug break-words min-w-0 w-full pl-0.5 mt-0.5">
                      {getPillarSubtitle(pillar.subtitle, idx)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

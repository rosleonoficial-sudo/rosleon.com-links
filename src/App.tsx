import React, { useState, useEffect } from 'react';
import { SiteConfig } from './types';
import { defaultConfig } from './data/defaultConfig';
import { useYouTubeStats } from './hooks/useYouTubeStats';
import { useInstagramStats } from './hooks/useInstagramStats';
import { useLiveOnlineCount } from './hooks/useLiveOnlineCount';

import { HeaderHero } from './components/HeaderHero';
import { PartnershipsCard } from './components/PartnershipsCard';
import { YouTubeSection } from './components/YouTubeSection';
import { SocialLinksSection } from './components/SocialLinksSection';
import { BrazilMapSection } from './components/BrazilMapSection';
import { SupportSection } from './components/SupportSection';
import { AboutSection } from './components/AboutSection';
import { EditDrawer } from './components/EditDrawer';
import { ShareModal } from './components/ShareModal';
import { Footer } from './components/Footer';
import { FloatingScrollDown } from './components/FloatingScrollDown';

const STORAGE_KEY = 'rosleon_site_config_v2';
const CLICKS_STORAGE_KEY = 'rosleon_click_analytics_v1';

const TARGET_PHOTO_URL = 'https://res.cloudinary.com/jfqsykts/image/upload/c_limit,w_640/q_auto:eco/f_auto/v1786311281/ChatGPT_Image_7_de_ago._de_2026_07_59_44.png';

export default function App() {
  const [config, setConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('rosleon_site_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedConfig = {
          ...defaultConfig,
          ...parsed,
          whatsappLink: {
            ...defaultConfig.whatsappLink,
            ...(parsed.whatsappLink || {})
          },
          instagramLink: {
            ...defaultConfig.instagramLink,
            ...(parsed.instagramLink || {})
          },
          tiktokLink: {
            ...defaultConfig.tiktokLink,
            ...(parsed.tiktokLink || {})
          },
          creator: {
            ...defaultConfig.creator,
            ...(parsed.creator || {})
          }
        };

        mergedConfig.instagramLink.url = 'https://www.instagram.com/rosleonoficial/';

        if (!mergedConfig.tiktokLink.url || (mergedConfig.tiktokLink.url.includes('tiktok.com/@rosleon') && !mergedConfig.tiktokLink.url.includes('rosleonoficial'))) {
          mergedConfig.tiktokLink.url = 'https://www.tiktok.com/@rosleonoficial';
        }

        if (!mergedConfig.youtubeSection.url || (mergedConfig.youtubeSection.url.includes('youtube.com/@rosleon') && !mergedConfig.youtubeSection.url.includes('rosleonoficial'))) {
          mergedConfig.youtubeSection.url = 'https://www.youtube.com/@rosleonoficial';
        }

        // Update creator bio, title & pillars
        mergedConfig.creator.title = "Criador de conteúdo, especialista em marketing e vendas.";
        if (!mergedConfig.creator.bioParagraph1 || mergedConfig.creator.bioParagraph1.includes('ajudo milhares de pessoas') || !mergedConfig.creator.pillars?.[0]?.subtitle) {
          mergedConfig.creator.bioHeadline = defaultConfig.creator.bioHeadline;
          mergedConfig.creator.bioParagraph1 = defaultConfig.creator.bioParagraph1;
          mergedConfig.creator.bioParagraph2 = defaultConfig.creator.bioParagraph2;
          mergedConfig.creator.bioParagraph3 = defaultConfig.creator.bioParagraph3;
          mergedConfig.creator.pillars = defaultConfig.creator.pillars;
        }
        mergedConfig.creator.aboutPhotoUrl = defaultConfig.creator.aboutPhotoUrl;
        mergedConfig.creator.photoUrl = defaultConfig.creator.photoUrl;

        return mergedConfig;
      }
    } catch (e) {
      console.error('Erro ao carregar dados do localStorage:', e);
    }
    return defaultConfig;
  });

  const { stats: liveStats } = useYouTubeStats(config.stats);
  const { 
    data: instagramStats, 
    loading: instagramLoading, 
    error: instagramError, 
    configured: instagramConfigured 
  } = useInstagramStats();
  const totalOnlineCount = useLiveOnlineCount();

  const [clickCounts, setClickCounts] = useState<Record<string, number>>(() => {

    try {
      const saved = localStorage.getItem(CLICKS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao carregar cliques:', e);
    }
    return {};
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Update document title dynamically
  useEffect(() => {
    document.title = config.siteTitle || 'GRUPO ROSLEON';
  }, [config.siteTitle]);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }, [config]);

  // Save click counts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CLICKS_STORAGE_KEY, JSON.stringify(clickCounts));
    } catch (e) {
      console.error('Erro ao salvar cliques:', e);
    }
  }, [clickCounts]);

  const handleTrackClick = (linkName: string) => {
    setClickCounts((prev) => ({
      ...prev,
      [linkName]: (prev[linkName] || 0) + 1
    }));
  };

  const handleSaveConfig = (newConfig: SiteConfig) => {
    setConfig(newConfig);
  };

  const handleResetDefault = () => {
    setConfig(defaultConfig);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-[#070a14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden antialiased">
      
      {/* Background Ambient Radial Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-600/15 via-blue-700/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[40%] -right-40 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main Container Content */}
      <div className="relative z-10">
        {/* Header Hero Section */}
        <HeaderHero
          config={config}
          onOpenShare={() => setIsShareOpen(true)}
          onOpenEdit={() => setIsEditOpen(true)}
          onTrackClick={handleTrackClick}
          totalOnlineCount={totalOnlineCount}
        />

        {/* Parcerias / Creator Card Section */}
        <PartnershipsCard
          creator={config.creator}
          stats={liveStats}
          instagramStats={instagramStats}
        />

        {/* Mapa de Audiência do Brasil em Tempo Real */}
        <BrazilMapSection totalOnlineCount={totalOnlineCount} />

        {/* Section Divider Title */}
        <div className="flex items-center justify-center gap-4 my-6 px-4 max-w-6xl mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent flex-1 max-w-xs" />
          <h3 className="text-xs sm:text-sm font-bold text-amber-400 tracking-widest uppercase">
            ME ACOMPANHE NAS REDES
          </h3>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent flex-1 max-w-xs" />
        </div>

        {/* 1º YouTube Section */}
        {config.youtubeSection && (
          <YouTubeSection
            youtubeData={config.youtubeSection}
            stats={liveStats}
            onTrackClick={handleTrackClick}
          />
        )}

        {/* 2º Instagram & 3º TikTok Section */}
        <SocialLinksSection
          instagram={config.instagramLink}
          tiktok={config.tiktokLink}
          telegram={config.telegramLink}
          instagramStats={instagramStats}
          instagramLoading={instagramLoading}
          instagramError={instagramError}
          instagramConfigured={instagramConfigured}
          onTrackClick={handleTrackClick}
          showTitle={false}
        />

        {/* Suporte WhatsApp para Seguidores */}
        <SupportSection
          supportLink={config.whatsappSupportLink}
          onTrackClick={handleTrackClick}
        />

        {/* Quem Sou Eu Section */}
        <AboutSection
          creator={config.creator}
        />

        {/* Footer */}
        <Footer
          logoText={config.logoText}
          clickCounts={clickCounts}
          onOpenEdit={() => setIsEditOpen(true)}
          onOpenShare={() => setIsShareOpen(true)}
        />
      </div>

      {/* Slide-over Edit Panel Modal & Share Modal */}
      <EditDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onResetDefault={handleResetDefault}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        siteTitle={config.siteTitle || "ROSLEON"}
      />

      {/* Floating Scroll Down Arrow Button */}
      <FloatingScrollDown />

    </div>
  );
}

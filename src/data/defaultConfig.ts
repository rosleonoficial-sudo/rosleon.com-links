import { SiteConfig } from '../types';

export const defaultConfig: SiteConfig = {
  siteTitle: "ROSLEON - Cupons e Ofertas",
  logoText: "ROSLEON",
  badgeText: "Afiliado Profissional Nível Prata Mercado Livre",
  
  heroTitlePrefix: "⚠️ Você pode estar ",
  heroTitleHighlight1: "pagando mais caro",
  heroTitleMiddle: " por não estar ",
  heroTitleHighlight2: "no grupo!",
  heroTitleSuffix: "",
  
  heroSubtitle: "Compre o que você quer pelos melhores preços do mercado — com segurança!",
  heroHighlights: [
    "Cupons exclusivos e testados",
    "Ofertas relâmpago todos os dias"
  ],
  
  telegramLink: {
    id: "telegram",
    platform: "telegram",
    title: "Telegram",
    subtitle: "Grupo exclusivo de cupons",
    url: "https://t.me/rosleon_ofertas",
    buttonText: "Entrar no Telegram",
    enabled: true
  },
  
  whatsappLink: {
    id: "whatsapp",
    platform: "whatsapp",
    title: "WhatsApp",
    subtitle: "Canal de ofertas no WhatsApp",
    url: "https://www.gruporosleon.com.br/",
    buttonText: "👉 TOQUE AQUI E VEJA COMO FUNCIONA NA PRÁTICA!",
    enabled: true
  },
  
  whatsappSupportLink: {
    id: "whatsapp-suporte",
    platform: "whatsapp",
    title: "Suporte WhatsApp",
    subtitle: "Suporte direto para seguidores e inscritos",
    url: "https://wa.me/5547997785876?text=Ol%C3%A1%20ROSLEON,%20sou%20seu%20seguidor%20e%20preciso%20de%20suporte!",
    buttonText: "Fale comigo aqui",
    enabled: true
  },
  
  youtubeSection: {
    title: "CANAL DO YOUTUBE",
    description: "Reviews sinceros, testes completos e as melhores recomendações para você comprar com segurança.",
    buttonText: "Ir para o YouTube",
    url: "https://www.youtube.com/@rosleonoficial",
    bannerText: "OFERTAS TESTADAS E APROVADAS!",
    bannerImage: "https://images.unsplash.com/photo-1593642532744-d377ab507dc8?auto=format&fit=crop&w=800&q=80"
  },
  
  instagramLink: {
    id: "instagram",
    platform: "instagram",
    title: "INSTAGRAM",
    subtitle: "Conteúdo diário, bastidores, ofertas e cupons exclusivos.",
    url: "https://www.instagram.com/rosleonoficial",
    buttonText: "Ir para o Instagram",
    enabled: true
  },
  
  tiktokLink: {
    id: "tiktok",
    platform: "tiktok",
    title: "TIKTOK",
    subtitle: "Conteúdo diário, bastidores, ofertas e cupons exclusivos.",
    url: "https://www.tiktok.com/@rosleonoficial",
    buttonText: "Ir para o TikTok",
    enabled: true
  },
  
  creator: {
    name: "Leonardo Mey",
    title: "Criador de conteúdo, especialista em marketing e vendas.",
    bioHeadline: "QUEM SOU EU",
    bioParagraph1: "Sou Leonardo Mey, criador de conteúdo, formado em Processos Gerenciais, copywriter e especialista em vendas e mercado digital, com mais de 10 anos de experiência.",
    bioParagraph2: "Ao longo desses anos, construí meu trabalho produzindo conteúdos, analisando produtos, compartilhando experiências e ajudando meu público a encontrar boas opções e tomar decisões de compra com mais segurança.",
    bioParagraph3: "Sou cristão, marido da Janaína e pai da Alice e do Joaquim. Meu compromisso é com Deus, com a minha família e com cada pessoa que acompanha e confia no meu trabalho.",
    photoUrl: "https://i.postimg.cc/VLyPkxjv/Chat-GPT-Image-7-de-ago-de-2026-07-59-44.png",
    aboutPhotoUrl: "https://i.postimg.cc/VLyPkxjv/Chat-GPT-Image-7-de-ago-de-2026-07-59-44.png",
    pillars: [
      { title: "+10 Anos de Experiência", subtitle: "Copywriting, Marketing & Vendas", icon: "award" },
      { title: "Análises Criteriosas", subtitle: "Recomendações com responsabilidade", icon: "sparkles" },
      { title: "Fé, Família & Princípios", subtitle: "Compromisso com Deus e com você", icon: "heart" },
      { title: "Transparência Total", subtitle: "Respeito a quem confia no trabalho", icon: "shield" }
    ]
  },
  
  stats: {
    subscribers: "42.600",
    views: "8.298.312",
    videos: "649",
    levelBadge: "MERCADO LIVRE NÍVEL PRATA",
    subscribersFull: "42.600",
    viewsFull: "8.298.312",
    videosFull: "649",
    rawSubscribers: 42600,
    rawViews: 8298312
  },
  
  couponsFeed: [
    { id: "1", category: "MÓVEIS E DECOR", discount: "Até 40% OFF em móveis", timeAgo: "há 2 min", activeUsers: "12,3K", active: true },
    { id: "2", category: "ELETRÔNICOS", discount: "Cupons até 25% OFF", timeAgo: "há 5 min", activeUsers: "15,7K", active: true },
    { id: "3", category: "ELETRODOMÉSTICOS", discount: "Descontos de até 30%", timeAgo: "há 8 min", activeUsers: "11,2K", active: true },
    { id: "4", category: "MODA E ACESSÓRIOS", discount: "Até 30% OFF", timeAgo: "há 10 min", activeUsers: "8,9K", active: true }
  ],
  
  primaryGlowColor: "cyan"
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;

  let defaultRawSubs = 42600;
  let defaultRawViews = 8542190;
  let defaultRawVideos = 649;

  // Function to scrape YouTube public page as zero-config fallback
  async function scrapeYouTubeChannel() {
    try {
      const pageRes = await fetch("https://www.youtube.com/@rosleonoficial", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8"
        }
      });
      if (!pageRes.ok) return null;
      const html = await pageRes.text();

      let subText = "";
      let vidText = "";

      const matches = [...html.matchAll(/"content":"([^"]+)"/g)].map(m => m[1]);
      for (const text of matches) {
        if (!subText && (text.includes("inscrito") || text.includes("subscribers"))) {
          subText = text;
        }
        if (!vidText && (text.includes("vídeo") || text.includes("videos"))) {
          vidText = text;
        }
      }

      if (subText) {
        let num = defaultRawSubs;
        const clean = subText.replace(/inscritos|subscribers/gi, "").trim();
        if (clean.includes("mil") || clean.includes("K") || clean.includes("k")) {
          const valStr = clean.replace(/mil|k/gi, "").trim().replace(",", ".");
          const val = parseFloat(valStr);
          if (!isNaN(val)) num = Math.round(val * 1000);
        } else {
          const val = parseInt(clean.replace(/\D/g, ""), 10);
          if (!isNaN(val)) num = val;
        }

        let vidNum = defaultRawVideos;
        if (vidText) {
          const cleanVid = vidText.replace(/vídeos|videos/gi, "").replace(/\D/g, "");
          const parsedVid = parseInt(cleanVid, 10);
          if (!isNaN(parsedVid)) vidNum = parsedVid;
        }

        return {
          rawSubscribers: num,
          rawVideos: vidNum,
          subText,
          vidText
        };
      }
    } catch (e) {
      console.warn("Falha ao raspar canal do YouTube:", e);
    }
    return null;
  }

  // 1. Try official YouTube Data API if key exists
  if (apiKey) {
    try {
      const handle = "rosleonoficial";
      let channelData: any = null;

      let url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=%40${handle}&key=${apiKey}`;
      let apiRes = await fetch(url);
      if (apiRes.ok) {
        let json = await apiRes.json();
        if (json.items && json.items.length > 0) {
          channelData = json.items[0];
        }
      }

      if (!channelData) {
        url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handle}&key=${apiKey}`;
        apiRes = await fetch(url);
        if (apiRes.ok) {
          let json = await apiRes.json();
          if (json.items && json.items.length > 0) {
            channelData = json.items[0];
          }
        }
      }

      if (channelData && channelData.statistics) {
        const stats = channelData.statistics;
        const snippet = channelData.snippet || {};

        const rawSubscribers = parseInt(stats.subscriberCount || `${defaultRawSubs}`, 10) || defaultRawSubs;
        const rawViews = parseInt(stats.viewCount || `${defaultRawViews}`, 10) || defaultRawViews;
        const rawVideos = parseInt(stats.videoCount || `${defaultRawVideos}`, 10) || defaultRawVideos;

        const fullSubscribers = rawSubscribers.toLocaleString('pt-BR');
        const fullViews = rawViews.toLocaleString('pt-BR');
        const fullVideos = rawVideos.toLocaleString('pt-BR');

        return res.status(200).json({
          success: true,
          apiKeyConfigured: true,
          data: {
            subscribers: fullSubscribers,
            subscribersShort: fullSubscribers,
            subscribersExact: fullSubscribers,
            subscribersFull: fullSubscribers,
            views: fullViews,
            viewsCompact: fullViews,
            videos: fullVideos,
            rawSubscribers,
            rawViews,
            rawVideos,
            viewsFull: fullViews,
            videosFull: fullVideos,
            channelTitle: snippet.title || "ROSLEON",
            channelDescription: snippet.description || "",
            thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
            updatedAt: new Date().toISOString()
          }
        });
      }
    } catch (err: any) {
      console.warn("Erro ao buscar API do YouTube:", err.message);
    }
  }

  // 2. Try zero-config live scraping
  const scraped = await scrapeYouTubeChannel();
  if (scraped) {
    const rawSubscribers = scraped.rawSubscribers;
    const rawVideos = scraped.rawVideos;
    const fullSubscribers = rawSubscribers.toLocaleString('pt-BR');
    const fullViews = defaultRawViews.toLocaleString('pt-BR');
    const fullVideos = rawVideos.toLocaleString('pt-BR');

    return res.status(200).json({
      success: true,
      apiKeyConfigured: false,
      source: "live-scrape",
      data: {
        subscribers: fullSubscribers,
        subscribersShort: fullSubscribers,
        subscribersExact: fullSubscribers,
        subscribersFull: fullSubscribers,
        views: fullViews,
        viewsCompact: fullViews,
        videos: fullVideos,
        rawSubscribers,
        rawViews: defaultRawViews,
        rawVideos,
        viewsFull: fullViews,
        videosFull: fullVideos,
        channelTitle: "ROSLEON",
        updatedAt: new Date().toISOString()
      }
    });
  }

  // 3. Last fallback
  const fullSubscribers = defaultRawSubs.toLocaleString('pt-BR');
  const fullViews = defaultRawViews.toLocaleString('pt-BR');
  const fullVideos = defaultRawVideos.toLocaleString('pt-BR');

  return res.status(200).json({
    success: true,
    apiKeyConfigured: false,
    data: {
      subscribers: fullSubscribers,
      subscribersShort: fullSubscribers,
      subscribersExact: fullSubscribers,
      subscribersFull: fullSubscribers,
      views: fullViews,
      viewsCompact: fullViews,
      videos: fullVideos,
      rawSubscribers: defaultRawSubs,
      rawViews: defaultRawViews,
      rawVideos: defaultRawVideos,
      viewsFull: fullViews,
      videosFull: fullVideos,
      channelTitle: "ROSLEON",
      updatedAt: new Date().toISOString()
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const params = url.searchParams;

    // 1. 处理日期逻辑
    let idx = params.get('idx');
    const dateStr = params.get('date'); // 格式: YYYYMMDD

    if (dateStr) {
      const targetDate = new Date(
        dateStr.substring(0, 4),
        parseInt(dateStr.substring(4, 6)) - 1,
        dateStr.substring(6, 8)
      );
      const today = new Date();
      // 设置为凌晨以对齐计算
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      // 计算差值 (ms / 1000 / 60 / 60 / 24)
      const diffDays = Math.floor((today - targetDate) / 86400000);
      
      // Bing API 限制：idx 范围通常在 -1 到 15 之间
      if (diffDays >= -1 && diffDays <= 15) {
        idx = diffDays.toString();
      } else {
        return new Response(JSON.stringify({ error: "Date out of range (support -1 to 15 days from today)" }), { status: 400 });
      }
    } else {
      idx = idx || '0';
    }

    // 2. 处理分辨率逻辑
    // 常用：UHD, 1920x1080, 1366x768, 1080x1920 (手机), 800x600, 1024x768
    const resolution = params.get('res') || 'UHD'; 
    const n = params.get('n') || '1';
    const format = params.get('format') || 'json';

    const BING_URL = `https://www.bing.com/HPImageArchive.aspx?format=js&idx=${idx}&n=${n}&mkt=zh-CN`;

    try {
      const response = await fetch(BING_URL);
      const data = await response.json();

      const images = data.images.map(img => {
        // 动态构造不同分辨率的 URL
        const baseUrl = `https://www.bing.com${img.urlbase}`;
        return {
          url: `${baseUrl}_${resolution}.jpg`,
          title: img.title,
          description: img.copyright,
          date: img.startdate,
          original_api_url: `https://www.bing.com${img.url}`
        };
      });

      if (format === 'image') {
        return Response.redirect(images[0].url, 302);
      }

      return new Response(JSON.stringify({ status: "success", count: images.length, data: images }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  },
};
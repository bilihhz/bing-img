export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 解析参数：idx 表示天数（0是今天，1是昨天），n 表示获取数量
    const idx = url.searchParams.get('idx') || '0';
    const n = url.searchParams.get('n') || '1';
    const format = url.searchParams.get('format') || 'json'; // json 或 image

    const BING_URL = `https://www.bing.com/HPImageArchive.aspx?format=js&idx=${idx}&n=${n}&mkt=zh-CN`;

    try {
      const response = await fetch(BING_URL);
      const data = await response.json();

      // 构造基础图片信息
      const images = data.images.map(img => ({
        url: `https://www.bing.com${img.url}`,
        urlbase: `https://www.bing.com${img.urlbase}`,
        title: img.title,
        copyright: img.copyright,
        copyrightlink: img.copyrightlink,
        startdate: img.startdate
      }));

      // 模式 1：直接返回图片 (适合做 API 引用)
      if (format === 'image') {
        return Response.redirect(images[0].url, 302);
      }

      // 模式 2：返回干净的 JSON
      return new Response(JSON.stringify({
        status: "success",
        data: images
      }), {
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*' 
        }
      });

    } catch (e) {
      return new Response(JSON.stringify({ status: "error", message: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};
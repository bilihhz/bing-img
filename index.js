export default {
  async fetch(request) {
    const url = new URL(request.url);
    const p = url.searchParams;

    // 1. 参数获取与缩减
    let i = p.get('i');
    const d = p.get('d');
    const n = p.get('n') || '1';
    const f = p.get('f') || 'js';
    let r = p.get('r') || 'UHD';

    // 2. 分辨率别名逻辑 (支持 4k, 1080p, 1920*1080, 1920x1080 等)
    const resMap = {
      '4k': 'UHD',
      'uhd': 'UHD',
      '1080p': '1920x1080'
    };
    
    // 先处理常用别名
    r = resMap[r.toLowerCase()] || r;
    // 处理 1920*1080 这种带星号的情况，统一转为 Bing 识别的 x
    r = r.replace('*', 'x');

    // 3. 日期转换逻辑 (保持不变)
    if (d) {
      const target = new Date(d.substring(0, 4), parseInt(d.substring(4, 6)) - 1, d.substring(6, 8));
      const today = new Date();
      today.setHours(0, 0, 0, 0); target.setHours(0, 0, 0, 0);
      i = Math.floor((today - target) / 86400000).toString();
    }
    i = i || '0';

    const BING_API = `https://www.bing.com/HPImageArchive.aspx?format=js&idx=${i}&n=${n}&mkt=zh-CN`;

    try {
      const resp = await fetch(BING_API);
      const { images } = await resp.json();

      const data = images.map(img => ({
        url: `https://www.bing.com${img.urlbase}_${r}.jpg`,
        t: img.title,
        desc: img.copyright,
        date: img.startdate
      }));

      // 4. 输出模式
      if (f === 'txt') {
        const text = data.map(item => `${item.t}\n${item.desc}`).join('\n\n');
        return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      if (f === 'img') {
        return Response.redirect(data[0].url, 302);
      }

      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};
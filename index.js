export default {
  async fetch(request) {
    const url = new URL(request.url);
    const p = url.searchParams;

    // 1. 参数缩减与解析
    let i = p.get('i');
    const d = p.get('d');
    const n = p.get('n') || '1';
    const f = p.get('f') || 'js';
    const r = p.get('r') || 'UHD';

    // 日期转换逻辑
    if (d) {
      const target = new Date(d.substring(0, 4), parseInt(d.substring(4, 6)) - 1, d.substring(6, 8));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      i = Math.floor((today - target) / 86400000).toString();
    }
    i = i || '0';

    const BING_API = `https://www.bing.com/HPImageArchive.aspx?format=js&idx=${i}&n=${n}&mkt=zh-CN`;

    try {
      const resp = await fetch(BING_API);
      const { images } = await resp.json();

      const data = images.map(img => ({
        url: `https://www.bing.com${img.urlbase}_${r === '1080p' ? '1920x1080' : r}.jpg`,
        t: img.title,
        desc: img.copyright,
        date: img.startdate
      }));

      // 2. 多模式输出逻辑
      // 模式 A: 纯文字介绍 (用于脚本读取或通知推送)
      if (f === 'txt') {
        const text = data.map(item => `${item.t}\n${item.desc}`).join('\n\n');
        return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      // 模式 B: 直接重定向到图片
      if (f === 'img') {
        return Response.redirect(data[0].url, 302);
      }

      // 模式 C: 极简 JSON
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};
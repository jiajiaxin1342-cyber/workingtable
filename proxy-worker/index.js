/**
 * Cloudflare Worker — 内容代理
 * 部署后将此文件内容粘贴到 Cloudflare Worker 编辑器即可
 *
 * 使用方式：GET https://your-worker.workers.dev/?url=https://mp.weixin.qq.com/...
 */

export default {
  async fetch(request) {
    // 只允许 GET 请求
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return new Response('Missing or invalid ?url= parameter', { status: 400 })
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          // 模拟正常浏览器请求，减少被拒概率
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml,application/atom+xml,application/xml,text/xml,text/html,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': new URL(targetUrl).origin,
        },
        // 跟随重定向
        redirect: 'follow',
      })

      const text = await response.text()

      // 透传目标服务器的 Content-Type，RSS/XML 必须正确传递否则解析失败
      const contentType = response.headers.get('content-type') || 'text/xml; charset=utf-8'

      return new Response(text, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          // 允许任意来源访问（这是关键）
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      })
    } catch (err) {
      return new Response(`Fetch failed: ${err.message}`, { status: 502 })
    }
  },
}

/**
 * RSS 订阅源解析工具
 *
 * 支持 RSS 2.0 和 Atom 格式
 * 大部分公开 RSS 源（包括 RSSHub）支持 CORS，少数不支持时会抛出错误
 */

/** 从 RSS/Atom XML 中提取文章列表（最多 limit 条） */
function parseXML(text, limit = 10) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')

  // 检测解析错误
  if (doc.querySelector('parsererror')) {
    throw new Error('RSS 格式解析失败，请确认是有效的 RSS/Atom 链接')
  }

  // ── RSS 2.0 ──
  const rssItems = doc.querySelectorAll('channel > item')
  if (rssItems.length > 0) {
    return Array.from(rssItems)
      .slice(0, limit)
      .map((item) => ({
        title: getText(item, 'title'),
        link: getText(item, 'link') || item.querySelector('guid')?.textContent || '',
        summary: stripHtml(getText(item, 'description') || getText(item, 'content\\:encoded') || '').slice(0, 200),
        pubDate: getText(item, 'pubDate') || getText(item, 'dc\\:date') || '',
        source: getText(doc, 'channel > title'),
      }))
  }

  // ── Atom ──
  const atomEntries = doc.querySelectorAll('feed > entry')
  if (atomEntries.length > 0) {
    const feedTitle = doc.querySelector('feed > title')?.textContent || ''
    return Array.from(atomEntries)
      .slice(0, limit)
      .map((entry) => ({
        title: getText(entry, 'title'),
        link:
          entry.querySelector('link[rel="alternate"]')?.getAttribute('href') ||
          entry.querySelector('link')?.getAttribute('href') ||
          '',
        summary: stripHtml(getText(entry, 'summary') || getText(entry, 'content') || '').slice(0, 200),
        pubDate: getText(entry, 'published') || getText(entry, 'updated') || '',
        source: feedTitle,
      }))
  }

  throw new Error('未找到文章条目，请确认链接是有效的 RSS/Atom 订阅地址')
}

function getText(node, selector) {
  return node.querySelector(selector)?.textContent?.trim() || ''
}

function stripHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
}

/**
 * 获取并解析单个 RSS 源
 * 优先直连；CORS 失败时自动尝试代理（如已配置）
 * @param {string} url - RSS feed URL
 * @param {number} limit - 最多返回条数
 * @returns {Promise<Array>} articles
 */
export async function fetchRssFeed(url, limit = 10) {
  const proxyUrl = getProxyUrl()

  // ── 先尝试直连 ────────────────────────────────────────────────────────────
  let directOk = false
  let text = ''
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/rss+xml,application/atom+xml,application/xml,text/xml,*/*' },
    })
    if (resp.ok) {
      text = await resp.text()
      directOk = true
    }
  } catch {
    // CORS 或网络错误，继续尝试代理
  }

  // ── 直连失败且有代理 → 走代理 ─────────────────────────────────────────────
  if (!directOk) {
    if (!proxyUrl) {
      throw new Error('该 RSS 源存在 CORS 限制，请在「设置」中配置代理地址后重试')
    }
    const target = `${proxyUrl.replace(/\/$/, '')}?url=${encodeURIComponent(url)}`
    let resp
    try {
      resp = await fetch(target, { signal: AbortSignal.timeout(15000) })
    } catch (err) {
      if (err.name === 'TimeoutError') throw new Error('请求超时，请检查代理地址是否正确')
      throw new Error('代理请求失败，请确认代理地址已正确部署')
    }
    if (!resp.ok) throw new Error(`代理获取失败：HTTP ${resp.status}`)
    text = await resp.text()
  }

  return parseXML(text, limit)
}

/**
 * 批量刷新多个 RSS 源
 * @param {Array} feeds - [{ id, url, name }]
 * @returns {Promise<Array>} - [{ feedId, feedName, articles, error? }]
 */
export async function refreshAllFeeds(feeds) {
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const articles = await fetchRssFeed(feed.url)
      return { feedId: feed.id, feedName: feed.name, articles }
    })
  )

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return { feedId: feeds[i].id, feedName: feeds[i].name, articles: [], error: r.reason.message }
  })
}

/**
 * 从 localStorage 读取用户配置的代理地址
 */
function getProxyUrl() {
  try {
    const stored = JSON.parse(localStorage.getItem('ai-workbench-storage') || '{}')
    return stored?.state?.proxyUrl || ''
  } catch {
    return ''
  }
}

/**
 * 提取 HTML 中的可读正文
 */
function extractText(html) {
  const div = document.createElement('div')
  div.innerHTML = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
}

/**
 * 尝试通过 fetch 获取 URL 的文章内容
 * 如果配置了代理地址，优先通过代理访问（可解决 CORS 问题）
 * @param {string} url
 * @returns {Promise<string>} 提取出的纯文本内容
 */
export async function tryFetchUrl(url) {
  const proxyUrl = getProxyUrl()

  // 有代理：通过 Cloudflare Worker 转发，无 CORS 限制
  if (proxyUrl) {
    const proxyTarget = `${proxyUrl}?url=${encodeURIComponent(url)}`
    let response
    try {
      response = await fetch(proxyTarget, { signal: AbortSignal.timeout(15000) })
    } catch {
      throw new Error('CORS_BLOCKED')
    }
    if (!response.ok) throw new Error('CORS_BLOCKED')

    const html = await response.text()
    const text = extractText(html)
    if (text.length < 100) throw new Error('AUTH_BLOCKED') // 代理可达但内容为空：登录墙/反爬
    return text.slice(0, 6000)
  }

  // 无代理：直接 fetch（大多数网站会 CORS 失败）
  let response
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'text/html,application/xhtml+xml' },
    })
  } catch {
    throw new Error('CORS_BLOCKED')
  }

  if (!response.ok) throw new Error('CORS_BLOCKED')

  const html = await response.text()
  const text = extractText(html)
  if (text.length < 100) throw new Error('CORS_BLOCKED')
  return text.slice(0, 6000)
}

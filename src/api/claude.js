// ═══════════════════════════════════════════
// Claude API 封装
// 直接在浏览器调用需要 anthropic-dangerous-direct-browser-access 头
// ═══════════════════════════════════════════

const CLAUDE_MODEL = 'claude-sonnet-4-5'
const API_URL = 'https://api.anthropic.com/v1/messages'

function getApiKey() {
  // 优先使用运行时在设置页面配置的 key（存于 localStorage via zustand）
  try {
    const stored = JSON.parse(localStorage.getItem('ai-workbench-storage') || '{}')
    const runtimeKey = stored?.state?.apiKey
    if (runtimeKey) return runtimeKey
  } catch {}
  // 降级到 .env 构建时注入的 key
  const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!envKey) throw new Error('未配置 API Key，请在「设置」页面填入或在 .env 文件中配置 VITE_ANTHROPIC_API_KEY')
  return envKey
}

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
}

// ── 核心调用函数 ──────────────────────────────────────────────────────────────

/**
 * 主调用函数，支持流式输出
 * @param {string} systemPrompt  - system prompt
 * @param {Array}  messages      - [{role:'user'|'assistant', content:string}]
 * @param {Function} onChunk     - (delta, accumulated) => void，每个chunk调用一次
 * @returns {Promise<string>}    - 完整回复文本
 */
export async function callClaude(systemPrompt, messages, onChunk) {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    stream: true,
    messages,
  }
  if (systemPrompt) body.system = systemPrompt

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { ...BASE_HEADERS, 'x-api-key': getApiKey() },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API 请求失败: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const jsonStr = line.slice(6).trim()
      if (jsonStr === '[DONE]') continue
      try {
        const event = JSON.parse(jsonStr)
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          fullText += event.delta.text
          onChunk?.(event.delta.text, fullText)
        }
      } catch {}
    }
  }

  return fullText
}

/**
 * 非流式调用，用于结构化数据解析场景
 */
export async function callClaudeOnce(systemPrompt, messages) {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages,
  }
  if (systemPrompt) body.system = systemPrompt

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { ...BASE_HEADERS, 'x-api-key': getApiKey() },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

// 向后兼容别名
export const sendMessage = (messages, systemPrompt) =>
  callClaudeOnce(systemPrompt, messages)
export const sendMessageStream = (messages, systemPrompt, onChunk) =>
  callClaude(systemPrompt, messages, onChunk)

// ── System Prompt 模板 ─────────────────────────────────────────────────────────

export const KNOWLEDGE_MENTOR_PROMPT = `你是我的AI学习导师，专注陪伴我学习AI产品设计领域。

当前学习目标：{goal}
已读文章数：{articleCount}
知识库收录：{kbCount} 篇
最近读的文章：{recentArticles}

你的风格：简练有洞察，回答直接不废话。每当用户积累了新内容，主动做阶段性锐评，锐评前加「⚡ 导师评」前缀。
当用户没有明确问题时，根据他的学习进度主动给出下一步建议。用中文回答。`

export const PRODUCT_MENTOR_PROMPT = `你是我的产品分析导师，帮我提升AI产品测评能力。

当前分析产品：{product}
我的测评维度：{dimensions}
已收集评测：{reviewCount} 条

你的风格：犀利不客气，直接指出分析的盲区，重点追问产品哲学和设计权衡。
不接受模糊表述，要求用户给出具体的判断依据。用中文回答。`

/**
 * 将模板中的占位符替换为实际上下文
 */
export function buildKnowledgePrompt({ goal, articles, kbItems }) {
  const goalText = goal?.title
    ? `${goal.title}${goal.targetDate ? `（截止 ${goal.targetDate}）` : ''}`
    : '暂未设定'

  const recentTitles = articles
    .slice(0, 5)
    .map((a) => `《${a.title}》`)
    .join('、') || '暂无'

  return KNOWLEDGE_MENTOR_PROMPT
    .replace('{goal}', goalText)
    .replace('{articleCount}', String(articles.length))
    .replace('{kbCount}', String(kbItems.length))
    .replace('{recentArticles}', recentTitles)
}

export function buildProductPrompt({ products, activeProductId, reviews }) {
  const product = products?.find((p) => p.id === activeProductId)

  if (!product) {
    return '你是我的产品分析导师，帮我提升AI产品测评能力。当前还没有选定分析对象，请先引导用户创建一个产品。用中文回答。'
  }

  const LEVEL_LABELS = ['', '明显短板', '有待提升', '中规中矩', '表现良好', '行业领先']
  const dimText = product.dimensions
    .filter((d) => d.level > 0)
    .map((d) => `${d.name}（${LEVEL_LABELS[d.level]}${d.desc ? `：${d.desc}` : ''}）`)
    .join('；') || '暂未评分'

  const reviewCount = reviews?.filter((r) => r.productId === activeProductId).length || 0

  return PRODUCT_MENTOR_PROMPT
    .replace('{product}', product.name)
    .replace('{dimensions}', dimText)
    .replace('{reviewCount}', String(reviewCount))
}

// ── 内容解析（粘贴 URL 或全文 → 结构化文章） ─────────────────────────────────

const isUrl = (text) => /^https?:\/\/\S+$/.test(text.trim())

const PARSE_SYSTEM = `你是一个内容解析助手。严格按照用户要求的 JSON 格式返回结果，不要有任何额外文字。`

const PARSE_PROMPT = (input) => `请分析以下内容，提取关键信息。

输入内容：
${input.slice(0, 3000)}${input.length > 3000 ? '\n（内容过长，已截取前3000字）' : ''}

请返回如下 JSON 格式（不要有多余文字）：
{
  "title": "文章标题（20字以内，如无法判断则用内容首句）",
  "source": "来源平台或作者（如 TechCrunch、知乎等，无法判断填「未知来源」）",
  "summary": "核心内容摘要，200字以内，提炼最有价值的观点",
  "tags": ["标签1", "标签2", "标签3"]
}`

export async function parseContent(text) {
  const trimmed = text.trim()

  try {
    const raw = await callClaudeOnce(PARSE_SYSTEM, [
      { role: 'user', content: PARSE_PROMPT(trimmed) },
    ])

    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('返回格式异常')

    const parsed = JSON.parse(match[0])

    // 补充 URL 字段
    if (isUrl(trimmed)) parsed.url = trimmed
    else { parsed.url = ''; parsed.content = trimmed }

    return {
      title: parsed.title || '（无标题）',
      source: parsed.source || '未知来源',
      url: parsed.url || '',
      content: parsed.content || '',
      summary: parsed.summary || trimmed.slice(0, 200),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    }
  } catch (err) {
    // 降级：返回基础信息
    const preview = trimmed.replace(/\s+/g, ' ').slice(0, 40)
    return {
      title: preview + (trimmed.length > 40 ? '...' : ''),
      source: isUrl(trimmed) ? new URL(trimmed).hostname.replace('www.', '') : '手动输入',
      url: isUrl(trimmed) ? trimmed : '',
      content: isUrl(trimmed) ? '' : trimmed,
      summary: trimmed.slice(0, 200),
      tags: ['待分类'],
    }
  }
}

import { callClaudeOnce, callClaude } from './claude'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// ── 工具函数 ──────────────────────────────────────────────────────────────────

/** 取频率最高的前 N 个标签 */
function topTags(tags, n = 3) {
  const freq = {}
  for (const t of tags) freq[t] = (freq[t] || 0) + 1
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag]) => tag)
}

/** 距今 7 天内 */
function isThisWeek(isoStr) {
  return Date.now() - new Date(isoStr).getTime() < WEEK_MS
}

// ── 周报数据收集 ───────────────────────────────────────────────────────────────

/**
 * 从 store 数据中计算本周学习摘要
 */
export function collectWeeklyData({ articles, kbItems, chatHistory }) {
  const weekArticles = articles.filter((a) => isThisWeek(a.savedAt))
  const weekKbItems = kbItems.filter((k) => isThisWeek(k.savedAt))

  const allWeekTags = weekKbItems.flatMap((k) => k.tags)
  const tags = topTags(allWeekTags, 3)

  // 对话次数：统计知识场景中用户发送的消息数（不含 notice）
  const knowledgeMessages = chatHistory?.knowledge || []
  const chatCount = knowledgeMessages.filter((m) => m.role === 'user').length

  return {
    articleCount: weekArticles.length,
    kbCount: weekKbItems.length,
    tags: tags.length ? tags.join('、') : '暂无',
    chatCount,
    totalArticles: articles.length,
    totalKbItems: kbItems.length,
  }
}

// ── 周报告生成 ─────────────────────────────────────────────────────────────────

/**
 * 调用 Claude 生成周报，流式返回
 * @param {Object} data - collectWeeklyData 的结果
 * @param {Function} onChunk - 流式回调
 * @returns {Promise<string>} 完整报告文本
 */
export async function generateWeeklyReport(data, onChunk) {
  const prompt = `我是一个正在学习AI产品设计的学习者，以下是我本周的学习数据：
新增文章：${data.articleCount} 篇，已入库：${data.kbCount} 篇，高频标签：${data.tags}，对话次数：${data.chatCount} 次
累计文章：${data.totalArticles} 篇，累计知识库：${data.totalKbItems} 篇

请用200字给我一份学习周报，包含：本周亮点、需要改进的地方、下周建议聚焦方向
风格要直接犀利，不要废话`

  const fullText = await callClaude(
    '你是一个直接犀利的学习教练，用中文给出精炼有力的周报。不要废话，直接给结论和行动项。',
    [{ role: 'user', content: prompt }],
    onChunk
  )

  return fullText
}

// ── 阶段性锐评 ────────────────────────────────────────────────────────────────

/**
 * 判断是否需要触发自动锐评（超过 7 天未锐评）
 */
export function shouldTriggerCritique(lastCritiqueAt) {
  if (!lastCritiqueAt) return true
  return Date.now() - new Date(lastCritiqueAt).getTime() > WEEK_MS
}

/**
 * 构建锐评摘要文本（注入学习记录）
 */
function buildCritiqueSummary({ goal, articles, kbItems }) {
  const recent = kbItems.slice(0, 6).map((k) => {
    const a = articles.find((x) => x.id === k.articleId)
    return a ? `《${a.title}》[${k.tags.join(',')}]` : null
  }).filter(Boolean).join('、')

  const lines = [
    goal?.title ? `学习目标：${goal.title}` : '无明确学习目标',
    `累计阅读：${articles.length} 篇，存入知识库：${kbItems.length} 篇`,
    recent ? `最近知识库内容：${recent}` : '知识库为空',
    goal?.startDate ? `学习开始：${goal.startDate}` : '',
  ].filter(Boolean)

  return lines.join('；')
}

/**
 * 生成阶段性锐评（非流式，作为对话开头附加）
 */
export async function generatePeriodCritique({ goal, articles, kbItems }) {
  const summary = buildCritiqueSummary({ goal, articles, kbItems })

  const prompt = `根据以下学习记录，给出一段不超过150字的阶段性锐评，直接指出学习者的思维盲区和进步，不要客气。
学习记录：${summary}`

  return callClaudeOnce(
    '你是一个严格的学习教练，风格犀利，直接点出问题。用中文，不超过150字。',
    [{ role: 'user', content: prompt }]
  )
}

// ── Markdown 导出 ──────────────────────────────────────────────────────────────

/**
 * 生成知识库的 Markdown 字符串
 */
export function buildKBMarkdown(kbItems, articles) {
  const now = new Date().toLocaleDateString('zh-CN')
  const lines = [`# 我的知识库`, ``, `> 导出时间：${now}　共 ${kbItems.length} 篇`, ``]

  for (const item of kbItems) {
    const article = articles.find((a) => a.id === item.articleId)
    if (!article) continue

    lines.push(`## ${article.title}`)
    lines.push(``)

    if (article.source) lines.push(`**来源：** ${article.source}`)
    if (article.url) lines.push(`**链接：** ${article.url}`)
    lines.push(`**收录时间：** ${new Date(item.savedAt).toLocaleDateString('zh-CN')}`)
    lines.push(``)

    if (article.summary) {
      lines.push(`**摘要：**`)
      lines.push(``)
      lines.push(article.summary)
      lines.push(``)
    }

    if (item.tags?.length) {
      lines.push(`**标签：** ${item.tags.map((t) => `\`${t}\``).join(' ')}`)
    }

    if (item.note) {
      lines.push(``)
      lines.push(`**我的笔记：**`)
      lines.push(``)
      lines.push(`> ${item.note}`)
    }

    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  return lines.join('\n')
}

/**
 * 触发浏览器下载 Markdown 文件
 */
export function downloadMarkdown(content, filename = '知识库.md') {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

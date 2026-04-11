import { useState } from 'react'
import useAppStore from '../../store/appStore'
import TagSelectorModal from './TagSelectorModal'

// ReaderModal 已移除 —— 阅读全文现在是 KnowledgeScene 内的子页面

const SOURCE_COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']
function sourceColor(source) {
  let h = 0
  for (const c of source) h = (h * 31 + c.charCodeAt(0)) % SOURCE_COLORS.length
  return SOURCE_COLORS[Math.abs(h)]
}

function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// ── 主组件 ───────────────────────────────────────────────────────────────────

export default function ArticleCard({ article }) {
  const { deleteArticle, triggerMentorMessage, goal, openArticleReader, openWebView } = useAppStore()
  const [showSaveModal, setShowSaveModal] = useState(false)

  const hasContent = !!article.content
  const hasUrl = !!article.url
  const isLinkOnly = !!article.linkOnly

  const handleMentorReview = () => {
    const goalInfo = goal?.title
      ? `我的学习目标是「${goal.title}」`
      : '我目前还没有明确设定学习目标'

    const msg = `${goalInfo}。\n\n我刚阅读了这篇文章：《${article.title}》\n来源：${article.source}\n\n文章摘要：\n${article.summary}\n\n请作为我的学习教练，帮我分析：\n1. 这篇内容对我的学习目标价值几何？\n2. 基于这篇内容，我接下来应该重点关注什么方向？\n3. 有没有推荐的相关学习资料？`

    triggerMentorMessage(msg)
  }

  return (
    <>
      <div className="article-card">
        <div className="article-card-meta">
          <span className="source-badge" style={{ background: sourceColor(article.source) }}>
            {article.source}
          </span>
          <span className="article-time">{formatTime(article.savedAt)}</span>
          {article.isInKB && <span className="article-in-kb">✓ 已存入知识库</span>}
          <button
            onClick={() => deleteArticle(article.id)}
            style={{
              marginLeft: article.isInKB ? '4px' : 'auto',
              padding: '2px 6px',
              background: 'transparent',
              border: 'none',
              color: '#4a5568',
              cursor: 'pointer',
              fontSize: 14,
            }}
            title="从信息流移除"
          >
            ×
          </button>
        </div>

        <p className="article-title">{article.title}</p>
        {isLinkOnly
          ? <p className="article-url-preview">{article.url}</p>
          : <p className="article-summary">{article.summary}</p>
        }

        {article.tags?.length > 0 && (
          <div className="article-tags">
            {article.tags.map((tag) => (
              <span key={tag} className="article-tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="article-actions">
          {/* 阅读按钮组 */}
          <div className="article-read-btns">
            {hasContent && (
              <button className="btn-read-full" onClick={() => openArticleReader(article.id)}>
                阅读全文
              </button>
            )}
            {hasUrl && (
              <button className="btn-webview" onClick={() => openWebView(article.url)}>
                在工作台查看
              </button>
            )}
            {hasUrl && (
              <a
                className="btn-open-url"
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                ↗ 原文
              </a>
            )}
          </div>

          <button
            className="btn-save-kb"
            onClick={() => setShowSaveModal(true)}
            disabled={article.isInKB}
          >
            {article.isInKB ? '✓ 已存入' : '存入知识库'}
          </button>
          <button className="btn-mentor" onClick={handleMentorReview}>
            🎓 导师解读
          </button>
        </div>
      </div>

      {showSaveModal && (
        <TagSelectorModal article={article} onClose={() => setShowSaveModal(false)} />
      )}
    </>
  )
}

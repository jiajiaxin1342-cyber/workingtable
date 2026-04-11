import { useState } from 'react'
import useAppStore from '../store/appStore'
import FeedTab from './knowledge/FeedTab'
import KBTab from './knowledge/KBTab'
import ProgressTab from './knowledge/ProgressTab'
import SocialTab from './product/SocialTab'
import AnalysisTab from './product/AnalysisTab'
import './knowledge/knowledge.css'
import './product/product.css'

// ── 文章阅读子页面 ─────────────────────────────────────────────────────────────

function ArticleReaderPage({ article, onBack }) {
  return (
    <div className="reader-page">
      <div className="reader-page-nav">
        <button className="reader-back-btn" onClick={onBack}>← 返回</button>
        <div className="reader-page-meta">
          <span className="reader-page-source">{article.source}</span>
        </div>
        {article.url && (
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="reader-page-open-btn">
            ↗ 打开原网页
          </a>
        )}
      </div>
      <div className="reader-page-body">
        <h2 className="reader-page-title">{article.title}</h2>
        {article.content ? (
          <div className="reader-page-content">
            {article.content.split('\n').map((line, i) => (
              <p key={i} className="reader-page-line">{line}</p>
            ))}
          </div>
        ) : (
          <div className="reader-page-summary-only">
            <p className="reader-page-summary-label">AI 生成摘要</p>
            <p className="reader-page-summary-text">{article.summary}</p>
            {article.url && (
              <p className="reader-page-no-content">
                未能获取全文，请<a href={article.url} target="_blank" rel="noopener noreferrer">打开原网页</a>阅读。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── WebView 子页面 ─────────────────────────────────────────────────────────────

const WECHAT_DOMAINS = ['mp.weixin.qq.com', 'weixin.qq.com']
function isWechat(url) {
  try { return WECHAT_DOMAINS.some((d) => new URL(url).hostname.includes(d)) } catch { return false }
}

function WebViewPage({ url, onBack }) {
  const displayUrl = (() => { try { const u = new URL(url); return u.hostname + u.pathname.slice(0, 30) } catch { return url } })()
  const wechat = isWechat(url)

  return (
    <div className="webview-page">
      <div className="webview-nav">
        <button className="reader-back-btn" onClick={onBack}>← 返回</button>
        <span className="webview-url-label" title={url}>{displayUrl}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="webview-newtab-btn">
          ↗ 在新标签打开
        </a>
      </div>

      {wechat ? (
        <div className="webview-wechat-tip">
          <p>⚠️ 微信公众号文章需要在微信 App 内打开，无法在工作台直接显示。</p>
          <p style={{ marginTop: 6 }}>
            请在微信中打开文章，全选复制正文后，回到「精选信息」粘贴全文保存。
          </p>
        </div>
      ) : (
        <>
          <div className="webview-notice">
            ⚠️ 部分网站不允许嵌入显示，若出现错误请点击上方「↗ 在新标签打开」
          </div>
          <iframe
            className="webview-iframe"
            src={url}
            title="参考网页"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
          />
        </>
      )}
    </div>
  )
}

// ── 信号源（便签 + 可折叠原则）────────────────────────────────────────────────

function SignalSourceSection() {
  const [principleOpen, setPrincipleOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* 原则折叠区 */}
      <div className="signal-principle-bar">
        <button
          className="signal-principle-toggle"
          onClick={() => setPrincipleOpen((v) => !v)}
        >
          {principleOpen ? '▾' : '▸'} 原则
        </button>
      </div>
      {principleOpen && (
        <div className="signal-principle-panel">
          <FeedTab />
        </div>
      )}

      {/* 便签主体 */}
      <KBTab />
    </div>
  )
}

// ── 产品分析台（原则子tab + 分析台子tab）──────────────────────────────────────

function ProductAnalysisSection() {
  const [subTab, setSubTab] = useState('analysis')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="kb-sub-tabs">
        <button
          className={`kb-sub-tab ${subTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setSubTab('analysis')}
        >
          分析台
        </button>
        <button
          className={`kb-sub-tab ${subTab === 'principle' ? 'active' : ''}`}
          onClick={() => setSubTab('principle')}
        >
          原则
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {subTab === 'analysis'  && <AnalysisTab />}
        {subTab === 'principle' && <SocialTab />}
      </div>
    </div>
  )
}

// ── 主场景 ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'signals', label: '信号源' },
  { id: 'product', label: '产品分析台' },
  { id: 'progress', label: '假设验证' },
]

export default function KnowledgeScene() {
  const [activeTab, setActiveTab] = useState('signals')
  const { articles, readingArticleId, closeArticleReader, webViewUrl, closeWebView } = useAppStore()

  const readingArticle = readingArticleId ? articles.find((a) => a.id === readingArticleId) : null

  if (webViewUrl) {
    return (
      <div className="k-scene">
        <WebViewPage url={webViewUrl} onBack={closeWebView} />
      </div>
    )
  }

  if (readingArticle) {
    return (
      <div className="k-scene">
        <ArticleReaderPage article={readingArticle} onBack={closeArticleReader} />
      </div>
    )
  }

  return (
    <div className="k-scene">
      <div className="k-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`k-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'signals' && <SignalSourceSection />}
        {activeTab === 'product' && <ProductAnalysisSection />}
        {activeTab === 'progress' && <div style={{ flex: 1, overflow: 'auto' }}><ProgressTab /></div>}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import useAppStore from '../store/appStore'
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

// ── 信号源（便签 + 原则 tab 在右侧）─────────────────────────────────────────

function SignalSourceSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <KBTab />
    </div>
  )
}

// ── 产品分析台（赛道 tab 动态生成 + 原则在最右）─────────────────────────────

function ProductAnalysisSection() {
  const products = useAppStore((s) => s.products ?? [])

  // 从产品数据动态派生赛道 tab
  const tracks      = [...new Set(products.map((p) => p.track).filter(Boolean))]
  const hasUntagged = products.some((p) => !p.track)
  const trackTabs   = [...tracks, ...(hasUntagged ? ['__untagged__'] : [])]

  const [activeTab, setActiveTab] = useState(() => trackTabs[0] ?? '__all__')
  const [showForm,  setShowForm]  = useState(false)

  // 当赛道列表变化时，若当前 tab 已不存在则重置
  useEffect(() => {
    if (activeTab !== 'principle' && !trackTabs.includes(activeTab) && activeTab !== '__all__') {
      setActiveTab(trackTabs[0] ?? '__all__')
    }
  }, [trackTabs.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  const tabLabel = (t) => t === '__untagged__' ? '未分类' : t

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 单行 header：赛道 tabs · 新增 · 原则 */}
      <div className="kb-sub-tabs">
        {/* 无产品时显示「全部」占位 tab */}
        {trackTabs.length === 0 && (
          <button
            className={`kb-sub-tab ${activeTab === '__all__' ? 'active' : ''}`}
            onClick={() => setActiveTab('__all__')}
          >
            全部
          </button>
        )}

        {trackTabs.map((t) => (
          <button
            key={t}
            className={`kb-sub-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {tabLabel(t)}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {activeTab !== 'principle' && !showForm && (
          <button className="sticky-add-btn" onClick={() => setShowForm(true)}>
            + 新增分析
          </button>
        )}

        <button
          className={`kb-sub-tab ${activeTab === 'principle' ? 'active' : ''}`}
          onClick={() => setActiveTab('principle')}
        >
          原则
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab !== 'principle' && (
          <AnalysisTab
            filterTrack={trackTabs.length > 0 && activeTab !== '__all__' ? activeTab : null}
            defaultTrack={activeTab !== '__untagged__' && activeTab !== '__all__' ? activeTab : ''}
            showForm={showForm}
            setShowForm={setShowForm}
          />
        )}
        {activeTab === 'principle' && <SocialTab />}
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

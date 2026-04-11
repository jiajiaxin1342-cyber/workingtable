import { useState } from 'react'
import useAppStore from '../store/appStore'
import { fetchRssFeed } from '../api/rss'
import './settings.css'

// ── API Key 区块 ──────────────────────────────────────────────────────────────

function ApiKeySection() {
  const { apiKey, setApiKey } = useAppStore()
  const [draft, setDraft] = useState(apiKey)
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const activeKey = apiKey || envKey

  const handleSave = () => {
    setApiKey(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const masked = (key) => key ? key.slice(0, 10) + '...' + key.slice(-4) : ''

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Claude API Key</h2>
        <p className="settings-section-desc">
          在此设置的 Key 优先级高于 .env 文件，保存后立即生效
        </p>
      </div>

      {activeKey && !apiKey && (
        <div className="settings-info-bar">
          当前使用 .env 中的 Key：{masked(envKey)}
        </div>
      )}

      <div className="settings-row">
        <input
          className="settings-input"
          type={show ? 'text' : 'password'}
          placeholder="sk-ant-api03-..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
        <button className="settings-icon-btn" onClick={() => setShow(!show)} title={show ? '隐藏' : '显示'}>
          {show ? '🙈' : '👁'}
        </button>
        <button className="settings-save-btn" onClick={handleSave}>
          {saved ? '✓ 已保存' : '保存'}
        </button>
      </div>

      {apiKey && (
        <p style={{ fontSize: 11, color: '#48bb78', marginTop: 6 }}>
          ✓ 已使用自定义 Key：{masked(apiKey)}
          <button
            style={{ marginLeft: 8, fontSize: 11, color: '#fc8181', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => { setApiKey(''); setDraft('') }}
          >
            清除
          </button>
        </p>
      )}

      <div className="settings-hint">
        <p>💡 如何获取 API Key：访问 <span className="settings-link">console.anthropic.com</span> → API Keys → Create Key</p>
        <p style={{ marginTop: 4, color: '#4a5568' }}>⚠️ Key 保存在本地 localStorage，不会上传服务器。仍请妥善保管。</p>
      </div>
    </div>
  )
}

// ── 代理设置区块 ──────────────────────────────────────────────────────────────

function ProxySection() {
  const { proxyUrl, setProxyUrl } = useAppStore()
  const [draft, setDraft] = useState(proxyUrl)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setProxyUrl(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">CORS 代理（可选）</h2>
        <p className="settings-section-desc">
          配置后可直接粘贴微信公众号、知乎等网站的 URL 自动抓取内容，无需手动复制正文
        </p>
      </div>

      <div className="settings-row">
        <input
          className="settings-input"
          placeholder="https://your-worker.workers.dev"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
        <button className="settings-save-btn" onClick={handleSave}>
          {saved ? '✓ 已保存' : '保存'}
        </button>
        {proxyUrl && (
          <button
            className="settings-save-btn"
            style={{ background: 'transparent', color: '#fc8181', border: '1px solid #fc8181' }}
            onClick={() => { setProxyUrl(''); setDraft('') }}
          >
            清除
          </button>
        )}
      </div>

      {proxyUrl && (
        <p style={{ fontSize: 11, color: '#48bb78', marginTop: 6 }}>
          ✓ 代理已启用：{proxyUrl}
        </p>
      )}

      <div className="settings-hint">
        <p>💡 <strong style={{ color: '#a0aec0' }}>如何部署（约 15 分钟，免费）：</strong></p>
        <ol style={{ marginTop: 6, paddingLeft: 16, lineHeight: 2 }}>
          <li>注册 <span className="settings-link">cloudflare.com</span>（免费账号）</li>
          <li>进入 <strong>Workers &amp; Pages</strong> → 创建 Worker</li>
          <li>将项目中 <code style={{ background: '#0f1117', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>proxy-worker/index.js</code> 的内容粘贴进去</li>
          <li>点击「部署」，复制生成的 <code style={{ background: '#0f1117', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>*.workers.dev</code> 地址填到上方</li>
        </ol>
        <p style={{ marginTop: 6, color: '#4a5568' }}>
          免费额度：每天 10 万次请求，个人使用完全足够
        </p>
      </div>
    </div>
  )
}

// ── 学习目标区块 ──────────────────────────────────────────────────────────────

function GoalSection() {
  const { goal, setGoal } = useAppStore()
  const [form, setForm] = useState({
    title: goal.title || '',
    startDate: goal.startDate || '',
    targetDate: goal.targetDate || '',
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setGoal(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">学习目标</h2>
        <p className="settings-section-desc">AI 导师会基于这个目标评估你的学习进度</p>
      </div>

      <div className="settings-field">
        <label className="settings-label">目标描述</label>
        <input
          className="settings-input"
          placeholder="例如：掌握 AI Native 产品设计方法论"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <div className="settings-row" style={{ gap: 12, marginTop: 10 }}>
        <div className="settings-field" style={{ flex: 1 }}>
          <label className="settings-label">开始日期</label>
          <input
            className="settings-input"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div className="settings-field" style={{ flex: 1 }}>
          <label className="settings-label">目标截止</label>
          <input
            className="settings-input"
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
          />
        </div>
      </div>

      <button className="settings-save-btn" style={{ marginTop: 12 }} onClick={handleSave}>
        {saved ? '✓ 已保存' : '保存目标'}
      </button>
    </div>
  )
}

// ── RSS 订阅源区块 ─────────────────────────────────────────────────────────────

function RssSection() {
  const { rssFeeds, addRssFeed, updateRssFeed, removeRssFeed, addArticle } = useAppStore()
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [fetchingId, setFetchingId] = useState(null)
  const [feedStatus, setFeedStatus] = useState({}) // { [feedId]: { loading, count, error } }
  const [confirmDeleteFeedId, setConfirmDeleteFeedId] = useState(null)

  const handleAdd = () => {
    const url = newUrl.trim()
    if (!url || !url.startsWith('http')) return
    addRssFeed(url, newName)
    setNewUrl('')
    setNewName('')
  }

  const handleRefresh = async (feed) => {
    setFetchingId(feed.id)
    setFeedStatus((s) => ({ ...s, [feed.id]: { loading: true } }))
    try {
      const articles = await fetchRssFeed(feed.url, 10)
      // 批量加入信息流
      let added = 0
      for (const a of articles) {
        addArticle({
          title: a.title,
          source: feed.name || a.source,
          url: a.link,
          content: '',
          summary: a.summary,
          tags: [],
          feedSource: 'rss',
        })
        added++
      }
      updateRssFeed(feed.id, { lastFetched: new Date().toISOString() })
      setFeedStatus((s) => ({ ...s, [feed.id]: { loading: false, count: added } }))
    } catch (err) {
      setFeedStatus((s) => ({ ...s, [feed.id]: { loading: false, error: err.message } }))
    } finally {
      setFetchingId(null)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">RSS 订阅源</h2>
        <p className="settings-section-desc">
          点击「刷新」将最新文章导入信息流。推荐使用 RSSHub（rsshub.app）订阅微信公众号、知乎等平台
        </p>
      </div>

      {/* 添加新源 */}
      <div className="rss-add-form">
        <input
          className="settings-input"
          placeholder="RSS 地址（https://...）"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{ flex: 2 }}
        />
        <input
          className="settings-input"
          placeholder="备注名称（选填）"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1 }}
        />
        <button className="settings-save-btn" onClick={handleAdd}>
          添加
        </button>
      </div>

      {/* 订阅源列表 */}
      {rssFeeds.length === 0 ? (
        <div className="rss-empty">
          <p>还没有订阅源</p>
          <p style={{ marginTop: 4, fontSize: 12, color: '#4a5568' }}>
            推荐：rsshub.app 可生成各平台的 RSS 地址
          </p>
        </div>
      ) : (
        <div className="rss-list">
          {rssFeeds.map((feed) => {
            const status = feedStatus[feed.id]
            return (
              <div key={feed.id} className="rss-item">
                <div className="rss-item-info">
                  <p className="rss-item-name">{feed.name}</p>
                  <p className="rss-item-url">{feed.url}</p>
                  {feed.lastFetched && !status && (
                    <p className="rss-item-meta">上次刷新：{formatDate(feed.lastFetched)}</p>
                  )}
                  {status?.loading && (
                    <p className="rss-item-meta" style={{ color: '#63b3ed' }}>
                      <span className="add-spinner" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
                      正在获取...
                    </p>
                  )}
                  {status?.count !== undefined && !status.loading && (
                    <p className="rss-item-meta" style={{ color: '#48bb78' }}>
                      ✓ 已导入 {status.count} 篇文章
                    </p>
                  )}
                  {status?.error && !status.loading && (
                    <p className="rss-item-meta" style={{ color: '#fc8181' }}>
                      ❌ {status.error}
                    </p>
                  )}
                </div>
                <div className="rss-item-actions">
                  <button
                    className="rss-refresh-btn"
                    onClick={() => handleRefresh(feed)}
                    disabled={fetchingId !== null}
                  >
                    {status?.loading ? '...' : '刷新'}
                  </button>
                  {confirmDeleteFeedId === feed.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, color: '#fc8181' }}>确认？</span>
                      <button className="draft-confirm-yes" onClick={() => { removeRssFeed(feed.id); setConfirmDeleteFeedId(null) }}>删除</button>
                      <button className="draft-confirm-no" onClick={() => setConfirmDeleteFeedId(null)}>取消</button>
                    </div>
                  ) : (
                    <button
                      className="rss-delete-btn"
                      onClick={() => setConfirmDeleteFeedId(feed.id)}
                      disabled={fetchingId === feed.id}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="settings-hint" style={{ marginTop: 12 }}>
        <p>💡 RSSHub 示例：</p>
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#718096', marginTop: 4 }}>
          微信公众号：https://rsshub.app/wechat/mp/{'{'}公众号ID{'}'}<br />
          知乎专栏：https://rsshub.app/zhihu/column/{'{'}专栏ID{'}'}
        </p>
      </div>
    </div>
  )
}

// ── 数据备份区块 ──────────────────────────────────────────────────────────────

function BackupSection() {
  const downloadBackup = useAppStore((s) => s.downloadBackup)
  const [downloaded, setDownloaded] = useState(false)

  const backups = (() => {
    try {
      return JSON.parse(localStorage.getItem('ai-workbench-backups') || '[]')
    } catch { return [] }
  })()

  const handleDownload = () => {
    downloadBackup()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const formatTs = (iso) => new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">数据备份</h2>
        <p className="settings-section-desc">
          数据存储在浏览器本地（localStorage）。清除浏览器缓存或更换设备会导致数据丢失，建议定期手动导出备份。
        </p>
      </div>

      <div className="settings-row" style={{ gap: 10 }}>
        <button className="settings-save-btn" onClick={handleDownload}>
          {downloaded ? '✓ 已导出' : '⬇ 导出 JSON 备份'}
        </button>
      </div>

      {backups.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11, color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            自动备份记录（最近 {backups.length} 次启动）
          </p>
          {backups.map((b, i) => (
            <p key={i} style={{ fontSize: 11, color: '#718096', marginBottom: 3 }}>
              {i + 1}. {formatTs(b.timestamp)}
              <span style={{ color: '#4a5568', marginLeft: 8 }}>
                {(b.data.length / 1024).toFixed(1)} KB
              </span>
            </p>
          ))}
        </div>
      )}

      <div className="settings-hint" style={{ marginTop: 12 }}>
        <p>💡 每次打开工作台时，系统会自动保存一份快照（保留最近 5 次），用于应对代码更新导致的数据意外丢失。</p>
        <p style={{ marginTop: 4, color: '#4a5568' }}>恢复数据：将导出的 JSON 文件内容粘贴回 localStorage 中的 <code style={{ background: '#0f1117', padding: '1px 6px', borderRadius: 4 }}>ai-workbench-storage</code> 键。</p>
      </div>
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────────────────────────────

export default function Settings() {
  return (
    <div className="settings-page">
      <ApiKeySection />
      <ProxySection />
      <GoalSection />
      <RssSection />
      <BackupSection />
    </div>
  )
}

import { useState } from 'react'
import useAppStore from '../../store/appStore'

const PLATFORMS = ['小红书', '公众号', '即刻', 'B站', '其他']

function formatDateShort(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function toDateInputValue(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

// ── 单条发布记录 ──────────────────────────────────────────────────────────────

function LogCard({ log, defaultExpanded }) {
  const updatePublishLog = useAppStore((s) => s.updatePublishLog)
  const addTopic         = useAppStore((s) => s.addTopic)
  const [expanded,    setExpanded]    = useState(defaultExpanded)
  const [addedToPool, setAddedToPool] = useState(false)

  const update = (patch) => updatePublishLog(log.id, patch)

  const handleAddToPool = () => {
    if (!log.newTopicHint?.trim()) return
    addTopic({ trigger: '突发想法', title: log.newTopicHint, type: 'opinion', status: 'todo' })
    setAddedToPool(true)
  }

  return (
    <div className="log-card">
      <div className="log-card-header" onClick={() => setExpanded((v) => !v)}>
        <span className="log-card-title">{log.title || '未命名'}</span>
        {log.platform && <span className="log-platform-badge">{log.platform}</span>}
        <span className="log-card-date">{formatDateShort(log.publishedAt)}</span>
      </div>

      {expanded && (
        <div className="log-card-body">
          {/* 平台 */}
          <div className="log-field">
            <label className="log-field-label">平台</label>
            <div className="topic-chips">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  className={`topic-chip ${log.platform === p ? 'active' : ''}`}
                  onClick={() => update({ platform: p })}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 标题 */}
          <div className="log-field">
            <label className="log-field-label">标题</label>
            <input
              className="log-input"
              value={log.title || ''}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="文章标题"
            />
          </div>

          {/* 发布日期 */}
          <div className="log-field">
            <label className="log-field-label">发布日期</label>
            <input
              className="log-input"
              type="date"
              value={toDateInputValue(log.publishedAt)}
              onChange={(e) => {
                if (e.target.value) update({ publishedAt: new Date(e.target.value + 'T12:00:00').toISOString() })
              }}
            />
          </div>

          {/* 最有价值的读者反应 */}
          <div className="log-field">
            <label className="log-field-label">最有价值的读者反应</label>
            <textarea
              className="log-textarea"
              rows={3}
              placeholder="收到什么有意思的反馈或评论？"
              value={log.topReaction || ''}
              onChange={(e) => update({ topReaction: e.target.value })}
            />
          </div>

          {/* 这篇触发的新选题线索 */}
          <div className="log-field">
            <label className="log-field-label">这篇触发的新选题线索</label>
            <textarea
              className="log-textarea"
              rows={2}
              placeholder="写完之后冒出来的下一个想法？"
              value={log.newTopicHint || ''}
              onChange={(e) => { update({ newTopicHint: e.target.value }); setAddedToPool(false) }}
            />
            {(log.newTopicHint || '').trim() && (
              <button className="log-add-pool-btn" onClick={handleAddToPool} disabled={addedToPool}>
                {addedToPool ? '✓ 已加入选题池' : '+ 加入选题池'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function PublishLog() {
  const publishLogs = useAppStore((s) => s.publishLogs ?? [])

  return (
    <div>
      <div className="log-toolbar">
        <p className="log-toolbar-label">发布记录 · {publishLogs.length} 篇</p>
      </div>

      {publishLogs.length === 0 ? (
        <div className="k-empty" style={{ padding: '32px 0' }}>
          <div className="k-empty-icon" style={{ fontSize: 28 }}>📢</div>
          <p className="k-empty-text">
            还没有发布记录<br />
            在写作台完成内容后点击「标记为已发布」
          </p>
        </div>
      ) : (
        publishLogs.map((log, i) => (
          <LogCard key={log.id} log={log} defaultExpanded={i === 0} />
        ))
      )}
    </div>
  )
}

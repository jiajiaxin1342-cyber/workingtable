import { useState } from 'react'
import useAppStore from '../../store/appStore'

// ── 影响力原则面板 ─────────────────────────────────────────────────────────────

function PrinciplePanel() {
  const motto       = useAppStore((s) => s.mottos?.discovery) ?? { current: '', history: [] }
  const updateMotto = useAppStore((s) => s.updateMotto)

  const [editing,     setEditing]     = useState(false)
  const [draft,       setDraft]       = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const handleEdit = () => { setDraft(motto.current); setEditing(true) }
  const handleSave = () => {
    if (!draft.trim()) return
    updateMotto('discovery', draft.trim())
    setEditing(false)
  }

  return (
    <div className="infl-principle-panel">
      <div className="infl-principle-header">
        <span className="infl-principle-title">影响力飞轮 · 原则</span>
        {!editing && (
          <button className="motto-edit-btn" onClick={handleEdit}>编辑</button>
        )}
      </div>

      {editing ? (
        <div className="motto-edit-area">
          <textarea
            className="motto-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className="motto-edit-actions">
            <button className="motto-cancel-btn" onClick={() => setEditing(false)}>取消</button>
            <button className="motto-save-btn" onClick={handleSave} disabled={!draft.trim()}>保存</button>
          </div>
        </div>
      ) : (
        <div className="motto-display" style={{ fontSize: 13 }}>
          {motto.current
            ? motto.current.split('\n').map((line, i) =>
                line === '' ? <br key={i} /> : <p key={i}>{line}</p>
              )
            : <p style={{ color: '#4a5568' }}>还没有原则，点击「编辑」记录你的影响力判断观</p>
          }
        </div>
      )}

      {motto.history?.length > 0 && !editing && (
        <div className="motto-history">
          <button className="motto-history-toggle" onClick={() => setHistoryOpen((v) => !v)}>
            {historyOpen ? '▾' : '▸'} 历史记录 · {motto.history.length} 条
          </button>
          {historyOpen && (
            <div className="motto-history-list">
              {motto.history.map((h, i) => (
                <div key={i} className="motto-history-item">
                  <p className="motto-history-date">{new Date(h.savedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <div className="motto-history-text">
                    {h.text.split('\n').map((line, j) =>
                      line === '' ? <br key={j} /> : <p key={j}>{line}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TRIGGERS = [
  '产品分析有新判断',
  '假设验证有结果',
  '身边真实观察',
  '读到有强烈反应的内容',
  '突发想法',
]

const TYPES = [
  { value: 'opinion', label: '观点类' },
  { value: 'process', label: '过程类' },
  { value: 'tool',    label: '工具类' },
]

const STATUSES = [
  { value: 'todo',      label: '待写' },
  { value: 'writing',   label: '写作中' },
  { value: 'published', label: '已发布' },
]

const STATUS_ORDER = { todo: 0, writing: 1, published: 2 }

function formatDate(iso) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── 新增 / 编辑表单 ───────────────────────────────────────────────────────────

function TopicForm({ initial, onSave, onCancel }) {
  const [trigger, setTrigger] = useState(initial?.trigger || '')
  const [title,   setTitle]   = useState(initial?.title   || '')
  const [type,    setType]    = useState(initial?.type    || 'opinion')
  const [status,  setStatus]  = useState(initial?.status  || 'todo')

  return (
    <div className="topic-form">
      <div className="topic-form-row">
        <label className="topic-form-label">触发来源</label>
        <div className="topic-chips">
          {TRIGGERS.map((t) => (
            <button key={t} className={`topic-chip ${trigger === t ? 'active' : ''}`} onClick={() => setTrigger(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="topic-form-row">
        <label className="topic-form-label">
          一句话选题 <span style={{ color: '#fc8181' }}>*</span>
        </label>
        <textarea
          className="topic-textarea"
          rows={3}
          placeholder="这篇文章的核心判断是？"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus={!initial}
        />
      </div>

      <div className="topic-form-row">
        <label className="topic-form-label">内容层类型</label>
        <div className="topic-chips">
          {TYPES.map((t) => (
            <button key={t.value} className={`topic-chip ${type === t.value ? 'active' : ''}`} onClick={() => setType(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="topic-form-row">
        <label className="topic-form-label">状态</label>
        <div className="topic-chips">
          {STATUSES.map((s) => (
            <button key={s.value} className={`topic-chip ${status === s.value ? 'active' : ''}`} onClick={() => setStatus(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="topic-form-actions">
        <button className="motto-cancel-btn" onClick={onCancel}>取消</button>
        <button
          className="motto-save-btn"
          onClick={() => onSave({ trigger, title, type, status })}
          disabled={!title.trim()}
        >
          {initial ? '保存修改' : '新增选题'}
        </button>
      </div>
    </div>
  )
}

// ── 单条选题卡片 ──────────────────────────────────────────────────────────────

function TopicCard({ topic, onStartWriting }) {
  const updateTopic = useAppStore((s) => s.updateTopic)
  const deleteTopic = useAppStore((s) => s.deleteTopic)
  const [expanded,      setExpanded]      = useState(false)
  const [editing,       setEditing]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const typeLabel   = TYPES.find((t) => t.value === topic.type)?.label    || topic.type
  const statusLabel = STATUSES.find((s) => s.value === topic.status)?.label || topic.status

  if (editing) {
    return (
      <TopicForm
        initial={topic}
        onSave={(data) => { updateTopic(topic.id, data); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="topic-card">
      <div className="topic-card-header" onClick={() => setExpanded((v) => !v)}>
        <div className="topic-card-main">
          {topic.trigger && <p className="topic-trigger-label">{topic.trigger}</p>}
          <p className="topic-card-title">{topic.title}</p>
        </div>
        <div className="topic-card-meta">
          <span className="topic-badge topic-badge-type">{typeLabel}</span>
          <span className={`topic-badge topic-badge-${topic.status}`}>{statusLabel}</span>
        </div>
      </div>

      {expanded && (
        <div className="topic-card-expand">
          <p className="topic-card-date">创建于 {formatDate(topic.createdAt)}</p>
          <div className="topic-card-actions">
            <button className="motto-edit-btn" onClick={() => setEditing(true)}>编辑</button>
            <button className="motto-save-btn" style={{ fontSize: 12 }} onClick={() => onStartWriting(topic)}>
              开始写作 →
            </button>
            <div style={{ flex: 1 }} />
            {confirmDelete ? (
              <>
                <span style={{ fontSize: 11, color: '#fc8181', alignSelf: 'center' }}>确认删除？</span>
                <button className="draft-confirm-yes" onClick={() => deleteTopic(topic.id)}>删除</button>
                <button className="draft-confirm-no" onClick={() => setConfirmDelete(false)}>取消</button>
              </>
            ) : (
              <button className="contact-action-btn contact-del-btn" onClick={() => setConfirmDelete(true)}>×</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function TopicPool({ onStartWriting }) {
  const topics   = useAppStore((s) => s.topics ?? [])
  const addTopic = useAppStore((s) => s.addTopic)
  const [showForm,      setShowForm]      = useState(false)
  const [principleOpen, setPrincipleOpen] = useState(false)

  // 待写优先，已发布沉底
  const sorted = [...topics].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  return (
    <div>
      <div className="topic-toolbar">
        <p className="topic-toolbar-label">选题池 · {topics.length} 条</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`signal-principle-toggle ${principleOpen ? 'active' : ''}`}
            onClick={() => setPrincipleOpen((v) => !v)}
          >
            {principleOpen ? '▾' : '▸'} 原则
          </button>
          {!showForm && (
            <button className="sticky-add-btn" onClick={() => setShowForm(true)}>+ 新增选题</button>
          )}
        </div>
      </div>

      {principleOpen && <PrinciplePanel />}

      {showForm && (
        <TopicForm
          onSave={(data) => { addTopic(data); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {sorted.length === 0 && !showForm ? (
        <div className="k-empty" style={{ padding: '32px 0' }}>
          <div className="k-empty-icon" style={{ fontSize: 28 }}>✍️</div>
          <p className="k-empty-text">还没有选题<br />点击「+ 新增选题」记录想写的内容</p>
        </div>
      ) : (
        sorted.map((topic) => (
          <TopicCard key={topic.id} topic={topic} onStartWriting={onStartWriting} />
        ))
      )}
    </div>
  )
}

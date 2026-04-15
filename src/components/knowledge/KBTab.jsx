import { useState } from 'react'
import useAppStore from '../../store/appStore'
import FeedTab from './FeedTab'

const NOTE_TYPE_STYLES = {
  '趋势感知': { color: '#63b3ed', bg: 'rgba(99,179,237,0.08)',  border: 'rgba(99,179,237,0.22)' },
  '需求信号': { color: '#f6ad55', bg: 'rgba(246,173,85,0.08)',  border: 'rgba(246,173,85,0.22)' },
  '机会窗口': { color: '#68d391', bg: 'rgba(104,211,145,0.08)', border: 'rgba(104,211,145,0.22)' },
  '其它':     { color: '#a0aec0', bg: 'rgba(160,174,192,0.06)', border: 'rgba(160,174,192,0.18)' },
}
const DEFAULT_STYLE = NOTE_TYPE_STYLES['其它']

const ALL_NOTE_TYPES = ['趋势感知', '需求信号', '机会窗口', '其它']
const FILTER_TYPES   = ['全部', ...ALL_NOTE_TYPES]

function formatDate(iso) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── 新增表单 ────────────────────────────────────────────────────────────────

function AddNoteForm({ onCancel }) {
  const addObservationNote = useAppStore((s) => s.addObservationNote)
  const [noteType, setNoteType] = useState('趋势感知')
  const [title, setTitle]       = useState('')
  const [body, setBody]         = useState('')

  const handleSave = () => {
    if (!body.trim()) return
    addObservationNote({ noteType, title, body: body.trim() })
    onCancel()
  }

  return (
    <div className="kb-note-form">
      <div className="kb-note-form-row">
        <label className="kb-note-form-label">类型</label>
        <div className="sticky-filter-bar">
          {ALL_NOTE_TYPES.map((t) => (
            <button
              key={t}
              className={`sticky-filter-chip ${noteType === t ? 'active' : ''}`}
              onClick={() => setNoteType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="kb-note-form-row">
        <label className="kb-note-form-label">标题（选填）</label>
        <input
          className="kb-note-form-input"
          placeholder="简短标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="kb-note-form-row">
        <label className="kb-note-form-label">
          内容 <span style={{ color: '#fc8181' }}>*</span>
        </label>
        <textarea
          className="kb-note-form-textarea"
          rows={4}
          placeholder="记录这个信号……"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          autoFocus
        />
      </div>
      <div className="kb-note-form-actions">
        <button className="motto-cancel-btn" onClick={onCancel}>取消</button>
        <button className="motto-save-btn" onClick={handleSave} disabled={!body.trim()}>
          保存便签
        </button>
      </div>
    </div>
  )
}

// ── 便签卡片（支持编辑） ─────────────────────────────────────────────────────

function StickyNote({ note, isFirst, isLast, onMoveUp, onMoveDown }) {
  const deleteDraft          = useAppStore((s) => s.deleteDraft)
  const updateObservationNote = useAppStore((s) => s.updateObservationNote)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing,       setEditing]       = useState(false)
  const [editType,      setEditType]      = useState(note.noteType || '其它')
  const [editTitle,     setEditTitle]     = useState(note.title || '')
  const [editBody,      setEditBody]      = useState(note.body || '')

  const style = NOTE_TYPE_STYLES[note.noteType] || DEFAULT_STYLE

  if (editing) {
    return (
      <div className="sticky-note" style={{ borderColor: style.border, background: style.bg }}>
        <div className="kb-note-form-row" style={{ marginBottom: 8 }}>
          <div className="sticky-filter-bar">
            {ALL_NOTE_TYPES.map((t) => (
              <button
                key={t}
                className={`sticky-filter-chip ${editType === t ? 'active' : ''}`}
                onClick={() => setEditType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <input
          className="kb-note-form-input"
          placeholder="标题（选填）"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <textarea
          className="kb-note-form-textarea"
          rows={4}
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          autoFocus
          style={{ marginBottom: 8 }}
        />
        <div className="kb-note-form-actions">
          <button className="motto-cancel-btn" onClick={() => setEditing(false)}>取消</button>
          <button
            className="motto-save-btn"
            disabled={!editBody.trim()}
            onClick={() => {
              updateObservationNote(note.id, { noteType: editType, title: editTitle, body: editBody.trim() })
              setEditing(false)
            }}
          >
            保存
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky-note" style={{ borderColor: style.border, background: style.bg }}>
      <div className="sticky-note-header">
        <span className="sticky-note-type" style={{ color: style.color }}>
          {note.noteType || '其它'}
        </span>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* 排序按钮 */}
          <button
            className="sticky-move-btn"
            onClick={onMoveUp}
            disabled={isFirst}
            title="上移"
          >↑</button>
          <button
            className="sticky-move-btn"
            onClick={onMoveDown}
            disabled={isLast}
            title="下移"
          >↓</button>

          <div style={{ width: 4 }} />

          {/* 编辑 / 删除 */}
          <button className="sticky-note-del" onClick={() => setEditing(true)} title="编辑">✎</button>
          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: '#fc8181' }}>删除？</span>
              <button className="draft-confirm-yes" onClick={() => deleteDraft('observation', note.id)}>是</button>
              <button className="draft-confirm-no" onClick={() => setConfirmDelete(false)}>否</button>
            </div>
          ) : (
            <button className="sticky-note-del" onClick={() => setConfirmDelete(true)}>×</button>
          )}
        </div>
      </div>

      {note.title && note.title !== '无标题' && (
        <p className="sticky-note-title">{note.title}</p>
      )}

      <p className="sticky-note-body">{note.body}</p>

      <p className="sticky-note-date">{formatDate(note.publishedAt || note.updatedAt)}</p>
    </div>
  )
}

// ── 主组件 ──────────────────────────────────────────────────────────────────

export default function KBTab() {
  const drafts              = useAppStore((s) => s.drafts.observation || [])
  const swapObservationNotes = useAppStore((s) => s.swapObservationNotes)
  const [filter,        setFilter]        = useState('全部')
  const [showForm,      setShowForm]      = useState(false)
  const [principleOpen, setPrincipleOpen] = useState(false)

  const notes    = drafts.filter((d) => d.status === 'published')
  const filtered = filter === '全部' ? notes : notes.filter((n) => (n.noteType || '其它') === filter)
  const countOf  = (type) => notes.filter((n) => (n.noteType || '其它') === type).length

  return (
    <div>
      {/* 顶部操作栏（单行：过滤 · 新增 · 原则） */}
      <div className="sticky-toolbar">
        <div className="sticky-filter-bar">
          {FILTER_TYPES.map((t) => (
            <button
              key={t}
              className={`sticky-filter-chip ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t}
              {t !== '全部' && countOf(t) > 0 && (
                <span className="sticky-filter-count">{countOf(t)}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {!showForm && (
          <button className="sticky-add-btn" onClick={() => setShowForm(true)}>
            + 新增信号
          </button>
        )}
        <button
          className={`sticky-filter-chip ${principleOpen ? 'active' : ''}`}
          style={{ flexShrink: 0 }}
          onClick={() => setPrincipleOpen((v) => !v)}
        >
          原则
        </button>
      </div>

      {/* 原则面板 */}
      {principleOpen && (
        <div className="signal-principle-panel">
          <FeedTab />
        </div>
      )}

      {/* 新增表单 */}
      {showForm && <AddNoteForm onCancel={() => setShowForm(false)} />}

      {/* 便签列表 */}
      {filtered.length === 0 ? (
        <div className="k-empty" style={{ padding: '32px 0' }}>
          <div className="k-empty-icon" style={{ fontSize: 28 }}>📝</div>
          <p className="k-empty-text">
            {notes.length === 0
              ? '还没有便签\n点击「+ 新增信号」记录观察'
              : '该类型暂无便签'}
          </p>
        </div>
      ) : (
        <div className="sticky-grid">
          {filtered.map((note, idx) => (
            <StickyNote
              key={note.id}
              note={note}
              isFirst={idx === 0}
              isLast={idx === filtered.length - 1}
              onMoveUp={() => swapObservationNotes(note.id, filtered[idx - 1].id)}
              onMoveDown={() => swapObservationNotes(note.id, filtered[idx + 1].id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

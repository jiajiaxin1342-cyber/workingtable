import { useState, useRef, useEffect } from 'react'
import useAppStore from '../store/appStore'

function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── 单条速记 ──────────────────────────────────────────────────────────────────

function NoteItem({ note }) {
  const deleteQuickNote    = useAppStore((s) => s.deleteQuickNote)
  const toggleQuickNoteDone = useAppStore((s) => s.toggleQuickNoteDone)
  const addObservationNote  = useAppStore((s) => s.addObservationNote)

  const handlePromote = () => {
    addObservationNote({ noteType: '其它', title: '', body: note.text })
    deleteQuickNote(note.id)
  }

  return (
    <div className={`qn-item ${note.done ? 'done' : ''}`}>
      <button
        className="qn-check"
        onClick={() => toggleQuickNoteDone(note.id)}
        title={note.done ? '标记未完成' : '标记完成'}
      >
        {note.done ? '✓' : '○'}
      </button>

      <div className="qn-body">
        <p className="qn-text">{note.text}</p>
        <span className="qn-time">{formatTime(note.createdAt)}</span>
      </div>

      <div className="qn-actions">
        <button className="qn-promote" onClick={handlePromote} title="存入信号源">
          →
        </button>
        <button className="qn-del" onClick={() => deleteQuickNote(note.id)} title="删除">
          ×
        </button>
      </div>
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function QuickNotepad() {
  const toggleMentorPanel = useAppStore((s) => s.toggleMentorPanel)
  const quickNotes        = useAppStore((s) => s.quickNotes)
  const addQuickNote      = useAppStore((s) => s.addQuickNote)
  const clearQuickNotes   = useAppStore((s) => s.clearQuickNotes)

  const [input, setInput] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const textareaRef = useRef(null)

  // 自动撑高 textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  const handleAdd = () => {
    if (!input.trim()) return
    addQuickNote(input.trim())
    setInput('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleClear = () => {
    if (confirmClear) {
      clearQuickNotes()
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
    }
  }

  const pending = quickNotes.filter((n) => !n.done)
  const done    = quickNotes.filter((n) => n.done)

  return (
    <aside className="mentor-panel">
      {/* 顶部标题栏 */}
      <div className="mentor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="qn-panel-icon">✏️</span>
          <span className="mentor-title">速记小本</span>
          {pending.length > 0 && (
            <span className="qn-badge">{pending.length}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {quickNotes.length > 0 && (
            <button
              className="btn-clear"
              onClick={handleClear}
              style={confirmClear ? { color: 'var(--red)', borderColor: 'var(--red-border)' } : {}}
            >
              {confirmClear ? '确认清空' : '清空'}
            </button>
          )}
          <button className="btn-collapse-mentor" onClick={toggleMentorPanel} title="收起">›</button>
        </div>
      </div>

      {/* 笔记列表 */}
      <div className="qn-list">
        {quickNotes.length === 0 ? (
          <div className="qn-empty">
            <span className="qn-empty-icon">📋</span>
            <p>随手记，不用分类</p>
            <p className="qn-empty-hint">todo、想法、灵感都行<br />Enter 快速添加</p>
          </div>
        ) : (
          <>
            {pending.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
            {done.length > 0 && pending.length > 0 && (
              <div className="qn-done-divider">已完成 {done.length} 条</div>
            )}
            {done.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </>
        )}
      </div>

      {/* 输入区 */}
      <div className="qn-input-area">
        <textarea
          ref={textareaRef}
          className="qn-input"
          placeholder="写下想法或待办…  Enter 记录"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="qn-submit"
          onClick={handleAdd}
          disabled={!input.trim()}
        >
          记下
        </button>
      </div>
    </aside>
  )
}

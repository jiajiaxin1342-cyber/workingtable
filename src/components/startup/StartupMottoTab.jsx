import { useState } from 'react'
import useAppStore from '../../store/appStore'

function formatDate(iso) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function StartupMottoTab() {
  const motto = useAppStore((s) => s.mottos?.startup) ?? { current: '', history: [] }
  const updateMotto = useAppStore((s) => s.updateMotto)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const handleEdit = () => {
    setDraft(motto.current)
    setEditing(true)
  }

  const handleSave = () => {
    if (!draft.trim()) return
    updateMotto('startup', draft.trim())
    setEditing(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🔄</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#a0aec0', letterSpacing: '0.04em' }}>
          创业飞轮
        </span>
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
            <button className="motto-save-btn" onClick={handleSave} disabled={!draft.trim()}>
              保存
            </button>
          </div>
        </div>
      ) : (
        <div className="motto-display">
          {motto.current.split('\n').map((line, i) =>
            line === '' ? <br key={i} /> : <p key={i}>{line}</p>
          )}
        </div>
      )}

      {motto.history.length > 0 && !editing && (
        <div className="motto-history">
          <button className="motto-history-toggle" onClick={() => setHistoryOpen((v) => !v)}>
            {historyOpen ? '▾' : '▸'} 历史记录 · {motto.history.length} 条
          </button>
          {historyOpen && (
            <div className="motto-history-list">
              {motto.history.map((h, i) => (
                <div key={i} className="motto-history-item">
                  <p className="motto-history-date">{formatDate(h.savedAt)}</p>
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

import { useState } from 'react'
import useAppStore from '../../store/appStore'

const STATUS_CONFIG = {
  holding:  { label: '持有中', color: '#63b3ed', bg: 'rgba(99,179,237,0.12)' },
  updated:  { label: '已修正', color: '#68d391', bg: 'rgba(104,211,145,0.12)' },
  disproven:{ label: '已证伪', color: '#fc8181', bg: 'rgba(252,129,129,0.12)' },
}

function BeliefCard({ belief, onChallenge }) {
  const { updateBelief, deleteBelief } = useAppStore()
  const [editingNote, setEditingNote] = useState(false)
  const [noteVal, setNoteVal] = useState(belief.revisionNote || '')
  const cfg = STATUS_CONFIG[belief.status]

  const saveNote = () => {
    updateBelief(belief.id, { revisionNote: noteVal })
    setEditingNote(false)
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <div className="belief-card" style={{ borderLeft: `3px solid ${cfg.color}` }}>
      <div className="belief-header">
        <p className="belief-statement">「{belief.statement}」</p>
        <div className="belief-actions">
          <button
            className="belief-challenge-btn"
            onClick={() => onChallenge(belief)}
            title="让 AI 挑战这个判断"
          >
            挑战
          </button>
          <button className="belief-del-btn" onClick={() => deleteBelief(belief.id)} title="删除">×</button>
        </div>
      </div>

      <div className="belief-meta">
        <span className="belief-date">记录于 {formatDate(belief.createdAt)}</span>
        {belief.revisedAt && (
          <span className="belief-date">· 修正于 {formatDate(belief.revisedAt)}</span>
        )}
      </div>

      {/* 状态切换 */}
      <div className="belief-status-row">
        {Object.entries(STATUS_CONFIG).map(([key, c]) => (
          <button
            key={key}
            className="belief-status-chip"
            style={{
              color: c.color,
              background: belief.status === key ? c.bg : 'transparent',
              borderColor: belief.status === key ? c.color : '#2d3748',
              fontWeight: belief.status === key ? 600 : 400,
            }}
            onClick={() => updateBelief(belief.id, { status: key })}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 修正原因 */}
      {belief.status !== 'holding' && (
        <div className="belief-note-area">
          {editingNote ? (
            <>
              <textarea
                className="belief-note-input"
                value={noteVal}
                onChange={(e) => setNoteVal(e.target.value)}
                placeholder="是什么让你改变了这个判断？"
                rows={2}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button className="belief-save-btn" onClick={saveNote}>保存</button>
                <button className="belief-cancel-btn" onClick={() => { setEditingNote(false); setNoteVal(belief.revisionNote || '') }}>取消</button>
              </div>
            </>
          ) : (
            <p className="belief-note-text" onClick={() => setEditingNote(true)}>
              {belief.revisionNote || '点击记录修正原因...'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function BeliefTab() {
  const { beliefs, addBelief, triggerMentorMessage } = useAppStore()
  const [newStatement, setNewStatement] = useState('')
  const [inputError, setInputError] = useState(false)

  const handleAdd = () => {
    const text = newStatement.trim()
    if (!text) { setInputError(true); return }
    addBelief(text)
    setNewStatement('')
    setInputError(false)
  }

  const handleChallenge = (belief) => {
    const msg = `我有一个判断想让你来挑战：「${belief.statement}」。请站在反对方，给出最有力的反驳或者质疑——不超过150字，说话直接。`
    triggerMentorMessage(msg)
  }

  const holding = beliefs.filter((b) => b.status === 'holding')
  const revised = beliefs.filter((b) => b.status !== 'holding')

  return (
    <div className="belief-tab">
      {/* 说明 */}
      <div className="belief-intro">
        <p className="belief-intro-title">我相信...</p>
        <p className="belief-intro-desc">
          记录你对 AI 产品、市场或技术的判断。<br />
          定期回来检验——哪些依然成立，哪些被事实修正了。<br />
          <strong>判断力的成长，就是观点不断被更新的过程。</strong>
        </p>
      </div>

      {/* 新增输入 */}
      <div className="belief-add-row">
        <input
          className="belief-add-input"
          placeholder="我相信：AI Agent 在 2025 年底前不会真正替代专业服务工作者..."
          value={newStatement}
          onChange={(e) => { setNewStatement(e.target.value); setInputError(false) }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{ borderColor: inputError ? '#fc8181' : undefined }}
        />
        <button className="belief-add-btn" onClick={handleAdd}>记录</button>
      </div>
      {inputError && (
        <p style={{ fontSize: 12, color: '#fc8181', marginTop: 4 }}>请填写你的判断</p>
      )}

      {beliefs.length === 0 && (
        <div className="belief-empty">
          <p>还没有记录任何判断</p>
          <p style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>一个明确的立场，比收藏100篇文章更有价值</p>
        </div>
      )}

      {/* 持有中 */}
      {holding.length > 0 && (
        <div>
          <p className="belief-group-label">持有中 · {holding.length}</p>
          {holding.map((b) => (
            <BeliefCard key={b.id} belief={b} onChallenge={handleChallenge} />
          ))}
        </div>
      )}

      {/* 已修正/证伪 */}
      {revised.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p className="belief-group-label">已修正 · {revised.length}</p>
          {revised.map((b) => (
            <BeliefCard key={b.id} belief={b} onChallenge={handleChallenge} />
          ))}
        </div>
      )}
    </div>
  )
}

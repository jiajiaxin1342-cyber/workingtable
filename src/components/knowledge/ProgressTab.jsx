import { useState } from 'react'
import useAppStore from '../../store/appStore'

const HYPOTHESIS_PLACEHOLDER = `我相信：[目标用户] 有 [具体痛点]
如果我做了 [解决方案]
他们会 [具体可观测的行为]
我会在 [时间] 内通过 [方式] 验证这件事。`

const MVP_PLACEHOLDER = `❌ 错误MVP思路：
做一个完整的求职助手，有登录、简历管理、JD收藏、匹配历史...
→ 3个月后上线，发现没人用，但不知道哪个假设错了

✅ 正确MVP思路：
一个网页，两个输入框（简历文本 + JD文本），一个按钮
输出：匹配度分数 + 3个优势 + 2个短板 + 建议投/不投
→ 3天做完，第4天开始验证。`

const NOTE_PLACEHOLDER = `1. 假设验证结果：
   我假设用户会[回访]，实际观察到的是[____]
   假设：✅成立 / ❌不成立 / ⚠️部分成立

2. 哪个环节出了问题：
   □ 痛点判断错了（用户其实不觉得这是问题）
   □ 解法方向错了（痛点真实，但这个解法不对）
   □ 用户群选错了（这类人有痛点，但不是这类人）
   □ 执行问题（产品体验太差导致无法判断）

3. 下一步假设是什么：
   基于这次结果，我更新后的假设是[____]
   下一轮验证我要改变的变量是[____]`

function formatDate(iso) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── 新增假设表单 ──────────────────────────────────────────────────────────────

function NewHypothesisForm({ onClose }) {
  const addHypothesis = useAppStore((s) => s.addHypothesis)
  const [title, setTitle] = useState('')
  const [mvp, setMvp] = useState('')

  const canSave = title.trim() && mvp.trim()

  const handleSave = () => {
    if (!canSave) return
    addHypothesis({ title, mvp })
    onClose()
  }

  return (
    <div className="hyp-form">
      <div className="hyp-form-section">
        <label className="hyp-form-label">① 可验证假设 <span className="pov-required">必填</span></label>
        <textarea
          className="hyp-textarea"
          placeholder={HYPOTHESIS_PLACEHOLDER}
          rows={5}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>
      <div className="hyp-form-section">
        <label className="hyp-form-label">② MVP 设计 <span className="pov-required">必填</span></label>
        <textarea
          className="hyp-textarea"
          placeholder={MVP_PLACEHOLDER}
          rows={7}
          value={mvp}
          onChange={(e) => setMvp(e.target.value)}
        />
      </div>
      <div className="hyp-form-actions">
        <button className="motto-cancel-btn" onClick={onClose}>取消</button>
        <button className="motto-save-btn" onClick={handleSave} disabled={!canSave}>
          完成新建
        </button>
      </div>
    </div>
  )
}

// ── 单条备注 ───────────────────────────────────────────────────────────────────

function NoteItem({ hypothesisId, note }) {
  const deleteHypothesisNote = useAppStore((s) => s.deleteHypothesisNote)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="hyp-note">
      <div className="hyp-note-header">
        <span className="hyp-note-date">{formatDate(note.createdAt)}</span>
        {confirmDelete ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#fc8181' }}>删除？</span>
            <button className="draft-confirm-yes" onClick={() => deleteHypothesisNote(hypothesisId, note.id)}>是</button>
            <button className="draft-confirm-no" onClick={() => setConfirmDelete(false)}>否</button>
          </div>
        ) : (
          <button className="contact-action-btn contact-del-btn" onClick={() => setConfirmDelete(true)}>×</button>
        )}
      </div>
      <p className="hyp-note-body">{note.content}</p>
    </div>
  )
}

// ── 假设卡片 ───────────────────────────────────────────────────────────────────

function HypothesisCard({ hypothesis }) {
  const deleteHypothesis = useAppStore((s) => s.deleteHypothesis)
  const addHypothesisNote = useAppStore((s) => s.addHypothesisNote)
  const [addingNote, setAddingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleAddNote = () => {
    if (!noteDraft.trim()) return
    addHypothesisNote(hypothesis.id, noteDraft)
    setNoteDraft('')
    setAddingNote(false)
  }

  return (
    <div className="hyp-card">
      {/* 卡片头部 */}
      <div className="hyp-card-header">
        <button className="hyp-collapse-btn" onClick={() => setCollapsed((v) => !v)}>
          {collapsed ? '▸' : '▾'}
        </button>
        <span className="hyp-card-date">{formatDate(hypothesis.createdAt)}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {confirmDelete ? (
            <>
              <span style={{ fontSize: 11, color: '#fc8181' }}>确认删除？</span>
              <button className="draft-confirm-yes" onClick={() => deleteHypothesis(hypothesis.id)}>删除</button>
              <button className="draft-confirm-no" onClick={() => setConfirmDelete(false)}>取消</button>
            </>
          ) : (
            <button className="contact-action-btn contact-del-btn" onClick={() => setConfirmDelete(true)}>×</button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* 假设内容 */}
          <div className="hyp-section">
            <p className="hyp-section-label">① 可验证假设</p>
            <p className="hyp-content">{hypothesis.title}</p>
          </div>

          {/* MVP */}
          <div className="hyp-section">
            <p className="hyp-section-label">② MVP 设计</p>
            <p className="hyp-content">{hypothesis.mvp}</p>
          </div>

          {/* 备注区 */}
          <div className="hyp-notes-section">
            <div className="hyp-notes-header">
              <span className="hyp-notes-title">进度备注 · {hypothesis.notes.length} 条</span>
              {!addingNote && (
                <button className="motto-edit-btn" onClick={() => setAddingNote(true)}>+ 添加备注</button>
              )}
            </div>

            {addingNote && (
              <div className="hyp-note-form">
                <textarea
                  className="hyp-note-textarea"
                  placeholder={NOTE_PLACEHOLDER}
                  rows={8}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button className="motto-cancel-btn" onClick={() => { setAddingNote(false); setNoteDraft('') }}>取消</button>
                  <button className="motto-save-btn" onClick={handleAddNote} disabled={!noteDraft.trim()}>保存备注</button>
                </div>
              </div>
            )}

            {hypothesis.notes.length > 0 && (
              <div className="hyp-notes-list">
                {[...hypothesis.notes].reverse().map((note) => (
                  <NoteItem key={note.id} hypothesisId={hypothesis.id} note={note} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── 主组件 ─────────────────────────────────────────────────────────────────────

export default function ProgressTab() {
  const hypotheses = useAppStore((s) => s.hypotheses ?? [])
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          假设验证 · {hypotheses.length} 条
        </p>
        {!showForm && (
          <button className="sticky-add-btn" onClick={() => setShowForm(true)}>
            + 新增 Demo 假设
          </button>
        )}
      </div>

      {/* 新增表单 */}
      {showForm && <NewHypothesisForm onClose={() => setShowForm(false)} />}

      {/* 假设列表 */}
      {hypotheses.length === 0 && !showForm ? (
        <div className="k-empty" style={{ padding: '32px 0' }}>
          <div className="k-empty-icon" style={{ fontSize: 28 }}>🧪</div>
          <p className="k-empty-text">
            还没有假设记录<br />
            点击「+ 新增 Demo 假设」开始第一次验证
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {hypotheses.map((h) => (
            <HypothesisCard key={h.id} hypothesis={h} />
          ))}
        </div>
      )}
    </div>
  )
}

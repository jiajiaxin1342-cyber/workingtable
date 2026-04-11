import { useState } from 'react'
import useAppStore from '../../store/appStore'

const QUESTIONS = [
  { key: 'q1', label: 'Q1：本周分析了什么产品？形成了什么判断？' },
  { key: 'q2', label: 'Q2：本周有没有动手做 AI 工具 / 原型？做了什么？' },
  { key: 'q3', label: 'Q3：本周有没有输出内容或认识新的创业者？' },
  { key: 'q4', label: 'Q4：和上周相比，我对「自己想做的方向」更清晰了吗？' },
]

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function RecordCard({ record }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="weekly-record">
      <div className="weekly-record-header">
        <span className="weekly-record-date">{formatDate(record.savedAt)}</span>
        <button className="weekly-record-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '收起 ▲' : '展开全文 ▼'}
        </button>
      </div>

      {!expanded && (
        <div className="weekly-record-summary">
          {QUESTIONS.map(({ key, label }) => (
            <p key={key} className="weekly-record-q">
              <span>{label.slice(0, 3)}：</span>
              {(record[key] || '（未填写）').slice(0, 50)}{(record[key] || '').length > 50 ? '…' : ''}
            </p>
          ))}
        </div>
      )}

      {expanded && (
        <div className="weekly-record-full">
          {QUESTIONS.map(({ key, label }) => (
            <div key={key} className="weekly-record-full-q">
              <p className="q-label">{label}</p>
              <p className="q-body">{record[key] || '（未填写）'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WeeklyReviewTab() {
  const addWeeklyReview = useAppStore((s) => s.addWeeklyReview)
  const weeklyReviews = useAppStore((s) => s.weeklyReviews)

  const [form, setForm] = useState({ q1: '', q2: '', q3: '', q4: '' })

  const hasContent = Object.values(form).some((v) => v.trim())

  const handleSave = () => {
    if (!hasContent) return
    addWeeklyReview({ ...form })
    setForm({ q1: '', q2: '', q3: '', q4: '' })
  }

  return (
    <div>
      {/* 填写表单 */}
      <div className="weekly-form">
        <p className="weekly-form-title">✍️ 本周 Review</p>
        {QUESTIONS.map(({ key, label }) => (
          <div key={key} className="weekly-question">
            <label className="weekly-question-label">{label}</label>
            <textarea
              className="weekly-question-textarea"
              placeholder="写下本周的思考..."
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
        <button className="weekly-save-btn" onClick={handleSave} disabled={!hasContent}>
          保存本周记录
        </button>
      </div>

      {/* 历史记录 */}
      {weeklyReviews.length > 0 && (
        <div>
          <p className="weekly-history-title">历史记录 · {weeklyReviews.length} 条</p>
          {[...weeklyReviews].reverse().map((r) => (
            <RecordCard key={r.id} record={r} />
          ))}
        </div>
      )}
    </div>
  )
}

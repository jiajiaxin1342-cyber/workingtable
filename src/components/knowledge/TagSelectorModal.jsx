import { useState } from 'react'
import useAppStore from '../../store/appStore'

const PRESET_TAGS = ['产品Taste', 'AI技术架构', 'AI洞见', '用户研究', '商业模式', '前端技术']

export default function TagSelectorModal({ article, onClose }) {
  const { kbItems, saveToKB } = useAppStore()

  // 从已有 kbItems 中提取标签，去重合并预设
  const existingTags = [...new Set(kbItems.flatMap((k) => k.tags))]
  const allSuggested = [...new Set([...PRESET_TAGS, ...existingTags])]

  // 默认勾选文章自带标签
  const [selected, setSelected] = useState(new Set(article.tags || []))
  const [newTag, setNewTag] = useState('')
  const [insight, setInsight] = useState('')
  const [insightError, setInsightError] = useState(false)

  const toggle = (tag) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })

  const addCustomTag = () => {
    const t = newTag.trim()
    if (!t) return
    setSelected((prev) => new Set([...prev, t]))
    setNewTag('')
  }

  const handleConfirm = () => {
    if (selected.size === 0) return
    if (!insight.trim()) {
      setInsightError(true)
      return
    }
    saveToKB(article.id, [...selected], insight.trim())
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <p className="modal-title">存入知识库</p>
        <p className="modal-subtitle">《{article.title}》</p>

        <p className="modal-section-label">选择标签</p>
        <div className="tag-chips-row">
          {allSuggested.map((tag) => (
            <button
              key={tag}
              className={`tag-chip ${selected.has(tag) ? 'selected' : ''}`}
              onClick={() => toggle(tag)}
            >
              {selected.has(tag) ? '✓ ' : ''}{tag}
            </button>
          ))}
        </div>

        <div className="tag-add-row">
          <input
            className="tag-add-input"
            placeholder="自定义标签..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
          />
          <button className="tag-add-btn" onClick={addCustomTag}>+ 添加</button>
        </div>

        <p className="modal-section-label" style={{ color: insightError ? '#fc8181' : undefined }}>
          所以呢？我的洞察（必填）
        </p>
        <textarea
          className="modal-note-input"
          placeholder="用一句话说：这篇文章让你改变了什么想法，或者确认了什么判断？"
          rows={3}
          value={insight}
          onChange={(e) => { setInsight(e.target.value); setInsightError(false) }}
          style={{ borderColor: insightError ? '#fc8181' : undefined }}
        />
        {insightError && (
          <p style={{ fontSize: 12, color: '#fc8181', marginTop: 4 }}>
            必须填写洞察才能存入——知识库不是书签夹
          </p>
        )}

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>取消</button>
          <button
            className="modal-confirm"
            onClick={handleConfirm}
            disabled={selected.size === 0 || !insight.trim()}
          >
            确认存入 {selected.size > 0 ? `(${selected.size}个标签)` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

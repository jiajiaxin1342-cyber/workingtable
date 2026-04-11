import { useState } from 'react'
import useAppStore from '../../store/appStore'

const TYPE_CONFIG = {
  insight:     { label: '长期洞见', icon: '🔭', dest: '知识库 · 长期洞见', empty: '在写作台选择「长期洞见」后保存草稿' },
  observation: { label: '短期观察', icon: '📌', dest: '知识库 · 短期观察', empty: '在写作台选择「短期观察」后保存草稿' },
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 单张草稿卡片
function DraftCard({ draft, type }) {
  const { deleteDraft, publishDraft, updateDraft, setWritingContent, setEditingDraftId, setWritingActiveTab, writingPanelOpen, toggleWritingPanel } = useAppStore()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isPublished = draft.status === 'published'
  const wordCount = (draft.body || '').replace(/\s/g, '').length

  const handleEdit = () => {
    setWritingContent(type, { title: draft.title, body: draft.body })
    setEditingDraftId(type, draft.id)
    setWritingActiveTab(type)
    if (!writingPanelOpen) toggleWritingPanel()
    // 如已发布则撤回为草稿
    if (isPublished) updateDraft(type, draft.id, { status: 'draft' })
  }

  const handlePublish = () => publishDraft(type, draft.id)

  return (
    <div className={`draft-card ${isPublished ? 'draft-card-published' : ''}`}>
      <div className="draft-card-header">
        <p className="draft-card-title">
          {isPublished && <span className="draft-published-badge">已发布</span>}
          {draft.title || '无标题'}
        </p>

        {/* 删除：二次确认 */}
        {confirmDelete ? (
          <div className="draft-confirm-delete">
            <span>确认删除？</span>
            <button className="draft-confirm-yes" onClick={() => deleteDraft(type, draft.id)}>删除</button>
            <button className="draft-confirm-no" onClick={() => setConfirmDelete(false)}>取消</button>
          </div>
        ) : (
          <button className="draft-del-btn" onClick={() => setConfirmDelete(true)} title="删除">×</button>
        )}
      </div>

      <p className="draft-card-preview">
        {(draft.body || '').replace(/#+\s/g, '').slice(0, 80)}{(draft.body || '').length > 80 ? '...' : ''}
      </p>

      <div className="draft-card-footer">
        <span className="draft-meta">
          {formatDate(draft.updatedAt)} · {wordCount} 字
          {isPublished && draft.publishedAt && ` · 发布于 ${formatDate(draft.publishedAt)}`}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="draft-edit-btn" onClick={handleEdit}>
            {isPublished ? '撤回编辑' : '✍️ 继续编辑'}
          </button>
          {!isPublished && (
            <button className="draft-send-btn" onClick={handlePublish} title={`发送到${TYPE_CONFIG[type]?.dest}`}>
              发送 →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DraftListTab({ type }) {
  const cfg = TYPE_CONFIG[type]
  const drafts = useAppStore((s) => s.drafts[type] || [])

  const draftItems = drafts.filter((d) => d.status !== 'published')
  const publishedItems = drafts.filter((d) => d.status === 'published')

  if (drafts.length === 0) {
    return (
      <div className="k-empty">
        <div className="k-empty-icon">{cfg.icon}</div>
        <p className="k-empty-text">{cfg.empty}</p>
      </div>
    )
  }

  return (
    <div>
      {draftItems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            草稿 · {draftItems.length}
          </p>
          {draftItems.map((d) => <DraftCard key={d.id} draft={d} type={type} />)}
        </div>
      )}

      {publishedItems.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            已发布 · {publishedItems.length}
          </p>
          {publishedItems.map((d) => <DraftCard key={d.id} draft={d} type={type} />)}
        </div>
      )}
    </div>
  )
}

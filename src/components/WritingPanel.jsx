import { useRef, useState } from 'react'
import useAppStore from '../store/appStore'

const TABS = [
  { id: 'product',     label: '产品分析', icon: '🛠️', dest: '产品工坊 · 我的文档' },
  { id: 'observation', label: '飞流日记', icon: '📝', dest: '创业飞轮 · 信号源' },
]

// 产品分析 的常规模板
const TEMPLATES = {
  product: [
    { label: '产品分析', content: `# 产品：\n## 一句话判断\n\n## 做对了\n- \n- \n\n## 做错了\n- \n- \n\n## 如果是我\n\n## 商业存活性\n它靠什么活着？能活多久？\n\n## 护城河\n被复制后还剩什么？\n\n## 机会雷达\n它没覆盖的空白在哪？那里有没有我能做的东西？\n\n` },
    { label: '竞品对比', content: `# 竞品对比：\n## 产品 A\n\n## 产品 B\n\n## 核心差异\n\n## 我的判断\n\n` },
  ],
}

// 飞流日记四种便签类型
const NOTE_TYPES = [
  { key: '趋势感知', hint: '这个赛道正在发生什么', template: '这个赛道正在发生什么：\n\n' },
  { key: '需求信号', hint: '真实用户在抱怨什么', template: '真实用户在抱怨什么：\n\n' },
  { key: '机会窗口', hint: '钱在往哪里流',        template: '钱在往哪里流：\n\n' },
  { key: '其它',     hint: '',                    template: '' },
]

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function WritingPanel() {
  const {
    writingActiveTab, setWritingActiveTab,
    writingContent, setWritingContent,
    editingDraftId, setEditingDraftId,
    drafts, saveDraft, updateDraft, deleteDraft, publishDraft,
    activeProductId,
    closeWritingPanel,
  } = useAppStore()

  const textareaRef = useRef(null)
  const [showDrafts, setShowDrafts] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [obsNoteType, setObsNoteType] = useState('')  // 飞流日记当前便签类型

  const tab = TABS.find((t) => t.id === writingActiveTab) ? writingActiveTab : 'product'
  const tabCfg = TABS.find((t) => t.id === tab)
  const content = writingContent[tab] || { title: '', body: '' }
  // 只展示未发布的草稿（发布后从草稿箱消失）
  const currentDrafts = (drafts[tab] || []).filter((d) => d.status !== 'published')
  const editingId = editingDraftId?.[tab] || null
  const isObservation = tab === 'observation'

  const setTitle = (title) => setWritingContent(tab, { title })
  const setBody  = (body)  => setWritingContent(tab, { body })

  const switchTab = (id) => {
    setWritingActiveTab(id)
    setShowDrafts(false)
  }

  const applyTemplate = (tpl) => {
    const newBody = content.body ? content.body + '\n\n---\n\n' + tpl.content : tpl.content
    setBody(newBody)
    setTimeout(() => { const ta = textareaRef.current; if (ta) { ta.focus(); ta.scrollTop = ta.scrollHeight } }, 50)
  }

  // 飞流日记：选择便签类型
  const selectNoteType = (nt) => {
    setObsNoteType(nt.key)
    if (!content.body.trim() && nt.template) {
      setBody(nt.template)
      setTimeout(() => { const ta = textareaRef.current; if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) } }, 50)
    }
  }

  const handleSave = () => {
    const { title, body } = content
    if (!body.trim()) return
    const extra = isObservation ? { noteType: obsNoteType || '其它' } : {}
    if (editingId) {
      updateDraft(tab, editingId, { title, body, ...extra })
    } else {
      saveDraft(tab, title, body, extra)
    }
    setWritingContent(tab, { title: '', body: '' })
    setEditingDraftId(tab, null)
    if (isObservation) setObsNoteType('')
    setShowDrafts(true)
  }

  const handleNewDraft = () => {
    setWritingContent(tab, { title: '', body: '' })
    setEditingDraftId(tab, null)
    if (isObservation) setObsNoteType('')
    setShowDrafts(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const loadDraft = (draft) => {
    setWritingContent(tab, { title: draft.title, body: draft.body })
    setEditingDraftId(tab, draft.id)
    if (isObservation) setObsNoteType(draft.noteType || '')
    setShowDrafts(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const wordCount = (content.body || '').replace(/\s/g, '').length

  const getDestLabel = (t) => {
    if (t === 'product') return '产品工坊·我的文档'
    return '创业飞轮·信号源'
  }

  return (
    <div className="writing-panel">
      {/* 顶栏 */}
      <div className="wp-header">
        <span className="wp-title">✍️ 写作台</span>
        <button className="wp-close" onClick={closeWritingPanel}>×</button>
      </div>

      {/* Tab 切换 */}
      <div className="wp-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`wp-tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => switchTab(t.id)}
          >
            {t.icon} {t.label}
            {(drafts[t.id] || []).filter((d) => d.status !== 'published').length > 0 && (
              <span className="wp-tab-count">{(drafts[t.id] || []).filter((d) => d.status !== 'published').length}</span>
            )}
          </button>
        ))}
      </div>

      {showDrafts ? (
        /* 草稿列表视图 */
        <div className="wp-drafts-view">
          <div className="wp-drafts-header">
            <span className="wp-drafts-title">{tabCfg?.label}草稿箱 · {currentDrafts.length} 篇</span>
            <button className="wp-new-btn" onClick={handleNewDraft}>+ 新建</button>
          </div>
          {currentDrafts.length === 0 ? (
            <p className="wp-drafts-empty">还没有草稿，保存后出现在这里</p>
          ) : (
            <div className="wp-drafts-list">
              {currentDrafts.map((draft) => {
                const isConfirming = confirmDeleteId === draft.id
                const canPublish = tab !== 'product' || !!activeProductId
                return (
                  <div key={draft.id} className="wp-draft-item">
                    <div className="wp-draft-item-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        {isObservation && draft.noteType && (
                          <span className={`wp-note-type-badge nt-${draft.noteType}`}>{draft.noteType}</span>
                        )}
                        <p className="wp-draft-item-title" style={{ margin: 0 }}>{draft.title || '无标题'}</p>
                      </div>
                      {isConfirming ? (
                        <div className="wp-draft-confirm">
                          <span style={{ fontSize: 10, color: '#fc8181' }}>确认删除？</span>
                          <button className="wp-confirm-yes" onClick={() => { deleteDraft(tab, draft.id); setConfirmDeleteId(null) }}>删除</button>
                          <button className="wp-confirm-no" onClick={() => setConfirmDeleteId(null)}>取消</button>
                        </div>
                      ) : (
                        <button className="wp-draft-del" onClick={() => setConfirmDeleteId(draft.id)}>×</button>
                      )}
                    </div>
                    <p className="wp-draft-preview">
                      {(draft.body || '').replace(/#+\s/g, '').slice(0, 60)}{draft.body?.length > 60 ? '...' : ''}
                    </p>
                    <div className="wp-draft-footer">
                      <span className="wp-draft-meta">{formatDate(draft.updatedAt)} · {(draft.body || '').replace(/\s/g, '').length} 字</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="wp-draft-edit" onClick={() => loadDraft(draft)}>编辑</button>
                        <button
                          className="wp-draft-send"
                          onClick={() => publishDraft(tab, draft.id)}
                          disabled={!canPublish}
                          title={canPublish ? `发送到${getDestLabel(tab)}` : '请先在产品工坊选择一个产品'}
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* 编辑视图 */
        <>
          {isObservation ? (
            /* 飞流日记：便签类型选择器 */
            <div className="wp-note-types">
              {NOTE_TYPES.map((nt) => (
                <button
                  key={nt.key}
                  className={`wp-note-type-btn ${obsNoteType === nt.key ? 'active' : ''}`}
                  onClick={() => selectNoteType(nt)}
                  title={nt.hint}
                >
                  {nt.key}
                </button>
              ))}
            </div>
          ) : (
            /* 其它 Tab：常规模板 */
            <div className="wp-templates">
              {(TEMPLATES[tab] || []).map((tpl) => (
                <button key={tpl.label} className="wp-tpl-btn" onClick={() => applyTemplate(tpl)}>
                  {tpl.label}
                </button>
              ))}
            </div>
          )}

          {/* 编辑中提示 */}
          {editingId && (
            <div className="wp-editing-badge">
              ✏️ 编辑中草稿 · 保存将覆盖原内容
              <button className="wp-editing-cancel" onClick={handleNewDraft}>取消编辑</button>
            </div>
          )}

          {/* 标题 */}
          <input
            className="wp-title-input"
            placeholder="标题（选填）"
            value={content.title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* 正文 */}
          <textarea
            ref={textareaRef}
            className="wp-body"
            placeholder={
              isObservation
                ? `选择便签类型后开始记录……\n\n草稿发送后出现在知识库 · 便签`
                : `在这里写${tabCfg?.label}……\n\n草稿保存到：${tabCfg?.dest}`
            }
            value={content.body}
            onChange={(e) => setBody(e.target.value)}
          />

          {/* 底栏 */}
          <div className="wp-footer">
            <span className="wp-wordcount">{wordCount} 字</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="wp-drafts-toggle" onClick={() => setShowDrafts(true)}>
                草稿箱{currentDrafts.length > 0 ? ` (${currentDrafts.length})` : ''}
              </button>
              <button className="wp-save-btn" onClick={handleSave} disabled={!content.body?.trim()}>
                {editingId ? '更新草稿' : '保存草稿'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

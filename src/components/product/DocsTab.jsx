import { useState, useRef } from 'react'
import useAppStore from '../../store/appStore'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 产品分析草稿列表（写作台保存的）
function ProductDraftSection() {
  const drafts = useAppStore((s) => s.drafts.product || [])
  const deleteDraft = useAppStore((s) => s.deleteDraft)
  const publishDraft = useAppStore((s) => s.publishDraft)
  const setWritingContent = useAppStore((s) => s.setWritingContent)
  const setEditingDraftId = useAppStore((s) => s.setEditingDraftId)
  const setWritingActiveTab = useAppStore((s) => s.setWritingActiveTab)
  const writingPanelOpen = useAppStore((s) => s.writingPanelOpen)
  const toggleWritingPanel = useAppStore((s) => s.toggleWritingPanel)
  const [confirmId, setConfirmId] = useState(null)

  if (drafts.length === 0) return null

  const handleEdit = (draft) => {
    setWritingContent('product', { title: draft.title, body: draft.body })
    setEditingDraftId('product', draft.id)
    setWritingActiveTab('product')
    if (!writingPanelOpen) toggleWritingPanel()
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        写作台草稿 · {drafts.length} 篇
      </p>
      {drafts.map((draft) => {
        const isConfirming = confirmId === draft.id
        return (
          <div key={draft.id} className="draft-card">
            <div className="draft-card-header">
              <p className="draft-card-title">{draft.title || '无标题'}</p>
              {isConfirming ? (
                <div className="draft-confirm-delete">
                  <span>确认删除？</span>
                  <button className="draft-confirm-yes" onClick={() => { deleteDraft('product', draft.id); setConfirmId(null) }}>删除</button>
                  <button className="draft-confirm-no" onClick={() => setConfirmId(null)}>取消</button>
                </div>
              ) : (
                <button className="draft-del-btn" onClick={() => setConfirmId(draft.id)}>×</button>
              )}
            </div>
            <p className="draft-card-preview">
              {(draft.body || '').replace(/#+\s/g, '').slice(0, 80)}{draft.body?.length > 80 ? '...' : ''}
            </p>
            <div className="draft-card-footer">
              <span className="draft-meta">{formatDate(draft.updatedAt)} · {(draft.body || '').replace(/\s/g, '').length} 字</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="draft-edit-btn" onClick={() => handleEdit(draft)}>✍️ 继续编辑</button>
                <button className="draft-send-btn" onClick={() => publishDraft('product', draft.id)} title="发送到我的文档">发送 →</button>
              </div>
            </div>
          </div>
        )
      })}
      <div style={{ borderTop: '1px solid #2d3748', margin: '16px 0' }} />
    </div>
  )
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file, 'utf-8')
  })
}

export default function DocsTab() {
  const { products, activeProductId, reviews, addReview, deleteReview, triggerMentorMessage } =
    useAppStore()
  const product = products.find((p) => p.id === activeProductId)

  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const myDocs = reviews.filter(
    (r) => r.productId === activeProductId && r.type === 'mine'
  )

  const handleFiles = async (files) => {
    for (const file of files) {
      if (!file.name.match(/\.(txt|md)$/i)) continue
      try {
        const content = await readFileAsText(file)
        addReview({
          productId: activeProductId,
          type: 'mine',
          source: '我的文档',
          title: file.name,
          summary: content.slice(0, 150) + (content.length > 150 ? '...' : ''),
          content, // 存全文用于锐评
        })
      } catch {}
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles([...e.dataTransfer.files])
  }

  const handleInputChange = (e) => {
    handleFiles([...e.target.files])
    e.target.value = ''
  }

  const handleDocReview = (doc) => {
    const productName = product?.name || '当前产品'
    const dimensions = product?.dimensions
      .filter((d) => d.level > 0)
      .map((d) => {
        const labels = ['', '明显短板', '有待提升', '中规中矩', '表现良好', '行业领先']
        return `- ${d.name}：${labels[d.level]}${d.desc ? `（${d.desc}）` : ''}`
      })
      .join('\n')

    const msg = [
      `请对「${productName}」进行深度锐评，基于以下测评文档：`,
      ``,
      `📄 文档：${doc.title}`,
      `内容：`,
      doc.content?.slice(0, 2000) || doc.summary,
      doc.content?.length > 2000 ? '\n（文档内容较长，已截取前2000字）' : '',
      ``,
      dimensions
        ? `📊 当前维度评分：\n${dimensions}`
        : `📊 当前还没有维度评分`,
      ``,
      `请从以下角度给出犀利、有深度的分析：`,
      `1. 这份测评文档揭示了产品的哪些核心问题？`,
      `2. 与行业最佳实践相比，差距在哪里？`,
      `3. 如果你是产品负责人，最优先改什么？`,
    ].join('\n')

    triggerMentorMessage(msg)
  }

  if (!product) {
    return (
      <div className="p-empty">
        <div className="p-empty-icon">📄</div>
        <p className="p-empty-title">请先在「产品分析台」新建一个产品</p>
      </div>
    )
  }

  return (
    <div>
      {/* 写作台草稿 */}
      <ProductDraftSection />

      {/* 上传区 */}
      <div
        className={`doc-dropzone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="doc-dropzone-icon">📂</div>
        <p className="doc-dropzone-text">
          点击上传 或 拖拽文件到此处
        </p>
        <p className="doc-dropzone-hint">支持 .txt 和 .md 格式的测评文档</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md"
        multiple
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* 文档列表 */}
      {myDocs.length === 0 ? (
        <div className="p-empty" style={{ padding: '32px 0' }}>
          <div className="p-empty-icon" style={{ fontSize: 28 }}>📝</div>
          <p className="p-empty-desc" style={{ fontSize: 13, color: '#4a5568' }}>
            上传测评文档，让 AI 导师进行深度锐评
          </p>
        </div>
      ) : (
        <div className="doc-list">
          {myDocs.map((doc) => (
            <div key={doc.id} className="doc-item">
              <div className="doc-item-header">
                <span className="doc-item-name">
                  <span className="doc-icon">
                    {doc.title.endsWith('.md') ? '📋' : '📄'}
                  </span>
                  {doc.title}
                </span>
                <span className="doc-item-meta">
                  {new Date(doc.savedAt).toLocaleString('zh-CN', {
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>

              {doc.summary && (
                <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, marginTop: 4 }}>
                  {doc.summary}
                </p>
              )}

              <div className="doc-item-actions">
                <button className="btn-doc-review" onClick={() => handleDocReview(doc)}>
                  🎓 基于此文档锐评
                </button>
                <button className="btn-doc-delete" onClick={() => deleteReview(doc.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import useAppStore from '../store/appStore'

export default function KnowledgeScene() {
  const { knowledgeItems, addKnowledgeItem, deleteKnowledgeItem } = useAppStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')

  const handleAdd = () => {
    if (!title.trim()) return
    addKnowledgeItem({
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    })
    setTitle('')
    setContent('')
    setTags('')
  }

  return (
    <div className="scene-container">
      <div className="scene-add-card">
        <h2>添加知识条目</h2>
        <input
          className="input"
          placeholder="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="textarea"
          placeholder="内容摘要"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input
          className="input"
          placeholder="标签（逗号分隔，如：React, 前端）"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <button className="btn-primary" onClick={handleAdd}>
          + 添加
        </button>
      </div>

      <div className="item-list">
        {knowledgeItems.length === 0 && (
          <p className="empty-hint">暂无知识条目，快来添加第一条吧 ✨</p>
        )}
        {knowledgeItems.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-header">
              <h3>{item.title}</h3>
              <button className="btn-danger" onClick={() => deleteKnowledgeItem(item.id)}>
                删除
              </button>
            </div>
            {item.content && <p className="item-content">{item.content}</p>}
            {item.tags.length > 0 && (
              <div className="tag-list">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="item-date">{new Date(item.createdAt).toLocaleString('zh-CN')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

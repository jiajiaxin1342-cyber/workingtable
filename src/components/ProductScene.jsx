import { useState } from 'react'
import useAppStore from '../store/appStore'

const STATUS_OPTIONS = ['想法', '进行中', '已完成', '已搁置']

export default function ProductScene() {
  const { productItems, addProductItem, deleteProductItem } = useAppStore()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [status, setStatus] = useState('想法')

  const handleAdd = () => {
    if (!name.trim()) return
    addProductItem({
      name: name.trim(),
      desc: desc.trim(),
      status,
      createdAt: new Date().toISOString(),
    })
    setName('')
    setDesc('')
    setStatus('想法')
  }

  const statusColor = {
    想法: '#6366f1',
    进行中: '#f59e0b',
    已完成: '#10b981',
    已搁置: '#6b7280',
  }

  return (
    <div className="scene-container">
      <div className="scene-add-card">
        <h2>新建产品 / 项目</h2>
        <input
          className="input"
          placeholder="项目名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="textarea"
          placeholder="项目描述"
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn-primary" onClick={handleAdd}>
          + 创建
        </button>
      </div>

      <div className="item-list">
        {productItems.length === 0 && (
          <p className="empty-hint">暂无项目，开始规划你的第一个产品吧 🚀</p>
        )}
        {productItems.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="status-badge"
                  style={{ background: statusColor[item.status] }}
                >
                  {item.status}
                </span>
                <h3>{item.name}</h3>
              </div>
              <button className="btn-danger" onClick={() => deleteProductItem(item.id)}>
                删除
              </button>
            </div>
            {item.desc && <p className="item-content">{item.desc}</p>}
            <p className="item-date">{new Date(item.createdAt).toLocaleString('zh-CN')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

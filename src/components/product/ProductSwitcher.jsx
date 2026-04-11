import { useState } from 'react'
import useAppStore from '../../store/appStore'

export default function ProductSwitcher({ onClose }) {
  const { products, activeProductId, setActiveProduct, createProduct, deleteProduct } = useAppStore()
  const [newName, setNewName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    createProduct(name)
    setNewName('')
    onClose()
  }

  const handleSelect = (id) => {
    setActiveProduct(id)
    onClose()
  }

  return (
    <div className="product-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="product-modal">
        <p className="product-modal-title">切换 / 管理产品</p>

        <div className="product-list">
          {products.length === 0 && (
            <p style={{ fontSize: 13, color: '#4a5568', textAlign: 'center', padding: '12px 0' }}>
              还没有产品，先新建一个吧
            </p>
          )}
          {products.map((p) => (
            <div
              key={p.id}
              className={`product-list-item ${p.id === activeProductId ? 'active' : ''}`}
              onClick={() => handleSelect(p.id)}
            >
              <span className="product-list-name">{p.name}</span>
              <span className="product-list-date">
                {new Date(p.createdAt).toLocaleDateString('zh-CN')}
              </span>
              {confirmDeleteId === p.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: 11, color: '#fc8181' }}>确认删除？</span>
                  <button className="draft-confirm-yes" onClick={(e) => { e.stopPropagation(); deleteProduct(p.id) }}>删除</button>
                  <button className="draft-confirm-no" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}>取消</button>
                </div>
              ) : (
                <button
                  className="btn-del-product"
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id) }}
                  title="删除"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="new-product-row">
          <input
            className="new-product-input"
            placeholder="输入新产品名称..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button className="btn-create-product" onClick={handleCreate}>
            新建
          </button>
        </div>
      </div>
    </div>
  )
}

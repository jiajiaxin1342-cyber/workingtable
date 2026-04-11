import { useState } from 'react'
import useAppStore from '../../store/appStore'

const MINI_TABS = [
  { id: 'signals',  label: '信号源' },
  { id: 'hyp',      label: '假设' },
  { id: 'product',  label: '产品洞见' },
]

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// ── 信号源（observation notes）──────────────────────────────────────────────

function SignalsPanel() {
  const drafts = useAppStore((s) => s.drafts.observation || [])
  const notes  = drafts.filter((d) => d.status === 'published')

  if (notes.length === 0) return (
    <div className="ref-empty">暂无信号源便签</div>
  )

  return (
    <div className="ref-list">
      {notes.map((n) => (
        <div key={n.id} className="ref-item">
          <div className="ref-item-meta">
            <span className="ref-item-tag">{n.noteType || '其它'}</span>
            <span className="ref-item-date">{formatDate(n.publishedAt || n.updatedAt)}</span>
          </div>
          {n.title && n.title !== '无标题' && (
            <p className="ref-item-title">{n.title}</p>
          )}
          <p className="ref-item-body">{n.body}</p>
        </div>
      ))}
    </div>
  )
}

// ── 假设验证 ──────────────────────────────────────────────────────────────

function HypPanel() {
  const hypotheses = useAppStore((s) => s.hypotheses ?? [])

  if (hypotheses.length === 0) return (
    <div className="ref-empty">暂无假设记录</div>
  )

  return (
    <div className="ref-list">
      {hypotheses.map((h) => (
        <div key={h.id} className="ref-item">
          <p className="ref-item-title">{h.title}</p>
          {h.mvp && <p className="ref-item-body" style={{ fontSize: 11, color: '#4a5568' }}>MVP: {h.mvp}</p>}
          {h.notes.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {h.notes.map((n) => (
                <p key={n.id} className="ref-item-body" style={{ marginBottom: 4 }}>
                  · {n.content}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── 产品洞见（当前产品的 POV）────────────────────────────────────────────────

function ProductPanel() {
  const products       = useAppStore((s) => s.products ?? [])
  const activeProductId = useAppStore((s) => s.activeProductId)
  const product = products.find((p) => p.id === activeProductId) || products[0]

  if (!product) return (
    <div className="ref-empty">暂无产品分析</div>
  )

  const pov = product.pov || {}
  const pros = (pov.pros || []).filter(Boolean)
  const cons = (pov.cons || []).filter(Boolean)

  return (
    <div className="ref-list">
      <div className="ref-item">
        <p className="ref-item-title" style={{ color: '#a0aec0', fontSize: 10, marginBottom: 4 }}>
          {product.name}
        </p>
        {pov.verdict && <p className="ref-item-body" style={{ fontWeight: 500, color: '#e2e8f0' }}>{pov.verdict}</p>}
        {pros.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p className="ref-item-meta-tag" style={{ color: '#68d391' }}>做对了</p>
            {pros.map((p, i) => p && <p key={i} className="ref-item-body">✓ {p}</p>)}
          </div>
        )}
        {cons.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <p className="ref-item-meta-tag" style={{ color: '#fc8181' }}>做错了</p>
            {cons.map((c, i) => c && <p key={i} className="ref-item-body">✗ {c}</p>)}
          </div>
        )}
        {pov.opportunity && (
          <div style={{ marginTop: 6 }}>
            <p className="ref-item-meta-tag" style={{ color: '#f6ad55' }}>机会雷达</p>
            <p className="ref-item-body">{pov.opportunity}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 主组件 ──────────────────────────────────────────────────────────────────

export default function ReferencePanel() {
  const [tab, setTab] = useState('signals')

  return (
    <div className="ref-panel">
      <div className="ref-tabs">
        {MINI_TABS.map((t) => (
          <button
            key={t.id}
            className={`ref-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="ref-content">
        {tab === 'signals' && <SignalsPanel />}
        {tab === 'hyp'     && <HypPanel />}
        {tab === 'product' && <ProductPanel />}
      </div>
    </div>
  )
}

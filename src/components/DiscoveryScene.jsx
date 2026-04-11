import { useState } from 'react'
import useAppStore from '../store/appStore'
import './knowledge/knowledge.css'

function formatDate(iso) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── 原则 Tab ──────────────────────────────────────────────────────────────────

function PrincipleTab() {
  const motto = useAppStore((s) => s.mottos?.discovery) ?? { current: '', history: [] }
  const updateMotto = useAppStore((s) => s.updateMotto)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const handleEdit = () => {
    setDraft(motto.current)
    setEditing(true)
  }

  const handleSave = () => {
    if (!draft.trim()) return
    updateMotto('discovery', draft.trim())
    setEditing(false)
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div className="motto-header">
        <span className="motto-icon">🌐</span>
        <span className="motto-tab-title">影响力飞轮 · 行动原则</span>
        {!editing && (
          <button className="motto-edit-btn" onClick={handleEdit}>编辑</button>
        )}
      </div>

      {editing ? (
        <div className="motto-edit-area">
          <textarea
            className="motto-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className="motto-edit-actions">
            <button className="motto-cancel-btn" onClick={() => setEditing(false)}>取消</button>
            <button className="motto-save-btn" onClick={handleSave} disabled={!draft.trim()}>保存</button>
          </div>
        </div>
      ) : (
        <div className="motto-display">
          {motto.current
            ? motto.current.split('\n').map((line, i) =>
                line === '' ? <br key={i} /> : <p key={i}>{line}</p>
              )
            : <p style={{ color: '#4a5568', fontSize: 13 }}>还没有原则，点击「编辑」写下你的行动手册</p>
          }
        </div>
      )}

      {motto.history.length > 0 && !editing && (
        <div className="motto-history">
          <button className="motto-history-toggle" onClick={() => setHistoryOpen((v) => !v)}>
            {historyOpen ? '▾' : '▸'} 历史记录 · {motto.history.length} 条
          </button>
          {historyOpen && (
            <div className="motto-history-list">
              {motto.history.map((h, i) => (
                <div key={i} className="motto-history-item">
                  <p className="motto-history-date">{formatDate(h.savedAt)}</p>
                  <div className="motto-history-text">
                    {h.text.split('\n').map((line, j) =>
                      line === '' ? <br key={j} /> : <p key={j}>{line}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 联系人卡片 ────────────────────────────────────────────────────────────────

function ContactCard({ contact }) {
  const updateDiscoveryContact = useAppStore((s) => s.updateDiscoveryContact)
  const deleteDiscoveryContact = useAppStore((s) => s.deleteDiscoveryContact)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nickname: contact.nickname, role: contact.role, note: contact.note })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    updateDiscoveryContact(contact.id, form)
    setEditing(false)
  }

  return (
    <div className="contact-card">
      {editing ? (
        <div className="contact-edit-form">
          <input
            className="contact-input"
            placeholder="昵称"
            value={form.nickname}
            onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
          />
          <input
            className="contact-input"
            placeholder="身份"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          />
          <textarea
            className="contact-note-input"
            placeholder="备注"
            rows={2}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
          <div className="contact-edit-actions">
            <button className="motto-cancel-btn" onClick={() => setEditing(false)}>取消</button>
            <button className="motto-save-btn" onClick={handleSave}>保存</button>
          </div>
        </div>
      ) : (
        <>
          <div className="contact-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="contact-nickname">{contact.nickname || '未命名'}</span>
              {contact.role && <span className="contact-role-badge">{contact.role}</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {confirmDelete ? (
                <>
                  <span style={{ fontSize: 11, color: '#fc8181' }}>确认删除？</span>
                  <button className="draft-confirm-yes" onClick={() => deleteDiscoveryContact(contact.id)}>删除</button>
                  <button className="draft-confirm-no" onClick={() => setConfirmDelete(false)}>取消</button>
                </>
              ) : (
                <>
                  <button className="contact-action-btn" onClick={() => setEditing(true)}>编辑</button>
                  <button className="contact-action-btn contact-del-btn" onClick={() => setConfirmDelete(true)}>×</button>
                </>
              )}
            </div>
          </div>
          {contact.note && <p className="contact-note">{contact.note}</p>}
          <p className="contact-meta">添加于 {formatDate(contact.createdAt)}</p>
        </>
      )}
    </div>
  )
}

// ── 新增联系人表单 ─────────────────────────────────────────────────────────────

function AddContactForm({ onClose }) {
  const addDiscoveryContact = useAppStore((s) => s.addDiscoveryContact)
  const [form, setForm] = useState({ nickname: '', role: '', note: '' })

  const handleAdd = () => {
    if (!form.nickname.trim()) return
    addDiscoveryContact(form)
    onClose()
  }

  return (
    <div className="contact-add-form">
      <input
        className="contact-input"
        placeholder="昵称 *"
        value={form.nickname}
        onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
        autoFocus
      />
      <input
        className="contact-input"
        placeholder="身份（投资人 / 创业者 / 产品人…）"
        value={form.role}
        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
      />
      <textarea
        className="contact-note-input"
        placeholder="备注（在哪认识、聊过什么、值得跟进的点…）"
        rows={3}
        value={form.note}
        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
      />
      <div className="contact-edit-actions">
        <button className="motto-cancel-btn" onClick={onClose}>取消</button>
        <button className="motto-save-btn" onClick={handleAdd} disabled={!form.nickname.trim()}>添加</button>
      </div>
    </div>
  )
}

// ── 圈内备注 Tab ──────────────────────────────────────────────────────────────

function ContactsTab() {
  const contacts = useAppStore((s) => s.discoveryContacts ?? [])
  const [addingContact, setAddingContact] = useState(false)

  return (
    <div>
      <div className="contact-section-header" style={{ marginBottom: 16 }}>
        <p className="contact-section-title">圈内备注 · {contacts.length} 人</p>
        {!addingContact && (
          <button className="motto-edit-btn" onClick={() => setAddingContact(true)}>+ 新增</button>
        )}
      </div>

      {addingContact && <AddContactForm onClose={() => setAddingContact(false)} />}

      {contacts.length === 0 && !addingContact && (
        <p className="contact-empty">记录圈内好友：昵称、身份、备注</p>
      )}

      {contacts.map((c) => (
        <ContactCard key={c.id} contact={c} />
      ))}
    </div>
  )
}

// ── 主场景 ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'principle', label: '原则' },
  { id: 'contacts',  label: '圈内备注' },
]

export default function DiscoveryScene() {
  const [activeTab, setActiveTab] = useState('principle')

  return (
    <div className="k-scene">
      <div className="k-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`k-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'principle' && <PrincipleTab />}
        {activeTab === 'contacts'  && <ContactsTab />}
      </div>
    </div>
  )
}

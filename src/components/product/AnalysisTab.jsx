import { useState } from 'react'
import useAppStore from '../../store/appStore'

function formatDate(iso) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── 赛道标签输入（带历史建议）────────────────────────────────────────────────

function TrackInput({ value, onChange, existingTracks, listId }) {
  return (
    <>
      <datalist id={listId}>
        {existingTracks.map((t) => <option key={t} value={t} />)}
      </datalist>
      <input
        className="analysis-input"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="如：AI效率工具、内容消费…（可选）"
      />
    </>
  )
}

// ── 新增表单（含完整分析框架）──────────────────────────────────────────────

function AddAnalysisForm({ onSave, onCancel, existingTracks, initialTrack = '' }) {
  const [track,       setTrack]       = useState(initialTrack)
  const [name,        setName]        = useState('')
  const [verdict,     setVerdict]     = useState('')
  const [pros,        setProsArr]     = useState(['', '', ''])
  const [cons,        setConsArr]     = useState(['', '', ''])
  const [myTake,      setMyTake]      = useState('')
  const [viability,   setViability]   = useState('')
  const [moat,        setMoat]        = useState('')
  const [opportunity, setOpportunity] = useState('')

  const setPros = (i, v) => { const a = [...pros]; a[i] = v; setProsArr(a) }
  const setCons = (i, v) => { const a = [...cons]; a[i] = v; setConsArr(a) }

  return (
    <div className="analysis-form">
      {/* 赛道标签 + 产品名 */}
      <div className="analysis-edit-row-two">
        <div className="analysis-form-row" style={{ flex: 1 }}>
          <label className="analysis-form-label">赛道标签</label>
          <TrackInput
            value={track}
            onChange={setTrack}
            existingTracks={existingTracks}
            listId="track-list-add"
          />
        </div>
        <div className="analysis-form-row" style={{ flex: 1 }}>
          <label className="analysis-form-label">
            产品名称 <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <input
            className="analysis-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="产品 / 公司名称"
            autoFocus
          />
        </div>
      </div>

      {/* 一句话判断 */}
      <div className="analysis-form-row">
        <label className="analysis-form-label">
          一句话判断 <span style={{ color: 'var(--red)' }}>*</span>
        </label>
        <textarea
          className="analysis-textarea"
          rows={2}
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          placeholder={`我认为「${name || '该产品'}」的核心问题/优势是…`}
        />
      </div>

      {/* 做对了 + 做错了 */}
      <div className="pov-two-col">
        <div className="analysis-form-row">
          <label className="analysis-form-label" style={{ color: 'var(--green)' }}>做对了什么</label>
          {[0, 1, 2].map((i) => (
            <input key={i} className="analysis-input" style={{ marginBottom: 5 }}
              placeholder={`第 ${i + 1} 条…`}
              value={pros[i]}
              onChange={(e) => setPros(i, e.target.value)}
            />
          ))}
        </div>
        <div className="analysis-form-row">
          <label className="analysis-form-label" style={{ color: 'var(--red)' }}>做错了什么</label>
          {[0, 1, 2].map((i) => (
            <input key={i} className="analysis-input" style={{ marginBottom: 5 }}
              placeholder={`第 ${i + 1} 条…`}
              value={cons[i]}
              onChange={(e) => setCons(i, e.target.value)}
            />
          ))}
        </div>
      </div>

      {/* 其余框架字段 */}
      {[
        { label: '如果是我，我会…', val: myTake,      set: setMyTake,      ph: '我会怎么改？或者我发现了什么没被满足的需求…' },
        { label: '商业存活性',      val: viability,   set: setViability,   ph: '它靠什么活着？能活多久？' },
        { label: '护城河',          val: moat,        set: setMoat,        ph: '被复制后还剩什么？' },
        { label: '机会雷达',        val: opportunity, set: setOpportunity, ph: '它没覆盖的空白在哪？那里有没有我能做的东西？' },
      ].map(({ label, val, set, ph }) => (
        <div key={label} className="analysis-form-row">
          <label className="analysis-form-label">{label}</label>
          <textarea className="analysis-textarea" rows={2} placeholder={ph}
            value={val} onChange={(e) => set(e.target.value)} />
        </div>
      ))}

      <div className="analysis-form-actions">
        <div />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="motto-cancel-btn" onClick={onCancel}>取消</button>
          <button
            className="motto-save-btn"
            onClick={() => onSave({
              track: track.trim(), name: name.trim(),
              pov: { verdict, pros, cons, myTake, viability, moat, opportunity },
            })}
            disabled={!name.trim() || !verdict.trim()}
          >
            新增分析
          </button>
        </div>
      </div>
    </div>
  )
}

// ── POV 只读展示 ──────────────────────────────────────────────────────────────

function PovDisplay({ pov }) {
  const pros = (pov.pros || []).filter(Boolean)
  const cons = (pov.cons || []).filter(Boolean)
  const fields = [
    { label: '如果是我', value: pov.myTake },
    { label: '商业存活性', value: pov.viability },
    { label: '护城河', value: pov.moat },
    { label: '机会雷达', value: pov.opportunity },
  ].filter((f) => f.value)

  return (
    <div className="pov-display">
      {pov.verdict && (
        <p className="pov-display-verdict">{pov.verdict}</p>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className="pov-display-two-col">
          {pros.length > 0 && (
            <div>
              <p className="pov-display-sub-label" style={{ color: 'var(--green)' }}>做对了</p>
              {pros.map((p, i) => <p key={i} className="pov-display-item">✓ {p}</p>)}
            </div>
          )}
          {cons.length > 0 && (
            <div>
              <p className="pov-display-sub-label" style={{ color: 'var(--red)' }}>做错了</p>
              {cons.map((c, i) => <p key={i} className="pov-display-item">✗ {c}</p>)}
            </div>
          )}
        </div>
      )}

      {fields.map((f) => (
        <div key={f.label} className="pov-display-field">
          <p className="pov-display-sub-label">{f.label}</p>
          <p className="pov-display-text">{f.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── POV 编辑表单 ────────────────────────────────────────────────────────────

function PovEditForm({ product, onSave, onCancel, existingTracks }) {
  const { triggerMentorMessage } = useAppStore()

  const pov0 = product.pov || {}
  const [track,      setTrack]      = useState(product.track || '')
  const [name,       setName]       = useState(product.name  || '')
  const [verdict,    setVerdict]    = useState(pov0.verdict   || '')
  const [pros,       setProsArr]    = useState(pov0.pros      || ['', '', ''])
  const [cons,       setConsArr]    = useState(pov0.cons      || ['', '', ''])
  const [myTake,     setMyTake]     = useState(pov0.myTake    || '')
  const [viability,  setViability]  = useState(pov0.viability || '')
  const [moat,       setMoat]       = useState(pov0.moat      || '')
  const [opportunity,setOpportunity]= useState(pov0.opportunity || '')
  const [aiLoading,  setAiLoading]  = useState(false)

  const setPros = (i, v) => { const a = [...pros]; a[i] = v; setProsArr(a) }
  const setCons = (i, v) => { const a = [...cons]; a[i] = v; setConsArr(a) }

  const handleAiCritique = () => {
    if (!verdict.trim()) return
    setAiLoading(true)
    const filledPros = pros.filter(Boolean)
    const filledCons = cons.filter(Boolean)
    const prompt = `我对「${name}」的产品观如下：

一句话判断：${verdict}
做对了什么：${filledPros.length ? filledPros.map((p, i) => `${i + 1}. ${p}`).join('\n') : '（未填）'}
做错了什么：${filledCons.length ? filledCons.map((c, i) => `${i + 1}. ${c}`).join('\n') : '（未填）'}
如果是我：${myTake || '（未填）'}
商业存活性：${viability || '（未填）'}
护城河：${moat || '（未填）'}
机会雷达：${opportunity || '（未填）'}

请直接锐评这个判断：哪里有道理，哪里过于表面，有没有遗漏的关键视角？不超过200字，说话直接，不要客气。`
    triggerMentorMessage(prompt)
    setAiLoading(false)
  }

  return (
    <div className="analysis-edit-form">
      {/* 赛道 + 产品名 */}
      <div className="analysis-edit-row-two">
        <div className="analysis-form-row" style={{ flex: 1 }}>
          <label className="analysis-form-label">赛道标签</label>
          <TrackInput
            value={track}
            onChange={setTrack}
            existingTracks={existingTracks}
            listId={`track-list-${product.id}`}
          />
        </div>
        <div className="analysis-form-row" style={{ flex: 1 }}>
          <label className="analysis-form-label">产品名称 <span style={{ color: 'var(--red)' }}>*</span></label>
          <input
            className="analysis-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      {/* 一句话判断 */}
      <div className="analysis-form-row">
        <label className="analysis-form-label">一句话判断 <span style={{ color: 'var(--red)' }}>*</span></label>
        <textarea
          className="analysis-textarea"
          rows={2}
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          placeholder={`我认为「${name}」的核心问题/优势是…`}
        />
      </div>

      {/* 做对了 + 做错了 */}
      <div className="pov-two-col">
        <div className="analysis-form-row">
          <label className="analysis-form-label" style={{ color: 'var(--green)' }}>做对了什么</label>
          {[0, 1, 2].map((i) => (
            <input key={i} className="analysis-input" style={{ marginBottom: 5 }}
              placeholder={`第 ${i + 1} 条…`}
              value={pros[i] || ''}
              onChange={(e) => setPros(i, e.target.value)}
            />
          ))}
        </div>
        <div className="analysis-form-row">
          <label className="analysis-form-label" style={{ color: 'var(--red)' }}>做错了什么</label>
          {[0, 1, 2].map((i) => (
            <input key={i} className="analysis-input" style={{ marginBottom: 5 }}
              placeholder={`第 ${i + 1} 条…`}
              value={cons[i] || ''}
              onChange={(e) => setCons(i, e.target.value)}
            />
          ))}
        </div>
      </div>

      {/* 其余字段 */}
      {[
        { label: '如果是我，我会…', val: myTake,     set: setMyTake,     ph: '我会怎么改？或者我发现了什么没被满足的需求…' },
        { label: '商业存活性',      val: viability,  set: setViability,  ph: '它靠什么活着？能活多久？' },
        { label: '护城河',          val: moat,       set: setMoat,       ph: '被复制后还剩什么？' },
        { label: '机会雷达',        val: opportunity,set: setOpportunity, ph: '它没覆盖的空白在哪？那里有没有我能做的东西？' },
      ].map(({ label, val, set, ph }) => (
        <div key={label} className="analysis-form-row">
          <label className="analysis-form-label">{label}</label>
          <textarea className="analysis-textarea" rows={2} placeholder={ph}
            value={val} onChange={(e) => set(e.target.value)} />
        </div>
      ))}

      {/* 底部按钮 */}
      <div className="analysis-edit-footer">
        <button
          className="pov-critique-btn"
          onClick={handleAiCritique}
          disabled={aiLoading || !verdict.trim()}
        >
          {aiLoading ? '发送中…' : '🔥 让 AI 锐评我的判断'}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="motto-cancel-btn" onClick={onCancel}>取消</button>
          <button
            className="motto-save-btn"
            disabled={!name.trim() || !verdict.trim()}
            onClick={() => onSave({
              track: track.trim(), name: name.trim(),
              pov: { verdict, pros, cons, myTake, viability, moat, opportunity },
            })}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 产品分析卡片 ────────────────────────────────────────────────────────────

function AnalysisCard({ product, existingTracks }) {
  const updateProduct    = useAppStore((s) => s.updateProduct)
  const updateProductPov = useAppStore((s) => s.updateProductPov)
  const deleteProduct    = useAppStore((s) => s.deleteProduct)

  const [expanded,      setExpanded]      = useState(false)
  const [editing,       setEditing]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const pov = product.pov || {}

  const handleSave = ({ track, name, pov: newPov }) => {
    updateProduct(product.id, { name, track })
    updateProductPov(product.id, newPov)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="analysis-card">
        <PovEditForm
          product={product}
          existingTracks={existingTracks}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  // 折叠预览行：每个已填写字段显示为一行截断文字
  const previewLines = [
    pov.verdict
      ? { label: '判断', text: pov.verdict }
      : null,
    (pov.pros || []).filter(Boolean).length > 0
      ? { label: '做对了', text: (pov.pros || []).filter(Boolean).join(' · ') }
      : null,
    (pov.cons || []).filter(Boolean).length > 0
      ? { label: '做错了', text: (pov.cons || []).filter(Boolean).join(' · ') }
      : null,
    pov.myTake      ? { label: '如果是我',   text: pov.myTake }      : null,
    pov.viability   ? { label: '商业存活性', text: pov.viability }   : null,
    pov.moat        ? { label: '护城河',     text: pov.moat }        : null,
    pov.opportunity ? { label: '机会雷达',   text: pov.opportunity } : null,
  ].filter(Boolean)

  return (
    <div className="analysis-card">
      {/* 卡片头（点击展开/收起详情） */}
      <div className="analysis-card-header" onClick={() => setExpanded((v) => !v)}>
        <div className="analysis-card-main">
          {product.track && (
            <span className="analysis-track-badge">{product.track}</span>
          )}
          <span className="analysis-card-name">{product.name}</span>
        </div>
        <div className="analysis-card-right">
          <span className="analysis-card-date">{formatDate(product.createdAt)}</span>
          <span className="analysis-card-chevron">{expanded ? '▾' : '▸'}</span>
        </div>
      </div>

      {/* 始终可见的内容预览（折叠态：每字段一行截断） */}
      {previewLines.length > 0 && !expanded && (
        <div className="analysis-card-preview">
          {previewLines.map(({ label, text }) => (
            <p key={label} className="analysis-preview-line">
              <span className="analysis-preview-label">{label}</span>
              <span className="analysis-preview-text">{text}</span>
            </p>
          ))}
        </div>
      )}

      {/* 展开后的完整内容 */}
      {expanded && (
        <div className="analysis-card-body">
          <PovDisplay pov={pov} />
          <div className="analysis-card-actions">
            <button className="motto-edit-btn" onClick={() => setEditing(true)}>编辑</button>
            <div style={{ flex: 1 }} />
            {confirmDelete ? (
              <>
                <span style={{ fontSize: 11, color: 'var(--red)', alignSelf: 'center' }}>确认删除？</span>
                <button className="draft-confirm-yes" onClick={() => deleteProduct(product.id)}>删除</button>
                <button className="draft-confirm-no" onClick={() => setConfirmDelete(false)}>取消</button>
              </>
            ) : (
              <button className="contact-action-btn contact-del-btn" onClick={() => setConfirmDelete(true)}>×</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 主组件 ──────────────────────────────────────────────────────────────────

// filterTrack: undefined=全部, 'string'=按赛道过滤, '__untagged__'=未分类
export default function AnalysisTab({ filterTrack, defaultTrack, showForm, setShowForm }) {
  const products         = useAppStore((s) => s.products ?? [])
  const addProduct       = useAppStore((s) => s.addProduct)
  const updateProduct    = useAppStore((s) => s.updateProduct)
  const updateProductPov = useAppStore((s) => s.updateProductPov)

  const existingTracks = [...new Set(products.map((p) => p.track).filter(Boolean))]
  const allSorted = [...products].sort((a, b) => b.id - a.id)
  const sorted = filterTrack === undefined || filterTrack === null
    ? allSorted
    : filterTrack === '__untagged__'
      ? allSorted.filter((p) => !p.track)
      : allSorted.filter((p) => p.track === filterTrack)

  const handleAdd = ({ track, name, pov }) => {
    const id = addProduct(name)
    if (track) updateProduct(id, { track })
    updateProductPov(id, pov)
    setShowForm(false)
  }

  return (
    <div>
      {/* 新增表单 */}
      {showForm && (
        <AddAnalysisForm
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
          existingTracks={existingTracks}
          initialTrack={defaultTrack && defaultTrack !== '__untagged__' ? defaultTrack : ''}
        />
      )}

      {/* 空状态 */}
      {sorted.length === 0 && !showForm && (
        <div className="k-empty" style={{ padding: '32px 0' }}>
          <div className="k-empty-icon" style={{ fontSize: 28 }}>🛠️</div>
          <p className="k-empty-text">
            还没有产品分析<br />
            点击「+ 新增分析」开始形成你的判断
          </p>
        </div>
      )}

      {/* 卡片列表 */}
      {sorted.map((product) => (
        <AnalysisCard
          key={product.id}
          product={product}
          existingTracks={existingTracks}
        />
      ))}
    </div>
  )
}

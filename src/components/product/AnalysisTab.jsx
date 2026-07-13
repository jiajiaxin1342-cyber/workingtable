import { useState } from 'react'
import useAppStore from '../../store/appStore'

// ── 两套分析模版定义 ──────────────────────────────────────────────────────────

const TEMPLATES = {
  pov: {
    label: '产品观框架',
    desc: '主观判断驱动的快速分析',
    fields: [
      { key: 'verdict',     label: '一句话判断',    type: 'textarea', required: true,  ph: '我认为该产品的核心问题/优势是…' },
      { key: 'pros',        label: '做对了什么',    type: 'multi',    required: false, ph: '第 {i} 条…', limit: 3 },
      { key: 'cons',        label: '做错了什么',    type: 'multi',    required: false, ph: '第 {i} 条…', limit: 3 },
      { key: 'myTake',      label: '如果是我',      type: 'textarea', required: false, ph: '我会怎么改？或者我发现了什么没被满足的需求…' },
      { key: 'viability',   label: '商业存活性',    type: 'textarea', required: false, ph: '它靠什么活着？能活多久？' },
      { key: 'moat',        label: '护城河',        type: 'textarea', required: false, ph: '被复制后还剩什么？' },
      { key: 'opportunity', label: '机会雷达',      type: 'textarea', required: false, ph: '它没覆盖的空白在哪？我能做点什么？' },
    ],
  },
  jtbd: {
    label: 'JTBD 框架',
    desc: 'Jobs-to-be-Done：从用户任务视角分析',
    fields: [
      { key: 'verdict',       label: '一句话判断',          type: 'textarea', required: true,  ph: '这个产品被用户「雇佣」来完成什么任务？' },
      { key: 'targetUser',    label: '目标用户',            type: 'textarea', required: false, ph: '谁在使用这个产品？他们在什么场景下用？' },
      { key: 'coreJob',       label: '核心任务（Job）',     type: 'textarea', required: false, ph: '用户"雇佣"这个产品来完成什么任务？（不是功能，是目的）' },
      { key: 'jobSteps',      label: '任务步骤拆解',        type: 'textarea', required: false, ph: '完成这个任务的关键步骤：定义→定位→准备→确认→执行→监控→调整→完成' },
      { key: 'painPoints',    label: '痛点缺口',            type: 'textarea', required: false, ph: '在哪些步骤上，这个产品做得不够好？用户在凑合什么？' },
      { key: 'unmetNeeds',    label: '未被满足的需求',      type: 'textarea', required: false, ph: '用户在哪些方面还忍受着不理想的方案？哪些需求被过度满足了？' },
      { key: 'opportunity',   label: '机会判断',            type: 'textarea', required: false, ph: '如果有产品能更好地完成这个任务，它应该怎么做？我能做吗？' },
    ],
  },
}

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

// ── 模版切换器 ───────────────────────────────────────────────────────────────

function TemplateSwitcher({ template, onChange }) {
  return (
    <div className="template-switcher">
      {Object.entries(TEMPLATES).map(([key, tpl]) => (
        <button
          key={key}
          className={`template-tab ${template === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          <span className="template-tab-label">{tpl.label}</span>
          <span className="template-tab-desc">{tpl.desc}</span>
        </button>
      ))}
    </div>
  )
}

// ── 通用字段表单渲染 ──────────────────────────────────────────────────────────

function TemplateFields({ template, values, setValues }) {
  const tpl = TEMPLATES[template]
  if (!tpl) return null

  return (
    <>
      {/* 做对了 + 做错了（仅 POV 模版，双列布局） */}
      {template === 'pov' && (
        <div className="pov-two-col">
          {['pros', 'cons'].map((key) => {
            const field = tpl.fields.find((f) => f.key === key)
            const arr = values[key] || ['', '', '']
            const color = key === 'pros' ? 'var(--green)' : 'var(--red)'
            return (
              <div key={key} className="analysis-form-row">
                <label className="analysis-form-label" style={{ color }}>{field.label}</label>
                {[0, 1, 2].map((i) => (
                  <input key={i} className="analysis-input" style={{ marginBottom: 5 }}
                    placeholder={`第 ${i + 1} 条…`}
                    value={arr[i] || ''}
                    onChange={(e) => {
                      const a = [...arr]; a[i] = e.target.value
                      setValues({ ...values, [key]: a })
                    }}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* 其余字段（排除已特殊处理的） */}
      {tpl.fields
        .filter((f) => !(template === 'pov' && (f.key === 'pros' || f.key === 'cons')))
        .map(({ key, label, type, required, ph }) => {
          // multi 类型在非 pov 模版中不使用
          if (type === 'multi') return null
          return (
            <div key={key} className="analysis-form-row">
              <label className="analysis-form-label">
                {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
              </label>
              <textarea
                className="analysis-textarea"
                rows={2}
                placeholder={ph}
                value={values[key] || ''}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              />
            </div>
          )
        })}
    </>
  )
}

// ── 通用字段展示（只读） ──────────────────────────────────────────────────────

function TemplateDisplay({ template, pov }) {
  const tpl = TEMPLATES[template] || TEMPLATES.pov

  // 一句话判断始终在顶部
  const verdict = pov.verdict
  const fields = tpl.fields
    .filter((f) => f.key !== 'verdict' && f.type !== 'multi')
    .map((f) => ({ label: f.label, value: pov[f.key] }))
    .filter((f) => f.value)

  // pros/cons 仅 pov 模版
  const pros = template === 'pov' ? (pov.pros || []).filter(Boolean) : []
  const cons = template === 'pov' ? (pov.cons || []).filter(Boolean) : []

  return (
    <div className="pov-display">
      {verdict && <p className="pov-display-verdict">{verdict}</p>}

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

      {/* 模版标签 */}
      <div style={{ marginTop: 8 }}>
        <span style={{
          fontSize: 10, padding: '1px 8px', borderRadius: 4,
          background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)',
        }}>
          {tpl.label}
        </span>
      </div>
    </div>
  )
}

// ── 新增分析表单（含模版切换）──────────────────────────────────────────────

function AddAnalysisForm({ onSave, onCancel, existingTracks, initialTrack = '' }) {
  const [template, setTemplate] = useState('pov')
  const [track,  setTrack]  = useState(initialTrack)
  const [name,   setName]   = useState('')
  const [values, setValues] = useState({ pros: ['', '', ''], cons: ['', '', ''] })

  const tpl = TEMPLATES[template]
  const requiredKey = tpl.fields.find((f) => f.required)?.key
  const canSave = name.trim() && (requiredKey ? (values[requiredKey] || '').trim() : true)

  return (
    <div className="analysis-form">
      {/* 模版切换器 */}
      <TemplateSwitcher template={template} onChange={setTemplate} />

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

      {/* 动态字段 */}
      <TemplateFields template={template} values={values} setValues={setValues} />

      <div className="analysis-form-actions">
        <div />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="motto-cancel-btn" onClick={onCancel}>取消</button>
          <button
            className="motto-save-btn"
            disabled={!canSave}
            onClick={() => onSave({
              track: track.trim(), name: name.trim(),
              template,
              pov: { ...values, pros: values.pros || ['', '', ''], cons: values.cons || ['', '', ''] },
            })}
          >
            新增分析
          </button>
        </div>
      </div>
    </div>
  )
}

// ── POV 编辑表单 ────────────────────────────────────────────────────────────

function PovEditForm({ product, onSave, onCancel, existingTracks }) {
  const { triggerMentorMessage } = useAppStore()

  const [template, setTemplate] = useState(product.template || 'pov')
  const pov0 = product.pov || {}
  const [track,  setTrack]  = useState(product.track || '')
  const [name,   setName]   = useState(product.name  || '')
  const [values, setValues] = useState({
    ...pov0,
    pros: pov0.pros  || ['', '', ''],
    cons: pov0.cons  || ['', '', ''],
  })
  const [aiLoading, setAiLoading] = useState(false)

  const tpl = TEMPLATES[template]
  const requiredKey = tpl.fields.find((f) => f.required)?.key
  const canSave = name.trim() && (requiredKey ? (values[requiredKey] || '').trim() : true)

  const handleAiCritique = () => {
    const verdict = values.verdict || ''
    if (!verdict.trim()) return
    setAiLoading(true)

    // 根据模版构造不同的 prompt
    let prompt
    if (template === 'jtbd') {
      prompt = `我对「${name}」的 JTBD 分析如下：
一句话判断：${verdict}
目标用户：${values.targetUser || '（未填）'}
核心任务：${values.coreJob || '（未填）'}
任务步骤：${values.jobSteps || '（未填）'}
痛点缺口：${values.painPoints || '（未填）'}
未被满足的需求：${values.unmetNeeds || '（未填）'}
机会判断：${values.opportunity || '（未填）'}

请直接锐评这个分析：任务定义准不准？有没有遗漏的关键步骤？机会判断有没有过于乐观？不超过200字，说话直接。`
    } else {
      const filledPros = (values.pros || []).filter(Boolean)
      const filledCons = (values.cons || []).filter(Boolean)
      prompt = `我对「${name}」的产品观如下：
一句话判断：${verdict}
做对了什么：${filledPros.length ? filledPros.map((p, i) => `${i + 1}. ${p}`).join('\n') : '（未填）'}
做错了什么：${filledCons.length ? filledCons.map((c, i) => `${i + 1}. ${c}`).join('\n') : '（未填）'}
如果是我：${values.myTake || '（未填）'}
商业存活性：${values.viability || '（未填）'}
护城河：${values.moat || '（未填）'}
机会雷达：${values.opportunity || '（未填）'}

请直接锐评这个判断：哪里有道理，哪里过于表面，有没有遗漏的关键视角？不超过200字，说话直接，不要客气。`
    }
    triggerMentorMessage(prompt)
    setAiLoading(false)
  }

  return (
    <div className="analysis-edit-form">
      {/* 模版切换器（编辑时也可切换） */}
      <TemplateSwitcher template={template} onChange={setTemplate} />

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

      {/* 动态字段 */}
      <TemplateFields template={template} values={values} setValues={setValues} />

      {/* 底部按钮 */}
      <div className="analysis-edit-footer">
        <button
          className="pov-critique-btn"
          onClick={handleAiCritique}
          disabled={aiLoading || !(values.verdict || '').trim()}
        >
          {aiLoading ? '发送中…' : '🔥 让 AI 锐评我的判断'}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="motto-cancel-btn" onClick={onCancel}>取消</button>
          <button
            className="motto-save-btn"
            disabled={!canSave}
            onClick={() => onSave({
              track: track.trim(), name: name.trim(), template,
              pov: { ...values, pros: values.pros || ['', '', ''], cons: values.cons || ['', '', ''] },
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
  const template = product.template || 'pov'
  const tpl = TEMPLATES[template] || TEMPLATES.pov

  const handleSave = ({ track, name, template: newTemplate, pov: newPov }) => {
    updateProduct(product.id, { name, track, template: newTemplate })
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
    pov.verdict ? { label: '判断', text: pov.verdict } : null,
  ]

  if (template === 'pov') {
    const prosArr = (pov.pros || []).filter(Boolean)
    const consArr = (pov.cons || []).filter(Boolean)
    if (prosArr.length > 0) previewLines.push({ label: '做对了', text: prosArr.join(' · ') })
    if (consArr.length > 0) previewLines.push({ label: '做错了', text: consArr.join(' · ') })
    if (pov.myTake)      previewLines.push({ label: '如果是我',   text: pov.myTake })
    if (pov.viability)   previewLines.push({ label: '商业存活性', text: pov.viability })
    if (pov.moat)        previewLines.push({ label: '护城河',     text: pov.moat })
    if (pov.opportunity) previewLines.push({ label: '机会雷达',   text: pov.opportunity })
  } else {
    // JTBD 模版预览
    if (pov.targetUser)  previewLines.push({ label: '目标用户',   text: pov.targetUser })
    if (pov.coreJob)     previewLines.push({ label: '核心任务',   text: pov.coreJob })
    if (pov.jobSteps)    previewLines.push({ label: '任务步骤',   text: pov.jobSteps })
    if (pov.painPoints)  previewLines.push({ label: '痛点缺口',   text: pov.painPoints })
    if (pov.unmetNeeds)  previewLines.push({ label: '未满足需求', text: pov.unmetNeeds })
    if (pov.opportunity) previewLines.push({ label: '机会判断',   text: pov.opportunity })
  }

  const validPreview = previewLines.filter(Boolean)

  return (
    <div className="analysis-card">
      {/* 卡片头（点击展开/收起详情） */}
      <div className="analysis-card-header" onClick={() => setExpanded((v) => !v)}>
        <div className="analysis-card-main">
          {product.track && (
            <span className="analysis-track-badge">{product.track}</span>
          )}
          <span className="analysis-card-name">{product.name}</span>
          <span style={{
            fontSize: 9, padding: '1px 5px', borderRadius: 3, marginLeft: 6,
            background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)',
          }}>
            {tpl.label}
          </span>
        </div>
        <div className="analysis-card-right">
          <span className="analysis-card-date">{formatDate(product.createdAt)}</span>
          <span className="analysis-card-chevron">{expanded ? '▾' : '▸'}</span>
        </div>
      </div>

      {/* 始终可见的内容预览（折叠态：每字段一行截断） */}
      {validPreview.length > 0 && !expanded && (
        <div className="analysis-card-preview">
          {validPreview.map(({ label, text }) => (
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
          <TemplateDisplay template={template} pov={pov} />
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

  const handleAdd = ({ track, name, template, pov }) => {
    const id = addProduct(name)
    if (track) updateProduct(id, { track, template })
    else updateProduct(id, { template })
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

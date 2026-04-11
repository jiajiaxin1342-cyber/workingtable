import { useState } from 'react'
import useAppStore from '../../store/appStore'
import ProductSwitcher from './ProductSwitcher'

// ── 产品观文档（主区域）────────────────────────────────────────────────────────

function PovDocument({ product }) {
  const { updateProductPov, triggerMentorMessage } = useAppStore()
  const pov = product.pov || { verdict: '', pros: ['', '', ''], cons: ['', '', ''], myTake: '', viability: '', moat: '', opportunity: '' }
  const [aiLoading, setAiLoading] = useState(false)

  const setPros = (i, val) => {
    const next = [...(pov.pros || ['', '', ''])]
    next[i] = val
    updateProductPov(product.id, { pros: next })
  }
  const setCons = (i, val) => {
    const next = [...(pov.cons || ['', '', ''])]
    next[i] = val
    updateProductPov(product.id, { cons: next })
  }

  const handleAiCritique = () => {
    if (!pov.verdict.trim()) return
    setAiLoading(true)
    const filledPros = (pov.pros || []).filter(Boolean)
    const filledCons = (pov.cons || []).filter(Boolean)
    const prompt = `我对「${product.name}」的产品观如下：

一句话判断：${pov.verdict}
做对了什么：${filledPros.length ? filledPros.map((p, i) => `${i + 1}. ${p}`).join('\n') : '（未填）'}
做错了什么：${filledCons.length ? filledCons.map((c, i) => `${i + 1}. ${c}`).join('\n') : '（未填）'}
如果是我：${pov.myTake || '（未填）'}

商业存活性：${pov.viability || '（未填）'}
护城河：${pov.moat || '（未填）'}
机会雷达：${pov.opportunity || '（未填）'}

请直接锐评这个判断：哪里有道理，哪里过于表面，有没有遗漏的关键视角？不超过200字，说话直接，不要客气。`
    triggerMentorMessage(prompt)
    setAiLoading(false)
  }

  return (
    <div className="pov-doc">
      {/* 一句话判断 */}
      <div className="pov-section">
        <label className="pov-label">一句话判断 <span className="pov-required">必填</span></label>
        <input
          className="pov-verdict-input"
          placeholder={`我认为「${product.name}」的核心问题/优势是...`}
          value={pov.verdict}
          onChange={(e) => updateProductPov(product.id, { verdict: e.target.value })}
        />
      </div>

      <div className="pov-two-col">
        {/* 做对了 */}
        <div className="pov-section">
          <label className="pov-label">做对了什么</label>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              className="pov-list-input"
              placeholder={`第 ${i + 1} 条...`}
              value={(pov.pros || [])[i] || ''}
              onChange={(e) => setPros(i, e.target.value)}
            />
          ))}
        </div>

        {/* 做错了 */}
        <div className="pov-section">
          <label className="pov-label">做错了什么</label>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              className="pov-list-input"
              placeholder={`第 ${i + 1} 条...`}
              value={(pov.cons || [])[i] || ''}
              onChange={(e) => setCons(i, e.target.value)}
            />
          ))}
        </div>
      </div>

      {/* 如果是我 */}
      <div className="pov-section">
        <label className="pov-label">如果是我，我会...</label>
        <textarea
          className="pov-mytake-input"
          placeholder="我会怎么改这个产品？或者我发现了一个没有被满足的需求..."
          rows={3}
          value={pov.myTake || ''}
          onChange={(e) => updateProductPov(product.id, { myTake: e.target.value })}
        />
      </div>

      {/* 商业存活性 */}
      <div className="pov-section">
        <label className="pov-label">商业存活性</label>
        <p className="pov-sublabel">它靠什么活着？能活多久？</p>
        <textarea
          className="pov-mytake-input"
          placeholder="商业模式、盈利来源、续命能力..."
          rows={3}
          value={pov.viability || ''}
          onChange={(e) => updateProductPov(product.id, { viability: e.target.value })}
        />
      </div>

      {/* 护城河 */}
      <div className="pov-section">
        <label className="pov-label">护城河</label>
        <p className="pov-sublabel">被复制后还剩什么？</p>
        <textarea
          className="pov-mytake-input"
          placeholder="数据壁垒、网络效应、品牌、技术壁垒..."
          rows={3}
          value={pov.moat || ''}
          onChange={(e) => updateProductPov(product.id, { moat: e.target.value })}
        />
      </div>

      {/* 机会雷达 */}
      <div className="pov-section">
        <label className="pov-label">机会雷达</label>
        <p className="pov-sublabel">它没覆盖的空白在哪？那里有没有我能做的东西？</p>
        <textarea
          className="pov-mytake-input"
          placeholder="未被满足的用户、被忽视的场景、可以切入的角度..."
          rows={3}
          value={pov.opportunity || ''}
          onChange={(e) => updateProductPov(product.id, { opportunity: e.target.value })}
        />
      </div>

      {/* AI 锐评按钮 */}
      <button
        className="pov-critique-btn"
        onClick={handleAiCritique}
        disabled={aiLoading || !pov.verdict.trim()}
        title={!pov.verdict.trim() ? '先填写一句话判断' : ''}
      >
        {aiLoading ? '发送中...' : '🔥 让 AI 锐评我的判断'}
      </button>
    </div>
  )
}

// ── 主组件 ─────────────────────────────────────────────────────────────────────

export default function AnalysisTab() {
  const { products, activeProductId } = useAppStore()
  const [showSwitcher, setShowSwitcher] = useState(false)

  const product = products.find((p) => p.id === activeProductId)

  if (!product) {
    return (
      <>
        <div className="p-empty">
          <div className="p-empty-icon">🛠️</div>
          <p className="p-empty-title">还没有分析中的产品</p>
          <p className="p-empty-desc">新建一个产品或赛道，开始形成你的判断</p>
          <button className="p-empty-btn" onClick={() => setShowSwitcher(true)}>+ 新建</button>
        </div>
        {showSwitcher && <ProductSwitcher onClose={() => setShowSwitcher(false)} />}
      </>
    )
  }

  return (
    <>
      <div className="product-topbar">
        <span className="product-name-display">{product.name}</span>
        <button className="btn-switch-product" onClick={() => setShowSwitcher(true)}>切换产品</button>
      </div>

      <PovDocument product={product} />

      {showSwitcher && <ProductSwitcher onClose={() => setShowSwitcher(false)} />}
    </>
  )
}

import { useRef, useState } from 'react'
import useAppStore from '../../store/appStore'
import ReferencePanel from './ReferencePanel'

const TYPES = [
  { value: 'opinion', label: '观点类' },
  { value: 'process', label: '过程类' },
  { value: 'tool',    label: '工具类' },
]

const TEMPLATES = {
  opinion: `[核心判断——一句话，要有明确立场]

大多数人认为：
但我观察到：
这说明：

支撑论据1：
支撑论据2：
可能的反驳：
我仍然相信，因为：

所以如果你是___，你应该___`,

  process: `[我做了什么，结果是什么——一句话]

我原本以为：
实际发生的是：

过程拆解：
第一步做了___，发现___
第二步做了___，发现___
最关键的转折点是：

我学到的一件反常识的事：
如果重来，我会：`,

  tool: `[这篇解决什么问题——一句话]

适合谁看：
不适合谁：

核心工具/方法：
1.（怎么用 + 我的真实感受）
2.
3.

一个容易踩的坑：
我自己的使用习惯是：`,
}

export default function InfluenceWriter({ onPublished }) {
  const draft         = useAppStore((s) => s.influenceWriterDraft)
  const setDraft      = useAppStore((s) => s.setInfluenceWriterDraft)
  const addPublishLog = useAppStore((s) => s.addPublishLog)
  const updateTopic   = useAppStore((s) => s.updateTopic)

  const textareaRef  = useRef(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [showRef,    setShowRef]    = useState(false)

  const wordCount = (draft.body || '').replace(/\s/g, '').length

  const switchType = (type) => {
    const isDefault = !draft.body.trim() || draft.body === TEMPLATES[draft.type]
    setDraft({ type, body: isDefault ? TEMPLATES[type] : draft.body })
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const loadTemplate = () => {
    setDraft({ body: TEMPLATES[draft.type] })
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleSave = () => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const handlePublish = () => {
    const title = draft.title || draft.body.replace(/\n/g, ' ').slice(0, 60)
    addPublishLog({ title })
    if (draft.topicId) updateTopic(draft.topicId, { status: 'published' })
    setDraft({ topicId: null, title: '', type: 'opinion', body: '' })
    onPublished()
  }

  return (
    <div className="infl-writer">
      {/* 选题来源提示 */}
      {draft.title && (
        <div className="infl-writer-topic">
          <p className="infl-writer-topic-label">当前选题</p>
          <p className="infl-writer-topic-title">{draft.title}</p>
        </div>
      )}

      {/* 内容类型 + 参考素材开关 */}
      <div className="infl-type-bar">
        {TYPES.map((t) => (
          <button
            key={t.value}
            className={`infl-type-btn ${draft.type === t.value ? 'active' : ''}`}
            onClick={() => switchType(t.value)}
          >
            {t.label}
          </button>
        ))}
        <button className="infl-reset-tpl-btn" onClick={loadTemplate}>
          重置模板
        </button>
        <button
          className={`infl-ref-toggle-btn ${showRef ? 'active' : ''}`}
          onClick={() => setShowRef((v) => !v)}
          title="查看创业飞轮参考素材"
        >
          📚 参考素材
        </button>
      </div>

      {/* 正文区：split 或单列 */}
      <div className={`infl-body-wrap ${showRef ? 'split' : ''}`}>
        {showRef && <ReferencePanel />}

        <textarea
          ref={textareaRef}
          className="infl-writer-body"
          placeholder="选择内容类型后开始写作……"
          value={draft.body}
          onChange={(e) => setDraft({ body: e.target.value })}
        />
      </div>

      {/* 底栏 */}
      <div className="infl-writer-footer">
        <span className="infl-wordcount">{wordCount} 字</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="motto-save-btn" style={{ fontSize: 12 }} onClick={handleSave}>
            {savedFlash ? '✓ 已保存' : '保存草稿'}
          </button>
          <button
            className="infl-publish-btn"
            onClick={handlePublish}
            disabled={!draft.body.trim()}
          >
            标记为已发布 →
          </button>
        </div>
      </div>
    </div>
  )
}

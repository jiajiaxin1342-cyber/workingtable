import { useState, useRef, useEffect, useCallback } from 'react'
import useAppStore from '../store/appStore'
import { callClaude, buildKnowledgePrompt, buildProductPrompt } from '../api/claude'
import { shouldTriggerCritique, generatePeriodCritique } from '../api/reports'

const MAX_HISTORY = 20 // 每个场景最多保留20条

// ── 学习进度卡片（知识场景顶部） ─────────────────────────────────────────────

function ProgressCard({ goal, articleCount, kbCount }) {
  const daysLeft = goal?.targetDate
    ? Math.max(0, Math.ceil((new Date(goal.targetDate) - Date.now()) / 86400000))
    : null

  if (!goal?.title && articleCount === 0) return null

  return (
    <div className="mentor-progress-card">
      {goal?.title ? (
        <div className="mpc-goal">
          <span className="mpc-label">目标</span>
          <span className="mpc-goal-text">{goal.title}</span>
        </div>
      ) : (
        <div className="mpc-goal">
          <span className="mpc-label">目标</span>
          <span className="mpc-goal-text" style={{ color: '#4a5568' }}>未设定</span>
        </div>
      )}
      <div className="mpc-stats">
        <div className="mpc-stat">
          <span className="mpc-num">{articleCount}</span>
          <span className="mpc-stat-label">已读</span>
        </div>
        <div className="mpc-divider" />
        <div className="mpc-stat">
          <span className="mpc-num">{kbCount}</span>
          <span className="mpc-stat-label">知识库</span>
        </div>
        {daysLeft !== null && (
          <>
            <div className="mpc-divider" />
            <div className="mpc-stat">
              <span className="mpc-num" style={{ color: daysLeft < 7 ? '#fc8181' : '#63b3ed' }}>
                {daysLeft}
              </span>
              <span className="mpc-stat-label">天</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── 消息气泡 ──────────────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  if (msg.role === 'notice') {
    return (
      <div className="message-notice">
        <span>{msg.content}</span>
      </div>
    )
  }

  return (
    <div className={`message ${msg.role}`}>
      <div className="message-bubble" style={{ whiteSpace: 'pre-wrap' }}>
        {msg.content}
      </div>
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function MentorChat() {
  const toggleMentorPanel = useAppStore((s) => s.toggleMentorPanel)

  const {
    activeScene,
    chatHistory,
    addMentorMessage,
    clearMentorChat,
    pendingMentorMessage,
    clearPendingMentorMessage,
    goal,
    articles,
    kbItems,
    products,
    activeProductId,
    reviews,
    lastCritiqueAt,
    setLastCritiqueAt,
  } = useAppStore()

  const messages = chatHistory[activeScene] || []
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef(null)
  const critiqueChecked = useRef(false) // 每次会话只检查一次

  // 滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

// 阶段性锐评：知识场景 mount 时检查是否超过 7 天未锐评
  useEffect(() => {
    if (critiqueChecked.current) return
    if (activeScene !== 'knowledge') return
    // 数据不足时不锐评（至少要有几篇文章）
    if (articles.length < 2) return
    if (!shouldTriggerCritique(lastCritiqueAt)) return

    critiqueChecked.current = true
    setLastCritiqueAt(new Date().toISOString())

    // 非阻塞：先插入一个 notice，等锐评生成后再追加
    addMentorMessage('knowledge', {
      role: 'notice',
      content: '— ⚡ 导师自动锐评（每周触发一次）—',
    })

    generatePeriodCritique({ goal, articles, kbItems })
      .then((text) => {
        addMentorMessage('knowledge', {
          role: 'assistant',
          content: `⚡ 阶段锐评\n\n${text}`,
        })
      })
      .catch(() => {}) // 锐评失败静默处理，不影响使用
  }, []) // 仅 mount 时执行一次

  // 外部触发消息（来自「导师解读」「教练评估」等按钮）
  useEffect(() => {
    if (pendingMentorMessage && !loading) {
      const msg = pendingMentorMessage
      clearPendingMentorMessage()
      sendToMentor(msg)
    }
  }, [pendingMentorMessage])

  const getSystemPrompt = useCallback(() => {
    if (activeScene === 'knowledge') {
      return buildKnowledgePrompt({ goal, articles, kbItems })
    }
    return buildProductPrompt({ products, activeProductId, reviews })
  }, [activeScene, goal, articles, kbItems, products, activeProductId, reviews])

  const sendToMentor = async (text) => {
    if (!text?.trim() || loading) return

    addMentorMessage(activeScene, { role: 'user', content: text })

    // 取最近 MAX_HISTORY 条非notice消息发给 API
    const allMsgs = [...(chatHistory[activeScene] || []), { role: 'user', content: text }]
    const apiMessages = allMsgs
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_HISTORY)
      .map(({ role, content }) => ({ role, content }))

    setLoading(true)
    setStreamingText('')
    try {
      const fullText = await callClaude(
        getSystemPrompt(),
        apiMessages,
        (_, accumulated) => setStreamingText(accumulated)
      )
      addMentorMessage(activeScene, { role: 'assistant', content: fullText })
    } catch (err) {
      addMentorMessage(activeScene, {
        role: 'assistant',
        content: `❌ 出错了：${err.message}`,
      })
    } finally {
      setLoading(false)
      setStreamingText('')
    }
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendToMentor(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const currentProduct = products?.find((p) => p.id === activeProductId)
  const isKnowledge = activeScene === 'knowledge'

  return (
    <aside className="mentor-panel">
      {/* 顶部标题栏 */}
      <div className="mentor-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="mentor-title">
            {isKnowledge ? '🎓 学习教练' : '🔍 产品教练'}
          </span>
          {!isKnowledge && currentProduct && (
            <span className="mentor-subtitle">{currentProduct.name}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn-clear" onClick={() => clearMentorChat(activeScene)}>清空</button>
          <button className="btn-collapse-mentor" onClick={toggleMentorPanel} title="收起">›</button>
        </div>
      </div>

      {/* 学习进度卡片（知识场景专属） */}
      {isKnowledge && (
        <ProgressCard
          goal={goal}
          articleCount={articles.length}
          kbCount={kbItems.length}
        />
      )}

      {/* 消息区 */}
      <div className="mentor-messages">
        {messages.length === 0 && (
          <div className="mentor-welcome">
            {isKnowledge ? (
              <>
                <p>👋 我是你的学习教练</p>
                <p style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6 }}>
                  {goal?.title
                    ? `帮你达成：「${goal.title}」`
                    : '先去「学习进度」设定目标吧'}
                </p>
              </>
            ) : (
              <>
                <p>🔍 我是你的产品教练</p>
                <p style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6 }}>
                  {currentProduct
                    ? `正在分析「${currentProduct.name}」，有什么想深入拆解的？`
                    : '先去「产品分析台」选择一个产品吧'}
                </p>
              </>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* 流式输出中 */}
        {loading && streamingText && (
          <div className="message assistant">
            <div className="message-bubble streaming" style={{ whiteSpace: 'pre-wrap' }}>
              {streamingText}
              <span className="typing-cursor" />
            </div>
          </div>
        )}
        {loading && !streamingText && (
          <div className="message assistant">
            <div className="message-bubble loading">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="mentor-input-area">
        <textarea
          className="mentor-input"
          placeholder="Enter 发送，Shift+Enter 换行"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={loading}
        />
        <button
          className="btn-send"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          {loading ? '···' : '发送'}
        </button>
      </div>
    </aside>
  )
}

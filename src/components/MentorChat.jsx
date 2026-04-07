import { useState, useRef, useEffect } from 'react'
import useAppStore from '../store/appStore'
import { sendMessageStream } from '../api/claude'

const SYSTEM_PROMPTS = {
  knowledge: '你是一个知识管理助手，帮助用户整理、总结和扩展知识库中的内容。用中文回答，简洁精炼。',
  product: '你是一个产品思维导师，帮助用户分析产品需求、梳理功能优先级、提供产品策略建议。用中文回答，结构清晰。',
}

export default function MentorChat() {
  const { activeScene, mentorChats, addMentorMessage, clearMentorChat } = useAppStore()
  const messages = mentorChats[activeScene] || []
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    addMentorMessage(activeScene, { role: 'user', content: text })

    const history = [...messages, { role: 'user', content: text }]
    const apiMessages = history.map((m) => ({ role: m.role, content: m.content }))

    setLoading(true)
    setStreamingText('')
    try {
      const fullText = await sendMessageStream(
        apiMessages,
        SYSTEM_PROMPTS[activeScene],
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <aside className="mentor-panel">
      <div className="mentor-header">
        <span>🤖 AI 导师</span>
        <button className="btn-clear" onClick={() => clearMentorChat(activeScene)}>
          清空
        </button>
      </div>

      <div className="mentor-messages">
        {messages.length === 0 && (
          <div className="mentor-welcome">
            <p>👋 你好！我是你的 AI 导师。</p>
            <p>有什么想聊的？</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-bubble">{msg.content}</div>
          </div>
        ))}
        {loading && streamingText && (
          <div className="message assistant">
            <div className="message-bubble streaming">{streamingText}</div>
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

      <div className="mentor-input-area">
        <textarea
          className="mentor-input"
          placeholder="问导师... (Enter 发送，Shift+Enter 换行)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={loading}
        />
        <button className="btn-send" onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? '...' : '发送'}
        </button>
      </div>
    </aside>
  )
}

// Claude API 调用封装
// 注意：直接在浏览器调用 Anthropic API 需要在请求头加 dangerouslyAllowBrowser: true
// 生产环境建议通过后端代理

const CLAUDE_MODEL = 'claude-sonnet-4-5'

export async function sendMessage(messages, systemPrompt = '') {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('缺少 VITE_ANTHROPIC_API_KEY，请在 .env 文件中配置')
  }

  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages,
  }
  if (systemPrompt) {
    body.system = systemPrompt
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

// 流式输出版本
export async function sendMessageStream(messages, systemPrompt = '', onChunk) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('缺少 VITE_ANTHROPIC_API_KEY，请在 .env 文件中配置')
  }

  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    stream: true,
    messages,
  }
  if (systemPrompt) {
    body.system = systemPrompt
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API 请求失败: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim()
        if (jsonStr === '[DONE]') continue
        try {
          const event = JSON.parse(jsonStr)
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            fullText += event.delta.text
            onChunk?.(event.delta.text, fullText)
          }
        } catch {}
      }
    }
  }

  return fullText
}

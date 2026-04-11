import { useState, useRef, useEffect } from 'react'
import { parseContent } from '../../api/claude'
import { tryFetchUrl } from '../../api/rss'
import useAppStore from '../../store/appStore'

const URL_RE = /^https?:\/\/\S+$/
function isUrl(text) { return URL_RE.test(text.trim()) }

const KNOWN_CORS_BLOCKED = [
  'mp.weixin.qq.com', 'weixin.qq.com',
  'zhihu.com', 'zhuanlan.zhihu.com',
  'juejin.cn', 'medium.com', 'notion.so', 'feishu.cn', 'larksuite.com',
]

const DOMAIN_TIPS = {
  'mp.weixin.qq.com': '微信公众号文章无法直接获取。\n请在微信/浏览器中打开文章，全选正文（Ctrl+A），复制后粘贴到下方。',
  'zhihu.com': '知乎需要登录才能抓取内容。\n请复制文章正文粘贴到下方。',
  'zhuanlan.zhihu.com': '知乎需要登录才能抓取内容。\n请复制文章正文粘贴到下方。',
  'medium.com': 'Medium 限制了直接访问。\n请复制文章正文粘贴到下方。',
}

function getBlockedDomain(url) {
  try {
    const hostname = new URL(url).hostname
    return KNOWN_CORS_BLOCKED.find((d) => hostname === d || hostname.endsWith('.' + d)) || null
  } catch { return null }
}

function getCORSTip(url) {
  try {
    const hostname = new URL(url).hostname
    for (const [domain, tip] of Object.entries(DOMAIN_TIPS)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return tip
    }
  } catch {}
  return '该网站不允许浏览器直接访问（CORS 限制）。\n请手动复制文章正文，粘贴到下方输入框。'
}

export default function AddContentBar() {
  const { addArticle } = useAppStore()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [phase, setPhase] = useState('idle') // idle | fetching | parsing | done | cors | error
  const [errorMsg, setErrorMsg] = useState('')
  const [corsTip, setCorsTip] = useState('')
  const busyRef = useRef(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50)
  }, [open])

  const reset = () => {
    setValue('')
    setCustomTitle('')
    setPhase('idle')
    setErrorMsg('')
    setCorsTip('')
    busyRef.current = false
  }

  const close = () => { reset(); setOpen(false) }

  // ── URL 方式（手动触发）───────────────────────────────────────────────────
  const handleUrl = async (url) => {
    const hasProxy = (() => {
      try { return !!JSON.parse(localStorage.getItem('ai-workbench-storage') || '{}')?.state?.proxyUrl } catch { return false }
    })()

    const blockedDomain = getBlockedDomain(url)
    if (!hasProxy && blockedDomain) {
      setCorsTip(getCORSTip(url))
      setPhase('cors')
      busyRef.current = false
      return
    }

    setPhase('fetching')
    try {
      const pageText = await tryFetchUrl(url)
      setPhase('parsing')
      const article = await parseContent(pageText)
      article.url = url
      article.source = new URL(url).hostname.replace('www.', '')
      article.feedSource = 'manual'
      if (customTitle.trim()) article.title = customTitle.trim()
      addArticle(article)
      setPhase('done')
      setTimeout(close, 1200)
    } catch (err) {
      if (err.message === 'CORS_BLOCKED') {
        setCorsTip(getCORSTip(url))
        setPhase('cors')
      } else if (err.message === 'AUTH_BLOCKED') {
        setCorsTip('该网站需要登录才能获取内容（如微信、知乎付费文章），代理也无法绕过。\n请在浏览器/微信中打开文章，复制正文后粘贴到下方。')
        setPhase('cors')
      } else {
        setErrorMsg(err.message)
        setPhase('error')
      }
    } finally {
      busyRef.current = false
    }
  }

  // ── 全文方式 ──────────────────────────────────────────────────────────────
  const handleText = async (text) => {
    setPhase('parsing')
    try {
      const article = await parseContent(text)
      article.feedSource = 'manual'
      if (customTitle.trim()) article.title = customTitle.trim()
      addArticle(article)
      setPhase('done')
      setTimeout(close, 1200)
    } catch (err) {
      setErrorMsg(err.message)
      setPhase('error')
    } finally {
      busyRef.current = false
    }
  }

  // ── 仅保存链接 ────────────────────────────────────────────────────────────
  const handleSaveLinkOnly = () => {
    const url = value.trim()
    if (!url || !isUrl(url)) return
    const hostname = (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return url } })()
    addArticle({
      title: customTitle.trim() || hostname,
      source: hostname,
      url,
      content: '',
      summary: '',
      tags: [],
      linkOnly: true,
      feedSource: 'manual',
    })
    setPhase('done')
    setTimeout(close, 1000)
  }

  // ── 手动提交 ──────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const text = value.trim()
    if (!text || busyRef.current) return
    busyRef.current = true
    if (isUrl(text)) {
      handleUrl(text)
    } else {
      handleText(text)
    }
  }

  // ── CORS 状态下粘贴全文 ────────────────────────────────────────────────────
  const handleCorsTextPaste = (pasted) => {
    if (!pasted || busyRef.current) return
    busyRef.current = true
    setValue(pasted)
    setPhase('idle')
    setTimeout(() => handleText(pasted), 80)
  }

  const isBusy = phase === 'fetching' || phase === 'parsing'
  const detectedUrl = isUrl(value.trim())

  return (
    <>
      <button className="add-content-btn" onClick={() => setOpen(true)}>
        <span>＋</span>
        <span>添加内容</span>
      </button>

      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !isBusy && close()}>
          <div className="add-modal">
            <div className="add-modal-header">
              <p className="add-modal-title">添加到精选信息</p>
              <button className="add-modal-close" onClick={close} disabled={isBusy}>×</button>
            </div>

            {/* 方式说明 */}
            {phase !== 'cors' && (
              <div className="add-modal-tips">
                <span className="tip-chip">① 粘贴文章全文 → AI 自动解析</span>
                <span className="tip-chip">② 粘贴 URL → 选择解析或存链接</span>
              </div>
            )}

            {/* CORS 提示 */}
            {phase === 'cors' && (
              <div className="status-cors" style={{ marginBottom: 10 }}>
                {corsTip.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: i === 0 ? 0 : '4px 0 0' }}>
                    {i === 0 ? '⚠️ ' : '👉 '}{line}
                  </p>
                ))}
              </div>
            )}

            {/* 自定义标题 */}
            <input
              className="add-modal-title-input"
              placeholder="标题 / 备注（选填，留空则自动提取）"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              disabled={isBusy}
            />

            {/* 内容输入 */}
            <textarea
              ref={textareaRef}
              className="add-modal-textarea"
              placeholder={phase === 'cors' ? '在此粘贴文章正文...' : '粘贴文章全文或 URL...'}
              rows={7}
              value={phase === 'cors' ? '' : value}
              onChange={(e) => {
                if (phase === 'cors') {
                  setValue(e.target.value)
                  if (e.target.value) setPhase('idle')
                } else {
                  setValue(e.target.value)
                }
              }}
              onPaste={(e) => {
                if (phase === 'cors') {
                  const pasted = e.clipboardData.getData('text')?.trim()
                  if (pasted) { e.preventDefault(); handleCorsTextPaste(pasted) }
                }
                // 不再自动触发，等用户手动点按钮
              }}
              disabled={isBusy}
            />

            {/* 状态提示 */}
            <div className="add-modal-status">
              {phase === 'idle' && value && (
                <span className="status-hint">
                  {detectedUrl
                    ? '🔗 识别为 URL，请选择：解析内容 或 仅存链接'
                    : `📄 识别为全文（${value.length} 字），点击「解析并添加」`}
                </span>
              )}
              {phase === 'fetching' && <span className="status-loading"><span className="add-spinner" />正在尝试获取网页内容...</span>}
              {phase === 'parsing'  && <span className="status-loading"><span className="add-spinner" />Claude 正在生成摘要和标签...</span>}
              {phase === 'done'     && <span className="status-done">✓ 已添加到精选信息</span>}
              {phase === 'error'    && <span className="status-error">❌ {errorMsg}</span>}
            </div>

            {/* 操作按钮 */}
            <div className="add-modal-actions">
              {(phase === 'idle' || phase === 'error') && (
                <>
                  <button className="modal-cancel" onClick={close}>取消</button>
                  {detectedUrl && phase === 'idle' && (
                    <button className="modal-cancel" onClick={handleSaveLinkOnly}>
                      🔗 仅存链接
                    </button>
                  )}
                  <button className="modal-confirm" onClick={handleSubmit} disabled={!value.trim()}>
                    {detectedUrl ? '解析内容' : '解析并添加'}
                  </button>
                </>
              )}
              {phase === 'cors' && (
                <>
                  <button className="modal-cancel" onClick={close}>关闭</button>
                  {isUrl(value.trim()) && (
                    <button className="modal-confirm" onClick={handleSaveLinkOnly}>🔗 仅存链接</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

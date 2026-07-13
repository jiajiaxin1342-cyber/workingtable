/**
 * 本地文件数据存储桥接层
 *
 * 原理：
 * - 开发模式（npm run dev）：通过 Vite dev server 提供的 API 读写 data/storage.json
 * - 生产模式：仅导出/导入本地 JSON 文件（浏览器无法直接读写文件系统）
 *
 * 数据流：
 *   localStorage（运行时）→ 前端请求 → Vite 插件 → data/storage.json（磁盘）
 *   启动时：data/storage.json → Vite 插件 → 前端 → localStorage
 */

const DATA_API = '/__data-api__'

// ── 读取文件数据 ──────────────────────────────────────────────────────────────

/**
 * 从 data/storage.json 读取数据
 * @returns {Promise<object|null>} 解析后的数据对象，失败返回 null
 */
export async function loadFromFile() {
  try {
    const res = await fetch(`${DATA_API}/read`)
    if (!res.ok) return null
    const json = await res.json()
    return json?.state ?? json ?? null
  } catch {
    // 生产环境或服务器不可用时静默失败
    return null
  }
}

// ── 写入文件 ─────────────────────────────────────────────────────────────────

let _debounceTimer = null
const DEBOUNCE_MS = 2000 // 2 秒防抖，避免频繁写入磁盘

/**
 * 将 localStorage 数据同步写入 data/storage.json
 * 内置防抖：2 秒内的多次调用只执行最后一次
 */
export function syncToFile() {
  // 只在浏览器环境执行
  if (typeof window === 'undefined') return

  clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(() => {
    const raw = localStorage.getItem('ai-workbench-storage')
    if (!raw) return

    fetch(`${DATA_API}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    }).catch(() => {
      // 静默失败，不影响主流程
    })
  }, DEBOUNCE_MS)
}

/**
 * 立即同步（不等待防抖），用于关闭页面等场景
 */
export function syncToFileNow() {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem('ai-workbench-storage')
  if (!raw) return

  // 使用 sendBeacon 确保页面关闭时数据也能发出
  if (navigator.sendBeacon) {
    const blob = new Blob([raw], { type: 'application/json' })
    navigator.sendBeacon(`${DATA_API}/write`, blob)
  }
}

// ── 导出 JSON 到本地文件（浏览器下载） ──────────────────────────────────────

export function exportBackupFile() {
  const raw = localStorage.getItem('ai-workbench-storage')
  if (!raw) return false
  const date = new Date().toISOString().split('T')[0]
  const blob = new Blob([raw], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workbench-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return true
}

// ── 监听 store 变化，自动同步 ────────────────────────────────────────────────

let _watchInterval = null

/**
 * 启动自动同步监听：轮询 localStorage 变化，有变化时自动写入文件
 */
export function startAutoSync() {
  if (_watchInterval) return
  let lastValue = localStorage.getItem('ai-workbench-storage') || ''

  _watchInterval = setInterval(() => {
    const current = localStorage.getItem('ai-workbench-storage') || ''
    if (current !== lastValue) {
      lastValue = current
      syncToFile()
    }
  }, 3000) // 每 3 秒检查一次
}

/**
 * 停止自动同步
 */
export function stopAutoSync() {
  if (_watchInterval) {
    clearInterval(_watchInterval)
    _watchInterval = null
  }
}

// 页面关闭时立即同步
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    syncToFileNow()
  })
}
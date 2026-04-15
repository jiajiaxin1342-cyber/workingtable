// ── 备份工具函数 ────────────────────────────────────────────────────────────

const STORAGE_KEY   = 'ai-workbench-storage'
const SNAPSHOT_PRE  = 'ai-workbench-snapshot-'
const MAX_SNAPSHOTS = 7

// ── 第一层：手动导出 / 导入 ──────────────────────────────────────────────────

/** 导出当前所有数据为 JSON 文件下载 */
export function exportBackup() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return false

  const date = new Date().toISOString().split('T')[0]
  const blob = new Blob([raw], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `workbench-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return true
}

/** 从 JSON 文件恢复（校验 + 写入 + 刷新页面） */
export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        JSON.parse(text) // 仅做格式校验
        // 在覆盖之前先保留一份快照
        const current = localStorage.getItem(STORAGE_KEY)
        if (current) {
          localStorage.setItem(SNAPSHOT_PRE + 'before-import', current)
        }
        localStorage.setItem(STORAGE_KEY, text)
        resolve()
        window.location.reload()
      } catch {
        reject(new Error('文件格式错误，请选择有效的备份 JSON 文件'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// ── 第二层：自动每日快照 ─────────────────────────────────────────────────────

/** 今日快照（每天首次打开时调用，已有则跳过） */
export function takeDailySnapshot() {
  const today = new Date().toISOString().split('T')[0]
  const key   = SNAPSHOT_PRE + today
  if (localStorage.getItem(key)) return // 今天已快照

  const current = localStorage.getItem(STORAGE_KEY)
  if (!current) return

  localStorage.setItem(key, current)
  pruneOldSnapshots()
}

/** 删除超出 MAX_SNAPSHOTS 上限的旧快照 */
function pruneOldSnapshots() {
  const keys = getAllSnapshotKeys()
  keys.slice(MAX_SNAPSHOTS).forEach((k) => localStorage.removeItem(k))
}

/** 获取所有快照 key（按日期倒序） */
function getAllSnapshotKeys() {
  return Object.keys(localStorage)
    .filter((k) => k.startsWith(SNAPSHOT_PRE) && k !== SNAPSHOT_PRE + 'before-import')
    .sort()
    .reverse()
}

/** 获取快照列表（供 UI 展示） */
export function getSnapshots() {
  return getAllSnapshotKeys().map((key) => {
    const date    = key.replace(SNAPSHOT_PRE, '')
    const raw     = localStorage.getItem(key)
    let itemCount = 0
    try {
      const parsed = JSON.parse(raw)
      const s = parsed?.state ?? parsed
      itemCount =
        (s?.drafts?.observation?.length ?? 0) +
        (s?.products?.length ?? 0) +
        (s?.hypotheses?.length ?? 0) +
        (s?.quickNotes?.length ?? 0)
    } catch {}
    return { key, date, itemCount }
  })
}

/** 从某条快照恢复（覆盖当前数据后刷新） */
export function restoreSnapshot(key) {
  const data = localStorage.getItem(key)
  if (!data) return false
  // 恢复前先保存当前状态
  const current = localStorage.getItem(STORAGE_KEY)
  if (current) localStorage.setItem(SNAPSHOT_PRE + 'before-restore', current)
  localStorage.setItem(STORAGE_KEY, data)
  window.location.reload()
  return true
}

import { useState, useRef, useEffect } from 'react'
import useAppStore, { SCENES } from '../store/appStore'
import { exportBackup, importBackup, getSnapshots, restoreSnapshot } from '../utils/backup'

// ── 备份下拉面板 ──────────────────────────────────────────────────────────────

function BackupDropdown({ onClose }) {
  const fileRef = useRef(null)
  const [snapshots,    setSnapshots]    = useState([])
  const [importError,  setImportError]  = useState('')
  const [restoreId,    setRestoreId]    = useState(null) // 二次确认的 key
  const [exported,     setExported]     = useState(false)

  useEffect(() => {
    setSnapshots(getSnapshots())
  }, [])

  const handleExport = () => {
    exportBackup()
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importBackup(file)
    } catch (err) {
      setImportError(err.message)
      setTimeout(() => setImportError(''), 4000)
    }
    e.target.value = ''
  }

  const handleRestore = (key) => {
    if (restoreId === key) {
      restoreSnapshot(key)
    } else {
      setRestoreId(key)
      setTimeout(() => setRestoreId(null), 3000)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const today = new Date().toISOString().split('T')[0]
    if (dateStr === today) return '今天'
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dateStr === yesterday) return '昨天'
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <div className="backup-dropdown">
      {/* 第一层：手动备份 */}
      <div className="backup-section-title">手动备份</div>

      <button className="backup-action-btn export" onClick={handleExport}>
        {exported ? '✓ 已下载' : '⬇ 导出 JSON 文件'}
      </button>

      <button className="backup-action-btn import" onClick={() => fileRef.current?.click()}>
        ⬆ 从文件恢复
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {importError && (
        <p className="backup-error">{importError}</p>
      )}

      {/* 第二层：自动快照 */}
      <div className="backup-section-title" style={{ marginTop: 14 }}>
        自动快照
        <span className="backup-section-hint">每天首次打开时自动保存</span>
      </div>

      {snapshots.length === 0 ? (
        <p className="backup-empty">暂无快照，明天打开后会生成第一条</p>
      ) : (
        <div className="backup-snapshot-list">
          {snapshots.map((s) => (
            <div key={s.key} className="backup-snapshot-row">
              <div className="backup-snapshot-info">
                <span className="backup-snapshot-date">{formatDate(s.date)}</span>
                <span className="backup-snapshot-count">{s.itemCount} 条记录</span>
              </div>
              <button
                className={`backup-restore-btn ${restoreId === s.key ? 'confirm' : ''}`}
                onClick={() => handleRestore(s.key)}
              >
                {restoreId === s.key ? '确认恢复？' : '恢复'}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="backup-tip">最多保留 7 天快照，恢复前会自动保存当前状态</p>
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function TopBar() {
  const activeScene  = useAppStore((s) => s.activeScene)
  const theme        = useAppStore((s) => s.theme)
  const toggleTheme  = useAppStore((s) => s.toggleTheme)
  const scene        = SCENES.find((s) => s.id === activeScene)

  const [showBackup, setShowBackup] = useState(false)
  const backupRef = useRef(null)

  // 点击外部关闭
  useEffect(() => {
    if (!showBackup) return
    const handler = (e) => {
      if (backupRef.current && !backupRef.current.contains(e.target)) {
        setShowBackup(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showBackup])

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="topbar-icon">{scene?.icon}</span>
        <h1>{scene?.label}</h1>
      </div>
      <div className="topbar-actions">
        {/* 备份按钮 */}
        <div className="backup-wrapper" ref={backupRef}>
          <button
            className={`backup-btn ${showBackup ? 'active' : ''}`}
            onClick={() => setShowBackup((v) => !v)}
            title="数据备份"
          >
            🛡
          </button>
          {showBackup && <BackupDropdown onClose={() => setShowBackup(false)} />}
        </div>

        {/* 日夜切换 */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <span className="badge">beta</span>
      </div>
    </header>
  )
}

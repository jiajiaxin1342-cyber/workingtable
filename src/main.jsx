import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { pullFromCloud, isCloudEnabled } from './storage/supabaseClient'

// ── 启动前数据恢复优先级 ──
// 1. localStorage 有数据 → 直接渲染（最快，无闪烁）
// 2. localStorage 为空 + Supabase 启用 → 从云端拉取
// 3. localStorage 为空 + dev server → 从 data/storage.json 拉取
// 4. 都没有 → 直接渲染空状态

function renderApp() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

function restoreAndRender() {
  // 先尝试 Supabase 云端
  if (isCloudEnabled()) {
    pullFromCloud().then((cloudData) => {
      if (cloudData) {
        localStorage.setItem('ai-workbench-storage', JSON.stringify({
          state: cloudData,
          version: 0,
        }))
        window.location.reload()
        return
      }
      // 云端没数据，尝试本地文件
      restoreFromFile()
    }).catch(() => {
      restoreFromFile()
    })
    return
  }

  restoreFromFile()
}

function restoreFromFile() {
  fetch('/__data-api__/read')
    .then((res) => res.ok ? res.json() : null)
    .then((fileJson) => {
      if (!fileJson) { renderApp(); return }
      const fileData = fileJson?.state ?? fileJson ?? null
      if (!fileData) { renderApp(); return }

      localStorage.setItem('ai-workbench-storage', JSON.stringify({
        state: fileData,
        version: 0,
      }))
      window.location.reload()
    })
    .catch(() => {
      renderApp()
    })
}

const localData = localStorage.getItem('ai-workbench-storage')

if (localData) {
  // localStorage 已有数据，直接同步渲染
  renderApp()
  // 后台静默拉取云端数据，如果比本地新则更新
  if (isCloudEnabled()) {
    pullFromCloud().then((cloudData) => {
      if (!cloudData) return
      // 简单策略：如果云端有数据且本地数据较旧，用云端覆盖
      // 这里先不做自动覆盖，避免数据丢失，用户可在设置中手动同步
    })
  }
} else {
  // localStorage 为空，走异步恢复
  restoreAndRender()
}
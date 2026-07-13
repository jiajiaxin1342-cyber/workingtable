import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── 启动前：尝试从本地文件恢复数据 ──
// 仅当 localStorage 为空时才走异步恢复流程，否则直接同步渲染（避免闪烁）

function renderApp() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

const localData = localStorage.getItem('ai-workbench-storage')

if (localData) {
  // localStorage 已有数据，直接同步渲染（无闪烁）
  renderApp()
} else {
  // localStorage 为空，尝试从 data/storage.json 异步恢复
  fetch('/__data-api__/read')
    .then((res) => res.ok ? res.json() : null)
    .then((fileJson) => {
      if (!fileJson) { renderApp(); return }
      const fileData = fileJson?.state ?? fileJson ?? null
      if (!fileData) { renderApp(); return }

      // 写入 localStorage（zustand persist 格式），然后渲染
      localStorage.setItem('ai-workbench-storage', JSON.stringify({
        state: fileData,
        version: 0,
      }))
      // 需要刷新一次让 zustand rehydrate
      window.location.reload()
    })
    .catch(() => {
      // dev server 不可用或生产环境，直接渲染
      renderApp()
    })
}

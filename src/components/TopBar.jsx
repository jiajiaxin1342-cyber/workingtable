import useAppStore, { SCENES } from '../store/appStore'

export default function TopBar() {
  const activeScene  = useAppStore((s) => s.activeScene)
  const theme        = useAppStore((s) => s.theme)
  const toggleTheme  = useAppStore((s) => s.toggleTheme)
  const scene = SCENES.find((s) => s.id === activeScene)

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="topbar-icon">{scene?.icon}</span>
        <h1>{scene?.label}</h1>
      </div>
      <div className="topbar-actions">
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

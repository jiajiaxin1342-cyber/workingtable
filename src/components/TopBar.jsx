import useAppStore, { SCENES } from '../store/appStore'

export default function TopBar() {
  const activeScene = useAppStore((s) => s.activeScene)
  const scene = SCENES.find((s) => s.id === activeScene)

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="topbar-icon">{scene?.icon}</span>
        <h1>{scene?.label}</h1>
      </div>
      <div className="topbar-actions">
        <span className="badge">beta</span>
      </div>
    </header>
  )
}

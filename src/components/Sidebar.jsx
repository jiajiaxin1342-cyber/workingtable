import useAppStore, { SCENES } from '../store/appStore'

const MAIN_SCENES = SCENES.filter((s) => s.id !== 'settings')
const SETTINGS_SCENE = SCENES.find((s) => s.id === 'settings')

export default function Sidebar() {
  const { activeScene, setActiveScene } = useAppStore()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">AI 工作台</span>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">场景</p>
        {MAIN_SCENES.map((scene) => (
          <button
            key={scene.id}
            className={`nav-item ${activeScene === scene.id ? 'active' : ''}`}
            onClick={() => setActiveScene(scene.id)}
          >
            <span className="nav-icon">{scene.icon}</span>
            <span>{scene.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {SETTINGS_SCENE && (
          <button
            className={`nav-item ${activeScene === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveScene('settings')}
          >
            <span className="nav-icon">{SETTINGS_SCENE.icon}</span>
            <span>{SETTINGS_SCENE.label}</span>
          </button>
        )}
        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>Claude 已连接</span>
        </div>
      </div>
    </aside>
  )
}

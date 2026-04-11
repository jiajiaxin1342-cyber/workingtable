import { useEffect } from 'react'
import useAppStore from './store/appStore'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import KnowledgeScene from './components/KnowledgeScene'
import MentorChat from './components/MentorChat'
import Settings from './components/Settings'
import StartupScene from './components/startup/StartupScene'
import InfluenceScene from './components/influence/InfluenceScene'
import './App.css'

function App() {
  const activeScene = useAppStore((s) => s.activeScene)
  const createBackup = useAppStore((s) => s.createBackup)
  const theme = useAppStore((s) => s.theme)

  // 每次启动时自动保存一份快照（最多保留5份）
  useEffect(() => { createBackup() }, [])

  // 将主题写入 html 根节点的 data-theme 属性
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme ?? 'dark')
  }, [theme])
  const mentorPanelOpen = useAppStore((s) => s.mentorPanelOpen)
  const toggleMentorPanel = useAppStore((s) => s.toggleMentorPanel)
  const isSettings = activeScene === 'settings'

  return (
    <div className="app-layout">
      {/* 左侧边栏 200px */}
      <Sidebar />

      {/* 主内容区（含写作台） */}
      <div className="main-area">
        <TopBar />
        <div className="main-with-writer">
          <main className="main-content">
            {activeScene === 'knowledge' && <KnowledgeScene />}
            {activeScene === 'influence' && <InfluenceScene />}
            {activeScene === 'startup'   && <StartupScene />}
            {isSettings && <Settings />}
          </main>

        </div>
      </div>

      {/* 右侧 AI 导师（设置页隐藏） */}
      {!isSettings && mentorPanelOpen && <MentorChat />}

      {/* 导师收起时的展开条 */}
      {!isSettings && !mentorPanelOpen && (
        <button className="mentor-collapsed-strip" onClick={toggleMentorPanel} title="展开 AI 教练">
          <span className="mentor-collapsed-icon">🎓</span>
          <span className="mentor-collapsed-label">AI 教练</span>
        </button>
      )}
    </div>
  )
}

export default App

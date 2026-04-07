import useAppStore from './store/appStore'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import KnowledgeScene from './components/KnowledgeScene'
import ProductScene from './components/ProductScene'
import MentorChat from './components/MentorChat'
import './App.css'

function App() {
  const activeScene = useAppStore((s) => s.activeScene)

  return (
    <div className="app-layout">
      {/* 左侧边栏 200px */}
      <Sidebar />

      {/* 主内容区 */}
      <div className="main-area">
        <TopBar />
        <main className="main-content">
          {activeScene === 'knowledge' && <KnowledgeScene />}
          {activeScene === 'product' && <ProductScene />}
        </main>
      </div>

      {/* 右侧 AI 导师 280px */}
      <MentorChat />
    </div>
  )
}

export default App

import { useState } from 'react'
import WeeklyReviewTab from './WeeklyReviewTab'
import ProgressBoard from './ProgressBoard'
import StartupMottoTab from './StartupMottoTab'
import './startup.css'
import '../knowledge/knowledge.css'

const TABS = [
  { id: 'motto',    label: '原则' },
  { id: 'weekly',   label: '本周 Review' },
  { id: 'progress', label: '进度看板' },
]

export default function StartupScene() {
  const [activeTab, setActiveTab] = useState('motto')

  return (
    <div className="startup-scene">
      <div className="startup-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`startup-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="startup-content">
        {activeTab === 'weekly'   && <WeeklyReviewTab />}
        {activeTab === 'progress' && <ProgressBoard />}
        {activeTab === 'motto'    && <StartupMottoTab />}
      </div>
    </div>
  )
}

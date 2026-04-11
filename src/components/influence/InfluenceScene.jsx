import { useState } from 'react'
import useAppStore from '../../store/appStore'
import TopicPool from './TopicPool'
import InfluenceWriter from './InfluenceWriter'
import PublishLog from './PublishLog'
import './influence.css'
import '../knowledge/knowledge.css'

const TABS = [
  { id: 'topics', label: '选题池' },
  { id: 'writer', label: '写作台' },
  { id: 'logs',   label: '发布记录' },
]

export default function InfluenceScene() {
  const [activeTab, setActiveTab] = useState('topics')
  const setDraft = useAppStore((s) => s.setInfluenceWriterDraft)

  const handleStartWriting = (topic) => {
    setDraft({ topicId: topic.id, title: topic.title, type: topic.type, body: '' })
    setActiveTab('writer')
  }

  const handlePublished = () => {
    setActiveTab('logs')
  }

  return (
    <div className="k-scene">
      <div className="k-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`k-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={activeTab === 'writer'
        ? { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
        : { flex: 1, overflow: 'auto' }
      }>
        {activeTab === 'topics' && <TopicPool onStartWriting={handleStartWriting} />}
        {activeTab === 'writer' && <InfluenceWriter onPublished={handlePublished} />}
        {activeTab === 'logs'   && <PublishLog />}
      </div>
    </div>
  )
}

import { useState } from 'react'
import AnalysisTab from './product/AnalysisTab'
import SocialTab from './product/SocialTab'
import DocsTab from './product/DocsTab'
import './product/product.css'

const TABS = [
  { id: 'social',   label: '原则' },
  { id: 'analysis', label: '产品分析台' },
  { id: 'docs',     label: '我的文档' },
]

export default function ProductScene() {
  const [activeTab, setActiveTab] = useState('social')

  return (
    <div className="p-scene">
      <div className="p-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`p-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'analysis' && <AnalysisTab />}
        {activeTab === 'social' && <SocialTab />}
        {activeTab === 'docs' && <DocsTab />}
      </div>
    </div>
  )
}

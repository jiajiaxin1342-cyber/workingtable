import useAppStore from '../../store/appStore'

const STATUS_OPTIONS = [
  { value: 'not_started', label: '未启动' },
  { value: 'in_progress', label: '进行中' },
  { value: 'stable',      label: '稳定推进' },
]

const LEVEL_LABELS = ['', '刚起步', '有进展', '中等', '较好', '很强']

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function ProgressCard({ item }) {
  const updateProgressItem = useAppStore((s) => s.updateProgressItem)

  const update = (patch) => updateProgressItem(item.id, patch)

  return (
    <div className="progress-card">
      <div className="progress-card-header">
        <span className="progress-card-label">{item.label}</span>
        <span className={`progress-status-tag ${item.status}`}>
          {STATUS_OPTIONS.find((o) => o.value === item.status)?.label}
        </span>
      </div>

      {/* 5 格进度块 */}
      <div className="progress-blocks">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`progress-block ${item.level >= n ? 'filled' : ''}`}
            onClick={() => update({ level: item.level === n ? n - 1 : n })}
            title={LEVEL_LABELS[n]}
          />
        ))}
      </div>

      <div className="progress-card-meta">
        <span className="progress-level-text">
          {item.level === 0 ? '尚未评级' : `Lv.${item.level} · ${LEVEL_LABELS[item.level]}`}
        </span>
        <select
          className="progress-status-select"
          value={item.status}
          onChange={(e) => update({ status: e.target.value })}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <textarea
        className="progress-card-note"
        rows={2}
        placeholder="备注（进展、卡点、下一步…）"
        value={item.note}
        onChange={(e) => update({ note: e.target.value })}
      />

      {item.updatedAt && (
        <p className="progress-updated">更新于 {formatDate(item.updatedAt)}</p>
      )}
    </div>
  )
}

export default function ProgressBoard() {
  const progressItems = useAppStore((s) => s.progressItems)

  return (
    <div className="progress-board">
      {progressItems.map((item) => (
        <ProgressCard key={item.id} item={item} />
      ))}
    </div>
  )
}

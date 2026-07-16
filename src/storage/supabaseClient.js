/**
 * Supabase 客户端
 *
 * 数据同步策略：
 * - localStorage 仍然作为主运行时存储（zustand persist）
 * - 每次数据变更后，异步同步到 Supabase（防抖 3 秒）
 * - 启动时从 Supabase 拉取最新数据，如果比 localStorage 新则覆盖
 *
 * 数据表结构（只需一张表）：
 *   user_data (
 *     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     device_id  text NOT NULL,          -- 设备标识
 *     data       jsonb NOT NULL,         -- 完整的 store state
 *     updated_at timestamptz DEFAULT now()
 *   )
 *
 * 同步规则：每个用户一条记录，按 updated_at 取最新
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null
let isEnabled = false

// 设备 ID（每个浏览器/设备唯一，存在 localStorage 里）
function getDeviceId() {
  let id = localStorage.getItem('__device_id__')
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    localStorage.setItem('__device_id__', id)
  }
  return id
}

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  isEnabled = true
}

// ── 从云端拉取数据 ──────────────────────────────────────────────────────────

export async function pullFromCloud() {
  if (!isEnabled) return null
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // 表还没创建或没数据
      return null
    }
    return data?.data ?? null
  } catch {
    return null
  }
}

// ── 推送数据到云端 ──────────────────────────────────────────────────────────

let _pushTimer = null
const PUSH_DEBOUNCE_MS = 3000

export function pushToCloud() {
  if (!isEnabled) return

  clearTimeout(_pushTimer)
  _pushTimer = setTimeout(async () => {
    const raw = localStorage.getItem('ai-workbench-storage')
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)
      const stateData = parsed?.state ?? parsed

      const deviceId = getDeviceId()

      // upsert：有就更新，没有就插入
      // 用 device_id 作为匹配键，每个设备一条记录
      const { error } = await supabase
        .from('user_data')
        .upsert(
          {
            device_id: deviceId,
            data: stateData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'device_id' }
        )

      if (error) {
        console.warn('[Supabase] push failed:', error.message)
      }
    } catch {
      // 静默失败
    }
  }, PUSH_DEBOUNCE_MS)
}

// ── 立即推送（页面关闭时） ──────────────────────────────────────────────────

export function pushToCloudNow() {
  if (!isEnabled) return
  const raw = localStorage.getItem('ai-workbench-storage')
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    const stateData = parsed?.state ?? parsed
    const deviceId = getDeviceId()

    // 用 Beacon API 发送（不保证到达，但尽力而为）
    const payload = JSON.stringify({
      device_id: deviceId,
      data: stateData,
      updated_at: new Date().toISOString(),
    })

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      // Supabase REST API 的 sendBeacon 方式
      const url = `${SUPABASE_URL}/rest/v1/user_data`
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      }
      // sendBeacon 不支持自定义 header，改用 fetch + keepalive
      fetch(url, {
        method: 'POST',
        headers,
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {}
}

// ── 是否启用云端同步 ────────────────────────────────────────────────────────

export function isCloudEnabled() {
  return isEnabled
}

// 页面关闭时推送
if (typeof window !== 'undefined' && isEnabled) {
  window.addEventListener('beforeunload', () => {
    pushToCloudNow()
  })
}
/**
 * Vite 插件：提供 data/storage.json 的本地读写 API
 *
 * 在 dev server 中插入两个 HTTP 接口：
 *   GET  /__data-api__/read  → 读取 data/storage.json 返回 JSON
 *   POST /__data-api__/write → 将请求体写入 data/storage.json
 *
 * 这样前端 localStorage 的数据就能同步到项目文件夹的文件中了。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'storage.json')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export default function dataStoragePlugin() {
  return {
    name: 'data-storage-plugin',

    configureServer(server) {
      // ── 读取接口 ──
      server.middlewares.use('/__data-api__/read', (_req, res) => {
        try {
          ensureDir()
          if (!fs.existsSync(DATA_FILE)) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'no data yet' }))
            return
          }
          const raw = fs.readFileSync(DATA_FILE, 'utf-8')
          const json = JSON.parse(raw)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(json))
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        }
      })

      // ── 写入接口 ──
      server.middlewares.use('/__data-api__/write', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }
        const chunks = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('end', () => {
          try {
            ensureDir()
            const body = Buffer.concat(chunks).toString('utf-8')
            // 校验是否为有效 JSON
            JSON.parse(body)
            fs.writeFileSync(DATA_FILE, body, 'utf-8')
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}
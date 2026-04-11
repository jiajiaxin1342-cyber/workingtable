# 技术决策记录

> 记录重要的技术选型和取舍，方便复盘和新成员理解

---

## 2026-04-07

### 纯前端 SPA，不设后端

**决定：** 整个应用是纯前端 React SPA，不部署任何后端服务器。

**理由：**
- 个人工作台，数据隐私优先，无需云端存储
- 减少维护成本，无需关注服务器运维
- Claude API 可通过 `anthropic-dangerous-direct-browser-access` 头直接在浏览器调用

**放弃的方案：**
- Next.js（有后端 API Routes）：过度设计，增加部署复杂度
- Express + React：需要维护两套代码和服务器

**风险：** API Key 暴露在前端，生产环境不建议这样做；个人工具可接受

---

### Zustand + localStorage persist

**决定：** 用 Zustand 管理全局状态，配合 `persist` 中间件自动同步 localStorage。

**理由：**
- 比 Redux 轻量，无需 boilerplate
- persist 中间件开箱即用，无需手动读写 localStorage
- 预留了 `USE_NOTION` 开关，后续可无缝切换到 Notion API

**放弃的方案：**
- Context + useReducer：大型状态树会造成性能问题
- Jotai/Recoil：社区相对小，文档不如 Zustand 完善

---

### Claude API 直接在浏览器调用（不走代理）

**决定：** 使用 `anthropic-dangerous-direct-browser-access` 请求头，直接在浏览器发起 Claude API 请求。

**理由：**
- 个人工具，无需后端中转
- 简化架构，减少延迟

**风险：** API Key 可在 Network 面板看到，仅限个人使用场景

---

### CORS 问题：Cloudflare Worker 代理（可选部署）

**决定：** 提供 `proxy-worker/index.js`，用户可选择性部署到 Cloudflare Worker，解决微信等网站的 CORS 限制。

**理由：**
- 免费（10万次/天）
- 代码极简（~40行），用户可自己审计
- 可选部署，不影响不需要此功能的用户

**放弃的方案：**
- 公共 CORS 代理服务（allorigins.win 等）：不稳定，有隐私风险
- 内置后端：增加维护负担

---

### 流式输出（Streaming）

**决定：** Claude API 调用统一使用流式输出（SSE），非结构化数据解析（parseContent、社媒评测）除外。

**理由：**
- 流式输出让对话体验更自然，不会有"卡顿感"
- 解析场景需要完整 JSON，不适合流式

**实现细节：** `callClaude(systemPrompt, messages, onChunk)` 为主函数，`callClaudeOnce` 用于需要完整响应的场景

---

### 对话历史：最多发送 20 条给 API，本地存 100 条

**决定：** API 请求只携带最近 20 条非 notice 消息；localStorage 最多保留 100 条，超出后裁剪最旧的 20%。

**理由：**
- Claude API 按 token 计费，避免无谓的历史 token 消耗
- 100 条足够回溯近期对话，不会撑爆 localStorage（约 100KB）

---

### notice 消息类型（场景切换分隔线）

**决定：** 对话历史中增加 `role: 'notice'` 类型消息，用于场景切换分隔、周报标记等，不发给 API。

**理由：**
- 不污染 API 上下文
- 提供视觉分隔，改善可读性
- 过滤规则简单：发送前 `filter(m => m.role !== 'notice')`

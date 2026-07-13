import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { notionStorage } from '../storage/notion'
import { syncToFile } from '../storage/dataStore'

// ── 存储后端开关 ───────────────────────────────────────────────────────────────
// 设为 true 时，写操作会同步调用 notionStorage（Notion API），读操作依然从 localStorage 启动
// 切换前请先在 .env 配置 VITE_NOTION_TOKEN 和 VITE_NOTION_DATABASE_ID
const USE_NOTION = false

// ── 常量 ──────────────────────────────────────────────────────────────────────

export const SCENES = [
  { id: 'knowledge', label: '创业飞轮', icon: '📚' },
  { id: 'influence', label: '影响力飞轮', icon: '🌐' },
  { id: 'startup',   label: '周度复盘',  icon: '🚀' },
  { id: 'settings',  label: '设置',      icon: '⚙️' },
]

const DEFAULT_DIMENSIONS = [
  { id: 1, name: '核心体验', level: 0, desc: '' },
  { id: 2, name: '产品设计', level: 0, desc: '' },
  { id: 3, name: 'AI 交互', level: 0, desc: '' },
  { id: 4, name: '商业模式', level: 0, desc: '' },
]

// 产品观默认值
const DEFAULT_POV = {
  verdict: '',           // 一句话判断
  pros: ['', '', ''],    // 做对了什么（≤3条）
  cons: ['', '', ''],    // 做错了什么（≤3条）
  myTake: '',            // 如果是我
  viability: '',         // 商业存活性
  moat: '',              // 护城河
  opportunity: '',       // 机会雷达
}

// 对话历史每个场景最多保留 100 条（localStorage 限额保护）
const MAX_CHAT_HISTORY = 100

// ── 存储适配器：统一写操作接口 ─────────────────────────────────────────────────
// localStorage 写入由 zustand persist 自动处理，这里只负责可选的 Notion 同步
const sync = {
  saveArticle:  USE_NOTION ? notionStorage.saveArticle  : async () => {},
  updateArticle:USE_NOTION ? notionStorage.updateArticle: async () => {},
  deleteArticle:USE_NOTION ? notionStorage.deleteArticle: async () => {},
  saveKBItem:   USE_NOTION ? notionStorage.saveKBItem   : async () => {},
  removeKBItem: USE_NOTION ? notionStorage.removeKBItem : async () => {},
  saveProduct:  USE_NOTION ? notionStorage.saveProduct  : async () => {},
  saveReview:   USE_NOTION ? notionStorage.saveReview   : async () => {},
}

// ── Store ─────────────────────────────────────────────────────────────────────

const useAppStore = create(
  persist(
    (set, get) => ({

      // ════════════════════════════════════════
      // 场景导航
      // ════════════════════════════════════════

      // ════════════════════════════════════════
      // 主题  'dark' | 'light'
      // ════════════════════════════════════════

      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      activeScene: 'knowledge',
      setActiveScene: (scene) => set({ activeScene: scene }),

      // ════════════════════════════════════════
      // 对话历史  chatHistory[scene] = Message[]
      // Message: { role: 'user'|'assistant'|'notice', content: string }
      // ════════════════════════════════════════

      chatHistory: { knowledge: [], product: [] },

      addMessage: (scene, message) =>
        set((state) => {
          const current = state.chatHistory[scene] || []
          // 超出上限时丢弃最旧的消息（保留 notice 分隔线不计入上限）
          const nonNotice = current.filter((m) => m.role !== 'notice')
          const shouldTrim = nonNotice.length >= MAX_CHAT_HISTORY
          const trimmed = shouldTrim ? current.slice(Math.floor(MAX_CHAT_HISTORY * 0.2)) : current
          return {
            chatHistory: {
              ...state.chatHistory,
              [scene]: [...trimmed, message],
            },
          }
        }),

      clearHistory: (scene) =>
        set((state) => ({
          chatHistory: { ...state.chatHistory, [scene]: [] },
        })),

      // 向后兼容别名（旧组件使用 mentorChats/addMentorMessage/clearMentorChat）
      addMentorMessage: (scene, message) => get().addMessage(scene, message),
      clearMentorChat: (scene) => get().clearHistory(scene),

      // ════════════════════════════════════════
      // 写作台  writingContent[scene] = { title, body }
      // ════════════════════════════════════════

      writingPanelOpen: false,
      toggleWritingPanel: () => set((s) => ({ writingPanelOpen: !s.writingPanelOpen })),
      closeWritingPanel: () => set({ writingPanelOpen: false }),

      // 写作台激活 Tab
      writingActiveTab: 'product', // 'product' | 'insight' | 'observation'
      setWritingActiveTab: (tab) => set({ writingActiveTab: tab }),

      // 草稿箱  drafts[type][] = { id, title, body, createdAt, updatedAt }
      drafts: { product: [], insight: [], observation: [] },

      saveDraft: (type, title, body, extra = {}) => {
        const now = new Date().toISOString()
        const draft = { id: Date.now(), title: title.trim() || '无标题', body, createdAt: now, updatedAt: now, ...extra }
        set((s) => ({ drafts: { ...s.drafts, [type]: [draft, ...s.drafts[type]] } }))
        return draft.id
      },

      updateDraft: (type, id, { title, body }) => {
        set((s) => ({
          drafts: {
            ...s.drafts,
            [type]: s.drafts[type].map((d) =>
              d.id === id ? { ...d, title: title ?? d.title, body: body ?? d.body, updatedAt: new Date().toISOString() } : d
            ),
          },
        }))
      },

      deleteDraft: (type, id) =>
        set((s) => ({ drafts: { ...s.drafts, [type]: s.drafts[type].filter((d) => d.id !== id) } })),

      // 发送草稿到对应目标位置
      // product → addReview（我的文档），insight/observation → 标记 published
      publishDraft: (type, id) => {
        const draft = get().drafts[type]?.find((d) => d.id === id)
        if (!draft) return
        if (type === 'product') {
          const activeProductId = get().activeProductId
          if (!activeProductId) return
          get().addReview({
            productId: activeProductId,
            type: 'mine',
            source: '写作台',
            title: draft.title || '无标题',
            summary: (draft.body || '').replace(/#+\s/g, '').slice(0, 150),
            content: draft.body,
          })
          get().deleteDraft('product', id)
        } else {
          set((s) => ({
            drafts: {
              ...s.drafts,
              [type]: s.drafts[type].map((d) =>
                d.id === id
                  ? { ...d, status: 'published', publishedAt: new Date().toISOString() }
                  : d
              ),
            },
          }))
        }
      },

      // 知识库内文章阅读（子页面导航，不是 modal）
      readingArticleId: null,
      openArticleReader: (id) => set({ readingArticleId: id }),
      closeArticleReader: () => set({ readingArticleId: null }),

      // 知识库内 WebView（iframe 嵌入，覆盖场景内容区）
      webViewUrl: null,
      openWebView: (url) => set({ webViewUrl: url }),
      closeWebView: () => set({ webViewUrl: null }),

      // 写作台编辑器内容（按 tab 分存，持久化）
      writingContent: {
        product:     { title: '', body: '' },
        insight:     { title: '', body: '' },
        observation: { title: '', body: '' },
      },
      // editingDraftId: 当前正在编辑的草稿 id（null = 新草稿）
      editingDraftId: { product: null, insight: null, observation: null },

      setWritingContent: (tab, patch) =>
        set((s) => ({
          writingContent: { ...s.writingContent, [tab]: { ...s.writingContent[tab], ...patch } },
        })),

      setEditingDraftId: (tab, id) =>
        set((s) => ({ editingDraftId: { ...s.editingDraftId, [tab]: id } })),

      // ════════════════════════════════════════
      // 跨组件通信：外部触发导师消息
      // ════════════════════════════════════════

      pendingMentorMessage: null,
      triggerMentorMessage: (text) => set({ pendingMentorMessage: text }),
      clearPendingMentorMessage: () => set({ pendingMentorMessage: null }),

      // ════════════════════════════════════════
      // 文章  Article[]
      // { id, title, source, url, content, summary, tags, savedAt, isInKB }
      // ════════════════════════════════════════

      articles: [],

      addArticle: (article) => {
        const newArticle = {
          id: Date.now(),
          savedAt: new Date().toISOString(),
          isInKB: false,
          ...article,
        }
        set((state) => ({ articles: [newArticle, ...state.articles] }))
        sync.saveArticle(newArticle)
      },

      updateArticle: (id, patch) => {
        set((state) => ({
          articles: state.articles.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }))
        sync.updateArticle(id, patch)
      },

      deleteArticle: (id) => {
        set((state) => ({
          articles: state.articles.filter((a) => a.id !== id),
          kbItems: state.kbItems.filter((k) => k.articleId !== id),
        }))
        sync.deleteArticle(id)
      },

      // ════════════════════════════════════════
      // 知识库  KBItem[]
      // { id, articleId, tags, note, savedAt }
      // ════════════════════════════════════════

      kbItems: [],

      saveToKB: (articleId, tags, note) => {
        const item = {
          id: Date.now(),
          articleId,
          tags,
          note,
          savedAt: new Date().toISOString(),
        }
        set((state) => ({
          kbItems: [...state.kbItems, item],
          articles: state.articles.map((a) =>
            a.id === articleId ? { ...a, isInKB: true } : a
          ),
        }))
        sync.saveKBItem(item)
        sync.updateArticle(articleId, { isInKB: true })
      },

      removeFromKB: (kbId) => {
        const item = get().kbItems.find((k) => k.id === kbId)
        set((state) => ({
          kbItems: state.kbItems.filter((k) => k.id !== kbId),
          articles: item
            ? state.articles.map((a) =>
                a.id === item.articleId ? { ...a, isInKB: false } : a
              )
            : state.articles,
        }))
        sync.removeKBItem(kbId)
        if (item) sync.updateArticle(item.articleId, { isInKB: false })
      },

      // ════════════════════════════════════════
      // 学习目标  Goal
      // { title, startDate, targetDate }
      // ════════════════════════════════════════

      goal: { title: '', startDate: '', targetDate: '' },

      setGoal: (goal) => set({ goal }),

      updateProgress: (patch) =>
        set((state) => ({ goal: { ...state.goal, ...patch } })),

      // ════════════════════════════════════════
      // 产品  Product[]
      // { id, name, createdAt, dimensions: Dimension[] }
      // Dimension: { id, name, level: 0-5, desc }
      // ════════════════════════════════════════

      products: [],
      activeProductId: null,

      addProduct: (name) => {
        const product = {
          id: Date.now(),
          name,
          createdAt: new Date().toISOString(),
          dimensions: DEFAULT_DIMENSIONS.map((d) => ({ ...d })),
          pov: { ...DEFAULT_POV, pros: [...DEFAULT_POV.pros], cons: [...DEFAULT_POV.cons] },
        }
        set((state) => ({
          products: [...state.products, product],
          activeProductId: product.id,
        }))
        sync.saveProduct(product)
        return product.id
      },

      // 向后兼容别名
      createProduct: (name) => get().addProduct(name),

      updateProduct: (id, patch) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }))
        const updated = get().products.find((p) => p.id === id)
        if (updated) sync.saveProduct(updated)
      },

      // 向后兼容
      updateProductName: (id, name) => get().updateProduct(id, { name }),

      deleteProduct: (id) =>
        set((state) => {
          const remaining = state.products.filter((p) => p.id !== id)
          return {
            products: remaining,
            activeProductId:
              state.activeProductId === id ? (remaining[0]?.id ?? null) : state.activeProductId,
            reviews: state.reviews.filter((r) => r.productId !== id),
          }
        }),

      setActiveProduct: (id) => set({ activeProductId: id }),

      // 维度操作（product 的子结构，通过 updateProduct 触发 Notion 同步）
      updateDimension: (productId, dimId, patch) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id !== productId
              ? p
              : {
                  ...p,
                  dimensions: p.dimensions.map((d) =>
                    d.id === dimId ? { ...d, ...patch } : d
                  ),
                }
          ),
        }))
        const updated = get().products.find((p) => p.id === productId)
        if (updated) sync.saveProduct(updated)
      },

      addDimension: (productId) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id !== productId
              ? p
              : {
                  ...p,
                  dimensions: [
                    ...p.dimensions,
                    { id: Date.now(), name: '新维度', level: 0, desc: '' },
                  ],
                }
          ),
        }))
        const updated = get().products.find((p) => p.id === productId)
        if (updated) sync.saveProduct(updated)
      },

      deleteDimension: (productId, dimId) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id !== productId
              ? p
              : { ...p, dimensions: p.dimensions.filter((d) => d.id !== dimId) }
          ),
        }))
        const updated = get().products.find((p) => p.id === productId)
        if (updated) sync.saveProduct(updated)
      },

      // ════════════════════════════════════════
      // 评测记录  Review[]
      // { id, productId, type:'social'|'mine', source, title, summary, content?, savedAt }
      // ════════════════════════════════════════

      reviews: [],

      addReview: (review) => {
        const newReview = {
          id: Date.now(),
          savedAt: new Date().toISOString(),
          ...review,
        }
        set((state) => ({ reviews: [newReview, ...state.reviews] }))
        sync.saveReview(newReview)
      },

      deleteReview: (id) =>
        set((state) => ({ reviews: state.reviews.filter((r) => r.id !== id) })),

      // 更新产品观（POV）
      updateProductPov: (productId, patch) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id !== productId ? p : { ...p, pov: { ...(p.pov || DEFAULT_POV), ...patch } }
          ),
        }))
        const updated = get().products.find((p) => p.id === productId)
        if (updated) sync.saveProduct(updated)
      },

      // ════════════════════════════════════════
      // 信念追踪  Belief[]
      // { id, statement, createdAt, status, revisionNote, revisedAt }
      // status: 'holding' | 'updated' | 'disproven'
      // ════════════════════════════════════════

      beliefs: [],

      addBelief: (statement) => {
        const belief = {
          id: Date.now(),
          statement: statement.trim(),
          createdAt: new Date().toISOString(),
          status: 'holding',
          revisionNote: '',
          revisedAt: null,
        }
        set((state) => ({ beliefs: [belief, ...state.beliefs] }))
      },

      updateBelief: (id, patch) =>
        set((state) => ({
          beliefs: state.beliefs.map((b) =>
            b.id === id
              ? { ...b, ...patch, revisedAt: patch.status !== 'holding' ? new Date().toISOString() : b.revisedAt }
              : b
          ),
        })),

      deleteBelief: (id) =>
        set((state) => ({ beliefs: state.beliefs.filter((b) => b.id !== id) })),

      // ════════════════════════════════════════
      // 锐评时间记录
      // ════════════════════════════════════════

      lastCritiqueAt: null,
      setLastCritiqueAt: (iso) => set({ lastCritiqueAt: iso }),

      // ════════════════════════════════════════
      // API Key（运行时覆盖 .env，优先级更高）
      // ════════════════════════════════════════

      apiKey: '',
      setApiKey: (key) => set({ apiKey: key.trim() }),

      // CORS 代理地址（Cloudflare Worker URL）
      // 填入后，已知 CORS 封锁的网站将通过代理访问
      proxyUrl: '',
      setProxyUrl: (url) => set({ proxyUrl: url.trim().replace(/\/$/, '') }),

      // ════════════════════════════════════════
      // RSS 订阅源  RssFeed[]
      // { id, url, name, lastFetched? }
      // ════════════════════════════════════════

      rssFeeds: [],

      addRssFeed: (url, name) =>
        set((state) => ({
          rssFeeds: [
            ...state.rssFeeds,
            { id: Date.now(), url: url.trim(), name: name.trim() || url.trim() },
          ],
        })),

      updateRssFeed: (id, patch) =>
        set((state) => ({
          rssFeeds: state.rssFeeds.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        })),

      removeRssFeed: (id) =>
        set((state) => ({
          rssFeeds: state.rssFeeds.filter((f) => f.id !== id),
        })),

      // ════════════════════════════════════════
      // 座右铭  mottos[key] = { current, history: [{text, savedAt}] }
      // key: 'knowledge' | 'product'
      // ════════════════════════════════════════

      mottos: {
        knowledge: {
          current: '上游信号源很重要，但——真正的信号不在订阅源里，在人的行为异常里。\n\n一、如何找到值得分析的产品：\n（1）反常的增长：即刻、X 等社区的自发讨论；Product Hunt 单日 votes 异常高的产品。\n（2）你身边真实的抱怨：不只是不好用，更是重复的蠢事。\n（3）大产品砍掉的功能：科技媒体的报道、产品的高赞差评。\n（4）追踪钱的流向：36氪融资播报，同一赛道半年内出现 3 个以上种子轮。',
          history: [],
        },
        product: {
          current: '洞见不是看多了自然就有的，是「带着问题去看」逼出来的。\n\n光看信息永远形成不了洞见，因为大脑默认会接受表面解释。\n\n同一赛道连续分析 5 个产品，问自己：\n· 所有产品都在做同一个假设吗？\n· 有没有哪个玩家在做一个完全不同的赌注？\n· 如果这个赛道三年后格局大变，最可能的原因是什么？',
          history: [],
        },
        discovery: {
          current: '第一步：选一个你真的在研究的垂直方向\n         （不是泛泛的"AI"，而是"AI+某个方向"）\n\n第二步：开始输出你的真实判断\n         不需要很长，即刻/小红书/公众号都行\n         关键是：要有明确观点，不要只是转述信息\n         「我认为XX会在6个月内被谁颠覆，因为___」\n         这种内容会吸引真正同频的人\n\n第三步：主动评论比你认知高一点的人的内容\n         不是点赞，是写一条真实的、有延伸的评论\n         「你说的X我同意，但我观察到Y现象，可能说明___」\n         做10次，会有1-2个人主动来找你',
          history: [],
        },
        startup: {
          current: '跟着异常信号发现产品  [上游信息]\n→ 带着问题连续分析同赛道产品  [产品工坊]\n→ 形成有观点的判断  [产品工坊]\n→ 把判断输出出去（社媒、线下）\n→ 吸引同频的人\n→ 进入圈子\n→ 圈子里又会有更多异常信号流向你（社媒、线下）',
          history: [],
        },
      },

      updateMotto: (key, text) =>
        set((state) => {
          const prev = state.mottos?.[key] ?? { current: '', history: [] }
          const newHistory = prev.current.trim()
            ? [{ text: prev.current, savedAt: new Date().toISOString() }, ...prev.history]
            : prev.history
          return {
            mottos: {
              ...state.mottos,
              [key]: { current: text, history: newHistory },
            },
          }
        }),

      // ════════════════════════════════════════
      // 创业准备  WeeklyReview[]
      // { id, savedAt, q1, q2, q3, q4 }
      // ════════════════════════════════════════

      weeklyReviews: [],

      addWeeklyReview: ({ q1, q2, q3, q4 }) => {
        const review = {
          id: Date.now(),
          savedAt: new Date().toISOString(),
          q1: q1 || '',
          q2: q2 || '',
          q3: q3 || '',
          q4: q4 || '',
        }
        set((state) => ({ weeklyReviews: [review, ...state.weeklyReviews] }))
      },

      // ════════════════════════════════════════
      // 创业准备  ProgressItem[]（四个固定方向）
      // { id, label, level: 0-5, status, note, updatedAt }
      // ════════════════════════════════════════

      progressItems: [
        { id: 'internal_01', label: '大厂内 0→1 项目参与度',  level: 0, status: 'not_started', note: '', updatedAt: '' },
        { id: 'ai_skill_02', label: 'AI 工具动手能力',         level: 0, status: 'not_started', note: '', updatedAt: '' },
        { id: 'brand_03',    label: '个人品牌 / 网络建设',     level: 0, status: 'not_started', note: '', updatedAt: '' },
        { id: 'direction_04',label: '方向清晰度',              level: 0, status: 'not_started', note: '', updatedAt: '' },
      ],

      updateProgressItem: (id, patch) =>
        set((state) => ({
          progressItems: state.progressItems.map((item) =>
            item.id === id
              ? { ...item, ...patch, updatedAt: new Date().toISOString() }
              : item
          ),
        })),

      // ════════════════════════════════════════
      // 发现圈子 · 圈内备注  Contact[]
      // { id, nickname, role, note, createdAt }
      // ════════════════════════════════════════

      discoveryContacts: [],

      addDiscoveryContact: ({ nickname, role, note }) =>
        set((state) => ({
          discoveryContacts: [
            {
              id: Date.now(),
              nickname: nickname.trim(),
              role: role.trim(),
              note: note.trim(),
              createdAt: new Date().toISOString(),
            },
            ...state.discoveryContacts,
          ],
        })),

      updateDiscoveryContact: (id, patch) =>
        set((state) => ({
          discoveryContacts: state.discoveryContacts.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      deleteDiscoveryContact: (id) =>
        set((state) => ({
          discoveryContacts: state.discoveryContacts.filter((c) => c.id !== id),
        })),

      // ════════════════════════════════════════
      // AI 教练面板显隐
      // ════════════════════════════════════════

      mentorPanelOpen: true,
      toggleMentorPanel: () => set((s) => ({ mentorPanelOpen: !s.mentorPanelOpen })),

      // ════════════════════════════════════════
      // 速记小本  QuickNote[]
      // { id, text, createdAt, done }
      // ════════════════════════════════════════

      quickNotes: [],

      addQuickNote: (text) => {
        const note = { id: Date.now(), text: text.trim(), createdAt: new Date().toISOString(), done: false }
        set((s) => ({ quickNotes: [note, ...s.quickNotes] }))
      },

      deleteQuickNote: (id) =>
        set((s) => ({ quickNotes: s.quickNotes.filter((n) => n.id !== id) })),

      clearQuickNotes: () => set({ quickNotes: [] }),

      toggleQuickNoteDone: (id) =>
        set((s) => ({
          quickNotes: s.quickNotes.map((n) => n.id === id ? { ...n, done: !n.done } : n),
        })),

      // ════════════════════════════════════════
      // 假设验证  Hypothesis[]
      // { id, title, mvp, notes: [{id, content, createdAt}], createdAt }
      // ════════════════════════════════════════

      hypotheses: [],

      addHypothesis: ({ name, title, mvp }) => {
        const h = {
          id: Date.now(),
          name: (name || '').trim(),
          title: title.trim(),
          mvp: mvp.trim(),
          notes: [],
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ hypotheses: [h, ...s.hypotheses] }))
      },

      addHypothesisNote: (hypothesisId, content) =>
        set((s) => ({
          hypotheses: s.hypotheses.map((h) =>
            h.id !== hypothesisId ? h : {
              ...h,
              notes: [
                ...h.notes,
                { id: Date.now(), content: content.trim(), createdAt: new Date().toISOString() },
              ],
            }
          ),
        })),

      deleteHypothesisNote: (hypothesisId, noteId) =>
        set((s) => ({
          hypotheses: s.hypotheses.map((h) =>
            h.id !== hypothesisId ? h : { ...h, notes: h.notes.filter((n) => n.id !== noteId) }
          ),
        })),

      updateHypothesis: (id, patch) =>
        set((s) => ({
          hypotheses: s.hypotheses.map((h) =>
            h.id !== id ? h : { ...h, ...patch, updatedAt: new Date().toISOString() }
          ),
        })),

      deleteHypothesis: (id) =>
        set((s) => ({ hypotheses: s.hypotheses.filter((h) => h.id !== id) })),

      // ════════════════════════════════════════
      // 数据备份
      // ════════════════════════════════════════

      createBackup: () => {
        const stored = localStorage.getItem('ai-workbench-storage')
        if (!stored) return
        const KEY = 'ai-workbench-backups'
        const existing = JSON.parse(localStorage.getItem(KEY) || '[]')
        const backup = { timestamp: new Date().toISOString(), data: stored }
        const updated = [backup, ...existing].slice(0, 5)
        localStorage.setItem(KEY, JSON.stringify(updated))
      },

      downloadBackup: () => {
        const stored = localStorage.getItem('ai-workbench-storage')
        if (!stored) return
        const blob = new Blob([stored], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ai-workbench-backup-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      },

      // ════════════════════════════════════════
      // 影响力飞轮  Topic[] + PublishRecord[]
      // ════════════════════════════════════════

      topics: [],

      addTopic: ({ trigger = '', title, type = 'opinion', status = 'todo' }) =>
        set((s) => ({
          topics: [{
            id: Date.now(),
            trigger,
            title: (title || '').trim(),
            type,
            status,
            createdAt: new Date().toISOString(),
          }, ...s.topics],
        })),

      updateTopic: (id, patch) =>
        set((s) => ({
          topics: s.topics.map((t) => t.id === id ? { ...t, ...patch } : t),
        })),

      deleteTopic: (id) =>
        set((s) => ({ topics: s.topics.filter((t) => t.id !== id) })),

      publishLogs: [],

      addPublishLog: (log) =>
        set((s) => ({
          publishLogs: [{
            id: Date.now(),
            publishedAt: new Date().toISOString(),
            platform: '',
            title: '',
            topReaction: '',
            newTopicHint: '',
            ...log,
          }, ...s.publishLogs],
        })),

      updatePublishLog: (id, patch) =>
        set((s) => ({
          publishLogs: s.publishLogs.map((l) => l.id === id ? { ...l, ...patch } : l),
        })),

      // 写作台草稿（持久化，刷新后保留）
      influenceWriterDraft: { topicId: null, title: '', type: 'opinion', body: '' },
      setInfluenceWriterDraft: (patch) =>
        set((s) => ({ influenceWriterDraft: { ...s.influenceWriterDraft, ...patch } })),

      // 直接创建已发布的信号源便签（不经过写作台）
      addObservationNote: ({ noteType = '其它', title = '', body }) => {
        const now = new Date().toISOString()
        set((s) => ({
          drafts: {
            ...s.drafts,
            observation: [{
              id: Date.now(),
              type: 'observation',
              noteType,
              title: title.trim() || '无标题',
              body,
              status: 'published',
              publishedAt: now,
              updatedAt: now,
            }, ...(s.drafts.observation || [])],
          },
        }))
      },

      updateObservationNote: (id, patch) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            observation: (s.drafts.observation || []).map((d) =>
              d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
            ),
          },
        })),

      // 交换两条信号源便签的位置（传入各自 id）
      swapObservationNotes: (idA, idB) =>
        set((s) => {
          const arr = [...(s.drafts.observation || [])]
          const iA = arr.findIndex((n) => n.id === idA)
          const iB = arr.findIndex((n) => n.id === idB)
          if (iA === -1 || iB === -1) return s
          ;[arr[iA], arr[iB]] = [arr[iB], arr[iA]]
          return { drafts: { ...s.drafts, observation: arr } }
        }),

    }),
    {
      name: 'ai-workbench-storage',
      // 不持久化运行时临时状态
      partialize: (state) => {
        const { pendingMentorMessage, writingPanelOpen, writingActiveTab, readingArticleId, webViewUrl, editingDraftId, ...rest } = state
        return rest
      },
      // 每次数据持久化到 localStorage 后，自动同步写入本地文件
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error || !state) return
          // 延迟同步，等 store 完全初始化后再触发
          setTimeout(() => syncToFile(), 1000)
        }
      },
    }
  )
)

export default useAppStore

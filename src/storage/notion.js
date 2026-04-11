/**
 * Notion 存储接口（空壳）
 *
 * 这里后续接入 Notion API，当前用 localStorage 代替。
 *
 * 接入步骤（TODO）：
 * 1. 在 .env 中配置 VITE_NOTION_TOKEN 和 VITE_NOTION_DATABASE_ID
 * 2. 将各方法改为调用 Notion API（推荐通过后端代理，避免 token 泄露）
 * 3. 将 appStore.js 顶部的 USE_NOTION 改为 true
 *
 * Notion API 参考：https://developers.notion.com/reference/intro
 */

export const notionStorage = {
  // ── 文章 ──────────────────────────────────────────────────────────────────

  /**
   * 保存文章到 Notion 数据库
   * @param {Object} article - { id, title, source, url, summary, tags, savedAt, isInKB }
   */
  saveArticle: async (article) => {
    // TODO: 调用 Notion API 创建 page
    // POST https://api.notion.com/v1/pages
  },

  /**
   * 从 Notion 获取所有文章
   * @returns {Promise<Array>}
   */
  getArticles: async () => {
    // TODO: 调用 Notion API 查询数据库
    // POST https://api.notion.com/v1/databases/{database_id}/query
    return []
  },

  /**
   * 更新文章（如 isInKB 状态变更）
   * @param {string|number} id
   * @param {Object} patch
   */
  updateArticle: async (id, patch) => {
    // TODO: PATCH https://api.notion.com/v1/pages/{page_id}
  },

  /**
   * 删除文章（Notion 中归档 page）
   * @param {string|number} id
   */
  deleteArticle: async (id) => {
    // TODO: PATCH https://api.notion.com/v1/pages/{page_id}  { archived: true }
  },

  // ── 知识库条目 ────────────────────────────────────────────────────────────

  /**
   * 保存知识库条目
   * @param {Object} item - { id, articleId, tags, note, savedAt }
   */
  saveKBItem: async (item) => {
    // TODO: 创建关联 article 的 KB page
  },

  /**
   * 获取所有知识库条目
   * @returns {Promise<Array>}
   */
  getKBItems: async () => {
    // TODO: 查询 KB 数据库
    return []
  },

  /**
   * 删除知识库条目
   * @param {string|number} id
   */
  removeKBItem: async (id) => {
    // TODO: 归档对应 page
  },

  // ── 产品 ──────────────────────────────────────────────────────────────────

  /**
   * 保存 / 更新产品
   * @param {Object} product - { id, name, dimensions, createdAt }
   */
  saveProduct: async (product) => {
    // TODO: upsert product page
  },

  /**
   * 获取所有产品
   * @returns {Promise<Array>}
   */
  getProducts: async () => {
    return []
  },

  // ── 评测记录 ──────────────────────────────────────────────────────────────

  /**
   * 保存评测记录
   * @param {Object} review - { id, productId, type, source, title, summary, savedAt }
   */
  saveReview: async (review) => {
    // TODO: 创建关联 product 的 review page
  },

  /**
   * 获取指定产品的评测列表
   * @param {string|number} productId
   * @returns {Promise<Array>}
   */
  getReviews: async (productId) => {
    return []
  },
}

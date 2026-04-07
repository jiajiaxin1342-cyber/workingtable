import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 场景列表
export const SCENES = [
  { id: 'knowledge', label: '知识库', icon: '📚' },
  { id: 'product', label: '产品工坊', icon: '🛠️' },
]

const useAppStore = create(
  persist(
    (set, get) => ({
      // 当前激活场景
      activeScene: 'knowledge',
      setActiveScene: (scene) => set({ activeScene: scene }),

      // 导师对话历史（按场景分开存储）
      mentorChats: {
        knowledge: [],
        product: [],
      },
      addMentorMessage: (scene, message) =>
        set((state) => ({
          mentorChats: {
            ...state.mentorChats,
            [scene]: [...(state.mentorChats[scene] || []), message],
          },
        })),
      clearMentorChat: (scene) =>
        set((state) => ({
          mentorChats: {
            ...state.mentorChats,
            [scene]: [],
          },
        })),

      // 知识场景数据
      knowledgeItems: [],
      addKnowledgeItem: (item) =>
        set((state) => ({
          knowledgeItems: [{ id: Date.now(), ...item }, ...state.knowledgeItems],
        })),
      deleteKnowledgeItem: (id) =>
        set((state) => ({
          knowledgeItems: state.knowledgeItems.filter((i) => i.id !== id),
        })),

      // 产品场景数据
      productItems: [],
      addProductItem: (item) =>
        set((state) => ({
          productItems: [{ id: Date.now(), ...item }, ...state.productItems],
        })),
      deleteProductItem: (id) =>
        set((state) => ({
          productItems: state.productItems.filter((i) => i.id !== id),
        })),
    }),
    {
      name: 'ai-workbench-storage', // localStorage key
    }
  )
)

export default useAppStore

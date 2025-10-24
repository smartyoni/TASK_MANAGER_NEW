import { create } from 'zustand';
import type { Category } from '../types';
import { categoryQueries } from '../db/db';

interface CategoryState {
  categories: Category[];
  selectedCategoryId: string | null;
  isLoading: boolean;

  // 액션
  loadCategories: () => Promise<void>;
  selectCategory: (id: string) => void;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (categories: Category[]) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  selectedCategoryId: null,
  isLoading: false,

  loadCategories: async () => {
    set({ isLoading: true });
    try {
      const categories = await categoryQueries.getAll();
      set({
        categories,
        selectedCategoryId: categories[0]?.id || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  selectCategory: (id: string) => {
    set({ selectedCategoryId: id });
  },

  addCategory: async (name: string) => {
    try {
      const order = await categoryQueries.getAll().then((cats) => cats.length);
      const id = await categoryQueries.create({
        name,
        createdAt: new Date().toISOString(),
        order,
      });

      // UI 즉시 업데이트 (optimistic update)
      set((state) => ({
        categories: [
          ...state.categories,
          {
            id,
            name,
            createdAt: new Date().toISOString(),
            order,
          },
        ],
        selectedCategoryId: id,
      }));
    } catch (error) {
      console.error('카테고리 생성 실패:', error);
    }
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    try {
      await categoryQueries.update(id, updates);

      // UI 업데이트
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === id ? { ...cat, ...updates } : cat
        ),
      }));
    } catch (error) {
      console.error('카테고리 수정 실패:', error);
    }
  },

  deleteCategory: async (id: string) => {
    try {
      await categoryQueries.delete(id);

      // UI 업데이트
      set((state) => {
        const filtered = state.categories.filter((cat) => cat.id !== id);
        return {
          categories: filtered,
          selectedCategoryId: filtered[0]?.id || null,
        };
      });
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
    }
  },

  reorderCategories: async (categories: Category[]) => {
    try {
      const updates = categories.map((cat, index) => ({
        ...cat,
        order: index,
      }));

      for (const cat of updates) {
        await categoryQueries.update(cat.id, { order: cat.order });
      }

      set({ categories: updates });
    } catch (error) {
      console.error('카테고리 순서 변경 실패:', error);
    }
  },
}));

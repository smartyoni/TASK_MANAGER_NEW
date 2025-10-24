import { create } from 'zustand';
import type { Task, TaskStatus, Priority } from '../types';
import { taskQueries } from '../db/db';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;

  // 액션
  loadTasks: () => Promise<void>;
  getTasksByCategory: (categoryId: string) => Task[];
  getTasksByStatus: (categoryId: string, status: TaskStatus) => Task[];
  getTaskById: (id: string) => Task | undefined;
  addTask: (
    categoryId: string,
    title: string,
    priority?: Priority
  ) => Promise<string>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  updateTaskProgress: (id: string, progress: number) => Promise<void>;
  reorderTasks: (
    categoryId: string,
    status: TaskStatus,
    tasks: Array<{ id: string; order: number }>
  ) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await taskQueries.getAll();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('업무 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  getTasksByCategory: (categoryId: string) => {
    return get().tasks.filter((task) => task.categoryId === categoryId);
  },

  getTasksByStatus: (categoryId: string, status: TaskStatus) => {
    return get()
      .tasks.filter(
        (task) => task.categoryId === categoryId && task.status === status
      )
      .sort((a, b) => a.order - b.order);
  },

  getTaskById: (id: string) => {
    return get().tasks.find((task) => task.id === id);
  },

  addTask: async (categoryId: string, title: string, priority: Priority = 'medium') => {
    try {
      const categoryTasks = get().tasks.filter(
        (task) => task.categoryId === categoryId && task.status === 'todo'
      );
      const order = categoryTasks.length;

      const id = await taskQueries.create({
        categoryId,
        title,
        status: 'todo',
        progress: 0,
        priority,
        dueDate: null,
        order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      });

      // UI 즉시 업데이트
      const newTask: Task = {
        id,
        categoryId,
        title,
        status: 'todo',
        progress: 0,
        priority,
        dueDate: null,
        order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };

      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));

      return id;
    } catch (error) {
      console.error('업무 생성 실패:', error);
      throw error;
    }
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    try {
      await taskQueries.update(id, updates);

      // UI 업데이트
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ),
      }));
    } catch (error) {
      console.error('업무 수정 실패:', error);
    }
  },

  deleteTask: async (id: string) => {
    try {
      await taskQueries.delete(id);

      // UI 업데이트
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      console.error('업무 삭제 실패:', error);
    }
  },

  updateTaskStatus: async (id: string, status: TaskStatus) => {
    try {
      const task = get().getTaskById(id);
      if (!task) return;

      const updates: Partial<Task> = {
        status,
        updatedAt: new Date().toISOString(),
      };

      // 완료 상태로 변경 시
      if (status === 'done') {
        updates.completedAt = new Date().toISOString();
        updates.progress = 100;
      }

      await taskQueries.update(id, updates);

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }));
    } catch (error) {
      console.error('업무 상태 변경 실패:', error);
    }
  },

  updateTaskProgress: async (id: string, progress: number) => {
    try {
      // 10% 단위로 정렬
      const roundedProgress = Math.round(progress / 10) * 10;

      await taskQueries.update(id, {
        progress: roundedProgress,
      });

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, progress: roundedProgress } : task
        ),
      }));
    } catch (error) {
      console.error('진행률 업데이트 실패:', error);
    }
  },

  reorderTasks: async (
    categoryId: string,
    status: TaskStatus,
    tasks: Array<{ id: string; order: number }>
  ) => {
    try {
      await taskQueries.updateOrder(tasks);

      set((state) => ({
        tasks: state.tasks.map((task) => {
          const updated = tasks.find((t) => t.id === task.id);
          if (updated && task.categoryId === categoryId && task.status === status) {
            return { ...task, order: updated.order };
          }
          return task;
        }),
      }));
    } catch (error) {
      console.error('업무 순서 변경 실패:', error);
    }
  },
}));

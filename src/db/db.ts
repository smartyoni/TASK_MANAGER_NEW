import Dexie, { type Table } from 'dexie';
import type { Category, Task, TaskDetail, AppSettings } from '../types';

/**
 * TaskManager 데이터베이스
 * IndexedDB를 사용하여 로컬에 데이터 저장
 */
export class TaskManagerDB extends Dexie {
  categories!: Table<Category>;
  tasks!: Table<Task>;
  taskDetails!: Table<TaskDetail>;
  appSettings!: Table<AppSettings>;

  constructor() {
    super('TaskManager');
    this.version(1).stores({
      categories: '++id, order',
      tasks: '++id, categoryId, status, dueDate, [categoryId+status]',
      taskDetails: 'taskId',
      appSettings: 'id',
    });
  }
}

export const db = new TaskManagerDB();

/**
 * 데이터베이스 초기화
 */
export async function initializeDatabase() {
  try {
    // 앱 설정 초기화
    const settings = await db.appSettings.get('app-settings');
    if (!settings) {
      await db.appSettings.put({
        id: 'app-settings',
        theme: 'auto',
        language: 'ko',
        autoSave: true,
        autoSaveDelay: 3000,
        notifications: {
          dueDate: true,
          dailyReminder: false,
        },
        updatedAt: new Date().toISOString(),
      });
    }
    return true;
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    return false;
  }
}

/**
 * 카테고리 관련 쿼리
 */
export const categoryQueries = {
  async getAll() {
    return db.categories.orderBy('order').toArray();
  },

  async getById(id: string) {
    return db.categories.get(id);
  },

  async create(category: Omit<Category, 'id'>) {
    const id = crypto.randomUUID();
    await db.categories.add({ ...category, id });
    return id;
  },

  async update(id: string, updates: Partial<Category>) {
    await db.categories.update(id, updates);
  },

  async delete(id: string) {
    // 카테고리 삭제 시 모든 업무도 삭제
    const tasksToDelete = await db.tasks.where('categoryId').equals(id).toArray();
    for (const task of tasksToDelete) {
      await db.taskDetails.delete(task.id);
    }
    await db.tasks.where('categoryId').equals(id).delete();
    await db.categories.delete(id);
  },
};

/**
 * 업무 관련 쿼리
 */
export const taskQueries = {
  async getAll() {
    return db.tasks.toArray();
  },

  async getByCategoryAndStatus(categoryId: string, status: string) {
    return db.tasks
      .where('[categoryId+status]')
      .equals([categoryId, status])
      .toArray();
  },

  async getByCategory(categoryId: string) {
    return db.tasks.where('categoryId').equals(categoryId).toArray();
  },

  async getById(id: string) {
    return db.tasks.get(id);
  },

  async create(task: Omit<Task, 'id'>) {
    const id = crypto.randomUUID();
    await db.tasks.add({ ...task, id });
    // 업무 생성 시 상세 정보도 자동 생성
    await taskDetailQueries.create({
      taskId: id,
      plan: { text: '', checklist: [] },
      execution: { text: '', checklist: [] },
      updatedAt: new Date().toISOString(),
    });
    return id;
  },

  async update(id: string, updates: Partial<Task>) {
    await db.tasks.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async delete(id: string) {
    // 업무 삭제 시 상세 정보도 삭제
    await db.taskDetails.delete(id);
    await db.tasks.delete(id);
  },

  async updateOrder(tasks: Array<{ id: string; order: number }>) {
    for (const task of tasks) {
      await db.tasks.update(task.id, {
        order: task.order,
        updatedAt: new Date().toISOString(),
      });
    }
  },
};

/**
 * 업무 상세 정보 관련 쿼리
 */
export const taskDetailQueries = {
  async getByTaskId(taskId: string) {
    return db.taskDetails.get(taskId);
  },

  async create(detail: Omit<TaskDetail, 'id'>) {
    const taskDetail: TaskDetail = {
      id: detail.taskId,
      ...detail,
    };
    await db.taskDetails.put(taskDetail);
    return detail.taskId;
  },

  async update(taskId: string, updates: Partial<TaskDetail>) {
    await db.taskDetails.update(taskId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
};

/**
 * 설정 관련 쿼리
 */
export const settingsQueries = {
  async get() {
    return db.appSettings.get('app-settings');
  },

  async update(updates: Partial<AppSettings>) {
    await db.appSettings.update('app-settings', {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
};

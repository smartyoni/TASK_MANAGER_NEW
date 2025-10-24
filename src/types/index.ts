/**
 * 카테고리 모델
 */
export interface Category {
  id: string;
  name: string;
  createdAt: string;
  order: number;
}

/**
 * 체크리스트 항목
 */
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

/**
 * 섹션 (텍스트 + 체크리스트)
 */
export interface TaskSection {
  text: string;
  checklist: ChecklistItem[];
}

/**
 * 업무 상세 정보
 */
export interface TaskDetail {
  id: string;
  taskId: string;
  description: TaskSection;
  plan: TaskSection;
  execution: TaskSection;
  updatedAt: string;
}

/**
 * 업무 상태
 */
export type TaskStatus = 'todo' | 'plan' | 'progress' | 'done';

/**
 * 우선순위
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * 업무 모델
 */
export interface Task {
  id: string;
  categoryId: string;
  title: string;
  status: TaskStatus;
  progress: number;
  priority: Priority;
  dueDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/**
 * 앱 설정
 */
export interface AppSettings {
  id: 'app-settings';
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  autoSave: boolean;
  autoSaveDelay: number;
  notifications: {
    dueDate: boolean;
    dailyReminder: boolean;
  };
  updatedAt: string;
}

/**
 * 백업 파일 형식
 */
export interface BackupFile {
  version: string;
  exportDate: string;
  data: {
    categories: Category[];
    tasks: Task[];
    taskDetails: TaskDetail[];
  };
}

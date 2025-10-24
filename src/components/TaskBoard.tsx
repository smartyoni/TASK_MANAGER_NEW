import { useTaskStore } from '../store/taskStore';
import { useCategoryStore } from '../store/categoryStore';
import { TaskCard } from './TaskCard';
import type { TaskStatus } from '../types';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface TaskBoardProps {
  onTaskClick: (taskId: string) => void;
}

/**
 * 업무 보드 컴포넌트
 * 4개의 칼럼 (할 일, 계획, 진행 중, 완료)으로 업무를 표시
 */
export function TaskBoard({ onTaskClick }: TaskBoardProps) {
  const { getTasksByStatus } = useTaskStore();
  const { selectedCategoryId } = useCategoryStore();
  const { addTask } = useTaskStore();
  const [newTaskName, setNewTaskName] = useState<Record<TaskStatus, string>>({
    todo: '',
    plan: '',
    progress: '',
    done: '',
  });

  const statuses: Array<{ key: TaskStatus; label: string; color: string }> = [
    { key: 'todo', label: '할 일', color: 'red' },
    { key: 'plan', label: '계획', color: 'amber' },
    { key: 'progress', label: '진행 중', color: 'blue' },
    { key: 'done', label: '완료', color: 'green' },
  ];

  const handleAddTask = async (status: TaskStatus) => {
    const title = newTaskName[status].trim();
    if (!title || !selectedCategoryId) return;

    await addTask(selectedCategoryId, title);
    setNewTaskName((prev) => ({ ...prev, [status]: '' }));
  };

  if (!selectedCategoryId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">카테고리를 선택해주세요.</p>
      </div>
    );
  }

  const colorMap = {
    red: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100 text-red-900' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100 text-amber-900' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100 text-blue-900' },
    green: { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100 text-green-900' },
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 4칼럼 칸반 보드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statuses.map(({ key, label, color }) => {
          const tasks = getTasksByStatus(selectedCategoryId, key);
          const colors = colorMap[color as keyof typeof colorMap];

          return (
            <div key={key} className="flex flex-col">
              {/* 칼럼 헤더 */}
              <div className={`${colors.header} rounded-t-lg px-4 py-3 font-semibold text-sm`}>
                {label} ({tasks.length})
              </div>

              {/* 칼럼 본체 */}
              <div className={`flex-1 ${colors.bg} rounded-b-lg border-2 ${colors.border} p-4 min-h-96 space-y-3`}>
                {/* 업무 카드 목록 */}
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">업무가 없습니다</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
                  ))
                )}

                {/* 새 업무 추가 폼 */}
                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="업무 제목..."
                      value={newTaskName[key]}
                      onChange={(e) =>
                        setNewTaskName((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask(key);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleAddTask(key)}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="추가"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

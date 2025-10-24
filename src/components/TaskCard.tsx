import type { Task } from '../types';
import { MoreVertical, Trash2, ChevronRight } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onTaskClick: (taskId: string) => void;
}

/**
 * 업무 카드 컴포넌트
 */
export function TaskCard({ task, onTaskClick }: TaskCardProps) {
  const { deleteTask } = useTaskStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    if (confirm(`"${task.title}" 업무를 삭제하시겠습니까?`)) {
      deleteTask(task.id);
      setShowMenu(false);
    }
  };

  const priorityColor = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-gray-400',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDueToday = task.dueDate && task.dueDate === new Date().toISOString().split('T')[0];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return '오늘';
    }
    if (dateString === tomorrow.toISOString().split('T')[0]) {
      return '내일';
    }

    const daysLeft = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `D${daysLeft > 0 ? '-' : ''}${Math.abs(daysLeft)}`;
  };

  const borderColor = isOverdue ? 'border-l-red-500 bg-red-50' : isDueToday ? 'border-l-yellow-500' : 'border-l-blue-500';

  return (
    <div
      className={`bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow p-4 relative group ${borderColor}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* 제목 */}
          <h3 className="font-semibold text-gray-900 truncate text-sm">{task.title}</h3>

          {/* 진행률 바 */}
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>

          {/* 정보: 진행률, 마감일, 우선순위 */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">{task.progress}%</span>

            {task.dueDate && (
              <span
                className={`px-2 py-1 rounded ${
                  isOverdue
                    ? 'bg-red-100 text-red-700'
                    : isDueToday
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {formatDate(task.dueDate)}
              </span>
            )}

            {/* 우선순위 표시 */}
            <span className={`font-bold text-lg leading-none ${priorityColor[task.priority]}`}>
              ●
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 상세보기 버튼 */}
          <button
            onClick={() => onTaskClick(task.id)}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="상세보기"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>

          {/* 메뉴 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title="메뉴"
            >
              <MoreVertical size={18} className="text-gray-600" />
            </button>

            {/* 메뉴 드롭다운 */}
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useTaskStore } from '../store/taskStore';
import { useCategoryStore } from '../store/categoryStore';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SidebarProps {
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

// 드래그 가능한 작업 항목 컴포넌트
function DraggableTaskItem({
  task,
  selectedTaskId,
  onTaskSelect,
  onDelete,
  onContextMenu,
}: {
  task: any;
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  onDelete: (taskId: string, taskName: string) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
      key={task.id}
    >
      <button
        {...listeners}
        {...attributes}
        onClick={() => onTaskSelect(task.id)}
        onContextMenu={(e) => onContextMenu(e, task.id)}
        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between cursor-grab active:cursor-grabbing ${
          selectedTaskId === task.id
            ? 'bg-blue-500 text-white shadow-md border-2 border-blue-700'
            : 'bg-gray-50 border-2 border-gray-500 text-gray-900 hover:bg-gray-100 hover:border-gray-600'
        }`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate text-gray-950">{task.title}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className={`h-1 bg-gray-300 rounded-full flex-1 ${selectedTaskId === task.id ? 'bg-blue-300' : ''}`}>
              <div
                className={`h-full rounded-full transition-all ${selectedTaskId === task.id ? 'bg-white' : 'bg-blue-500'}`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${selectedTaskId === task.id ? 'text-blue-700' : 'text-gray-600'}`}>
              {task.progress}%
            </span>
          </div>
        </div>
      </button>

      {/* 삭제 버튼 */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id, task.title);
        }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center w-6 h-6 rounded transition-colors cursor-pointer ${
          selectedTaskId === task.id
            ? 'text-blue-200 hover:bg-blue-400'
            : 'text-red-600 hover:bg-red-100'
        }`}
        title="삭제"
      >
        <Trash2 size={14} />
      </div>
    </div>
  );
}

/**
 * 좌측 사이드바 - 선택된 카테고리의 작업 항목 리스트
 */
export function Sidebar({ selectedTaskId, onTaskSelect, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const { selectedCategoryId } = useCategoryStore();
  const { getTasksByCategory, addTask, deleteTask, reorderTasks, updateTask } = useTaskStore();
  const [newTaskName, setNewTaskName] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState<{ taskId: string; x: number; y: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tasks = selectedCategoryId ? getTasksByCategory(selectedCategoryId) : [];

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !selectedCategoryId) return;

    try {
      console.log('Adding task:', { categoryId: selectedCategoryId, title: newTaskName.trim() });
      const taskId = await addTask(selectedCategoryId, newTaskName.trim());
      console.log('Task added with ID:', taskId);
      setNewTaskName('');
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleDeleteTask = (taskId: string, taskName: string) => {
    if (confirm(`"${taskName}" 항목을 삭제하시겠습니까?`)) {
      deleteTask(taskId);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ taskId, x: e.clientX, y: e.clientY });
  };

  const handleEditTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newTitle = prompt('작업 항목명 수정:', task.title);
    if (newTitle && newTitle.trim() && newTitle !== task.title) {
      try {
        await updateTask(taskId, { title: newTitle.trim() });
      } catch (error) {
        console.error('작업 항목 수정 실패:', error);
        alert('수정에 실패했습니다.');
      }
    }
    setContextMenu(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(tasks, oldIndex, newIndex);
        const updates = newOrder.map((task, index) => ({
          id: task.id,
          order: index,
        }));

        if (selectedCategoryId) {
          await reorderTasks(selectedCategoryId, 'todo', updates);
        }
      }
    }
  };

  if (!selectedCategoryId) {
    return (
      <>
        {/* 모바일 오버레이 */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={onMobileClose}
          />
        )}

        {/* 사이드바 */}
        <div className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 md:w-64 bg-gray-50 border-r-2 border-gray-400 p-6
          flex items-center justify-center
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <p className="text-gray-500 text-center">카테고리를 선택해주세요</p>
        </div>
      </>
    );
  }

  React.useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <>
      {/* 모바일 오버레이 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* 사이드바 */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-80 md:w-64 bg-white border-r-2 border-gray-400
        flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* 헤더 */}
        <div className="p-4 border-b-2 border-gray-300 bg-orange-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">작업 항목 ({tasks.length})</h2>
          {/* 모바일 닫기 버튼 */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1 hover:bg-orange-200 rounded transition-colors"
            aria-label="사이드바 닫기"
          >
            <X size={20} />
          </button>
        </div>

      {/* 작업 리스트 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 p-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400 mb-3">항목이 없습니다</p>
                  <p className="text-xs text-gray-400">아래 입력란에서 새 항목을 추가해주세요</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id}>
                    <DraggableTaskItem
                      task={task}
                      selectedTaskId={selectedTaskId}
                      onTaskSelect={onTaskSelect}
                      onDelete={handleDeleteTask}
                      onContextMenu={handleContextMenu}
                    />

                    {/* 컨텍스트 메뉴 */}
                    {contextMenu && contextMenu.taskId === task.id && (
                      <div
                        className="fixed bg-white border-2 border-gray-400 rounded-lg shadow-lg z-50"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task.id);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700 border-b border-gray-200 transition-colors"
                        >
                          <Edit2 size={16} />
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id, task.title);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600 border-b border-gray-200 transition-colors"
                        >
                          <Trash2 size={16} />
                          삭제
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700 transition-colors"
                        >
                          <X size={16} />
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </DndContext>

      {/* 추가 입력란 */}
      <div className="p-4 border-t-2 border-gray-300 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="새 항목 추가..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTask();
              }
            }}
            className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskName.trim()}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
            title="항목 추가"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      </div>
    </>
  );
}

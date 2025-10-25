import { useEffect, useState } from 'react';
import type { TaskDetail } from '../types';
import type { DragEndEvent } from '@dnd-kit/core';
import { useTaskStore } from '../store/taskStore';
import { db, taskDetailQueries } from '../db/db';
import { Save, Plus, Trash2, MoreVertical, Edit2, X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WorkSpaceProps {
  taskId: string | null;
}

/**
 * 중앙 작업 공간 - 계획 패널과 상세내용 입력창
 */
export function WorkSpace({ taskId }: WorkSpaceProps) {
  const { getTaskById, updateTaskProgress } = useTaskStore();
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [newChecklistText, setNewChecklistText] = useState<{ [key: string]: string }>({
    plan: '',
    execution: '',
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState('');
  const [detailTimeout, setDetailTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const task = taskId ? getTaskById(taskId) : null;
  const [autosaveTimeout, setAutosaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // 작업 상세 정보 로드
  useEffect(() => {
    const loadDetail = async () => {
      if (!taskId) {
        setTaskDetail(null);
        return;
      }

      try {
        let detail = await taskDetailQueries.getByTaskId(taskId);

        // TaskDetail이 없으면 새로 생성
        if (!detail) {
          console.log('Creating new task detail for taskId:', taskId);
          const newTaskId = await taskDetailQueries.create({
            taskId,
            plan: { text: '', checklist: [] },
            execution: { text: '', checklist: [] },
            updatedAt: new Date().toISOString(),
          });
          detail = await taskDetailQueries.getByTaskId(newTaskId);
          console.log('Created task detail:', detail);
        } else {
          console.log('Loaded existing task detail:', detail);
        }

        setTaskDetail(detail || null);
        setSelectedItemId(null);
        setSelectedItemDetail('');
      } catch (error) {
        console.error('Failed to load task detail:', error);
        setTaskDetail(null);
      }
    };

    loadDetail();
  }, [taskId]);

  // 자동 저장 (Debouncing)
  useEffect(() => {
    if (!taskDetail) return;

    // 기존 타이머 취소
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }

    // 새 타이머 설정 (1초 후 자동 저장)
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await db.taskDetails.put(taskDetail);
        setTimeout(() => setIsSaving(false), 500);
      } catch (error) {
        console.error('자동 저장 실패:', error);
        setIsSaving(false);
      }
    }, 1000);

    setAutosaveTimeout(timeout);

    // 클린업 함수
    return () => clearTimeout(timeout);
  }, [taskDetail]);

  // 외부 클릭 감지 - 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setMenuPosition(null);
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // 상세내용 자동 저장
  useEffect(() => {
    if (!selectedItemId) return;

    if (detailTimeout) {
      clearTimeout(detailTimeout);
    }

    const timeout = setTimeout(() => {
      const newDetail = { ...taskDetail };
      const idx = newDetail.plan.checklist.findIndex(i => i.id === selectedItemId);
      if (idx !== -1) {
        newDetail.plan.checklist[idx].detail = selectedItemDetail;
        setTaskDetail(newDetail);
      }
    }, 1000);

    setDetailTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [selectedItemDetail, selectedItemId, taskDetail]);

  // ESC 키로 메뉴 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSave = async () => {
    if (!taskDetail) return;

    // 자동 저장 타이머 취소 후 즉시 저장
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
      setAutosaveTimeout(null);
    }

    setIsSaving(true);
    try {
      await db.taskDetails.put(taskDetail);
      // 저장 완료 피드백
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error('저장 실패:', error);
      setIsSaving(false);
    }
  };

  const handleProgressChange = async (progress: number) => {
    if (!task) return;
    const roundedProgress = Math.round(progress / 10) * 10;
    await updateTaskProgress(task.id, roundedProgress);
  };

  // 드래그 앤 드롭 sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!task) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-400">📝</p>
          <p className="text-gray-500 mt-4">항목을 선택해주세요</p>
        </div>
      </div>
    );
  }

  if (!taskDetail) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  // 드래그 가능한 체크리스트 항목 컴포넌트
  function DraggableChecklistItem({
    item,
    title,
    panelKey,
  }: {
    item: any;
    title: string;
    panelKey: 'plan' | 'execution';
  }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(item.text);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: item.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const handleSaveEdit = () => {
      if (editText.trim()) {
        const newDetail = { ...taskDetail };
        const idx = newDetail[panelKey].checklist.findIndex(i => i.id === item.id);
        if (idx !== -1) {
          newDetail[panelKey].checklist[idx].text = editText.trim();
          setTaskDetail(newDetail);
        }
      }
      setIsEditing(false);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();

      let x = rect.right + 8;
      let y = rect.bottom + 8;

      const menuWidth = 120;
      const menuHeight = 120;

      if (x + menuWidth > window.innerWidth) {
        x = rect.left - menuWidth;
      }

      if (y + menuHeight > window.innerHeight) {
        y = rect.top - menuHeight;
      }

      setOpenMenuId(item.id);
      setMenuPosition({ x, y });
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => {
          setSelectedItemId(item.id);
          setSelectedItemDetail(item.detail || '');
        }}
        className={`flex items-center border rounded cursor-pointer transition-colors group ${
          selectedItemId === item.id
            ? 'bg-blue-50 border-blue-400'
            : 'bg-white border-gray-300 hover:bg-gray-50'
        }`}
      >
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
          style={{ padding: '0.25rem 0.125rem' }}
          title="드래그하여 순서 변경"
        >
          <GripVertical size={14} />
        </button>

        <input
          type="checkbox"
          checked={item.completed}
          onChange={(e) => {
            const newDetail = { ...taskDetail };
            const idx = newDetail[panelKey].checklist.findIndex(i => i.id === item.id);
            if (idx !== -1) {
              newDetail[panelKey].checklist[idx].completed = e.target.checked;
              setTaskDetail(newDetail);
            }
          }}
          className="w-4 h-4 cursor-pointer flex-shrink-0 ml-1"
        />

        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveEdit();
              }
            }}
            className="flex-1 px-3 py-1 ml-2 border-0 border-l border-blue-500 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="항목 입력..."
          />
        ) : (
          <div
            onDoubleClick={() => {
              setEditText(item.text);
              setIsEditing(true);
            }}
            className="flex-1 px-3 py-1 ml-2 border-0 border-l border-gray-300 text-sm font-semibold bg-white cursor-default select-none"
          >
            {item.text}
          </div>
        )}

        <button
          onClick={handleMenuClick}
          className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
          style={{ padding: '0.25rem 0.125rem' }}
          title="메뉴"
        >
          <MoreVertical size={14} />
        </button>
      </div>
    );
  }

  // 패널 렌더링 헬퍼 함수
  const renderPanel = (title: string, content: typeof taskDetail.plan) => {
    const headerColors = {
      '계획': 'bg-blue-100 border-blue-300',
      '실행': 'bg-yellow-100 border-yellow-300',
    };
    const headerColor = headerColors[title as keyof typeof headerColors] || 'bg-gray-50 border-gray-300';
    const panelKey = title === '계획' ? 'plan' : 'execution';

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = content.checklist.findIndex((item) => item.id === active.id);
        const newIndex = content.checklist.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(content.checklist, oldIndex, newIndex);
          const newDetail = { ...taskDetail };
          newDetail[panelKey].checklist = newOrder;
          setTaskDetail(newDetail);
        }
      }
    };

    return (
      <div className="flex-1 flex flex-col bg-white border-2 border-gray-400 rounded-lg overflow-hidden">
        {/* 패널 헤더 */}
        <div className={`px-4 py-3 ${headerColor} border-b-2`}>
          <h3 className="font-bold text-sm text-gray-900">{title}</h3>
        </div>

        {/* 패널 콘텐츠 - 체크리스트만 표시 */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* 체크리스트 항목들 (드래그&드롭 가능) */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-y-auto space-y-2">
              <SortableContext items={content.checklist.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {content.checklist.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-sm">항목을 추가해주세요</p>
                  </div>
                ) : (
                  content.checklist.map((item) => (
                    <DraggableChecklistItem
                      key={item.id}
                      item={item}
                      title={title}
                      panelKey={panelKey}
                    />
                  ))
                )}
              </SortableContext>
            </div>
          </DndContext>

          {/* 새 항목 추가 필드 (하단) - 댓글 입력처럼 */}
          <div className="mt-4 pt-4 border-t border-gray-300 flex gap-2">
            <input
              type="text"
              placeholder="새 항목 추가..."
              value={newChecklistText[panelKey]}
              onChange={(e) => {
                setNewChecklistText(prev => ({ ...prev, [panelKey]: e.target.value }));
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const text = newChecklistText[panelKey].trim();
                  if (text) {
                    const newDetail = { ...taskDetail };
                    const newId = Math.random().toString(36).substring(7);
                    newDetail[panelKey].checklist.unshift({
                      id: newId,
                      text,
                      completed: false,
                    });
                    setTaskDetail(newDetail);
                    setNewChecklistText(prev => ({ ...prev, [panelKey]: '' }));
                  }
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                const text = newChecklistText[panelKey].trim();
                if (text) {
                  const newDetail = { ...taskDetail };
                  const newId = Math.random().toString(36).substring(7);
                  newDetail[panelKey].checklist.unshift({
                    id: newId,
                    text,
                    completed: false,
                  });
                  setTaskDetail(newDetail);
                  setNewChecklistText(prev => ({ ...prev, [panelKey]: '' }));
                }
              }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors font-medium flex-shrink-0"
              title="새 항목 추가"
            >
              <Plus size={16} />
              추가
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-white border-l-2 border-gray-400 flex flex-col">
      {/* 헤더 */}
      <div className="border-b-2 border-gray-300 p-4 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>

        {/* 마감일 */}
        {task.dueDate && (
          <div className="text-sm text-gray-600 mt-2">
            📅 마감일: {new Date(task.dueDate).toLocaleDateString('ko-KR')}
          </div>
        )}
      </div>

      {/* 좌우 2단 레이아웃 */}
      <div className="flex-1 flex flex-row gap-3 p-3 overflow-hidden">
        {/* 좌측: 계획 패널 (50%) */}
        <div className="flex-1 overflow-hidden">
          {renderPanel('계획', taskDetail.plan)}
        </div>

        {/* 우측: 상세내용 입력창 (50%) */}
        <div className="flex-1 flex flex-col bg-white border-2 border-gray-400 rounded-lg overflow-hidden">
          {/* 헤더 */}
          <div className="px-4 py-3 bg-green-100 border-b-2 border-green-300">
            <h3 className="font-bold text-sm text-gray-900">
              {selectedItemId ? '상세내용' : '체크리스트 항목을 선택해주세요'}
            </h3>
          </div>

          {/* 내용 */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {selectedItemId ? (
              <>
                <textarea
                  value={selectedItemDetail}
                  onChange={(e) => setSelectedItemDetail(e.target.value)}
                  className="flex-1 resize-none border-2 border-gray-300 rounded-lg p-3 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="상세내용을 입력하세요..."
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p className="text-sm">위의 계획 패널에서 항목을 클릭하여 상세내용을 작성할 수 있습니다</p>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="border-t-2 border-gray-300 p-4 bg-gray-50 text-sm text-gray-600">
            💾 자동으로 저장됩니다
          </div>
        </div>
      </div>

      {/* 푸터 - 저장 버튼 */}
      <div className="border-t-2 border-gray-300 p-4 bg-gray-50 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {isSaving ? '저장 중...' : '모든 변경사항이 자동 저장됩니다'}
        </span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors font-medium"
        >
          <Save size={18} />
          저장
        </button>
      </div>

      {/* 고정 위치 3선 메뉴 */}
      {openMenuId && menuPosition && (
        <div
          style={{
            position: 'fixed',
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
          className="bg-white border border-gray-300 rounded-lg shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              // 현재 openMenuId의 아이템을 계획 패널에서 찾아서 수정
              let foundItem = null;
              let foundKey: 'plan' | 'execution' | null = null;

              for (const key of ['plan', 'execution'] as const) {
                const item = taskDetail?.[key]?.checklist.find(i => i.id === openMenuId);
                if (item) {
                  foundItem = item;
                  foundKey = key;
                  break;
                }
              }

              if (foundItem && foundKey) {
                const newText = prompt('항목 수정:', foundItem.text);
                if (newText !== null && newText !== foundItem.text) {
                  const newDetail = { ...taskDetail };
                  const idx = newDetail[foundKey].checklist.findIndex(i => i.id === openMenuId);
                  if (idx !== -1) {
                    newDetail[foundKey].checklist[idx].text = newText;
                    setTaskDetail(newDetail);
                  }
                }
              }

              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 border-b border-gray-200 transition-colors min-w-max"
          >
            <Edit2 size={14} />
            수정
          </button>
          <button
            onClick={() => {
              // 계획/실행 패널에서 해당 ID의 아이템 삭제
              let deleted = false;
              const newDetail = { ...taskDetail };

              for (const key of ['plan', 'execution'] as const) {
                if (newDetail[key].checklist.some(i => i.id === openMenuId)) {
                  newDetail[key].checklist = newDetail[key].checklist.filter(i => i.id !== openMenuId);
                  deleted = true;
                  break;
                }
              }

              if (deleted) {
                setTaskDetail(newDetail);
                if (selectedItemId === openMenuId) {
                  setSelectedItemId(null);
                  setSelectedItemDetail('');
                }
              }

              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-b border-gray-200 transition-colors"
          >
            <Trash2 size={14} />
            삭제
          </button>
          <button
            onClick={() => {
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <X size={14} />
            취소
          </button>
        </div>
      )}

    </div>
  );
}

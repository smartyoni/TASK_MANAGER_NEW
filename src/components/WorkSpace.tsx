import { useEffect, useState } from 'react';
import type { TaskDetail, ChecklistItem } from '../types';
import { useTaskStore } from '../store/taskStore';
import { db, taskDetailQueries } from '../db/db';
import { Save, Plus, Trash2, FileText } from 'lucide-react';
import { PlanDetailModal } from './PlanDetailModal';

interface WorkSpaceProps {
  taskId: string | null;
}

/**
 * 중앙 작업 공간 - 설명/계획/실행 3가지 패널
 */
export function WorkSpace({ taskId }: WorkSpaceProps) {
  const { getTaskById, updateTaskProgress } = useTaskStore();
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const task = taskId ? getTaskById(taskId) : null;
  const [autosaveTimeout, setAutosaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [planDetailModal, setPlanDetailModal] = useState<{ itemId: string; item: ChecklistItem } | null>(null);

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
            description: { text: '', checklist: [] },
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

  // 계획 패널 전용 렌더링 함수
  const renderPlanPanel = () => {
    const content = taskDetail.plan;

    return (
      <div className="flex-1 md:flex-none md:w-1/3 flex flex-col bg-white border-2 border-gray-400 rounded-lg overflow-hidden min-h-[400px] md:min-h-0">
        {/* 패널 헤더 */}
        <div className="px-4 py-3 bg-blue-100 border-blue-300 border-b-2">
          <h3 className="font-bold text-sm text-gray-900">계획</h3>
        </div>

        {/* 패널 콘텐츠 - 체크리스트만 */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          {/* 체크리스트 영역 */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">계획 항목</p>
              <button
                onClick={() => {
                  const newDetail = { ...taskDetail };
                  const newId = Math.random().toString(36).substring(7);
                  newDetail.plan.checklist.push({
                    id: newId,
                    text: '',
                    completed: false,
                    detailPlan: '',
                  });
                  setTaskDetail(newDetail);
                }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 hover:bg-blue-50 rounded"
                title="새 계획 항목 추가"
              >
                <Plus size={16} />
                항목 추가
              </button>
            </div>

            {content.checklist.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                계획 항목을 추가해주세요
              </div>
            ) : (
              <div className="space-y-2">
                {content.checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border-2 border-gray-300 hover:border-blue-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => {
                        const newDetail = { ...taskDetail };
                        const idx = newDetail.plan.checklist.findIndex(i => i.id === item.id);
                        if (idx !== -1) {
                          newDetail.plan.checklist[idx].completed = e.target.checked;
                          setTaskDetail(newDetail);
                        }
                      }}
                      className="w-5 h-5 cursor-pointer mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const newDetail = { ...taskDetail };
                          const idx = newDetail.plan.checklist.findIndex(i => i.id === item.id);
                          if (idx !== -1) {
                            newDetail.plan.checklist[idx].text = e.target.value;
                            setTaskDetail(newDetail);
                          }
                        }}
                        className="w-full px-2 py-1 border-2 border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="계획 항목 입력..."
                      />
                      {item.detailPlan && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.detailPlan}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setPlanDetailModal({ itemId: item.id, item })}
                      className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="상세 계획"
                    >
                      <FileText size={18} />
                    </button>
                    <button
                      onClick={() => {
                        const newDetail = { ...taskDetail };
                        newDetail.plan.checklist = newDetail.plan.checklist.filter(i => i.id !== item.id);
                        setTaskDetail(newDetail);
                      }}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 일반 패널 렌더링 헬퍼 함수
  const renderPanel = (title: string, content: typeof taskDetail.description) => {
    const headerColors = {
      '설명': 'bg-pink-100 border-pink-300',
      '계획': 'bg-blue-100 border-blue-300',
      '실행': 'bg-yellow-100 border-yellow-300',
    };
    const headerColor = headerColors[title as keyof typeof headerColors] || 'bg-gray-50 border-gray-300';

    return (
    <div className="flex-1 md:flex-none md:w-1/3 flex flex-col bg-white border-2 border-gray-400 rounded-lg overflow-hidden min-h-[400px] md:min-h-0">
      {/* 패널 헤더 */}
      <div className={`px-4 py-3 ${headerColor} border-b-2`}>
        <h3 className="font-bold text-sm text-gray-900">{title}</h3>
      </div>

      {/* 패널 콘텐츠 */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-[300px]">
        {/* 텍스트 영역 */}
        <textarea
          value={content.text}
          onChange={(e) => {
            const newDetail = { ...taskDetail };
            if (title === '설명') {
              newDetail.description.text = e.target.value;
            } else if (title === '계획') {
              newDetail.plan.text = e.target.value;
            } else {
              newDetail.execution.text = e.target.value;
            }
            setTaskDetail(newDetail);
          }}
          placeholder={`${title}을(를) 입력하세요...`}
          className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
        />

        {/* 체크리스트 영역 */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-300 max-h-40 overflow-y-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-600">체크리스트</p>
            <button
              onClick={() => {
                const newDetail = { ...taskDetail };
                const textKey = title === '설명' ? 'description' : title === '계획' ? 'plan' : 'execution';
                const newId = Math.random().toString(36).substring(7);
                newDetail[textKey].checklist.push({
                  id: newId,
                  text: '',
                  completed: false,
                });
                setTaskDetail(newDetail);
              }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              title="새 체크리스트 항목 추가"
            >
              <Plus size={14} />
              추가
            </button>
          </div>
          <div className="space-y-1">
            {content.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => {
                    const newDetail = { ...taskDetail };
                    const textKey = title === '설명' ? 'description' : title === '계획' ? 'plan' : 'execution';
                    const idx = newDetail[textKey].checklist.findIndex(i => i.id === item.id);
                    if (idx !== -1) {
                      newDetail[textKey].checklist[idx].completed = e.target.checked;
                      setTaskDetail(newDetail);
                    }
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const newDetail = { ...taskDetail };
                    const textKey = title === '설명' ? 'description' : title === '계획' ? 'plan' : 'execution';
                    const idx = newDetail[textKey].checklist.findIndex(i => i.id === item.id);
                    if (idx !== -1) {
                      newDetail[textKey].checklist[idx].text = e.target.value;
                      setTaskDetail(newDetail);
                    }
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="항목 입력..."
                />
                <button
                  onClick={() => {
                    const newDetail = { ...taskDetail };
                    const textKey = title === '설명' ? 'description' : title === '계획' ? 'plan' : 'execution';
                    newDetail[textKey].checklist = newDetail[textKey].checklist.filter(i => i.id !== item.id);
                    setTaskDetail(newDetail);
                  }}
                  className="text-red-600 hover:text-red-700 transition-colors p-1"
                  title="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="flex-1 bg-white md:border-l-2 border-gray-400 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="border-b-2 border-gray-300 p-3 md:p-4 bg-gray-50 flex-shrink-0">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">{task.title}</h2>

        {/* 진행률 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">진행률</label>
            <span className="text-lg font-bold text-blue-600">{task.progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={task.progress}
            onChange={(e) => handleProgressChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 마감일 */}
        {task.dueDate && (
          <div className="text-sm text-gray-600">
            📅 마감일: {new Date(task.dueDate).toLocaleDateString('ko-KR')}
          </div>
        )}
      </div>

      {/* 3개 패널 그리드 - 모바일: 세로, 데스크톱: 가로 */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 overflow-hidden overflow-y-auto md:overflow-y-hidden">
        {renderPanel('설명', taskDetail.description)}
        {renderPlanPanel()}
        {renderPanel('실행', taskDetail.execution)}
      </div>

      {/* 상세 계획 모달 */}
      {planDetailModal && (
        <PlanDetailModal
          itemText={planDetailModal.item.text}
          detailPlan={planDetailModal.item.detailPlan || ''}
          onSave={(detailPlan) => {
            const newDetail = { ...taskDetail };
            const idx = newDetail.plan.checklist.findIndex(i => i.id === planDetailModal.itemId);
            if (idx !== -1) {
              newDetail.plan.checklist[idx].detailPlan = detailPlan;
              setTaskDetail(newDetail);
            }
          }}
          onClose={() => setPlanDetailModal(null)}
        />
      )}

      {/* 푸터 - 저장 버튼 */}
      <div className="border-t-2 border-gray-300 p-3 md:p-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 flex-shrink-0">
        <span className="text-xs md:text-sm text-gray-500 text-center sm:text-left">
          {isSaving ? '저장 중...' : '모든 변경사항이 자동 저장됩니다'}
        </span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors font-medium"
        >
          <Save size={18} />
          저장
        </button>
      </div>
    </div>
  );
}

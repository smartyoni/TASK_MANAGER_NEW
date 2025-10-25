import { useEffect, useState } from 'react';
import type { Task, TaskDetail, Priority } from '../types';
import { useTaskStore } from '../store/taskStore';
import { taskDetailQueries } from '../db/db';
import { convertLinksToElementsWithLineBreaks } from '../utils/linkConverter';
import { X, Save } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

/**
 * 업무 상세 정보 모달
 */
export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { updateTask, updateTaskProgress } = useTaskStore();
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [title, setTitle] = useState(task.title);
  const [progress, setProgress] = useState(task.progress);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState('');
  const [execution, setExecution] = useState('');
  const [activeTab, setActiveTab] = useState<'description' | 'plan' | 'execution'>('description');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 상세 정보 로드
  useEffect(() => {
    const loadDetail = async () => {
      const detail = await taskDetailQueries.getByTaskId(task.id);
      setTaskDetail(detail || null);
      if (detail) {
        setDescription(detail.description || '');
        setPlan(detail.plan.text || '');
        setExecution(detail.execution.text || '');
      }
    };
    loadDetail();
  }, [task.id]);

  const handleSaveTask = async () => {
    setIsSaving(true);
    try {
      await updateTask(task.id, {
        title,
        progress: Math.round(progress / 10) * 10,
        dueDate: dueDate || null,
        priority,
      });

      // 상세 정보 저장 (설명, 계획, 실행)
      if (taskDetail) {
        await taskDetailQueries.update(task.id, {
          description,
          plan: { ...taskDetail.plan, text: plan },
          execution: { ...taskDetail.execution, text: execution },
        });
      }

      setSaveMessage('저장됨 ✓');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveMessage('저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProgressChange = async (value: number) => {
    const roundedProgress = Math.round(value / 10) * 10;
    setProgress(roundedProgress);
    await updateTaskProgress(task.id, roundedProgress);
  };

  const priorityColor = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-gray-400',
  };

  const priorityLabel = {
    high: '높음',
    medium: '중간',
    low: '낮음',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg shadow-lg w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto modal-enter">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">업무 상세 정보</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* 내용 */}
        <div className="px-6 py-4 space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              업무 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="업무 제목을 입력하세요"
            />
          </div>

          {/* 진행률 슬라이더 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                진행률
              </label>
              <span className="text-lg font-bold text-blue-600">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={progress}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              마감일 (선택사항)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 우선순위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              우선순위
            </label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => {
                const bgClass = priority === p
                  ? p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${bgClass}`}
                  >
                    <span className={`inline-block mr-2 text-lg ${priorityColor[p]}`}>
                      ●
                    </span>
                    {priorityLabel[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 탭 */}
          <div>
            <div className="flex gap-2 border-b border-gray-200">
              {(['description', 'plan', 'execution'] as const).map((tab) => {
                const labels = {
                  description: '설명',
                  plan: '계획',
                  execution: '실행',
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* 탭 콘텐츠 */}
            {taskDetail && (
              <div className="mt-4">
                {/* 설명 탭 - 편집 모드 */}
                {activeTab === 'description' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">입력</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="설명을 입력하세요... (URL이 자동으로 링크로 변환됩니다)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">미리보기</label>
                      <div className="w-full min-h-24 p-4 border border-gray-300 rounded-lg bg-gray-50 text-sm leading-relaxed">
                        {description ? (
                          <div className="text-gray-800">
                            {convertLinksToElementsWithLineBreaks(description)}
                          </div>
                        ) : (
                          <p className="text-gray-400">입력한 내용이 여기에 표시됩니다.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 계획 탭 - 편집 모드 */}
                {activeTab === 'plan' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">입력</label>
                      <textarea
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="계획을 입력하세요... (URL이 자동으로 링크로 변환됩니다)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">미리보기</label>
                      <div className="w-full min-h-24 p-4 border border-gray-300 rounded-lg bg-gray-50 text-sm leading-relaxed">
                        {plan ? (
                          <div className="text-gray-800">
                            {convertLinksToElementsWithLineBreaks(plan)}
                          </div>
                        ) : (
                          <p className="text-gray-400">입력한 내용이 여기에 표시됩니다.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 실행 탭 - 편집 모드 */}
                {activeTab === 'execution' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">입력</label>
                      <textarea
                        value={execution}
                        onChange={(e) => setExecution(e.target.value)}
                        className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="실행을 입력하세요... (URL이 자동으로 링크로 변환됩니다)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">미리보기</label>
                      <div className="w-full min-h-24 p-4 border border-gray-300 rounded-lg bg-gray-50 text-sm leading-relaxed">
                        {execution ? (
                          <div className="text-gray-800">
                            {convertLinksToElementsWithLineBreaks(execution)}
                          </div>
                        ) : (
                          <p className="text-gray-400">입력한 내용이 여기에 표시됩니다.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {isSaving ? '저장 중...' : saveMessage && <span className="text-green-600">{saveMessage}</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              취소
            </button>
            <button
              onClick={handleSaveTask}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2"
            >
              <Save size={18} />
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

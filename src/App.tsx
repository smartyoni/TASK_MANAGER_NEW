import { useEffect, useState } from 'react';
import './styles/globals.css';
import { initializeDatabase } from './db/db';
import { useCategoryStore } from './store/categoryStore';
import { useTaskStore } from './store/taskStore';
import { HeaderTabs } from './components/HeaderTabs';
import { Sidebar } from './components/Sidebar';
import { WorkSpace } from './components/WorkSpace';

function App() {
  const { loadCategories, categories } = useCategoryStore();
  const { loadTasks } = useTaskStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('App initializing...');
        const success = await initializeDatabase();
        console.log('Database initialized:', success);
        if (success) {
          await loadCategories();
          console.log('Categories loaded');
          await loadTasks();
          console.log('Tasks loaded');
        }
      } catch (error) {
        console.error('초기화 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [loadCategories, loadTasks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 헤더 */}
        <HeaderTabs />

        {/* 빈 상태 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl mb-4">📋</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">시작하기</p>
            <p className="text-gray-600 mb-6">상단의 "+ 추가" 버튼을 클릭하여<br />첫 번째 카테고리를 만들어보세요!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 상단 헤더 */}
      <HeaderTabs
        onMenuClick={() => {}}
      />

      {/* 메인 콘텐츠 - 3칼럼 레이아웃 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 좌측 사이드바 */}
        <Sidebar
          selectedTaskId={selectedTaskId}
          onTaskSelect={(taskId) => {
            setSelectedTaskId(taskId);
          }}
        />

        {/* 우측 작업 공간 */}
        <WorkSpace taskId={selectedTaskId} />
      </div>
    </div>
  );
}

export default App;

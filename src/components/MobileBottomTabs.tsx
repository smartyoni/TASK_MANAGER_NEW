type TabType = 'tasks' | 'plan' | 'detail';

interface MobileBottomTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function MobileBottomTabs({ activeTab, onTabChange }: MobileBottomTabsProps) {
  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'tasks', label: '작업목록' },
    { id: 'plan', label: '계획' },
    { id: 'detail', label: '상세내용' },
  ];

  return (
    <div className="border-t border-gray-300 bg-white">
      <div className="flex items-center gap-2 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all text-black ${
              activeTab === tab.id
                ? 'bg-blue-500'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

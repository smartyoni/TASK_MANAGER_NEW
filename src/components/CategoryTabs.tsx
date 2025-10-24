import { useCategoryStore } from '../store/categoryStore';
import { Plus, Edit2, Trash2 } from 'lucide-react';

/**
 * 카테고리 탭 컴포넌트
 * 상단에 카테고리 목록을 탭 형식으로 표시
 */
export function CategoryTabs() {
  const {
    categories,
    selectedCategoryId,
    selectCategory,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore();

  const handleAddCategory = () => {
    const name = prompt('카테고리 이름을 입력하세요:');
    if (name && name.trim()) {
      addCategory(name.trim());
    }
  };

  const handleEditCategory = (id: string, currentName: string) => {
    const newName = prompt('카테고리 이름을 수정하세요:', currentName);
    if (newName && newName.trim() && newName !== currentName) {
      updateCategory(id, { name: newName.trim() });
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`"${name}" 카테고리를 삭제하시겠습니까?\n이 카테고리의 모든 업무도 함께 삭제됩니다.`)) {
      deleteCategory(id);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4">
        {/* 데스크탑 뷰: 탭 형식 */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto py-3">
          {categories.map((category) => {
            const isSelected = selectedCategoryId === category.id;
            const btnClass = isSelected
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

            return (
            <div key={category.id} className="flex items-center group">
              <button
                onClick={() => selectCategory(category.id)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${btnClass}`}
              >
                {category.name}
              </button>

              {/* 삭제, 수정 버튼 (호버 시 표시) */}
              <div className="hidden group-hover:flex items-center gap-1 ml-1">
                <button
                  onClick={() => handleEditCategory(category.id, category.name)}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="편집"
                >
                  <Edit2 size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  className="p-1 rounded hover:bg-red-100 transition-colors"
                  title="삭제"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>
            );
          })}

          {/* 추가 버튼 */}
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 rounded-t-lg font-medium bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap ml-auto"
          >
            <Plus size={18} />
            카테고리 추가
          </button>
        </div>

        {/* 모바일 뷰: 드롭다운 형식 */}
        <div className="md:hidden flex items-center justify-between py-3 gap-2">
          <select
            value={selectedCategoryId || ''}
            onChange={(e) => selectCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              카테고리 선택
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddCategory}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">추가</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useCategoryStore } from '../store/categoryStore';
import { Plus, X, Edit2 } from 'lucide-react';

/**
 * 상단 헤더 - 최상위 카테고리 탭
 */
export function HeaderTabs() {
  const { categories, selectedCategoryId, selectCategory, addCategory, deleteCategory, updateCategory } = useCategoryStore();
  const [contextMenu, setContextMenu] = React.useState<{ categoryId: string; x: number; y: number } | null>(null);

  const handleAddCategory = () => {
    const name = prompt('새 카테고리 이름을 입력하세요:');
    if (name && name.trim()) {
      addCategory(name.trim());
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) {
      deleteCategory(id);
    }
    setContextMenu(null);
  };

  const handleEditCategory = (id: string, currentName: string) => {
    const newName = prompt('카테고리명 수정:', currentName);
    if (newName && newName.trim() && newName !== currentName) {
      updateCategory(id, { name: newName.trim() });
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ categoryId, x: e.clientX, y: e.clientY });
  };

  React.useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // 카테고리 인덱스에 따른 완전히 하드코딩된 className 반환
  const getButtonClassNames = (index: number, isSelected: boolean): { button: string; deleteBg: string; deleteBorder: string } => {
    const colorSchemes = [
      {
        button: isSelected
          ? 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-blue-500 scale-110 shadow-lg'
          : 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-blue-500 hover:shadow-md',
        deleteBg: 'bg-blue-500',
        deleteBorder: 'border-blue-500',
      },
      {
        button: isSelected
          ? 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-purple-500 scale-110 shadow-lg'
          : 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-purple-500 hover:shadow-md',
        deleteBg: 'bg-purple-500',
        deleteBorder: 'border-purple-500',
      },
      {
        button: isSelected
          ? 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-green-500 scale-110 shadow-lg'
          : 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-green-500 hover:shadow-md',
        deleteBg: 'bg-green-500',
        deleteBorder: 'border-green-500',
      },
      {
        button: isSelected
          ? 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-amber-500 scale-110 shadow-lg'
          : 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-amber-500 hover:shadow-md',
        deleteBg: 'bg-amber-500',
        deleteBorder: 'border-amber-500',
      },
      {
        button: isSelected
          ? 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-red-500 scale-110 shadow-lg'
          : 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-red-500 hover:shadow-md',
        deleteBg: 'bg-red-500',
        deleteBorder: 'border-red-500',
      },
      {
        button: isSelected
          ? 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-cyan-500 scale-110 shadow-lg'
          : 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-cyan-500 hover:shadow-md',
        deleteBg: 'bg-cyan-500',
        deleteBorder: 'border-cyan-500',
      },
      {
        button: isSelected
          ? 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-indigo-500 scale-110 shadow-lg'
          : 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-indigo-500 hover:shadow-md',
        deleteBg: 'bg-indigo-500',
        deleteBorder: 'border-indigo-500',
      },
      {
        button: isSelected
          ? 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-pink-500 scale-110 shadow-lg'
          : 'px-5 py-2 rounded-2xl font-bold transition-all whitespace-nowrap text-sm border-4 bg-gray-900 text-gray-900 border-pink-500 hover:shadow-md',
        deleteBg: 'bg-pink-500',
        deleteBorder: 'border-pink-500',
      },
    ];

    return colorSchemes[index % colorSchemes.length];
  };

  return (
    <div className="bg-cyan-100 border-b-2 border-gray-400">
      <div className="px-6 py-4">
        <div className="flex items-center gap-6">
          {/* 로고 - 좌측 정렬 */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span>
              <span>Task Manager</span>
            </h1>
          </div>

          {/* 카테고리 버튼 그룹 */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 inline-flex min-w-full">
              {categories.map((category, index) => {
                const isSelected = selectedCategoryId === category.id;
                const classNames = getButtonClassNames(index, isSelected);

                return (
                  <div key={category.id} className="relative group">
                    <button
                      onClick={() => selectCategory(category.id)}
                      onContextMenu={(e) => handleContextMenu(e, category.id)}
                      className={classNames.button}
                    >
                      {category.name}
                    </button>

                    {/* 컨텍스트 메뉴 */}
                    {contextMenu && contextMenu.categoryId === category.id && (
                      <div
                        className="fixed bg-white border-2 border-gray-400 rounded-lg shadow-lg z-50"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCategory(category.id, category.name);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700 border-b border-gray-200 transition-colors"
                        >
                          <Edit2 size={16} />
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id, category.name);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600 border-b border-gray-200 transition-colors"
                        >
                          <X size={16} />
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

                    {/* 삭제 버튼 (호버시) */}
                    {index % 8 === 0 && (
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs hover:opacity-80 transition-opacity border-2 border-blue-500"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {index % 8 === 1 && (
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center w-6 h-6 bg-purple-500 text-white rounded-full text-xs hover:opacity-80 transition-opacity border-2 border-purple-500"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {index % 8 === 2 && (
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs hover:opacity-80 transition-opacity border-2 border-green-500"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {index % 8 === 3 && (
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center w-6 h-6 bg-amber-500 text-white rounded-full text-xs hover:opacity-80 transition-opacity border-2 border-amber-500"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {index % 8 === 4 && (
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:opacity-80 transition-opacity border-2 border-red-500"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {index % 8 === 5 && (
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center w-6 h-6 bg-cyan-500 text-white rounded-full text-xs hover:opacity-80 transition-opacity border-2 border-cyan-500"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {index % 8 === 6 && (
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center w-6 h-6 bg-indigo-500 text-white rounded-full text-xs hover:opacity-80 transition-opacity border-2 border-indigo-500"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {index % 8 === 7 && (
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center w-6 h-6 bg-pink-500 text-white rounded-full text-xs hover:opacity-80 transition-opacity border-2 border-pink-500"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* 추가 버튼 */}
              <button
                onClick={handleAddCategory}
                className="flex-shrink-0 flex items-center justify-center ml-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                title="카테고리 추가"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

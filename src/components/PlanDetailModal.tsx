import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PlanDetailModalProps {
  itemText: string;
  detailPlan: string;
  onSave: (detailPlan: string) => void;
  onClose: () => void;
}

/**
 * 계획 항목 상세 모달
 */
export function PlanDetailModal({ itemText, detailPlan, onSave, onClose }: PlanDetailModalProps) {
  const [localDetail, setLocalDetail] = useState(detailPlan);

  useEffect(() => {
    setLocalDetail(detailPlan);
  }, [detailPlan]);

  const handleSave = () => {
    onSave(localDetail);
    onClose();
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 모달 */}
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b-2 border-gray-300 bg-blue-50">
            <div className="flex-1 pr-4">
              <h3 className="font-bold text-lg text-gray-900">상세 계획</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{itemText}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>

          {/* 본문 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <textarea
              value={localDetail}
              onChange={(e) => setLocalDetail(e.target.value)}
              placeholder="이 계획 항목의 상세 내용을 작성하세요..."
              className="w-full h-full min-h-[300px] p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
            />
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 p-4 border-t-2 border-gray-300 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

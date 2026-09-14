import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  pageNumber,
  pageSize,
  totalPages,
  totalRecords,
  onPageChange,
  onPageSizeChange
}) => {
  if (totalRecords === 0) return null;

  const startRecord = (pageNumber - 1) * pageSize + 1;
  const endRecord = Math.min(pageNumber * pageSize, totalRecords);

  // Generate page numbers array (with ellipsis if needed)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pageNumber > 3) pages.push('...');

      const start = Math.max(2, pageNumber - 1);
      const end = Math.min(totalPages - 1, pageNumber + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (pageNumber < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white border border-slate-200 rounded-xl">
      {/* Information text */}
      <div className="text-sm text-slate-600">
        Toplam <span className="font-semibold text-slate-900">{totalRecords}</span> kayıttan{' '}
        <span className="font-semibold text-slate-900">{startRecord}</span> -{' '}
        <span className="font-semibold text-slate-900">{endRecord}</span> arası gösteriliyor
      </div>

      <div className="flex items-center gap-4">
        {/* Page size dropdown */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Sayfa başı:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Önceki Sayfa"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((p, idx) => (
            <React.Fragment key={idx}>
              {typeof p === 'number' ? (
                <button
                  onClick={() => onPageChange(p)}
                  className={`min-w-8 h-8 px-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    pageNumber === p
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span className="px-1 text-slate-400 text-xs select-none">...</span>
              )}
            </React.Fragment>
          ))}

          <button
            onClick={() => onPageChange(pageNumber + 1)}
            disabled={pageNumber >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Sonraki Sayfa"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

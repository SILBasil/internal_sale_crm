import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading
}: PaginationControlsProps) {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  const handleGoToPage = () => {
    let page = parseInt(inputPage);
    if (isNaN(page)) {
      page = currentPage;
    }
    // Clamp between 1 and totalPages
    page = Math.max(1, Math.min(page, totalPages));
    
    setInputPage(page.toString());
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="h-8 w-8 text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 mx-2">
        <span className="text-sm text-slate-600 font-medium">หน้า</span>
        <input
          type="text"
          value={inputPage}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleGoToPage}
          disabled={isLoading}
          className="w-12 h-8 text-center border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
        />
        <span className="text-sm text-slate-600 font-medium">จาก {totalPages}</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="h-8 w-8 text-slate-500 hover:text-slate-700"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

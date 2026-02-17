import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { Search, Calendar as CalendarIcon, Download, X } from 'lucide-react';
import { useState } from 'react';

interface FilterBarProps {
  searchTerm: string;
  searchStatus: string;
  searchSalesPerson: string;
  startDate: string;
  endDate: string;
  onSearch: (term: string) => void;
  onStatusChange: (status: string) => void;
  onDateChange: (start: string, end: string) => void;
  onSalesPersonChange?: (salesPersonId: string) => void;
  onExport: () => void;
  showExport?: boolean;
  salesPersons?: { id: string; name: string }[];
}

export function FilterBar({
  searchTerm,
  searchStatus,
  searchSalesPerson,
  startDate,
  endDate,
  onSearch,
  onStatusChange,
  onDateChange,
  onSalesPersonChange,
  onExport,
  showExport = true,
  salesPersons
}: FilterBarProps) {
  // No internal state - fully controlled by parent

  const handleClearFilters = () => {
    onSearch('');
    onStatusChange('all');
    onDateChange('', '');
    if (onSalesPersonChange) onSalesPersonChange('all');
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div className="flex flex-wrap gap-5 items-end">
        {/* Search */}
        <div className="flex-1 min-w-full sm:min-w-[280px] space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">ค้นหาลูกค้า</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ชื่อ, เบอร์โทรศัพท์, เลขบัตร..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-[160px] space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">สถานะ</label>
          <Select value={searchStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white shadow-sm">
              <SelectValue placeholder="สถานะทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="new">ใหม่</SelectItem>
              <SelectItem value="active">ใช้งาน</SelectItem>
              <SelectItem value="pending">รอดำเนินการ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sales Person Filter */}
        {salesPersons && onSalesPersonChange && (
          <div className="w-full sm:w-[180px] space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">เซลล์ผู้ดูแล</label>
            <Select value={searchSalesPerson} onValueChange={onSalesPersonChange}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white shadow-sm">
                <SelectValue placeholder="เซลล์ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">เซลล์ทั้งหมด</SelectItem>
                {salesPersons.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id}>
                    {sp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Filter */}
        <div className="w-full lg:w-auto space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">ช่วงวันที่บันทึก</label>
          <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
            <div className="relative min-w-[140px] flex-1 lg:flex-none">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onDateChange(e.target.value, endDate)}
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm font-sans"
              />
            </div>
            <div className="text-slate-300 hidden sm:block">ถึง</div>
            <div className="relative min-w-[140px] flex-1 lg:flex-none">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => onDateChange(startDate, e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm font-sans"
              />
            </div>
          </div>
        </div>

        {/* Actions Row - Full width */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-50 mt-2">
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="h-9 px-3 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-medium w-full sm:w-auto"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            ล้างตัวกรอง
          </Button>

          {showExport && (
            <Button
              onClick={onExport}
              className="h-10 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white shadow-md shadow-green-100 transition-all font-medium px-6 w-full sm:w-auto flex justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

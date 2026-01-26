import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { Search, Calendar as CalendarIcon, Download, X } from 'lucide-react';
import { useState } from 'react';

interface FilterBarProps {
  onSearch: (term: string) => void;
  onStatusChange: (status: string) => void;
  onDateChange: (start: string, end: string) => void;
  onSalesPersonChange?: (salesPersonId: string) => void;
  onExport: () => void;
  showExport?: boolean;
  salesPersons?: { id: string; name: string }[];
}

export function FilterBar({ 
  onSearch, 
  onStatusChange, 
  onDateChange, 
  onSalesPersonChange,
  onExport, 
  showExport = true,
  salesPersons
}: FilterBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    onSearch(val);
  };

  const handleDateChange = () => {
    onDateChange(startDate, endDate);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    onSearch('');
    onStatusChange('all');
    onDateChange('', '');
    if (onSalesPersonChange) onSalesPersonChange('all');
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
        {/* Search - 4 columns */}
        <div className="lg:col-span-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">ค้นหาลูกค้า</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ชื่อ, เบอร์โทรศัพท์, เลขบัตร..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Status Filter - 2 columns */}
        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">สถานะ</label>
          <Select onValueChange={onStatusChange} defaultValue="all">
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

        {/* Sales Person Filter - 2 columns if exists */}
        {salesPersons && onSalesPersonChange && (
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">เซลล์ผู้ดูแล</label>
            <Select onValueChange={onSalesPersonChange} defaultValue="all">
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

        {/* Date Filter - 4 columns (or less if no salesperson filter) */}
        <div className={`${salesPersons ? 'lg:col-span-4' : 'lg:col-span-6'} space-y-1.5`}>
          <label className="text-xs font-semibold text-slate-500 ml-1">ช่วงวันที่บันทึก</label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); onDateChange(e.target.value, endDate); }}
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm font-sans"
              />
            </div>
            <div className="text-slate-300">ถึง</div>
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); onDateChange(startDate, e.target.value); }}
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm font-sans"
              />
            </div>
          </div>
        </div>

        {/* Actions Row - Full width */}
        <div className="lg:col-span-12 flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="h-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-medium"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            ล้างตัวกรองทั้งหมด
          </Button>
          
          {showExport && (
            <Button
              onClick={onExport}
              className="h-10 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white shadow-md shadow-green-100 transition-all font-medium px-6"
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

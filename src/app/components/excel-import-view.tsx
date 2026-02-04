import { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { generateTemplate, parseExcelFile, validateExcelRow, ExcelCustomerData } from '@/app/utils/excel-utils';
import { toast } from 'sonner';
import { Customer } from '@/app/components/customer-table';

interface ExcelImportViewProps {
  onImport: (customers: Omit<Customer, 'id' | 'date' | 'ownerId' | 'ownerName'>[]) => void;
  onCheckDuplicate: (idCard: string, phoneNumbers: string[]) => Promise<{ isDuplicate: boolean; duplicateField: string | null }>;
}

interface ValidatedRow extends ExcelCustomerData {
  errors: string[];
  isDuplicate: boolean;
  duplicateField: string | null;
}

export function ExcelImportView({ onImport, onCheckDuplicate }: ExcelImportViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ValidatedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        toast.error('ไฟล์ไม่ถูกต้อง', { description: 'กรุณาอัปโหลดไฟล์ Excel (.xlsx) เท่านั้น' });
        return;
      }
      setFile(selectedFile);
      await processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    try {
      const rawData = await parseExcelFile(file);
      const validatedData = await Promise.all(rawData.map(async row => {
        const errors = validateExcelRow(row);
        
        // Check duplicates
        const phoneNumbers = row['เบอร์โทรศัพท์'] 
          ? String(row['เบอร์โทรศัพท์']).split(',').map(p => p.trim()) 
          : [];
        const duplicateCheck = await onCheckDuplicate(String(row['เลขบัตรประชาชน'] || ''), phoneNumbers);

        return {
          ...row,
          errors,
          isDuplicate: duplicateCheck.isDuplicate,
          duplicateField: duplicateCheck.duplicateField
        };
      }));
      setData(validatedData);
      toast.success('วิเคราะห์ไฟล์สำเร็จ', { description: `พบข้อมูลทั้งหมด ${validatedData.length} รายการ` });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์');
      console.error(error);
    } finally {
      setIsParsing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = () => {
    const errorCount = data.filter(row => row.errors.length > 0 || row.isDuplicate).length;
    if (errorCount > 0) {
      toast.error('ไม่สามารถนำเข้าข้อมูลได้', { description: `มีข้อมูลที่ซ้ำหรือข้อมูลไม่ถูกต้อง ${errorCount} รายการ` });
      return;
    }

    const customers = data.map(row => ({
      name: row['ชื่อลูกค้า/ชื่อร้าน'] || row['ชื่อลูกค้า'] || '',
      idCard: String(row['เลขบัตรประชาชน'] || ''),
      phoneNumbers: String(row['เบอร์โทรศัพท์']).split(',').map(p => p.trim()),
      taxId: String(row['เลขผู้เสียภาษี'] || ''),
      status: (row['สถานะ']?.toLowerCase() || 'new') as 'new' | 'active' | 'pending'
    }));

    onImport(customers);
    clearFile();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-slate-900">นำเข้าข้อมูลจาก Excel</h3>
          <p className="text-sm text-slate-500">ดาวน์โหลดเทมเพลตและกรอกข้อมูลเพื่อนำเข้าแบบกลุ่ม</p>
        </div>
        <Button 
          variant="outline" 
          onClick={generateTemplate}
          className="flex items-center gap-2 border-slate-200"
        >
          <Download className="h-4 w-4" />
          ดาวน์โหลดเทมเพลต
        </Button>
      </div>

      {!file ? (
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-slate-50 cursor-pointer transition-colors group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-4 bg-blue-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="h-10 w-10 text-blue-600" />
            </div>
            <p className="mb-2 text-sm text-slate-700">
              <span className="font-semibold text-blue-600">คลิกเพื่ออัปโหลด</span> หรือลากและวาง
            </p>
            <p className="text-xs text-slate-500">เฉพาะไฟล์ Excel (.xlsx)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef}
            accept=".xlsx"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <Card className="rounded-2xl border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span className="font-medium text-slate-900">{file.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile} className="text-slate-500 hover:text-red-500">
              <Trash2 className="h-4 w-4 mr-2" />
              ลบไฟล์
            </Button>
          </div>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-white border-b sticky top-0">
                  <tr>
                    <th className="px-6 py-3">ชื่อลูกค้า/ชื่อร้าน</th>
                    <th className="px-6 py-3">สถานะข้อมูล</th>
                    <th className="px-6 py-3 text-right">การตรวจสอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, idx) => (
                    <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{row['ชื่อลูกค้า/ชื่อร้าน'] || row['ชื่อลูกค้า']}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {row.isDuplicate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              ข้อมูลซ้ำ ({row.duplicateField})
                            </span>
                          )}
                          {row.errors.length > 0 ? (
                            <div className="text-xs text-red-500 space-y-0.5">
                              {row.errors.map((err, i) => <p key={i}>• {err}</p>)}
                            </div>
                          ) : !row.isDuplicate && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> ปกติ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.errors.length > 0 ? (
                          <AlertCircle className="h-5 w-5 text-red-500 inline" />
                        ) : row.isDuplicate ? (
                          <AlertCircle className="h-5 w-5 text-amber-500 inline" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <Button variant="outline" onClick={clearFile} className="bg-white">
              ยกเลิก
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={data.some(row => row.errors.length > 0 || row.isDuplicate) || data.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              <Upload className="h-4 w-4 mr-2" />
              นำเข้า {data.length} รายการ
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

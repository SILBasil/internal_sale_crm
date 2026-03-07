import { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, Trash2, FileWarning, Loader2 } from 'lucide-react';
import { generateTemplate, parseExcelFile, validateExcelRow, ExcelCustomerData, generateErrorReport } from '@/app/utils/excel-utils';
import { toast } from 'sonner';
import { Customer } from '@/app/components/customer-table';

interface ExcelImportViewProps {
  onImport: (customers: any[], hasErrors: boolean) => void;
  onCheckDuplicate: (idCard: string, phoneNumbers: string[], taxIds?: string[], excludeCustomerId?: string, ownerId?: string) => Promise<{
    isDuplicate: boolean;
    duplicateField: string | null;
    existingCustomer?: { id: string; ownerId: string | null; ownerName: string | null; name: string }
  }>;
  owners?: { id: string; name: string; email: string }[]; // List of sales persons for admin
  userRole: 'admin' | 'sales';
}

interface ValidatedRow extends ExcelCustomerData {
  errors: string[];
  isDuplicate: boolean;
  isUpsert?: boolean;
  duplicateField: string | null;
  targetOwnerId?: string;
  targetOwnerName?: string;
  existingCustomerId?: string;
}

export function ExcelImportView({ onImport, onCheckDuplicate, owners, userRole }: ExcelImportViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validRows, setValidRows] = useState<ValidatedRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<ValidatedRow[]>([]);
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
    setValidRows([]);
    setInvalidRows([]);
    try {
      const rawData = await parseExcelFile(file);
      // Tracking duplicates WITHIN the file/session
      const seenPhones = new Set<string>();
      const seenTaxIds = new Map<string, string>(); // taxId -> ownerId

      const validatedData: ValidatedRow[] = [];

      for (const row of rawData) {
        const errors = validateExcelRow(row);

        let targetOwnerId: string | undefined;
        let targetOwnerName: string | undefined;

        // Admin Mode: Check for owner email in Excel if owners list is provided
        if (owners && owners.length > 0) {
          // Support multiple owner email columns for reassignment scenario
          const ownerEmail = row['เมลล์เซลล์ใหม่'] || row['อีเมลผู้ดูแล'] || row['อีเมลผู้ดูแล (สำหรับ Admin)'];
          if (ownerEmail) {
            const activeOwners = (owners || []).filter((o: any) => !o.status || o.status === 'active');
            const owner = activeOwners.find(o => o.email.trim().toLowerCase() === ownerEmail.trim().toLowerCase());
            if (owner) {
              targetOwnerId = owner.id;
              targetOwnerName = owner.name;
            } else {
              errors.push(`ไม่พบอีเมลผู้ดูแลที่กำลังใช้งานอยู่: ${ownerEmail}`);
            }
          } else {
            errors.push('กรุณาระบุอีเมลผู้ดูแล (สำหรับ Admin)');
          }
        }

        const phoneNumbers = row['เบอร์โทรศัพท์']
          ? String(row['เบอร์โทรศัพท์']).split(',').map(p => p.trim().replace(/[-\s]/g, ""))
          : [];

        const idCard = row['เลขบัตรประชาชน'] ? String(row['เลขบัตรประชาชน']) : '';

        // Parse tax IDs from comma-separated values (like phone numbers)
        const taxIds = row['เลขผู้เสียภาษี/เลขทะเบียนพาณิชย์'] || row['เลขผู้เสียภาษี']
          ? String(row['เลขผู้เสียภาษี/เลขทะเบียนพาณิชย์'] || row['เลขผู้เสียภาษี']).split(',').map(t => t.trim()).filter(t => t)
          : [];

        // Check duplicates in database
        const duplicateCheck = await onCheckDuplicate(idCard, phoneNumbers, taxIds, undefined, targetOwnerId);

        // Prepare initial result
        const rowResult: ValidatedRow = {
          ...row,
          errors,
          isDuplicate: duplicateCheck.isDuplicate,
          duplicateField: duplicateCheck.duplicateField,
          targetOwnerId,
          targetOwnerName,
        };

        // Explicit ID mapping: If row has "หมายเลขระบบ" or "ID", treat it as an update
        const systemId = row['หมายเลขระบบ'] || row['ID'] || row['id'];
        if (systemId) {
          if (userRole === 'admin') {
            rowResult.isUpsert = true;
            rowResult.existingCustomerId = String(systemId).trim();
            rowResult.isDuplicate = false; // Trust the explicit ID
            rowResult.duplicateField = "อัปเดตข้อมูล (ตาม ID)";
          } else {
            errors.push('คุณไม่มีสิทธิ์อัปเดตข้อมูลผ่าน Excel (กรุณาแก้ไขผ่านหน้าเว็บ)');
            rowResult.isUpsert = false;
          }
        }

        // Reassignment logic: If duplicate is found by phone/idCard but has no owner, allow Admin to reassign
        if (!rowResult.isUpsert && rowResult.isDuplicate && duplicateCheck.existingCustomer && owners && owners.length > 0) {
          const existing = duplicateCheck.existingCustomer;
          if (!existing.ownerId) {
            rowResult.isDuplicate = false; // Not a hard error anymore
            rowResult.isUpsert = true;
            rowResult.existingCustomerId = existing.id;
            rowResult.duplicateField = "อัปเดตเจ้าของ (เดิมว่าง)";
          }
        }

        // If not already a DB duplicate, check WITHIN the file
        if (!rowResult.isDuplicate && !rowResult.isUpsert) {
          // Check Internal Phone Duplicates
          for (const phone of phoneNumbers) {
            if (seenPhones.has(phone)) {
              rowResult.isDuplicate = true;
              rowResult.duplicateField = "phone (ในไฟล์)";
              break;
            }
            seenPhones.add(phone);
          }

          // Check Internal Tax ID Duplicates (Within same owner)
          if (!rowResult.isDuplicate && !rowResult.isUpsert && taxIds.length > 0) {
            const ownerKey = targetOwnerId || "myself";
            for (const taxId of taxIds) {
              if (!taxId.trim()) continue;
              const taxKey = `${taxId}_${ownerKey}`;
              if (seenTaxIds.has(taxKey)) {
                rowResult.isDuplicate = true;
                rowResult.duplicateField = "taxId (ในไฟล์)";
                break;
              }
              seenTaxIds.set(taxKey, ownerKey);
            }
          }
        }

        validatedData.push(rowResult);
      }

      const valid = validatedData.filter(r => r.errors.length === 0 && !r.isDuplicate);
      const invalid = validatedData.filter(r => r.errors.length > 0 || r.isDuplicate);

      setValidRows(valid);
      setInvalidRows(invalid);

      if (invalid.length > 0) {
        toast.warning('พบข้อมุลไม่ถูกต้อง', { description: `สามารถนำเข้าได้ ${valid.length} รายการ, ผิดพลาด ${invalid.length} รายการ` })
      } else {
        toast.success('วิเคราะห์ไฟล์สำเร็จ', { description: `พร้อมนำเข้า ${valid.length} รายการ` });
      }

    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์');
      console.error(error);
    } finally {
      setIsParsing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setValidRows([]);
    setInvalidRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportValid = () => {
    if (validRows.length === 0) return;

    const customers = validRows.map(row => {
      const idCard = row['เลขบัตรประชาชน'] ? String(row['เลขบัตรประชาชน']) : '';

      // Parse tax IDs from comma-separated values (like phone numbers)
      const taxIds = row['เลขผู้เสียภาษี/เลขทะเบียนพาณิชย์'] || row['เลขผู้เสียภาษี']
        ? String(row['เลขผู้เสียภาษี/เลขทะเบียนพาณิชย์'] || row['เลขผู้เสียภาษี']).split(',').map(t => t.trim()).filter(t => t)
        : [];

      return {
        name: row['ชื่อลูกค้า/ชื่อร้าน'] || row['ชื่อลูกค้า'] || '',
        idCard: idCard,
        phoneNumbers: String(row['เบอร์โทรศัพท์']).split(',').map(p => p.trim()),
        taxIds: taxIds,
        status: (row['สถานะ']?.toLowerCase() || 'new') as 'new' | 'active' | 'pending',
        ownerId: row.targetOwnerId,
        ownerName: row.targetOwnerName,
        existingCustomerId: row.existingCustomerId // Add this for UPSERT
      };
    });

    const hasErrors = invalidRows.length > 0;
    onImport(customers, hasErrors);

    // After import, check if we still have invalid rows to show
    if (hasErrors) {
      setValidRows([]); // Clear valid rows as they are imported
      toast.success(`นำเข้า ${customers.length} รายการสำเร็จ`, { description: 'กรุณาดาวน์โหลดรายการที่ผิดพลาดเพื่อแก้ไข' });
    } else {
      clearFile();
    }
  };

  const handleDownloadErrors = () => {
    generateErrorReport(invalidRows, owners);
    toast.success('ดาวน์โหลดรายการผิดพลาดแล้ว', { description: 'แก้ไขข้อมูลในไฟล์ Excel แล้วอัปโหลดใหม่ได้เลย' });
  };

  const allData = [...invalidRows, ...validRows]; // Show invalid first for attention

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-slate-900">นำเข้าข้อมูลจาก Excel</h3>
          <p className="text-sm text-slate-500">กรอกข้อมูลเพื่อนำเข้าแบบกลุ่ม (รองรับทั้งเพิ่มใหม่และอัปเดต)</p>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              เพิ่มใหม่: ไม่ต้องระบุหมายเลขระบบ
            </span>
            {userRole === 'admin' && (
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                อัปเดต: ต้องระบุคอลัมน์ "หมายเลขระบบ"
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => generateTemplate(owners)}
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
        <Card className="rounded-2xl border-slate-200 overflow-hidden relative">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span className="font-medium text-slate-900">{file.name}</span>
              {isParsing && (
                <div className="flex items-center gap-2 ml-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600">กำลังอ่านไฟล์...</span>
                </div>
              )}
              <div className="flex gap-2 text-xs">
                {validRows.length > 0 && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">ผ่าน {validRows.length}</span>}
                {invalidRows.length > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ไม่ผ่าน {invalidRows.length}</span>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile} className="text-slate-500 hover:text-red-500" disabled={isParsing}>
              <Trash2 className="h-4 w-4 mr-2" />
              ลบไฟล์
            </Button>
          </div>

          {isParsing && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-slate-700">กำลังวิเคราะห์ข้อมูล...</p>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-white border-b sticky top-0">
                  <tr>
                    <th className="px-6 py-3">ชื่อลูกค้า/ชื่อร้าน</th>
                    {owners && <th className="px-6 py-3">ผู้ดูแล</th>}
                    <th className="px-6 py-3">สถานะข้อมูล</th>
                    <th className="px-6 py-3 text-right">การตรวจสอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allData.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{row['ชื่อลูกค้า/ชื่อร้าน'] || row['ชื่อลูกค้า']}</td>
                      {owners && (
                        <td className="px-6 py-4 text-slate-600">
                          {row.targetOwnerName ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                              {row.targetOwnerName}
                            </span>
                          ) : (
                            <span className="text-red-500">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {row.isUpsert ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Upload className="h-3 w-3 mr-1" /> อัปเดตข้อมูลเดิม ({row.existingCustomerId})
                            </span>
                          ) : row.isDuplicate ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              ข้อมูลซ้ำ ({row.duplicateField})
                            </span>
                          ) : null}
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
                        ) : row.isUpsert ? (
                          <CheckCircle2 className="h-5 w-5 text-indigo-500 inline" />
                        ) : row.isDuplicate ? (
                          <AlertCircle className="h-5 w-5 text-amber-500 inline" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                  {allData.length > 100 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-slate-500 text-xs">
                        ... และอีก {allData.length - 100} รายการ ...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
            <Button variant="outline" onClick={clearFile} className="bg-white" disabled={isParsing}>
              ยกเลิก
            </Button>

            <div className="flex gap-3">
              {invalidRows.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDownloadErrors}
                  className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  disabled={isParsing}
                >
                  <FileWarning className="h-4 w-4 mr-2" />
                  ดาวน์โหลดรายการที่ผิดพลาด ({invalidRows.length})
                </Button>
              )}

              {validRows.length > 0 && (
                <Button
                  onClick={handleImportValid}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                  disabled={isParsing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  ยืนยันนำเข้า {validRows.length} รายการ
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

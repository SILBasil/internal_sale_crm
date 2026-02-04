import { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Input } from '@/app/components/ui/input';
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, Trash2, Pencil } from 'lucide-react';
import { parseUserExcelFile, validateUserExcelHeaders, generateUserTemplate, ExcelUserData } from '@/app/utils/excel-utils';
import { toast } from 'sonner';

interface UserImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingEmails: string[];
  onImport: (users: any[]) => void;
}

interface EditableUser {
    originalIndex: number;
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'sales';
    error?: string;
}

export function UserImportDialog({ isOpen, onClose, existingEmails, onImport }: UserImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [data, setData] = useState<EditableUser[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
        // 1. Validate Headers
        const isValid = await validateUserExcelHeaders(file);
        if (!isValid) {
            toast.error('รูปแบบไฟล์ไม่ถูกต้อง', {
                description: 'กรุณาดาวน์โหลด Template และลองใหม่อีกครั้ง',
                action: {
                    label: 'โหลด Template',
                    onClick: generateUserTemplate
                }
            });
            setIsProcessing(false);
            e.target.value = ''; // Reset input
            return;
        }

        // 2. Parse Data
        const rawData = await parseUserExcelFile(file);
        
        // 3. Transform to Editable Format & Check Duplicates
        const transformedData: EditableUser[] = rawData.map((row, index) => {
            const email = String(row['อีเมล'] || '').trim();
            const isDuplicate = existingEmails.includes(email);
            
            return {
                originalIndex: index,
                name: String(row['ชื่อ-นามสกุล'] || ''),
                email: email,
                password: String(row['รหัสผ่าน'] || 'password123'), // Default or from file
                role: (String(row['บทบาท']).toLowerCase() === 'admin' ? 'admin' : 'sales'),
                error: isDuplicate ? 'อีเมลนี้มีอยู่ในระบบแล้ว' : (!email ? 'กรุณาระบุอีเมล' : undefined)
            };
        });
        
        // Check for duplicates within the file itself
        const emailCounts = new Map<string, number>();
        transformedData.forEach(u => {
            if (u.email) emailCounts.set(u.email, (emailCounts.get(u.email) || 0) + 1);
        });
        
        transformedData.forEach(u => {
            if (!u.error && u.email && (emailCounts.get(u.email) || 0) > 1) {
                u.error = 'อีเมลซ้ำกันในไฟล์';
            }
        });

        setData(transformedData);
        setStep('preview');
        toast.success(`อ่านไฟล์สำเร็จ พบ ${rawData.length} รายการ`);

    } catch (error) {
        console.error(error);
        toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์');
    } finally {
        setIsProcessing(false);
        e.target.value = '';
    }
  };

  const handleUpdateUser = (index: number, field: keyof EditableUser, value: string) => {
    const newData = [...data];
    const user = { ...newData[index], [field]: value };
    
    // Re-validate logic for this user
    if (field === 'email') {
        const email = value.trim();
        const isDuplicateSystem = existingEmails.includes(email);
        // Check duplicate within file (excluding self)
        const isDuplicateFile = newData.some((u, i) => i !== index && u.email === email);
        
        if (isDuplicateSystem) user.error = 'อีเมลนี้มีอยู่ในระบบแล้ว';
        else if (isDuplicateFile) user.error = 'อีเมลซ้ำกันในไฟล์';
        else if (!email) user.error = 'กรุณาระบุอีเมล';
        else user.error = undefined;
    }

    newData[index] = user as EditableUser;
    setData(newData);
  };

  const handleDeleteUser = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
  };

  const handleSave = () => {
    const hasError = data.some(u => u.error);
    if (hasError) {
        toast.error('กรุณาแก้ไขข้อมูลที่ผิดพลาดก่อนบันทึก');
        return;
    }
    
    // Convert back to format expected by user-management
    const usersToImport = data.map(u => ({
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role
    }));
    
    onImport(usersToImport);
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setData([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-7xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-2 border-b relative">
                <DialogTitle>นำเข้าผู้ใช้งานจาก Excel</DialogTitle>
                <DialogDescription>
                    {step === 'upload' 
                        ? 'อัปโหลดไฟล์ Excel ที่มีข้อมูลผู้ใช้งาน (.xlsx)' 
                        : 'ตรวจสอบและแก้ไขข้อมูลก่อนนำเข้า'}
                </DialogDescription>
                {step === 'upload' && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={generateUserTemplate}
                        className="absolute right-12 top-4 flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Template
                    </Button>
                )}
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6">
                {step === 'upload' ? (
                     <div className="flex flex-col items-center justify-center space-y-6">
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <div className="p-4 bg-white rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet className="h-10 w-10 text-blue-600" />
                                </div>
                                <p className="mb-2 text-sm text-slate-700">
                                    <span className="font-semibold text-blue-600">คลิกเพื่ออัปโหลด</span> หรือลากและวาง
                                </p>
                                <p className="text-xs text-slate-500">รองรับไฟล์ Template (.xlsx)</p>
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".xlsx"
                                onChange={handleFileUpload}
                                disabled={isProcessing}
                            />
                        </label>
                     </div>
                ) : (
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>ชื่อ-นามสกุล</TableHead>
                                    <TableHead>อีเมล</TableHead>
                                    <TableHead>รหัสผ่าน</TableHead>
                                    <TableHead>บทบาท</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((user, idx) => (
                                    <TableRow key={idx} className={user.error ? 'bg-red-50/50' : ''}>
                                        <TableCell>
                                            <Input 
                                                value={user.name} 
                                                onChange={(e) => handleUpdateUser(idx, 'name', e.target.value)}
                                                className="h-8 bg-white" 
                                                placeholder="ชื่อ-นามสกุล"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Input 
                                                    value={user.email} 
                                                    onChange={(e) => handleUpdateUser(idx, 'email', e.target.value)}
                                                    className={`h-8 bg-white ${user.error ? 'border-red-300 focus-visible:ring-red-300' : ''}`} 
                                                    placeholder="user@email.com"
                                                />
                                                {user.error && (
                                                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" /> {user.error}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                value={user.password} 
                                                onChange={(e) => handleUpdateUser(idx, 'password', e.target.value)}
                                                className="h-8 bg-white" 
                                                type="text" 
                                                placeholder="รหัสผ่าน"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => handleUpdateUser(idx, 'role', e.target.value as any)}
                                                className="h-8 rounded-md border border-slate-300 text-sm px-2 bg-white"
                                            >
                                                <option value="sales">Sales</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                onClick={() => handleDeleteUser(idx)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
            
            <DialogFooter className="p-6 pt-2 border-t bg-slate-50 rounded-b-lg">
                <Button variant="outline" onClick={handleClose}>ยกเลิก</Button>
                {step === 'preview' && (
                     <Button 
                        onClick={handleSave} 
                        disabled={data.length === 0 || data.some(u => !!u.error)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                     >
                        <Upload className="h-4 w-4 mr-2" />
                        บันทึก {data.length} รายการ
                     </Button>
                )}
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertTriangle, Phone, Plus, X, User } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';

export interface CustomerInfoData {
  name: string;
  idCard: string;
  phoneNumbers: string[];
  taxId: string;
  status: 'new' | 'active' | 'pending';
  ownerId?: string; // Add ownerId for admin selection
}

interface CustomerInfoFormProps {
  initialData?: Partial<CustomerInfoData>;
  onSubmit: (data: CustomerInfoData) => void;
  onCancel?: () => void;
  owners?: { id: string; name: string; email: string }[]; // List of sales persons for admin
  onCheckDuplicate?: (idCard: string, phoneNumbers: string[], taxId?: string, ownerId?: string) => Promise<{
    isDuplicate: boolean;
    duplicateField: string | null;
    duplicateValue?: string;
  }>;
}

export function CustomerInfoForm({ initialData, onSubmit, onCancel, owners, onCheckDuplicate }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState<CustomerInfoData>({
    name: initialData?.name || '',
    idCard: initialData?.idCard || '',
    phoneNumbers: initialData?.phoneNumbers || [''],
    taxId: initialData?.taxId || '',
    status: initialData?.status || 'new',
    ownerId: initialData?.ownerId || (owners && owners.length > 0 ? owners[0].id : undefined),
  });
  const [duplicateErrors, setDuplicateErrors] = useState<{ idCard?: string; taxId?: string; phone?: string }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อลูกค้าหรือชื่อร้าน';
    }

    if (formData.idCard && formData.idCard.length !== 13) {
      newErrors.idCard = 'เลขบัตรประชาชนต้องมี 13 หลัก';
    }

    const validPhones = formData.phoneNumbers.filter(p => p.trim());
    if (validPhones.length === 0) {
      newErrors.phoneNumbers = 'กรุณากรอกเบอร์โทรศัพท์อย่างน้อย 1 หมายเลข';
    } else {
      // Validation for phone format specifically to allow 02 (9 digits) and mobile (10 digits)
      const invalidPhone = validPhones.find(p => !/^0[2-9][0-9]{7,8}$/.test(p.replace(/-/g, '')));
      if (invalidPhone) {
        newErrors.phoneNumbers = 'เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)';
      }
    }

    if (owners && !formData.ownerId) {
      newErrors.ownerId = 'กรุณาเลือกผู้ดูแลลูกค้า (เซลล์)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (Object.keys(duplicateErrors).length > 0) {
      return; // Block submit if duplicates exist
    }

    // Filter out empty phone numbers before submitting
    const submissionData = {
      ...formData,
      phoneNumbers: validPhones,
    };

    onSubmit(submissionData);
  };

  const handleIdCardChange = (value: string) => {
    // Only allow digits
    const numericValue = value.replace(/\D/g, '').slice(0, 13);
    setFormData({ ...formData, idCard: numericValue });
    setErrors({ ...errors, idCard: '' });
    // Clear duplicate error when typing
    setDuplicateErrors(prev => ({ ...prev, idCard: undefined }));
  };

  const handlePhoneChange = (index: number, value: string) => {
    // Basic filtering to allow typing dashes but clean for state
    // Just keep as is for flexible input, validate on submit or blur
    const newPhoneNumbers = [...formData.phoneNumbers];
    newPhoneNumbers[index] = value;
    setFormData({ ...formData, phoneNumbers: newPhoneNumbers });
    setErrors({ ...errors, phoneNumbers: '' });
    // Clear duplicate error when typing
    setDuplicateErrors(prev => ({ ...prev, phone: undefined }));
  };

  const handleTaxIdChange = (value: string) => {
    setFormData({ ...formData, taxId: value });
    // Clear duplicate error when typing
    setDuplicateErrors(prev => ({ ...prev, taxId: undefined }));
  }

  const handleOwnerChange = (value: string) => {
    setFormData({ ...formData, ownerId: value });
    setErrors({ ...errors, ownerId: '' });
    // Re-check duplicates because Tax ID is unique per owner
    // We trigger this manually or let blur handle it, but changing owner affects uniqueness context
    // Implementing explicit re-check for Tax ID if present
    if (formData.taxId) {
      checkForDuplicates(value);
    }
  }

  const addPhoneNumber = () => {
    setFormData({
      ...formData,
      phoneNumbers: [...formData.phoneNumbers, ''],
    });
  };

  const removePhoneNumber = (index: number) => {
    if (formData.phoneNumbers.length > 1) {
      const newPhoneNumbers = formData.phoneNumbers.filter((_, i) => i !== index);
      setFormData({ ...formData, phoneNumbers: newPhoneNumbers });
    }
  };

  const checkForDuplicates = async (overrideOwnerId?: string) => {
    if (onCheckDuplicate) {
      const validPhones = formData.phoneNumbers.filter(p => p.trim());
      // Don't check if fields are empty
      if (!formData.idCard && validPhones.length === 0 && !formData.taxId) return;

      // Use current ownerId or override
      const ownerToCheck = overrideOwnerId || formData.ownerId;

      const result = await onCheckDuplicate(formData.idCard, validPhones, formData.taxId, ownerToCheck);

      const newDupErrors: { idCard?: string; taxId?: string; phone?: string } = {};

      if (result.isDuplicate) {
        if (result.duplicateField === 'idCard') {
          newDupErrors.idCard = 'เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว';
        } else if (result.duplicateField === 'phone') {
          newDupErrors.phone = 'เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว';
        } else if (result.duplicateField === 'taxId') {
          // Clarify specific owner context
          const ownerName = owners?.find(o => o.id === ownerToCheck)?.name;
          newDupErrors.taxId = `เลขผู้เสียภาษีนี้มีอยู่ในระบบแล้ว (ของ ${ownerName || 'คุณ'})`;
        }
      }
      setDuplicateErrors(newDupErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sales Person Selection (Admin Only) */}
      {owners && owners.length > 0 && (
        <Card className="rounded-xl border border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="ownerId" className="text-blue-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                ผู้ดูแลลูกค้า (เซลล์) <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.ownerId}
                onValueChange={handleOwnerChange}
              >
                <SelectTrigger className="rounded-lg border-blue-200 bg-white focus:ring-2 focus:ring-blue-500 h-11">
                  <SelectValue placeholder="เลือกเซลล์ผู้ดูแล" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map(owner => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ownerId && <p className="text-sm text-red-500">{errors.ownerId}</p>}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Customer Name Section */}
      <Card className="rounded-xl border border-slate-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700">
              ชื่อลูกค้า / ชื่อร้าน <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: '' });
              }}
              placeholder="กรอกชื่อลูกค้าหรือชื่อร้าน"
              className={`rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] h-11 ${errors.name ? 'border-red-500' : ''
                }`}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Identification Section */}
      <Card className="rounded-xl border border-slate-200">
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-4">ข้อมูลระบุตัวตน</h3>

            <div className="space-y-2">
              <Label htmlFor="idCard" className="text-slate-700">
                เลขบัตรประชาชนเจ้าของร้าน
              </Label>
              <Input
                id="idCard"
                type="text"
                value={formData.idCard}
                onChange={(e) => handleIdCardChange(e.target.value)}
                onBlur={checkForDuplicates}
                placeholder="X-XXXX-XXXXX-XX-X"
                maxLength={13}
                className={`rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] h-11 font-mono ${errors.idCard || duplicateErrors.idCard ? 'border-red-500' : ''
                  }`}
              />
              <p className="text-xs text-slate-500">กรอกเลขบัตรประชาชน 13 หลัก</p>
              {errors.idCard && <p className="text-sm text-red-500">{errors.idCard}</p>}
              {duplicateErrors.idCard && <p className="text-sm text-red-500">{duplicateErrors.idCard}</p>}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="taxId" className="text-slate-700">
              เลขผู้เสียภาษี / เลขทะเบียนพาณิชย์
            </Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => handleTaxIdChange(e.target.value)}
              onBlur={checkForDuplicates}
              placeholder="0000000000000"
              className={`rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] h-11 font-mono ${duplicateErrors.taxId ? 'border-red-500' : ''
                }`}
            />
            <p className="text-xs text-slate-500">ไม่บังคับ - สำหรับออกใบกำกับภาษี</p>
            {duplicateErrors.taxId && <p className="text-sm text-red-500">{duplicateErrors.taxId}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Phone Numbers Section */}
      <Card className="rounded-xl border border-slate-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                onClick={addPhoneNumber}
                variant="outline"
                size="sm"
                className="rounded-lg text-[#2563eb] border-[#2563eb] hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มเบอร์
              </Button>
            </div>

            <div className="space-y-3">
              {formData.phoneNumbers.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      onBlur={checkForDuplicates}
                      placeholder="08X-XXX-XXXX"
                      className={`rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] h-11 pl-10 ${(errors.phoneNumbers && index === 0) || duplicateErrors.phone ? 'border-red-500' : ''
                        }`}
                    />
                  </div>
                  {formData.phoneNumbers.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removePhoneNumber(index)}
                      variant="ghost"
                      size="icon"
                      className="rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.phoneNumbers && <p className="text-sm text-red-500">{errors.phoneNumbers}</p>}
            {duplicateErrors.phone && <p className="text-sm text-red-500">{duplicateErrors.phone}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Status Section */}
      <Card className="rounded-xl border border-slate-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-700">
              สถานะลูกค้า <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as 'new' | 'active' | 'pending' })}
            >
              <SelectTrigger className="rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">ใหม่</SelectItem>
                <SelectItem value="active">ใช้งาน</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            ยกเลิก
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 h-11 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow-lg"
          disabled={Object.keys(duplicateErrors).length > 0}
        >
          บันทึกข้อมูล
        </Button>
      </div>
    </form>
  );
}

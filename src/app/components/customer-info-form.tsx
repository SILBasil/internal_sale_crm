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
  taxIds: string[]; // Changed from single taxId to array
  status: 'new' | 'active' | 'pending';
  ownerId?: string; // Add ownerId for admin selection
}

interface CustomerInfoFormProps {
  initialData?: Partial<CustomerInfoData>;
  onSubmit: (data: CustomerInfoData) => void;
  onCancel?: () => void;
  owners?: { id: string; name: string; email: string }[]; // List of sales persons for admin
  onCheckDuplicate?: (idCard: string, phoneNumbers: string[], taxIds?: string[], excludeCustomerId?: string, ownerId?: string) => Promise<{
    isDuplicate: boolean;
    duplicateField: string | null;
    duplicateValue?: string;
    message?: string;
    ownerInfo?: {
      ownerId: string;
      ownerName: string;
      foundCustomers: any[];
    };
  }>;
}

export function CustomerInfoForm({ initialData, onSubmit, onCancel, owners, onCheckDuplicate }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState<CustomerInfoData>({
    name: initialData?.name || '',
    idCard: initialData?.idCard || '',
    phoneNumbers: initialData?.phoneNumbers || [''],
    taxIds: initialData?.taxIds || [''], // Changed from single taxId to array
    status: initialData?.status || 'new',
    ownerId: initialData?.ownerId || (owners && owners.length > 0 ? owners[0].id : undefined),
  });
  const [duplicateErrors, setDuplicateErrors] = useState<{ idCard?: string; taxIds?: string; phone?: string }>({});
  const [internalDuplicateErrors, setInternalDuplicateErrors] = useState<{ phoneNumbers?: string; taxIds?: string }>({});
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [idCardOwner, setIdCardOwner] = useState<{ ownerId: string; ownerName: string; foundCustomers: any[] } | null>(null);
  const [duplicateOwner, setDuplicateOwner] = useState<{ field: string; ownerName: string; customerName: string } | null>(null);

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
      // Validation for phone format - Min 9 digits, Max 10 digits
      const invalidPhone = validPhones.find(p => {
        const cleanPhone = p.replace(/\D/g, '');
        return cleanPhone.length < 9 || cleanPhone.length > 10;
      });
      if (invalidPhone) {
        newErrors.phoneNumbers = 'เบอร์โทรศัพท์ต้องมี 9-10 หลัก (เบอร์บ้าน 9 หลัก, เบอร์ส่วนตัว 10 หลัก)';
      }

      // Check for duplicates within the form itself
      const cleanPhones = validPhones.map(p => p.replace(/\D/g, ''));
      const hasDuplicates = cleanPhones.some((p, index) => cleanPhones.indexOf(p) !== index);
      if (hasDuplicates) {
        newErrors.phoneNumbers = 'กรุณาอย่ากรอกเบอร์โทรศัพท์ซ้ำกันในลูกค้ารายนี้';
      }
    }

    const validTaxIds = formData.taxIds.filter(t => t.trim());
    const cleanTaxIds = validTaxIds.map(t => t.replace(/\D/g, ''));
    if (cleanTaxIds.some((t, index) => cleanTaxIds.indexOf(t) !== index)) {
      newErrors.taxIds = 'กรุณาอย่ากรอกเลขผู้เสียภาษีซ้ำกันในลูกค้ารายนี้';
    }

    if (owners && !formData.ownerId) {
      newErrors.ownerId = 'กรุณาเลือกผู้ดูแลลูกค้า (เซลล์)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (Object.keys(duplicateErrors).length > 0 || Object.keys(internalDuplicateErrors).length > 0) {
      return; // Block submit if duplicates exist
    }

    // Filter out empty phone numbers and tax IDs before submitting
    const submissionData = {
      ...formData,
      phoneNumbers: validPhones,
      taxIds: formData.taxIds.filter(t => t.trim()),
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
    setIdCardOwner(null);

    // If ID card is complete (13 digits), check owner info
    if (numericValue.length === 13) {
      checkIdCardOwner(numericValue);
    }
  };

  const checkIdCardOwner = async (idCard: string) => {
    if (onCheckDuplicate && typeof onCheckDuplicate === 'function') {
      try {
        // Call a new method (we'll add getOwnerByIdCard to App.tsx)
        // For now, let's check if owner has this ID card already
        setIsCheckingDuplicate(true);
        // We'll use the existing check but pass empty tax/phone to get owner info
        const result = await onCheckDuplicate(idCard, [], [], formData.ownerId);

        if (result.ownerInfo) {
          setIdCardOwner(result.ownerInfo);
        }
      } catch (error) {
        console.error("Error checking ID card owner:", error);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }
  };

  const handlePhoneChange = (index: number, value: string) => {
    // Basic filtering to allow typing dashes but clean for state
    // Just keep as is for flexible input, validate on submit or blur
    const newPhoneNumbers = [...formData.phoneNumbers];
    newPhoneNumbers[index] = value;
    setFormData({ ...formData, phoneNumbers: newPhoneNumbers });
    setErrors({ ...errors, phoneNumbers: '' });
    // Clear duplicate error when typing
    setInternalDuplicateErrors(prev => ({ ...prev, phoneNumbers: undefined }));
    setDuplicateOwner(null);
    checkInternalDuplicates();
  };

  const handleTaxIdChange = (index: number, value: string) => {
    const newTaxIds = [...formData.taxIds];
    newTaxIds[index] = value;
    setFormData({ ...formData, taxIds: newTaxIds });
    // Clear internal duplicate error when typing
    setInternalDuplicateErrors(prev => ({ ...prev, taxIds: undefined }));
    setDuplicateOwner(null);
    checkInternalDuplicates();
  }

  const addTaxId = () => {
    setFormData({
      ...formData,
      taxIds: [...formData.taxIds, ''],
    });
  };

  const removeTaxId = (index: number) => {
    if (formData.taxIds.length > 1) {
      const newTaxIds = formData.taxIds.filter((_, i) => i !== index);
      setFormData({ ...formData, taxIds: newTaxIds });
      checkInternalDuplicates();
    }
  };

  const handleOwnerChange = (value: string) => {
    setFormData({ ...formData, ownerId: value });
    setErrors({ ...errors, ownerId: '' });
    // Re-check duplicates because Tax ID is unique per owner
    // We trigger this manually or let blur handle it, but changing owner affects uniqueness context
    // Implementing explicit re-check for Tax IDs if present
    if (formData.taxIds.some(t => t.trim())) {
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
      checkInternalDuplicates();
    }
  };

  const checkInternalDuplicates = () => {
    const newInternalErrors: { phoneNumbers?: string; taxIds?: string } = {};

    // Check phones
    const validPhones = formData.phoneNumbers
      .map(p => p.trim().replace(/\D/g, ""))
      .filter(p => p.length > 0);
    const hasDuplicatePhones = validPhones.some((p, index) => validPhones.indexOf(p) !== index);
    if (hasDuplicatePhones) {
      newInternalErrors.phoneNumbers = 'มีการกรอกเบอร์โทรศัพท์ซ้ำ';
    }

    // Check tax ids
    const validTaxIds = formData.taxIds
      .map(t => t.trim().replace(/\D/g, ""))
      .filter(t => t.length > 0);
    const hasDuplicateTaxIds = validTaxIds.some((t, index) => validTaxIds.indexOf(t) !== index);
    if (hasDuplicateTaxIds) {
      newInternalErrors.taxIds = 'มีการกรอกเลขผู้เสียภาษีซ้ำ';
    }

    setInternalDuplicateErrors(newInternalErrors);
  };

  const checkForDuplicates = async (overrideOwnerId?: string) => {
    // First check internal duplicates
    checkInternalDuplicates();

    if (onCheckDuplicate) {
      const validPhones = formData.phoneNumbers
        .map(p => p.trim().replace(/[-\s]/g, ""))
        .filter(p => p.length >= 9 && p.length <= 10); // Min 9, Max 10

      const validTaxIds = formData.taxIds
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Don't check if all fields are empty
      if (!formData.idCard && validPhones.length === 0 && validTaxIds.length === 0) {
        setDuplicateErrors({});
        return;
      }

      // Use current ownerId or override
      const ownerToCheck = overrideOwnerId && typeof overrideOwnerId === 'string' ? overrideOwnerId : formData.ownerId;

      setIsCheckingDuplicate(true);
      try {
        const result = await onCheckDuplicate(
          formData.idCard,
          validPhones,
          validTaxIds,
          undefined, // excludeCustomerId (if parent handles it via closure)
          ownerToCheck   // ownerId
        );

        const newDupErrors: { idCard?: string; taxIds?: string; phone?: string } = {};

        if (result.isDuplicate) {
          if (result.duplicateField === 'idCard') {
            newDupErrors.idCard = 'เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว';
          } else if (result.duplicateField === 'phone') {
            newDupErrors.phone = result.message || 'เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว';
          } else if (result.duplicateField === 'taxId') {
            newDupErrors.taxIds = result.message || 'เลขผู้เสียภาษีนี้มีอยู่ในระบบแล้ว';
          }

          if (result.existingCustomer) {
            setDuplicateOwner({
              field: result.duplicateField || '',
              ownerName: result.existingCustomer.ownerName,
              customerName: result.existingCustomer.name || ''
            });
          }
        } else {
          setDuplicateOwner(null);
        }
        setDuplicateErrors(newDupErrors);
      } catch (error) {
        console.error("Duplicate check failed:", error);
      } finally {
        setIsCheckingDuplicate(false);
      }
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
                  {(owners || [])
                    .filter((owner: any) => !owner.status || owner.status === 'active')
                    .map(owner => (
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
                onBlur={() => checkForDuplicates()}
                placeholder="X-XXXX-XXXXX-XX-X"
                maxLength={13}
                className={`rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] h-11 font-mono ${errors.idCard || duplicateErrors.idCard ? 'border-red-500' : ''
                  }`}
              />
              <p className="text-xs text-slate-500">กรอกเลขบัตรประชาชน 13 หลัก</p>
              {errors.idCard && <p className="text-sm text-red-500">{errors.idCard}</p>}
              {duplicateErrors.idCard && <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">{duplicateErrors.idCard}</p>}
              {idCardOwner && (
                <Alert className="bg-blue-50 border-blue-200 rounded-xl mt-3">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>เตือน:</strong> มีคนต่อไปนี้ใช้เลขบัตรนี้แล้ว<br />
                    <span className="ml-2">👤 {idCardOwner.ownerName}</span><br />
                    <span className="text-xs text-blue-700 ml-2">ลูกค้า: {idCardOwner.foundCustomers.map(c => c.name).join(', ')}</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700">
                เลขผู้เสียภาษี / เลขทะเบียนพาณิชย์
              </Label>
              <Button
                type="button"
                onClick={addTaxId}
                variant="outline"
                size="sm"
                className="rounded-lg text-[#2563eb] border-[#2563eb] hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มเลข
              </Button>
            </div>

            <div className="space-y-3">
              {formData.taxIds.map((taxId, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={taxId}
                      onChange={(e) => handleTaxIdChange(index, e.target.value)}
                      onBlur={() => checkForDuplicates()}
                      placeholder="0000000000000"
                      className={`rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] h-11 font-mono ${duplicateErrors.taxIds && index === 0 ? 'border-red-500' : ''
                        }`}
                    />
                  </div>
                  {formData.taxIds.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeTaxId(index)}
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
            <p className="text-xs text-slate-500">ไม่บังคับ - สำหรับออกใบกำกับภาษี (สามารถเพิ่มได้หลายเลข)</p>
            {internalDuplicateErrors.taxIds && (
              <Alert className="bg-amber-50 border-amber-200 rounded-xl mt-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 font-medium">
                  {internalDuplicateErrors.taxIds}
                </AlertDescription>
              </Alert>
            )}
            {errors.taxIds && <p className="text-sm text-red-500 bg-red-50 p-2 rounded mt-2">{errors.taxIds}</p>}
            {duplicateErrors.taxIds && (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{duplicateErrors.taxIds}</p>
                {duplicateOwner && duplicateOwner.field === 'taxId' && (
                  <Alert className="bg-blue-50 border-blue-200 rounded-xl">
                    <User className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-xs">
                      ผู้ดูแลปัจจุบัน: <strong>{duplicateOwner.ownerName}</strong><br />
                      ลูกค้า: {duplicateOwner.customerName}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
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
              {formData.phoneNumbers.map((phone, index) => {
                const cleanPhone = phone.replace(/\D/g, '');
                const isPhoneComplete = cleanPhone.length === 9 || cleanPhone.length === 10;
                const isPhoneValid = cleanPhone.length >= 9 && cleanPhone.length <= 10;

                return (
                  <div key={index} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => handlePhoneChange(index, e.target.value)}
                          onBlur={() => checkForDuplicates()}
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
                    {/* Show phone validation info */}
                    {phone && !isPhoneValid && (
                      <p className="text-xs text-orange-600">ต้องมี 9-10 หลัก ({cleanPhone.length} หลัก)</p>
                    )}
                  </div>
                );
              })}
            </div>
            {internalDuplicateErrors.phoneNumbers && (
              <Alert className="bg-amber-50 border-amber-200 rounded-xl mt-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 font-medium">
                  {internalDuplicateErrors.phoneNumbers}
                </AlertDescription>
              </Alert>
            )}
            {errors.phoneNumbers && <p className="text-sm text-red-500 bg-red-50 p-2 rounded mt-2">{errors.phoneNumbers}</p>}
            {duplicateErrors.phone && (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{duplicateErrors.phone}</p>
                {duplicateOwner && duplicateOwner.field === 'phone' && (
                  <Alert className="bg-blue-50 border-blue-200 rounded-xl">
                    <User className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-xs">
                      ผู้ดูแลปัจจุบัน: <strong>{duplicateOwner.ownerName}</strong><br />
                      ลูกค้า: {duplicateOwner.customerName}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
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
          className={`flex-1 h-11 ${isCheckingDuplicate ? 'bg-slate-400' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'} text-white rounded-xl shadow-lg transition-colors`}
          disabled={Object.keys(duplicateErrors).length > 0 || Object.keys(internalDuplicateErrors).length > 0 || isCheckingDuplicate}
        >
          {isCheckingDuplicate ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              กำลังตรวจสอบข้อมูล...
            </div>
          ) : (
            'บันทึกข้อมูล'
          )}
        </Button>
      </div>
    </form>
  );
}

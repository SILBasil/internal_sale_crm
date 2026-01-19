import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  status: 'new' | 'active' | 'pending';
}

interface AddCustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
  onCancel?: () => void;
  onCheckDuplicate?: (phone: string, email: string) => { isDuplicate: boolean; duplicateField: string | null };
}

export function AddCustomerForm({ onSubmit, onCancel, onCheckDuplicate }: AddCustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    status: 'new',
  });
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const checkForDuplicates = () => {
    if (onCheckDuplicate && formData.phone && formData.email) {
      const result = onCheckDuplicate(formData.phone, formData.email);
      if (result.isDuplicate) {
        setDuplicateWarning(
          result.duplicateField === 'both'
            ? 'พบข้อมูลลูกค้าที่มีเบอร์โทรและอีเมลนี้ในระบบแล้ว'
            : result.duplicateField === 'phone'
            ? 'พบข้อมูลลูกค้าที่มีเบอร์โทรนี้ในระบบแล้ว'
            : 'พบข้อมูลลูกค้าที่มีอีเมลนี้ในระบบแล้ว'
        );
      } else {
        setDuplicateWarning(null);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {duplicateWarning && (
        <Alert className="bg-orange-50 border-orange-200 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {duplicateWarning} คุณยังสามารถบันทึกข้อมูลได้หากต้องการ
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">ชื่อลูกค้า</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="กรอกชื่อลูกค้า"
          required
          className="rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          onBlur={checkForDuplicates}
          placeholder="08X-XXX-XXXX"
          required
          className="rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          onBlur={checkForDuplicates}
          placeholder="example@email.com"
          required
          className="rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">สถานะ</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as 'new' | 'active' | 'pending' })}
        >
          <SelectTrigger className="rounded-lg border-slate-300 focus:ring-[#2563eb] focus:border-[#2563eb]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">ใหม่</SelectItem>
            <SelectItem value="active">ใช้งาน</SelectItem>
            <SelectItem value="pending">รอดำเนินการ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-lg"
          >
            ยกเลิก
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg shadow-lg"
        >
          บันทึก
        </Button>
      </div>
    </form>
  );
}
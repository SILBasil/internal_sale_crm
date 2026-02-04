import { Phone, Mail, Edit, IdCard } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';

export interface Customer {
  id: string;
  name: string;
  date: string;
  createdAt?: string; // Added createdAt
  phoneNumbers: string[];
  email?: string;
  idCard?: string;
  taxId?: string;
  status: 'new' | 'active' | 'pending';
  ownerId: string;
  ownerName?: string;
}

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
}

export function CustomerTable({ customers, onEdit }: CustomerTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
      case 'active':
        return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'pending':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'ใหม่';
      case 'active':
        return 'ใช้งาน';
      case 'pending':
        return 'รอดำเนินการ';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="text-xs uppercase text-slate-600">ชื่อลูกค้า</TableHead>
            <TableHead className="text-xs uppercase text-slate-600">การติดต่อ</TableHead>
            <TableHead className="text-xs uppercase text-slate-600">ข้อมูลระบุตัวตน</TableHead>
            <TableHead className="text-xs uppercase text-slate-600">สถานะ</TableHead>
            <TableHead className="text-xs uppercase text-slate-600">ผู้ดูแล</TableHead>
            <TableHead className="text-xs uppercase text-slate-600">วันที่เพิ่ม</TableHead>
            <TableHead className="text-xs uppercase text-slate-600 text-right">การจัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center bg-slate-50/50 italic">
                <div className="flex flex-col items-center justify-center space-y-2 py-8">
                  <span className="text-3xl">🔍</span>
                  <p className="text-slate-500 font-medium">ไม่พบข้อมูลลูกค้า หรือเกิดข้อผิดพลาดในการดึงข้อมูล</p>
                  <p className="text-xs text-slate-400">หากคุณกำลังระบุตัวกรองหลายส่วน (เช่น ชื่อ + สถานะ + เซลล์) <br/> โปรดตรวจสอบว่าได้สร้าง Composite Index ใน Firebase แล้ว</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-slate-50 group">
                <TableCell>
                  <div>
                    <p className="text-slate-900 font-medium">{customer.name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {customer.phoneNumbers.slice(0, 2).map((phone, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{phone}</span>
                      </div>
                    ))}
                    {customer.phoneNumbers.length > 2 && (
                      <p className="text-xs text-slate-500 ml-6">
                        +{customer.phoneNumbers.length - 2} เบอร์
                      </p>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{customer.email}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {customer.idCard && (
                      <div className="flex items-center gap-2 text-sm">
                        <IdCard className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 font-mono">{customer.idCard}</span>
                      </div>
                    )}
                    {customer.taxId && (
                      <p className="text-xs text-slate-500 ml-6 font-mono">
                        Tax: {customer.taxId}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(customer.status)} rounded-full px-3 py-1`}>
                    {getStatusLabel(customer.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-slate-700 font-medium">
                    {customer.ownerName || customer.ownerId}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono leading-none">{customer.ownerId}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-slate-600">
                    {(() => {
                      const dateVal = customer.createdAt;
                      if (!dateVal) return customer.date;
                      
                      // If it's a Firestore Timestamp (has seconds)
                      const d = (typeof dateVal === 'object' && 'seconds' in dateVal) 
                        ? new Date((dateVal as any).seconds * 1000)
                        : new Date(dateVal);

                      return isNaN(d.getTime()) ? customer.date : d.toLocaleDateString('th-TH', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: '2-digit' 
                      });
                    })()}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(customer)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2563eb] hover:text-[#2563eb] hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    แก้ไข
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
import { Phone, Mail, Edit, IdCard, Trash2, Building2 } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';

export interface Customer {
  id: string;
  name: string;
  date: string;
  createdAt?: string; // Added createdAt
  phoneNumbers: string[];
  phoneNumbers_clean?: string[];
  email?: string;
  idCard?: string;
  taxIds?: string[]; // Changed from single taxId to array
  status: 'new' | 'active' | 'pending';
  ownerId: string;
  ownerName?: string;
  search_keywords?: string[];
}

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
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
                      <p className="text-xs text-slate-400">หากคุณกำลังระบุตัวกรองหลายส่วน (เช่น ชื่อ + สถานะ + เซลล์) <br /> โปรดตรวจสอบว่าได้สร้าง Composite Index ใน Firebase แล้ว</p>
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
                      <div className="space-y-2">
                        {customer.idCard && (
                          <div className="flex items-center gap-2 text-sm">
                            <IdCard className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-700 font-mono">{customer.idCard}</span>
                          </div>
                        )}
                        {customer.taxIds && customer.taxIds.length > 0 && (
                          <div className="space-y-2">
                            {customer.taxIds.map((taxId, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700 font-mono">{taxId}</span>
                              </div>
                            ))}
                          </div>
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
                        {customer.ownerName || (customer.ownerId ? customer.ownerId : 'ไม่มีเซลล์')}
                      </p>
                      {customer.ownerId && (
                        <p className="text-[10px] text-slate-400 font-mono leading-none">{customer.ownerId}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600">
                        {(() => {
                          const dateVal = customer.createdAt;
                          if (!dateVal) return customer.date;

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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(customer)}
                          className="text-[#2563eb] hover:text-[#2563eb] hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          แก้ไข
                        </Button>
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(customer)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {customers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 italic">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-slate-500 font-medium">ไม่พบข้อมูลลูกค้า</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <div key={customer.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{customer.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        เพิ่มเมื่อ: {(() => {
                          const dateVal = customer.createdAt;
                          if (!dateVal) return customer.date;
                          const d = (typeof dateVal === 'object' && 'seconds' in dateVal)
                            ? new Date((dateVal as any).seconds * 1000)
                            : new Date(dateVal);
                          return isNaN(d.getTime()) ? customer.date : d.toLocaleDateString('th-TH', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          });
                        })()}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(customer.status)} rounded-full px-2 py-0.5 text-xs`}>
                      {getStatusLabel(customer.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div>
                        {customer.phoneNumbers.slice(0, 2).map((phone, idx) => (
                          <div key={idx} className="text-sm text-slate-700">{phone}</div>
                        ))}
                        {customer.phoneNumbers.length > 2 && (
                          <p className="text-xs text-slate-500">+{customer.phoneNumbers.length - 2} เบอร์</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {(customer.ownerName || 'ไ').charAt(0)}
                      </div>
                      <span className="text-sm text-slate-600">
                        ดูแลโดย {customer.ownerName || (customer.ownerId ? customer.ownerId : 'ไม่มีเซลล์')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(customer)}
                      className="flex-1 text-[#2563eb] border-blue-200 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      แก้ไข
                    </Button>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(customer)}
                        className="text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
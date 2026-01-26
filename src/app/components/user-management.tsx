import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { UserPlus, Shield, User, FileSpreadsheet, Download, Upload, Edit } from 'lucide-react';
import { generateUserTemplate, parseUserExcelFile } from '@/app/utils/excel-utils';
import { toast } from 'sonner';

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'sales';
  status: 'active' | 'inactive';
  createdDate: string;
}

interface UserManagementProps {
  users: UserData[];
  onAddUser: (email: string, password: string, name: string, role: 'admin' | 'sales') => void;
  onBulkAddUsers: (users: Omit<UserData, 'id' | 'status' | 'createdDate'>[]) => void;
  onUpdateUser: (userId: string, updates: Partial<UserData>) => void;
}

export function UserManagement({ users, onAddUser, onBulkAddUsers, onUpdateUser }: UserManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'sales' as 'admin' | 'sales',
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.id, editingUser);
      setEditingUser(null);
      toast.success('อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const rawData = await parseUserExcelFile(file);
      const newUsers = rawData.map(row => ({
        name: row['ชื่อ-นามสกุล'],
        email: row['อีเมล'],
        role: (row['บทบาท']?.toLowerCase() === 'admin' ? 'admin' : 'sales') as 'admin' | 'sales',
        password: 'password123' // Default password for imported users
      }));
      onBulkAddUsers(newUsers);
      toast.success('นำเข้าผู้ใช้งานสำเร็จ', { description: `นำเข้าทั้งหมด ${newUsers.length} รายการ` });
    } catch (error) {
      toast.error('ไม่สามารถนำเข้าข้อมูลได้', { description: 'กรุณาตรวจสอบรูปแบบไฟล์' });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add User Section */}
      <Card className="rounded-xl border border-slate-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <UserPlus className="h-5 w-5 text-[#2563eb]" />
              เพิ่มผู้ใช้งานใหม่
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={generateUserTemplate}
                className="rounded-lg h-9 border-slate-200 text-slate-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
              <div className="relative">
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={handleExcelImport}
                  className="hidden"
                  id="user-excel-upload"
                  disabled={isImporting}
                />
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-lg h-9 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  <label htmlFor="user-excel-upload" className="cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {isImporting ? 'กำลังนำเข้า...' : 'Import Excel'}
                  </label>
                </Button>
              </div>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant={showAddForm ? 'outline' : 'default'}
                className={showAddForm ? 'h-9 rounded-lg' : 'h-9 bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shadow-sm'}
              >
                {showAddForm ? 'ยกเลิก' : 'เพิ่มผู้ใช้งาน'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddUser(formData.email, formData.password, formData.name, formData.role);
              setFormData({ email: '', password: '', name: '', role: 'sales' });
              setShowAddForm(false);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">ชื่อ</Label>
                  <Input
                    id="user-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ชื่อผู้ใช้งาน"
                    required
                    className="rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">อีเมล</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@company.com"
                    required
                    className="rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">รหัสผ่าน</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">บทบาท</Label>
                  <select
                    id="user-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'sales' })}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 outline-none"
                  >
                    <option value="sales">Sales</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg shadow-sm"
                >
                  สร้างผู้ใช้งาน
                </Button>
              </div>
            </form>
          </CardContent>
        )}
        {editingUser && (
          <CardContent className="border-t border-slate-100 bg-slate-50/50">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">แก้ไขข้อมูลผู้ใช้งาน: {editingUser.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>ยกเลิก</Button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ชื่อ</Label>
                  <Input
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                    className="rounded-lg border-slate-300 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>อีเมล</Label>
                  <Input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    required
                    className="rounded-lg border-slate-300 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>บทบาท</Label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'sales' })}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 bg-white outline-none"
                  >
                    <option value="sales">Sales</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>สถานะ</Label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 bg-white outline-none"
                  >
                    <option value="active">ใช้งาน</option>
                    <option value="inactive">ปิดการใช้งาน</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8"
                >
                  บันทึกการแก้ไข
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* User List */}
      <Card className="rounded-xl border border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">รายการผู้ใช้งาน</CardTitle>
          <p className="text-sm text-slate-500">จำนวนผู้ใช้งานทั้งหมด: {users.length} คน</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs uppercase text-slate-600">ผู้ใช้งาน</TableHead>
                <TableHead className="text-xs uppercase text-slate-600">อีเมล</TableHead>
                <TableHead className="text-xs uppercase text-slate-600">บทบาท</TableHead>
                <TableHead className="text-xs uppercase text-slate-600">สถานะ</TableHead>
                <TableHead className="text-xs uppercase text-slate-600 border-none">วันที่สร้าง</TableHead>
                <TableHead className="text-xs uppercase text-slate-600 text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2563eb] flex items-center justify-center text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }
                    >
                      {user.role === 'admin' ? (
                        <Shield className="h-3 w-3 mr-1" />
                      ) : (
                        <User className="h-3 w-3 mr-1" />
                      )}
                      {user.role === 'admin' ? 'Admin' : 'Sales'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      }
                    >
                      {user.status === 'active' ? 'ใช้งาน' : 'ปิดการใช้งาน'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">{user.createdDate}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setEditingUser(user);
                        setShowAddForm(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      แก้ไข
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { UserPlus, Shield, User } from 'lucide-react';

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
}

export function UserManagement({ users, onAddUser }: UserManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'sales' as 'admin' | 'sales',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(formData.email, formData.password, formData.name, formData.role);
    setFormData({ email: '', password: '', name: '', role: 'sales' });
    setShowAddForm(false);
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
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? 'outline' : 'default'}
              className={showAddForm ? 'rounded-lg' : 'bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shadow-lg'}
            >
              {showAddForm ? 'ยกเลิก' : 'เพิ่มผู้ใช้งาน'}
            </Button>
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">ชื่อ</Label>
                  <Input
                    id="user-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ชื่อผู้ใช้งาน"
                    required
                    className="rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
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
                    className="rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
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
                    className="rounded-lg border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">บทบาท</Label>
                  <select
                    id="user-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'sales' })}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none"
                  >
                    <option value="sales">Sales</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg shadow-lg"
                >
                  สร้างผู้ใช้งาน
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
                <TableHead className="text-xs uppercase text-slate-600">วันที่สร้าง</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

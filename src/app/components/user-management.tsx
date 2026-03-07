import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { UserPlus, Shield, User, FileSpreadsheet, Download, Edit, Eye, EyeOff, Lock, Trash2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { generateUserTemplate } from '@/app/utils/excel-utils';
import { toast } from 'sonner';
import { UserImportDialog } from './user-import-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/app/components/ui/dialog";

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'sales';
  status: 'active' | 'inactive';
  createdDate: string;
  password?: string;
  customerCount?: number;
}

interface UserManagementProps {
  users: UserData[];
  onAddUser: (email: string, password: string, name: string, role: 'admin' | 'sales') => void;
  onBulkAddUsers: (users: Omit<UserData, 'id' | 'status' | 'createdDate'>[]) => void;
  onUpdateUser: (userId: string, updates: Partial<UserData>) => void;
  onDeactivateUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
}

export function UserManagement({ users, onAddUser, onBulkAddUsers, onUpdateUser, onDeactivateUser, onDeleteUser }: UserManagementProps) {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // For Add User form
  const [showEditPassword, setShowEditPassword] = useState(false); // For Edit User form

  // Deactivate/Delete confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'deactivate' | 'delete';
    user: UserData | null;
  }>({
    isOpen: false,
    type: 'deactivate',
    user: null,
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'sales' as 'admin' | 'sales',
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // Don't include password in updates if it's empty strings (meaning no change)
      const updates = { ...editingUser };
      if (!updates.password || updates.password.trim() === '') {
        delete updates.password;
      }

      onUpdateUser(editingUser.id, updates);
      setEditingUser(null);
      toast.success('อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
    }
  };

  const handleImportSuccess = (newUsers: any[]) => {
    onBulkAddUsers(newUsers);
    toast.success('นำเข้าผู้ใช้งานสำเร็จ', { description: `นำเข้าทั้งหมด ${newUsers.length} รายการ` });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(formData.email, formData.password, formData.name, formData.role);
    setFormData({ email: '', password: '', name: '', role: 'sales' });
    setIsAddUserOpen(false);
    setShowPassword(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card className="rounded-xl border border-slate-200 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <UserPlus className="h-5 w-5 text-[#2563eb]" />
              จัดการผู้ใช้งาน
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={generateUserTemplate}
                className="rounded-lg h-9 border-slate-200 text-slate-600 flex-1 sm:flex-none justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                className="rounded-lg h-9 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 flex-1 sm:flex-none justify-center"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import Excel
              </Button>

              <UserImportDialog
                isOpen={showImportDialog}
                onClose={() => setShowImportDialog(false)}
                existingEmails={users.map(u => u.email)}
                onImport={handleImportSuccess}
              />


              <Button
                onClick={() => {
                  setIsAddUserOpen(true);
                  setShowPassword(false);
                }}
                className="h-9 bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shadow-sm flex-1 sm:flex-none justify-center w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                เพิ่มผู้ใช้งาน
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลเพื่อสร้างผู้ใช้งานใหม่ในระบบ
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">ชื่อ-นามสกุล</Label>
                <Input
                  id="user-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="สมชาย ใจดี"
                  required
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">รหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
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
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>ยกเลิก</Button>
              <Button type="submit" className="bg-[#2563eb] hover:bg-[#1d4ed8]">บันทึก</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          // Clear password field when opening edit modal to indicate "leave blank to keep"
                          setEditingUser({ ...user, password: '' });
                          setShowEditPassword(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        แก้ไข
                      </Button>
                      {user.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              type: 'deactivate',
                              user
                            });
                          }}
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          ปิดใช้งาน
                        </Button>
                      )}
                      {user.status === 'inactive' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              type: 'delete',
                              user
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          ลบ
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลผู้ใช้งาน</DialogTitle>
              <DialogDescription>
                แก้ไขรายละเอียดผู้ใช้งาน หากต้องการเปลี่ยนรหัสผ่านให้กรอกช่องใหม่
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อ</Label>
                <Input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)</Label>
                <div className="relative">
                  <Input
                    type={showEditPassword ? "text" : "password"}
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    placeholder="ตั้งรหัสผ่านใหม่"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>บทบาท</Label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'sales' })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 outline-none"
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
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 outline-none"
                >
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ปิดการใช้งาน</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>ยกเลิก</Button>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">บันทึกการแก้ไข</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Deactivate/Delete Confirmation Dialog */}
      {confirmDialog.isOpen && confirmDialog.user && (
        <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => {
          if (!open) setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${confirmDialog.type === 'deactivate'
                  ? 'bg-amber-100'
                  : 'bg-red-100'
                  }`}>
                  <AlertCircle className={`h-6 w-6 ${confirmDialog.type === 'deactivate'
                    ? 'text-amber-600'
                    : 'text-red-600'
                    }`} />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-lg">
                    {confirmDialog.type === 'deactivate'
                      ? 'ปิดการใช้งานเซลล์'
                      : 'ลบเซลล์นี้'}
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-2">
                    {confirmDialog.type === 'deactivate'
                      ? 'คุณต้องการปิดการใช้งานเซลล์นี้หรือไม่ ลูกค้าทั้งหมดจะเปลี่ยนเป็น "เซลล์ว่าง"'
                      : 'การลบจะไม่สามารถย้อนกลับได้ กรุณายืนยัน'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">ชื่อ:</span>
                <span className="font-medium text-slate-900">{confirmDialog.user.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">อีเมล:</span>
                <span className="font-medium text-slate-900 text-sm">{confirmDialog.user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">บทบาท:</span>
                <span className="font-medium text-slate-900">
                  {confirmDialog.user.role === 'admin' ? 'Admin' : 'Sales'}
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
              >
                ยกเลิก
              </Button>
              <Button
                className={`${confirmDialog.type === 'deactivate'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                onClick={() => {
                  if (confirmDialog.type === 'deactivate' && onDeactivateUser) {
                    onDeactivateUser(confirmDialog.user!.id);
                  } else if (confirmDialog.type === 'delete' && onDeleteUser) {
                    onDeleteUser(confirmDialog.user!.id);
                  }
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
              >
                {confirmDialog.type === 'deactivate' ? 'ปิดการใช้งาน' : 'ลบ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

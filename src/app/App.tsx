import { useState } from 'react';
import { LoginPage } from '@/app/components/login-page';
import { CRMSidebar } from '@/app/components/crm-sidebar';
import { CRMHeader } from '@/app/components/crm-header';
import { DashboardStats } from '@/app/components/dashboard-stats';
import { CustomerTable, Customer } from '@/app/components/customer-table';
import { CustomerInfoForm, CustomerInfoData } from '@/app/components/customer-info-form';
import { EditCustomerModal } from '@/app/components/edit-customer-modal';
import { UserManagement, UserData } from '@/app/components/user-management';
import { toast } from 'sonner';
import { Toaster } from '@/app/components/ui/sonner';

// Mock users database
const mockUsers = [
  { email: 'admin@company.com', password: 'admin123', name: 'Somchai', role: 'admin' as const, id: 'U001' },
  { email: 'sales@company.com', password: 'sales123', name: 'Suda', role: 'sales' as const, id: 'U002' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<typeof mockUsers[0] | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // System users state
  const [systemUsers, setSystemUsers] = useState<UserData[]>([
    {
      id: 'U001',
      email: 'admin@company.com',
      name: 'Somchai',
      role: 'admin',
      status: 'active',
      createdDate: '10 ม.ค. 2026',
    },
    {
      id: 'U002',
      email: 'sales@company.com',
      name: 'Suda',
      role: 'sales',
      status: 'active',
      createdDate: '10 ม.ค. 2026',
    },
  ]);

  // Mock customer data
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 'C001',
      name: 'บริษัท ABC จำกัด',
      date: '15 ม.ค. 2026',
      phoneNumbers: ['089-123-4567', '092-111-2222'],
      email: 'contact@abc.com',
      idCard: '1234567890123',
      taxId: '0123456789012',
      status: 'active',
      ownerId: 'U001',
      ownerName: 'Somchai',
    },
    {
      id: 'C002',
      name: 'ร้านค้า XYZ',
      date: '14 ม.ค. 2026',
      phoneNumbers: ['092-345-6789'],
      email: 'info@xyz.com',
      idCard: '9876543210987',
      status: 'pending',
      ownerId: 'U002',
      ownerName: 'Suda',
    },
    {
      id: 'C003',
      name: 'บริษัท DEF Corporation',
      date: '13 ม.ค. 2026',
      phoneNumbers: ['081-234-5678', '081-234-5679', '081-234-5680'],
      email: 'sales@def.com',
      idCard: '5555555555555',
      taxId: '9999999999999',
      status: 'new',
      ownerId: 'U001',
      ownerName: 'Somchai',
    },
    {
      id: 'C004',
      name: 'ห้างหุ้นส่วน GHI',
      date: '12 ม.ค. 2026',
      phoneNumbers: ['098-765-4321'],
      email: 'admin@ghi.com',
      status: 'active',
      ownerId: 'U002',
      ownerName: 'Suda',
    },
    {
      id: 'C005',
      name: 'SME Solutions Ltd.',
      date: '11 ม.ค. 2026',
      phoneNumbers: ['086-555-1234', '086-555-5678'],
      email: 'contact@sme.com',
      idCard: '1111111111111',
      status: 'pending',
      ownerId: 'U001',
      ownerName: 'Somchai',
    },
  ]);

  const handleLogin = (email: string, password: string) => {
    const user = mockUsers.find((u) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      toast.success('เข้าสู่ระบบสำเร็จ', {
        description: `ยินดีต้อนรับ ${user.name}`,
      });
    } else {
      toast.error('เข้าส���่ระบบล้มเหลว', {
        description: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      });
    }
  };

  const handleCheckDuplicate = (idCard: string, phoneNumbers: string[]) => {
    // Check if ID card exists
    const idCardExists = customers.find((c) => c.idCard === idCard);
    
    // Check if any phone number exists
    const phoneExists = customers.find((c) => 
      c.phoneNumbers.some(p => phoneNumbers.includes(p))
    );

    if (idCardExists) {
      return { 
        isDuplicate: true, 
        duplicateField: 'idCard',
        duplicateValue: idCard
      };
    } else if (phoneExists) {
      const duplicatePhone = phoneExists.phoneNumbers.find(p => phoneNumbers.includes(p));
      return { 
        isDuplicate: true, 
        duplicateField: 'phone',
        duplicateValue: duplicatePhone
      };
    }

    return { isDuplicate: false, duplicateField: null };
  };

  const handleAddCustomer = (data: CustomerInfoData) => {
    if (!currentUser) return;

    const newCustomer: Customer = {
      id: `C${(customers.length + 1).toString().padStart(3, '0')}`,
      name: data.name,
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      phoneNumbers: data.phoneNumbers,
      idCard: data.idCard,
      taxId: data.taxId,
      status: data.status,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
    };
    setCustomers([newCustomer, ...customers]);
    toast.success('เพิ่มลูกค้าสำเร็จ', {
      description: `เพิ่มลูกค้า ${data.name} เรียบร้อยแล้ว`,
    });
    setCurrentView('my-customers');
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleSaveCustomer = (updatedCustomer: Customer) => {
    setCustomers(customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    toast.success('อัปเดตข้อมูลสำเร็จ', {
      description: `แก้ไขข้อมูลลูกค้า ${updatedCustomer.name} เรียบร้อยแล้ว`,
    });
  };

  const handleAddUser = (email: string, password: string, name: string, role: 'admin' | 'sales') => {
    const newUser: UserData = {
      id: `U${(systemUsers.length + 1).toString().padStart(3, '0')}`,
      email,
      name,
      role,
      status: 'active',
      createdDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    setSystemUsers([...systemUsers, newUser]);
    toast.success('เพิ่มผู้ใช้งานสำเร็จ', {
      description: `สร้างผู้ใช้งาน ${name} เรียบร้อยแล้ว`,
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    toast.info('ออกจากระบบ', {
      description: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
    });
  };

  // Filter customers based on view
  const getFilteredCustomers = () => {
    if (!currentUser) return [];
    if (currentView === 'my-customers') {
      return customers.filter((c) => c.ownerId === currentUser.id);
    }
    return customers;
  };

  const filteredCustomers = getFilteredCustomers();

  // Calculate stats
  const totalCustomers = customers.length;
  const completedSales = customers.filter((c) => c.status === 'active').length;
  const monthlyGoalPercentage = Math.round((completedSales / 10) * 100); // Assuming goal is 10 sales

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'ภาพรวม';
      case 'add-customer':
        return 'เพิ่มลูกค้า';
      case 'my-customers':
        return 'ลูกค้าของฉัน';
      case 'all-customers':
        return 'ลูกค้าทั้งหมด';
      case 'user-management':
        return 'จัดการผู้ใช้งาน';
      default:
        return 'ภาพรวม';
    }
  };

  // Show login page if not logged in
  if (!isLoggedIn || !currentUser) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <CRMSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentView={currentView}
        onViewChange={setCurrentView}
        userRole={currentUser.role}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <CRMHeader
          title={getViewTitle()}
          userEmail={currentUser.email}
          userName={currentUser.name}
          userRole={currentUser.role}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {currentView === 'dashboard' && (
            <div>
              <DashboardStats
                totalCustomers={totalCustomers}
                completedSales={completedSales}
                monthlyGoalPercentage={monthlyGoalPercentage}
              />
              <div>
                <h2 className="text-xl text-slate-900 mb-4">ลูกค้าล่าสุด</h2>
                <CustomerTable customers={customers.slice(0, 5)} onEdit={handleEditCustomer} />
              </div>
            </div>
          )}

          {currentView === 'add-customer' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                <h2 className="text-2xl text-slate-900 mb-6">เพิ่มลูกค้าใหม่</h2>
                <CustomerInfoForm 
                  onSubmit={handleAddCustomer} 
                  onCheckDuplicate={handleCheckDuplicate}
                />
              </div>
            </div>
          )}

          {(currentView === 'my-customers' || currentView === 'all-customers') && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-600">แสดง {filteredCustomers.length} รายการ</p>
              </div>
              <CustomerTable customers={filteredCustomers} onEdit={handleEditCustomer} />
            </div>
          )}

          {currentView === 'user-management' && currentUser.role === 'admin' && (
            <UserManagement users={systemUsers} onAddUser={handleAddUser} />
          )}
        </main>
      </div>

      {/* Edit Customer Modal */}
      <EditCustomerModal
        customer={editingCustomer}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        onCheckDuplicate={handleCheckDuplicate}
      />
    </div>
  );
}
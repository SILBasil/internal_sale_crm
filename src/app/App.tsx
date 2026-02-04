import { useState, useEffect } from 'react';
import { LoginPage } from '@/app/components/login-page';
import { CRMSidebar } from '@/app/components/crm-sidebar';
import { CRMHeader } from '@/app/components/crm-header';
import { DashboardStats, DashboardSkeleton } from '@/app/components/dashboard-stats';
import { CustomerTable, Customer } from '@/app/components/customer-table';
import { CustomerInfoForm, CustomerInfoData } from '@/app/components/customer-info-form';
import { EditCustomerModal } from '@/app/components/edit-customer-modal';
import { UserManagement, UserData } from '@/app/components/user-management';
import { ExcelImportView } from '@/app/components/excel-import-view';
import { FilterBar } from '@/app/components/filter-bar';
import { PaginationControls } from '@/app/components/pagination-controls';
import { exportToExcel } from '@/app/utils/excel-utils';
import { customerService, CustomerQueryOptions } from '@/app/services/customer-service';
import { userService } from '@/app/services/user-service';
import { DocumentSnapshot } from 'firebase/firestore';
import { migrateDataToFirestore, checkMigrationStatus } from '@/app/utils/migration-utils';
import { toast } from 'sonner';
import { Toaster } from '@/app/components/ui/sonner';
import { Button } from '@/app/components/ui/button';
import { startUserMigration } from '@/app/utils/user-migration';


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isLoggedIn') === 'true';
    }
    return false;
  });
  const [currentUser, setCurrentUser] = useState<UserData | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [addMethod, setAddMethod] = useState<'manual' | 'excel'>('manual');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Pagination State
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCursors, setPageCursors] = useState<Map<number, DocumentSnapshot>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // System users state
  const [systemUsers, setSystemUsers] = useState<UserData[]>([]);
  const [isSystemUsersLoading, setIsSystemUsersLoading] = useState(true);

  // Sync users to localStorage (Optional, keep for offline but prioritize Firebase)
  useEffect(() => {
    if (systemUsers.length > 0) {
      localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    }
  }, [systemUsers]);

  // Initial users fetch
  useEffect(() => {
    const fetchUsers = async () => {
      setIsSystemUsersLoading(true);
      try {
        const fbUsers = await userService.getUsers();
        if (fbUsers.length > 0) {
          setSystemUsers(fbUsers);
        }
      } catch (error) {
        toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
      } finally {
        setIsSystemUsersLoading(false);
      }
    };
    if (isLoggedIn) {
      fetchUsers();
    }
  }, [isLoggedIn]);

  const [customers, setCustomers] = useState<Customer[]>([]);

  // Run user migration once
  useEffect(() => {
    startUserMigration();
  }, []);

  // Check if customer migration is needed
  useEffect(() => {
    const checkStatus = async () => {
      if (currentUser?.role === 'admin') {
        const isEmpty = !(await checkMigrationStatus());
        setNeedsMigration(isEmpty);
      }
    };
    checkStatus();
  }, [currentUser]);

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      await migrateDataToFirestore();
      toast.success('ย้ายข้อมูลสำเร็จ!', {
        description: 'ข้อมูลจาก mock_data.json ถูกอัปโหลดขึ้น Firestore แล้ว',
      });
      setNeedsMigration(false);
      // Trigger refresh
      setSearchTerm(prev => prev + ' ');
      setSearchTerm(prev => prev.trim());
    } catch (error) {
      toast.error('การย้ายข้อมูลล้มเหลว', {
        description: 'กรุณาเช็ค Console สำหรับรายละเอียด',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('กำลังเตรียมข้อมูลสำหรับ Export...', { duration: 2000 });
      
      const options: CustomerQueryOptions = {
        searchTerm,
        ownerId: currentView === 'my-customers' ? currentUser?.id : (selectedSalesPerson !== 'all' ? selectedSalesPerson : undefined),
        status: selectedStatus,
        startDate: dateRange.start,
        endDate: dateRange.end
      };

      const allCustomers = await customerService.getAllMatchingCustomers(options);
      
      if (allCustomers.length === 0) {
        toast.warning('ไม่พบข้อมูลสำหรับ Export');
        return;
      }

      const exportData = allCustomers.map(c => ({
        'ชื่อลูกค้า': c.name,
        'เบอร์โทรศัพท์': c.phoneNumbers.join(', '),
        'เลขบัตรประชาชน': c.idCard || '-',
        'เลขผู้เสียภาษี/เลขทะเบียนพาณิชย์': c.taxId || '-',
        'สถานะ': c.status,
        'ผู้ดูแล': systemUsers.find(u => u.id === c.ownerId)?.name || 'Unknown',
        'วันที่บันทึก': c.date
      }));

      exportToExcel(exportData, currentView === 'my-customers' ? 'my_customers' : 'all_customers');
      toast.success(`Export ข้อมูล ${allCustomers.length} รายการสำเร็จ`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error('Export ล้มเหลว กรุณาลองใหม่');
    }
  };

  // Initial fetch and filter effect
  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const options: CustomerQueryOptions = {
          searchTerm,
          ownerId: currentUser?.role === 'sales' 
            ? currentUser.id 
            : (currentView === 'my-customers' ? currentUser?.id : (selectedSalesPerson !== 'all' ? selectedSalesPerson : undefined)),
          status: selectedStatus,
          pageSize: PAGE_SIZE,
          startDate: dateRange?.start,
          endDate: dateRange?.end,
          sortBy: currentView === 'dashboard' ? 'recent' : undefined
        };
        
        // Reset pagination
        setCurrentPage(1);
        setPageCursors(new Map());

        const result = await customerService.getCustomers(options);
        const count = await customerService.getCustomerCount(options);
        
        setCustomers(result.customers);
        setTotalCount(count);
        
        // Save cursor for next page (page 2)
        if (result.lastVisible) {
            setPageCursors(new Map().set(2, result.lastVisible));
        }

      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomers([]);
        setTotalCount(0);
        toast.error('ไม่สามารถโหลดข้อมูลลูกค้าได้ กรุณาตรวจสอบ Console หรือสร้าง Index ใน Firebase');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn && currentUser) {
      const timer = setTimeout(() => {
        fetchInitial();
      }, 500); // Debounce search
      return () => clearTimeout(timer);
    }
  }, [searchTerm, selectedStatus, selectedSalesPerson, currentView, isLoggedIn, currentUser, dateRange]);

  const handlePageChange = async (targetPage: number) => {
    if (isLoading || targetPage === currentPage) return;
    
    // Prevent invalid jumps
    if (targetPage < 1) return;
    const maxPage = Math.ceil(totalCount / PAGE_SIZE);
    if (targetPage > maxPage) return;

    // Check if we have the cursor for this page
    // Page 1 needs no cursor. Page 2 needs cursor from Page 1 (stored in map at key 2).
    // So targetPage N needs cursor stored at key N.
    const cursor = targetPage === 1 ? undefined : pageCursors.get(targetPage);

    // If we are jumping forward > 1 page and don't have cursor, strictly we can't do it efficiently.
    // For now, we only allow 1 step forward (which we should have cursor for) or jumping back to known pages.
    // However, if user clicks "Last", we might be in trouble. 
    // Optimization: If jumping far, we warn user or disable it. For now, we try our best.
    
    // We will attempt to use offset if cursor is missing

    setIsLoading(true);
    try {
        const options: CustomerQueryOptions = {
            searchTerm,
            ownerId: currentView === 'my-customers' ? currentUser?.id : (selectedSalesPerson !== 'all' ? selectedSalesPerson : undefined),
            status: selectedStatus,
            pageSize: PAGE_SIZE,
            startDate: dateRange?.start,
            endDate: dateRange?.end,
            lastVisible: cursor,
            offset: !cursor && targetPage > 1 ? (targetPage - 1) * PAGE_SIZE : undefined
        };

        const result = await customerService.getCustomers(options);
        setCustomers(result.customers);
        setCurrentPage(targetPage);

        // Save cursor for NEXT page (targetPage + 1)
        if (result.lastVisible) {
            setPageCursors(prev => {
                const newMap = new Map(prev);
                newMap.set(targetPage + 1, result.lastVisible!);
                return newMap;
            });
        }
    } catch (e) {
        console.error(e);
        toast.error('ไม่สามารถโหลดข้อมูลหน้าดังกล่าวได้');
    } finally {
        setIsLoading(false);
    }
  };

  /* 
  // Firebase Data Initialization
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fbCustomers, fbUsers] = await Promise.all([
          customerService.getCustomers(),
          userService.getUsers()
        ]);
        if (fbCustomers.length > 0) setCustomers(fbCustomers);
        if (fbUsers.length > 0) setSystemUsers(fbUsers);
      } catch (error) {
        console.error("Firebase sync error:", error);
      }
    };
    // fetchData(); // Uncomment when Firebase is ready
  }, []);
  */

  const handleLogin = async (email: string, password: string) => {
    try {
        const user = await userService.verifyLogin(email, password);
        
        if (user) {
          setIsLoggedIn(true);
          setCurrentUser(user);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
          }
          toast.success(`ยินดีต้อนรับคุณ ${user.name}`);
        } else {
          toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
    } catch (err) {
        console.error(err);
        toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  const handleCheckDuplicate = async (idCard: string, phoneNumbers: string[], taxId?: string) => {
    // Use server-side check for accurate duplicate detection across all pages
    try {
      return await customerService.checkDuplicate(idCard, phoneNumbers, taxId);
    } catch (error) {
       console.error("Duplicate check failed:", error);
       return { isDuplicate: false, duplicateField: null };
    }
  };

  const handleAddCustomer = async (data: CustomerInfoData) => {
    if (!currentUser) return;

    // Strict Server-side Duplicate Check
    const duplicateCheck = await handleCheckDuplicate(data.idCard || '', data.phoneNumbers, data.taxId);
    if (duplicateCheck.isDuplicate) {
        toast.error('ไม่สามารถเพิ่มลูกค้าได้', {
            description: `ตรวจพบข้อมูลซ้ำ: ${duplicateCheck.duplicateField === 'phone' ? 'เบอร์โทรศัพท์' : duplicateCheck.duplicateField === 'idCard' ? 'เลขบัตรประชาชน' : 'เลขผู้เสียภาษี'} มีอยู่ในระบบแล้ว`,
        });
        return;
    }

    const newCustomerData: Omit<Customer, 'id'> = {
      name: data.name,
      // Date is handled by server timestamp, but keeping local string for display if needed
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      phoneNumbers: data.phoneNumbers,
      idCard: data.idCard,
      taxId: data.taxId,
      status: data.status,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    try {
      const newId = await customerService.addCustomer(newCustomerData);
      const newCustomer = { ...newCustomerData, id: newId! };
      setCustomers([newCustomer, ...customers]);
      
      // Refresh system users to update dashboard stats
      const updatedUsers = await userService.getUsers();
      setSystemUsers(updatedUsers);

      toast.success('เพิ่มลูกค้าสำเร็จ', {
        description: `เพิ่มลูกค้า ${data.name} เรียบร้อยแล้ว`,
      });
      setCurrentView('my-customers');
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มลูกค้า');
    }
  };

  const handleBulkAddCustomers = async (newCustomersData: any[]) => {
    if (!currentUser) return;

    const newCustomers: Omit<Customer, 'id'>[] = newCustomersData.map((data) => ({
      name: data.name,
      // Date is handled by server timestamp, but keeping local string for display if needed
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      phoneNumbers: data.phoneNumbers,
      idCard: data.idCard,
      taxId: data.taxId,
      status: data.status,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      createdAt: new Date().toISOString(),
    }));

    try {
      await customerService.bulkAddCustomers(newCustomers);
      
      // Refresh system users to update dashboard stats
      const updatedUsers = await userService.getUsers();
      setSystemUsers(updatedUsers);

      toast.success('นำเข้าลูกค้าสำเร็จ', {
        description: `นำเข้าลูกค้า ${newCustomers.length} รายการ เรียบร้อยแล้ว`,
      });
      setCurrentView('my-customers');
      // Trigger refresh
      setSearchTerm(prev => prev + ' ');
      setSearchTerm(prev => prev.trim());
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleSaveCustomer = async (updatedCustomer: Customer) => {
    try {
      await customerService.updateCustomer(updatedCustomer.id, updatedCustomer);
      setCustomers(customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      toast.success('อัปเดตข้อมูลสำเร็จ', {
        description: `แก้ไขข้อมูลลูกค้า ${updatedCustomer.name} เรียบร้อยแล้ว`,
      });
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleBulkAddUsers = async (newUsers: any[]) => {
    try {
      const usersToAdd = newUsers.map((u) => ({
        ...u,
        status: 'active',
        createdDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      }));

      await userService.bulkAddUsers(usersToAdd);
      
      const users = await userService.getUsers();
      setSystemUsers(users);
      
      toast.success('นำเข้าผู้ใช้งานสำเร็จ', {
        description: `นำเข้าผู้ใช้งาน ${newUsers.length} รายการ เรียบร้อยแล้ว`,
      });
    } catch (e) {
      console.error(e);
      toast.error('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    }
  };


  const handleAddUser = async (email: string, password: string, name: string, role: 'admin' | 'sales') => {
    try {
      const newUser = {
        email,
        password,
        name,
        role,
        status: 'active',
        createdDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
      
      await userService.addUser(newUser as any);
      const users = await userService.getUsers();
      setSystemUsers(users);
      
      toast.success('เพิ่มผู้ใช้งานสำเร็จ', {
        description: `สร้างผู้ใช้งาน ${name} เรียบร้อยแล้ว`,
      });
    } catch (e) {
      console.error(e);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserData>) => {
    try {
      await userService.updateUser(userId, updates);
      
      // Optimistic update or refresh
      setSystemUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      
      toast.success('อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
    } catch (e) {
      console.error(e);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    toast.info('ออกจากระบ', {
      description: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
    });
  };

  const filteredCustomers = customers; // Already filtered by Firestore

  // Calculate stats
  const totalCustomers = currentUser?.role === 'sales' 
    ? customers.filter(c => c.ownerId === currentUser.id).length
    : customers.length;

  const salesBreakdown = currentUser?.role === 'admin' ? systemUsers
    .filter(u => u.role === 'sales')
    .map(u => ({
      name: u.name,
      count: customers.filter(c => c.ownerId === u.id).length
    })) : undefined;

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
              {needsMigration && currentUser?.role === 'admin' && (
                <div className="mb-8 p-6 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">ระบบตรวจพบว่า Firestore ยังไม่มีข้อมูล</h3>
                    <p className="text-blue-700">ต้องการนำเข้าข้อมูลจาก mock_data.json หรือไม่? (ใช้เวลาประมาณ 10-30 วินาที)</p>
                  </div>
                  <Button onClick={handleMigrate} disabled={isMigrating}>
                    {isMigrating ? 'กำลังย้ายข้อมูล...' : '📥 ย้ายข้อมูลเข้า Firestore'}
                  </Button>
                  </div>
              )}

              {isSystemUsersLoading ? (
                <DashboardSkeleton />
              ) : (
                <DashboardStats
                  totalCustomers={totalCount}
                  salesBreakdown={
                    currentUser?.role === 'admin'
                      ? systemUsers
                          .filter(u => u.role === 'sales')
                          .map(u => ({
                            name: u.name,
                            count: u.customerCount || 0
                          }))
                      : undefined
                  }
                />
              )}
              <div>
                <h2 className="text-xl text-slate-900 mb-4 font-semibold">ลูกค้าล่าสุด</h2>
                <CustomerTable 
                  customers={(currentUser?.role === 'sales' 
                    ? customers.filter(c => c.ownerId === currentUser.id)
                    : customers)
                    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .slice(0, 5)
                    .map(c => ({
                      ...c,
                      ownerName: systemUsers.find(u => u.id === c.ownerId)?.name || 'Unknown'
                    }))
                  } 
                  onEdit={handleEditCustomer} 
                  currentUserRole={currentUser.role}
                />
              </div>
            </div>
          )}

          {currentView === 'add-customer' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex p-1 bg-slate-200/50 rounded-xl w-fit">
                <button
                  onClick={() => setAddMethod('manual')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    addMethod === 'manual' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  กรอกข้อมูลเอง
                </button>
                <button
                  onClick={() => setAddMethod('excel')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    addMethod === 'excel' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  นำเข้าจาก Excel
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                <h2 className="text-2xl text-slate-900 mb-6">
                  {addMethod === 'manual' ? 'เพิ่มลูกค้าใหม่' : 'นำเข้าลูกค้าผ่านไฟล์'}
                </h2>
                
                {addMethod === 'manual' ? (
                  <CustomerInfoForm 
                    onSubmit={handleAddCustomer} 
                    onCheckDuplicate={handleCheckDuplicate}
                  />
                ) : (
                  <ExcelImportView 
                    onImport={handleBulkAddCustomers}
                    onCheckDuplicate={handleCheckDuplicate}
                  />
                )}
              </div>
            </div>
          )}

          {(currentView === 'my-customers' || currentView === 'all-customers') && (
            <div>
              {/* Admin Actions Bar Removed */}

              <FilterBar
                searchTerm={searchTerm}
                searchStatus={selectedStatus}
                searchSalesPerson={selectedSalesPerson}
                startDate={dateRange.start}
                endDate={dateRange.end}
                onSearch={setSearchTerm}
                onStatusChange={setSelectedStatus}
                onDateChange={(start: string, end: string) => setDateRange({ start, end })}
                onSalesPersonChange={currentUser.role === 'admin' ? setSelectedSalesPerson : undefined}
                onSalesPersonChange={currentUser.role === 'admin' ? setSelectedSalesPerson : undefined}
                onExport={handleExport}
                salesPersons={currentUser.role === 'admin' ? systemUsers.filter(u => u.role === 'sales').map(u => ({ id: u.id, name: u.name })) : undefined}
              />
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  แสดงหน้า {currentPage} จาก {Math.ceil(totalCount / PAGE_SIZE)} ({totalCount} รายการ)
                </p>
                <PaginationControls 
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
              </div>

              <CustomerTable customers={customers} onEdit={handleEditCustomer} currentUserRole={currentUser.role} />
              
              <div className="mt-6 flex justify-center pb-8 p-1">
                 <PaginationControls 
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {currentView === 'user-management' && currentUser.role === 'admin' && (
            <UserManagement 
              users={systemUsers} 
              onAddUser={handleAddUser}
              onBulkAddUsers={handleBulkAddUsers}
              onUpdateUser={handleUpdateUser}
            />
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
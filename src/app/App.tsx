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
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';
import { ConfirmDialog } from '@/app/components/ui/confirm-dialog';


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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [addMethod, setAddMethod] = useState<'manual' | 'excel'>('manual');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Pagination State
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCursors, setPageCursors] = useState<Map<number, DocumentSnapshot>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Dashboard State
  const [dashboardStats, setDashboardStats] = useState<{ total: number; breakdown?: { name: string; count: number }[] }>({ total: 0 });
  const [latestCustomers, setLatestCustomers] = useState<Customer[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  // System users state
  const [systemUsers, setSystemUsers] = useState<UserData[]>([]);
  const [isSystemUsersLoading, setIsSystemUsersLoading] = useState(true);

  // Import state
  const [importStatus, setImportStatus] = useState<{ current: number; total: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  // Dashboard Data Fetch Effect
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (currentView !== 'dashboard') return;

      setIsDashboardLoading(true);
      try {
        const isSales = currentUser.role === 'sales';
        const options: CustomerQueryOptions = {
          pageSize: 5,
          sortBy: 'recent',
          ...(isSales && { ownerId: currentUser.id })
        };
        const result = await customerService.getCustomers(options);

        // 1. Fetch Latest Customers (Isolated by ownerId for Sales)
        setLatestCustomers(result.customers);

        // 2. Fetch True Dashboard Stats (Source of Truth)
        // For Sales, we only care about their own stats
        const salesUsers = isSales
          ? [{ id: currentUser.id, name: currentUser.name }]
          : systemUsers
            .filter(u => u.role === 'sales')
            .map(u => ({ id: u.id, name: u.name }));

        const stats = await customerService.getDashboardStats(
          salesUsers,
          isSales ? currentUser.id : undefined
        );

        setDashboardStats({
          total: stats.totalCustomers,
          breakdown: stats.salesStats
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    if (isLoggedIn && currentUser && currentView === 'dashboard') {
      fetchDashboardData();
    }
  }, [currentView, isLoggedIn, currentUser, systemUsers]);

  // Reset Filters when switching views
  useEffect(() => {
    // Reset all filter states to defaults whenever the view changes
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedSalesPerson('all');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
    setPageCursors(new Map());
  }, [currentView]);

  // List Views Filter Effect (All/My Customers)
  useEffect(() => {
    const fetchFilteredList = async () => {
      if (currentView !== 'my-customers' && currentView !== 'all-customers') return;

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
          endDate: dateRange?.end
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
        console.error("Error fetching filtered customers:", error);
        setCustomers([]);
        setTotalCount(0);
        toast.error('ไม่สามารถโหลดข้อมูลลูกค้าได้');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn && currentUser && (currentView === 'my-customers' || currentView === 'all-customers')) {
      const timer = setTimeout(() => {
        fetchFilteredList();
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

  const handleCheckDuplicate = async (idCard: string, phoneNumbers: string[], taxId?: string, excludeCustomerId?: string, ownerId?: string) => {
    // Use server-side check for accurate duplicate detection across all pages
    try {
      return await customerService.checkDuplicate(idCard, phoneNumbers, taxId, excludeCustomerId, ownerId);
    } catch (error) {
      console.error("Duplicate check failed:", error);
      return { isDuplicate: false, duplicateField: null };
    }
  };

  const handleAddCustomer = async (data: CustomerInfoData) => {
    if (!currentUser) return;

    // For Admin: Use selected ownerId from form, or fallback to their own ID (should not happen if form valid)
    // For Sales: Always use their own ID
    const targetOwnerId = currentUser.role === 'admin' && data.ownerId ? data.ownerId : currentUser.id;
    const targetOwnerName = currentUser.role === 'admin'
      ? (systemUsers.find(u => u.id === targetOwnerId)?.name || currentUser.name)
      : currentUser.name;

    // Strict Server-side Duplicate Check
    const duplicateCheck = await handleCheckDuplicate(data.idCard || '', data.phoneNumbers, data.taxId, undefined, targetOwnerId);
    if (duplicateCheck.isDuplicate) {
      toast.error('ไม่สามารถเพิ่มลูกค้าได้', {
        description: duplicateCheck.message || `ตรวจพบข้อมูลซ้ำ: ${duplicateCheck.duplicateField === 'phone' ? 'เบอร์โทรศัพท์' : duplicateCheck.duplicateField === 'idCard' ? 'เลขบัตรประชาชน' : 'เลขผู้เสียภาษี'} มีอยู่ในระบบแล้ว`,
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
      ownerId: targetOwnerId,
      ownerName: targetOwnerName,
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
        description: `เพิ่มลูกค้า ${data.name} ให้กับ ${targetOwnerName} เรียบร้อยแล้ว`,
      });
      setCurrentView('my-customers');
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มลูกค้า');
    }
  };

  const handleBulkAddCustomers = async (newCustomersData: any[], hasErrors: boolean) => {
    if (!currentUser) return;

    const newCustomers: Omit<Customer, 'id'>[] = newCustomersData.map((data: any) => ({
      name: data.name,
      // Date is handled by server timestamp, but keeping local string for display if needed
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      phoneNumbers: data.phoneNumbers,
      idCard: data.idCard,
      taxId: data.taxId,
      status: data.status,
      // For Admin, use the owner info from Excel if present. For Sales, force their own info.
      ownerId: (currentUser.role === 'admin' && data.ownerId) ? data.ownerId : currentUser.id,
      ownerName: (currentUser.role === 'admin' && data.ownerName) ? data.ownerName : currentUser.name,
      createdAt: new Date().toISOString(),
    }));

    const totalToImport = newCustomers.length;
    setIsImporting(true);
    // Initialize with 0 progress
    setImportStatus({ current: 0, total: totalToImport });

    try {
      await customerService.bulkAddCustomers(newCustomers, (processed, total) => {
        setImportStatus({ current: processed, total });
      });

      // Refresh system users to update dashboard stats
      const updatedUsers = await userService.getUsers();
      setSystemUsers(updatedUsers);

      toast.success('นำเข้าลูกค้าสำเร็จ', {
        description: `นำเข้าลูกค้า ${totalToImport} รายการ เรียบร้อยแล้ว`,
      });

      if (!hasErrors) {
        setCurrentView(currentUser.role === 'admin' ? 'all-customers' : 'my-customers');
      }

      // Trigger refresh
      setSearchTerm(prev => prev + ' ');
      setSearchTerm(prev => prev.trim());
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsImporting(false);
      setImportStatus(null);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    // Inject latest owner name from systemUsers
    const latestOwnerName = systemUsers.find(u => u.id === customer.ownerId)?.name || customer.ownerName;
    setEditingCustomer({ ...customer, ownerName: latestOwnerName });
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

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      const customer = customerToDelete;
      await customerService.deleteCustomer(customer.id, customer.ownerId);
      setCustomers(customers.filter(c => c.id !== customer.id));
      toast.success('ลบข้อมูลสำเร็จ', {
        description: `ลบข้อมูลลูกค้า ${customer.name} เรียบร้อยแล้ว`,
      });
      // Force refresh count
      const result = await customerService.getCustomers({
        searchTerm,
        ownerId: currentUser?.role === 'sales'
          ? currentUser.id
          : (currentView === 'my-customers' ? currentUser?.id : (selectedSalesPerson !== 'all' ? selectedSalesPerson : undefined)),
        status: selectedStatus,
        pageSize: PAGE_SIZE,
      });
      setCustomers(result.customers);

      // Also refresh the total count for the badges/stats
      const newCount = await customerService.getCustomerCount({
        searchTerm,
        ownerId: currentUser?.role === 'sales'
          ? currentUser.id
          : (currentView === 'my-customers' ? currentUser?.id : (selectedSalesPerson !== 'all' ? selectedSalesPerson : undefined)),
        status: selectedStatus,
      });
      setTotalCount(newCount);
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
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

  const handleFixSystem = async () => {
    try {
      toast.promise(
        async () => {
          // 1. Cleanup inconsistent data (Trim IDs, Normalize Phone)
          const cleanCount = await customerService.cleanupData();

          // 2. Sync all User customerCount (Force recount everything)
          const syncCount = await userService.syncAllUserCounts();

          // 3. Refresh user list in local state
          const updatedUsers = await userService.getUsers();
          setSystemUsers(updatedUsers);

          return { cleanCount, syncCount };
        },
        {
          loading: 'กำลังปรับปรุงระบบและซิงค์ข้อมูล...',
          success: (data) => `ซิงค์แล้ว! ทำความสะอาดข้อมูล: ${data.cleanCount}, อัปเดตยอดผู้ใช้งาน: ${data.syncCount} รายการ`,
          error: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล',
        }
      );
    } catch (e) {
      console.error(e);
      toast.error('เกิดข้อผิดพลาดในการเข้าถึงระบบ');
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
    toast.info('ออกจากระบบ', {
      description: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
    });
  };

  const filteredCustomers = customers; // Already filtered by Firestore

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

      {/* Global Import Progress Overlay */}
      {isImporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
            <LoadingSpinner size={48} className="mb-6" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">กำลังนำเข้าข้อมูล...</h3>
            {importStatus && (
              <div className="w-full space-y-4">
                <div className="flex justify-between text-sm font-medium text-slate-600 mb-1">
                  <span>นำเข้าแล้ว {importStatus.current.toLocaleString()} จาก {importStatus.total.toLocaleString()} รายการ</span>
                  <span>{Math.round((importStatus.current / importStatus.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(importStatus.current / importStatus.total) * 100}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-400">
                  กรุณาอย่าปิดหน้าต่างนี้จนกว่าจะเสร็จสิ้น
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
      {/* Sidebar */}
      <CRMSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        userRole={currentUser.role}
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <CRMHeader
          title={getViewTitle()}
          userEmail={currentUser.email}
          userName={currentUser.name}
          userRole={currentUser.role}
          onMenuClick={() => setIsMobileMenuOpen(true)}
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

              {isDashboardLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <LoadingSpinner size={40} />
                  <p className="text-slate-500 mt-4 animate-pulse text-sm">กำลังโหลดข้อมูลภาพรวม...</p>
                </div>
              ) : (
                <DashboardStats
                  stats={dashboardStats}
                  isLoading={isDashboardLoading}
                  userRole={currentUser.role}
                />
              )}


              <div>
                <h2 className="text-xl text-slate-900 mb-4 font-semibold">ลูกค้าล่าสุด</h2>
                <CustomerTable
                  customers={latestCustomers.map(c => ({
                    ...c,
                    ownerName: systemUsers.find(u => u.id === c.ownerId)?.name || 'Unknown'
                  }))}
                  onEdit={handleEditCustomer}
                  onDelete={handleDeleteCustomer}
                />
              </div>
            </div>
          )}

          {currentView === 'add-customer' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex p-1 bg-slate-200/50 rounded-xl w-fit">
                <button
                  onClick={() => setAddMethod('manual')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${addMethod === 'manual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  กรอกข้อมูลเอง
                </button>
                <button
                  onClick={() => setAddMethod('excel')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${addMethod === 'excel'
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
                    onCheckDuplicate={(id, phones, tax, ownerId) => handleCheckDuplicate(id, phones, tax, undefined, ownerId || currentUser.id)}
                    owners={currentUser.role === 'admin' ? systemUsers.filter(u => u.role === 'sales').map(u => ({ id: u.id, name: u.name, email: u.email })) : undefined}
                  />
                ) : (
                  <ExcelImportView
                    onImport={handleBulkAddCustomers}
                    onCheckDuplicate={handleCheckDuplicate}
                    owners={currentUser.role === 'admin' ? systemUsers.filter(u => u.role === 'sales').map(u => ({ id: u.id, name: u.name, email: u.email })) : undefined}
                  />
                )}
              </div>
            </div>
          )}

          {(currentView === 'my-customers' || currentView === 'all-customers') && (
            <div>
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
                onExport={handleExport}
                salesPersons={currentUser.role === 'admin' ? systemUsers.filter(u => u.role === 'sales').map(u => ({ id: u.id, name: u.name })) : undefined}
              />

              {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200 shadow-sm mt-6">
                  <LoadingSpinner size={40} />
                  <p className="text-slate-500 mt-4 animate-pulse text-sm">กำลังค้นหาข้อมูล...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between mt-6">
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

                  {customers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">ไม่พบข้อมูลลูกค้า</h3>
                      <p className="text-slate-500">ไม่พบลูกค้าที่ตรงตามเงื่อนไขที่คุณค้นหา</p>
                    </div>
                  ) : (
                    <>
                      <CustomerTable
                        customers={customers.map(c => ({
                          ...c,
                          ownerName: systemUsers.find(u => u.id === c.ownerId)?.name || c.ownerName
                        }))}
                        onEdit={handleEditCustomer}
                        onDelete={handleDeleteCustomer}
                      />

                      <div className="mt-6 flex justify-center pb-8 p-1">
                        <PaginationControls
                          currentPage={currentPage}
                          totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                          onPageChange={handlePageChange}
                          isLoading={isLoading}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {currentView === 'user-management' && currentUser.role === 'admin' && (
            isSystemUsersLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <LoadingSpinner size={40} />
                <p className="text-slate-500 mt-4 animate-pulse text-sm">กำลังโหลดข้อมูลผู้ใช้งาน...</p>
              </div>
            ) : (
              <UserManagement
                users={systemUsers}
                onAddUser={handleAddUser}
                onBulkAddUsers={handleBulkAddUsers}
                onUpdateUser={handleUpdateUser}
              />
            )
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

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="ยืนยันการลบข้อมูล"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลลูกค้า "${customerToDelete?.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบข้อมูล"
        cancelText="ยกเลิก"
        variant="destructive"
      />
    </div>
  );
}
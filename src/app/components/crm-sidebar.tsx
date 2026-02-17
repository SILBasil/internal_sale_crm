import { LayoutDashboard, UserPlus, Users, UsersRound, LogOut, ChevronLeft, Settings, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface CRMSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
  userRole: 'admin' | 'sales';
  onLogout: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function CRMSidebar({ isCollapsed, onToggle, currentView, onViewChange, userRole, onLogout, isMobileOpen = false, onMobileClose }: CRMSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    // Common items or Admin/Sales specific
    ...(userRole === 'admin' || userRole === 'sales' ? [
      { id: 'add-customer', label: 'เพิ่มลูกค้า', icon: UserPlus },
    ] : []),
    ...(userRole === 'sales' ? [
      { id: 'my-customers', label: 'ลูกค้าของฉัน', icon: Users },
    ] : []),
    ...(userRole === 'admin' ? [
      { id: 'all-customers', label: 'ลูกค้าทั้งหมด', icon: UsersRound },
      { id: 'user-management', label: 'จัดการผู้ใช้งาน', icon: Settings }
    ] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-[#0f172a] text-white transition-all duration-300 flex flex-col shadow-xl md:shadow-none md:relative md:translate-x-0 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64
        `}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-700">
          {(!isCollapsed || isMobileOpen) && <h2 className="text-xl font-semibold">CRM System</h2>}

          {/* Desktop Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hidden md:flex text-white hover:bg-slate-700"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </Button>

          {/* Mobile Close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="md:hidden text-white hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onViewChange(item.id);
                      if (onMobileClose) onMobileClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                      ? 'bg-[#2563eb] text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </div>
    </>
  );
}
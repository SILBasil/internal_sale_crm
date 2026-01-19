import { LayoutDashboard, UserPlus, Users, UsersRound, LogOut, ChevronLeft, Settings } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface CRMSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
  userRole: 'admin' | 'user';
  onLogout: () => void;
}

export function CRMSidebar({ isCollapsed, onToggle, currentView, onViewChange, userRole, onLogout }: CRMSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'add-customer', label: 'เพิ่มลูกค้า', icon: UserPlus },
    { id: 'my-customers', label: 'ลูกค้าของฉัน', icon: Users },
    ...(userRole === 'admin' ? [
      { id: 'all-customers', label: 'ลูกค้าทั้งหมด', icon: UsersRound },
      { id: 'user-management', label: 'จัดการผู้ใช้งาน', icon: Settings }
    ] : []),
  ];

  return (
    <div 
      className={`h-screen bg-[#0f172a] text-white transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-700">
        {!isCollapsed && <h2 className="text-xl font-semibold">CRM System</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-white hover:bg-slate-700"
        >
          <ChevronLeft className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
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
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-[#2563eb] text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
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
          {!isCollapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </div>
  );
}
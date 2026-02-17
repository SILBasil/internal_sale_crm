import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Menu } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface CRMHeaderProps {
  title: string;
  userEmail: string;
  userName: string;
  userRole: 'admin' | 'user';
  onMenuClick: () => void;
}

export function CRMHeader({ title, userEmail, userName, userRole, onMenuClick }: CRMHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Breadcrumb Title */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-slate-600" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl md:text-2xl text-slate-900 truncate max-w-[200px] md:max-w-none">{title}</h1>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-900">{userEmail}</p>
            <Badge
              variant={userRole === 'admin' ? 'default' : 'secondary'}
              className={userRole === 'admin' ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : ''}
            >
              {userRole === 'admin' ? 'Admin' : 'User'}
            </Badge>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-[#2563eb] text-white">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

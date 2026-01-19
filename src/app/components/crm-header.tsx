import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';

interface CRMHeaderProps {
  title: string;
  userEmail: string;
  userName: string;
  userRole: 'admin' | 'user';
}

export function CRMHeader({ title, userEmail, userName, userRole }: CRMHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumb Title */}
        <div>
          <h1 className="text-2xl text-slate-900">{title}</h1>
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

import { Users, CheckCircle, Target } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { Button } from '@/app/components/ui/button';

interface DashboardStatsProps {
  stats: {
    total: number;
    breakdown?: { name: string; count: number }[];
  };
  isLoading?: boolean;
  userRole?: 'admin' | 'sales';
}

export function DashboardStats({ stats, isLoading, userRole }: DashboardStatsProps) {
  const statCards = [
    {
      id: 1,
      title: userRole === 'admin' ? 'ลูกค้าทั้งหมดในระบบ' : 'ลูกค้าทั้งหมดของคุณ',
      value: stats.total.toLocaleString(),
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.id} className={`border ${stat.borderColor} shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-5">
                  <div className={`${stat.bgColor} p-4 rounded-xl shadow-inner`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1 text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats.breakdown && stats.breakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              สรุปจำนวนลูกค้า
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.breakdown.map((sales, index) => (
              <div key={index} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all group">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter mb-1">{sales.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{sales.count}</span>
                  <span className="text-xs text-slate-500">ราย</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ... existing code ...

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1].map((i) => (
          <div key={i} className="border border-slate-100 shadow-sm rounded-2xl p-6 bg-white h-[116px]">
            <div className="flex items-center gap-5 h-full">
              <div className="w-14 h-14 bg-slate-100 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-24"></div>
                <div className="h-8 bg-slate-100 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-slate-100 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 h-[86px]">
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-16"></div>
                <div className="h-6 bg-slate-100 rounded w-8"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

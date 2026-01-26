import { Users, CheckCircle, Target } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';

interface DashboardStatsProps {
  totalCustomers: number;
  salesBreakdown?: { name: string; count: number }[];
}

export function DashboardStats({ totalCustomers, salesBreakdown }: DashboardStatsProps) {
  const stats = [
    {
      id: 1,
      title: 'ลูกค้าทั้งหมด',
      value: totalCustomers.toLocaleString(),
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
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

      {salesBreakdown && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              จำนวนลูกค้าของเซลล์แต่ละคน
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {salesBreakdown.map((sales, index) => (
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

import { Users, CheckCircle, Target } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';

interface DashboardStatsProps {
  totalCustomers: number;
  completedSales: number;
  monthlyGoalPercentage: number;
}

export function DashboardStats({ totalCustomers, completedSales, monthlyGoalPercentage }: DashboardStatsProps) {
  const stats = [
    {
      id: 1,
      title: 'ลูกค้าทั้งหมด',
      value: totalCustomers,
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-[#2563eb]',
    },
    {
      id: 2,
      title: 'ยอดขายสำเร็จ',
      value: completedSales,
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      id: 3,
      title: 'เป้าหมายรายเดือน',
      value: `${monthlyGoalPercentage}%`,
      icon: Target,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      progress: monthlyGoalPercentage,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.id} className="border border-slate-200 shadow-lg rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`${stat.bgColor} p-4 rounded-xl`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-3xl mt-1 text-slate-900">{stat.value}</p>
                  {stat.progress !== undefined && (
                    <Progress value={stat.progress} className="mt-2 h-2" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

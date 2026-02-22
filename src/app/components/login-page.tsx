import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { userService } from '@/app/services/user-service';
import { toast } from 'sonner';
import { Shield, User, Eye, EyeOff, Loader2, ArrowLeft, Trash2, Plus } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
}

interface QueuedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'sales';
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [queuedUsers, setQueuedUsers] = useState<QueuedUser[]>([]);
  const [setupData, setSetupData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'sales',
  });

  useEffect(() => {
    const checkUsers = async () => {
      try {
        const users = await userService.getUsers();
        if (users.length === 0) {
          setIsFirstRun(true);
          // Auto manifest setup if first run
          // setIsFirstRun(true); 
        }
      } catch (error) {
        console.error("Error checking users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const addToQueue = () => {
    if (!setupData.name || !setupData.email || !setupData.password) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Check for duplicate email in current queue
    if (queuedUsers.some(u => u.email === setupData.email)) {
      toast.error('อีเมลนี้มีอยู่ในรายการแล้ว');
      return;
    }

    const newUser: QueuedUser = {
      id: Math.random().toString(36).substr(2, 9),
      ...setupData
    };

    setQueuedUsers([...queuedUsers, newUser]);
    setSetupData({
      ...setupData,
      name: '',
      email: '',
      password: '',
    });
    toast.success('เพิ่มผู้ใช้งานลงในรายการแล้ว');
  };

  const removeFromQueue = (id: string) => {
    setQueuedUsers(queuedUsers.filter(u => u.id !== id));
  };

  const handleBatchSetup = async () => {
    if (queuedUsers.length === 0) {
      toast.error('กรุณาเพิ่มผู้ใช้งานลงในรายการอย่างน้อย 1 รายการ');
      return;
    }

    try {
      setIsCreating(true);
      const promises = queuedUsers.map(user =>
        userService.addUser({
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          status: 'active',
          createdDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        })
      );

      await Promise.all(promises);
      toast.success(`สร้างผู้ใช้งานทัังหมด ${queuedUsers.length} รายการสำเร็จ`);

      // Auto login with the first user in the list (usually the one who set it up)
      const firstUser = queuedUsers[0];
      onLogin(firstUser.email, firstUser.password);

      setQueuedUsers([]);
      setIsFirstRun(false);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form Side */}
          <Card className="rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#2563eb] p-6 text-center text-white relative">
              <button
                onClick={() => setShowSetup(false)}
                className="absolute left-4 top-6 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm border border-white/10">
                <img src="/favicon.svg" alt="CRM Logo" className="w-10 h-10 brightness-0 invert" />
              </div>
              <CardTitle className="text-xl font-bold">ข้อมูลผู้ใช้งานใหม่</CardTitle>
              <p className="text-blue-100 text-xs mt-1">กรอกข้อมูลและเพิ่มลงรายการด้านขวา</p>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setup-name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="setup-name"
                    type="text"
                    value={setupData.name}
                    onChange={(e) => setSetupData({ ...setupData, name: e.target.value })}
                    placeholder="สมชาย ใจดี"
                    className="rounded-xl border-slate-300 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-email">อีเมล</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    value={setupData.email}
                    onChange={(e) => setSetupData({ ...setupData, email: e.target.value })}
                    placeholder="user@company.com"
                    className="rounded-xl border-slate-300 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-password">รหัสผ่าน</Label>
                  <div className="relative">
                    <Input
                      id="setup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={setupData.password}
                      onChange={(e) => setSetupData({ ...setupData, password: e.target.value })}
                      placeholder="••••••••"
                      className="rounded-xl border-slate-300 h-10 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>บทบาท (Permission)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSetupData({ ...setupData, role: 'admin' })}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all ${setupData.role === 'admin'
                        ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetupData({ ...setupData, role: 'sales' })}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all ${setupData.role === 'sales'
                        ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Sales</span>
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addToQueue}
                  className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white h-11 rounded-xl shadow-md mt-4 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มผู้ใช้งานลงรายการ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* List Side */}
          <div className="space-y-4 h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              รายการผู้ใช้งานที่จะสร้าง ({queuedUsers.length})
            </h3>

            <Card className="flex-1 rounded-2xl border-slate-200 shadow-xl overflow-hidden min-h-[400px] flex flex-col bg-white">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {queuedUsers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <User className="w-12 h-12 opacity-20" />
                    <p className="text-sm">ยังไม่มีผู้ใช้งานในรายการ</p>
                  </div>
                ) : (
                  queuedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${user.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {user.role === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${user.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                          {user.role}
                        </span>
                        <button
                          onClick={() => removeFromQueue(user.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
                <Button
                  onClick={handleBatchSetup}
                  disabled={isCreating || queuedUsers.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl shadow-lg font-bold text-lg transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>กำลังสร้าง...</span>
                    </div>
                  ) : (
                    <span>สร้างผู้ใช้งานทั้งหมด {queuedUsers.length > 0 ? `(${queuedUsers.length})` : ''}</span>
                  )}
                </Button>
                <p className="text-[10px] text-center text-slate-400">
                  * เมื่อกดปุ่ม ระบบจะสร้างไอดีทั้งหมดและพาคุณเข้าสู่ระบบอัตโนมัติ
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="rounded-2xl shadow-2xl border border-slate-200">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 shadow-inner group transition-transform hover:scale-105">
              <img src="/favicon.svg" alt="CRM Logo" className="w-16 h-16 drop-shadow-sm" />
            </div>
            <CardTitle className="text-2xl text-slate-900 font-bold">Sales CRM System</CardTitle>
            <p className="text-sm text-slate-500">เข้าสู่ระบบเพื่อจัดการลูกค้า</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  required
                  className="rounded-xl border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="rounded-xl border-slate-300 focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white h-11 rounded-xl shadow-lg mt-6 font-bold"
              >
                เข้าสู่ระบบ
              </Button>
            </form>
          </CardContent>
        </Card>

        {isFirstRun && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowSetup(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-xl hover:bg-blue-50 bg-white shadow-sm border border-blue-50"
            >
              <Shield className="w-4 h-4" />
              <span>สร้างผู้ใช้งานใหม่</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

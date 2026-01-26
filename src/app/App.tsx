import { useState, useEffect } from 'react';
import { LoginPage } from '@/app/components/login-page';
import { CRMSidebar } from '@/app/components/crm-sidebar';
import { CRMHeader } from '@/app/components/crm-header';
import { DashboardStats } from '@/app/components/dashboard-stats';
import { CustomerTable, Customer } from '@/app/components/customer-table';
import { CustomerInfoForm, CustomerInfoData } from '@/app/components/customer-info-form';
import { EditCustomerModal } from '@/app/components/edit-customer-modal';
import { UserManagement, UserData } from '@/app/components/user-management';
import { ExcelImportView } from '@/app/components/excel-import-view';
import { FilterBar } from '@/app/components/filter-bar';
import { exportToExcel } from '@/app/utils/excel-utils';
// import { customerService } from '@/app/services/customer-service';
// import { userService } from '@/app/services/user-service';
import { toast } from 'sonner';
import { Toaster } from '@/app/components/ui/sonner';

// Mock users database
const mockUsers = [
  { email: 'admin@company.com', password: 'admin123', name: 'Somchai (Admin)', role: 'admin' as const, id: 'U001' },
  { email: 'sales1@company.com', password: 'sales123', name: 'Sompong', role: 'sales' as const, id: 'U002' },
  { email: 'sales2@company.com', password: 'sales223', name: 'Wichai', role: 'sales' as const, id: 'U003' },
  { email: 'sales3@company.com', password: 'sales323', name: 'Anan', role: 'sales' as const, id: 'U004' },
  { email: 'sales4@company.com', password: 'sales423', name: 'Somsak', role: 'sales' as const, id: 'U005' },
  { email: 'sales5@company.com', password: 'sales523', name: 'Preecha', role: 'sales' as const, id: 'U006' },
  { email: 'sales6@company.com', password: 'sales623', name: 'Suwit', role: 'sales' as const, id: 'U007' },
  { email: 'sales7@company.com', password: 'sales723', name: 'Kittisak', role: 'sales' as const, id: 'U008' },
  { email: 'sales8@company.com', password: 'sales823', name: 'Chaiwat', role: 'sales' as const, id: 'U009' },
  { email: 'sales9@company.com', password: 'sales923', name: 'Narong', role: 'sales' as const, id: 'U010' },
  { email: 'sales10@company.com', password: 'sales1023', name: 'Prasit', role: 'sales' as const, id: 'U011' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isLoggedIn') === 'true';
    }
    return false;
  });
  const [currentUser, setCurrentUser] = useState<typeof mockUsers[0] | null>(() => {
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

  // System users state
  const [systemUsers, setSystemUsers] = useState<UserData[]>(() => {
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('systemUsers');
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (parsed.length > 5) return parsed;
      }
    }
    return [
      { id: 'U001', email: 'admin@company.com', name: 'Somchai (Admin)', role: 'admin', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U002', email: 'sales1@company.com', name: 'Sompong', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U003', email: 'sales2@company.com', name: 'Wichai', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U004', email: 'sales3@company.com', name: 'Anan', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U005', email: 'sales4@company.com', name: 'Somsak', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U006', email: 'sales5@company.com', name: 'Preecha', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U007', email: 'sales6@company.com', name: 'Suwit', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U008', email: 'sales7@company.com', name: 'Kittisak', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U009', email: 'sales8@company.com', name: 'Chaiwat', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U010', email: 'sales9@company.com', name: 'Narong', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
      { id: 'U011', email: 'sales10@company.com', name: 'Prasit', role: 'sales', status: 'active', createdDate: '10 ม.ค. 2026' },
    ];
  });

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
  }, [systemUsers]);

  // Mock customer data
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCustomers = localStorage.getItem('customers');
      if (savedCustomers) {
        const parsed = JSON.parse(savedCustomers);
        if (parsed.length > 50) return parsed; // If we already have the mock data, use it
      }
    }
    return [
      {"id": "C049", "name": "มั่นคงพานิช เซอร์วิส 49", "date": "25 Jan 2026", "createdAt": "2026-01-25T15:13:14.038789Z", "phoneNumbers": ["0852508068"], "email": "customer49@example.com", "idCard": "4274970391430", "status": "active", "ownerId": "U008", "ownerName": "Kittisak"},
      {"id": "C022", "name": "ไทยเจริญ จำกัด 22", "date": "25 Jan 2026", "createdAt": "2026-01-25T15:13:14.038529Z", "phoneNumbers": ["0873633956"], "email": "customer22@example.com", "idCard": "5172843166739", "status": "new", "ownerId": "U002", "ownerName": "Sompong"},
      {"id": "C057", "name": "แสงทอง พานิช 57", "date": "25 Jan 2026", "createdAt": "2026-01-25T09:13:14.038863Z", "phoneNumbers": ["0846090439"], "email": "customer57@example.com", "idCard": "8160381751958", "status": "pending", "ownerId": "U006", "ownerName": "Preecha"},
      {"id": "C065", "name": "รุ่งเรือง พานิช 65", "date": "24 Jan 2026", "createdAt": "2026-01-24T18:13:14.038942Z", "phoneNumbers": ["0865924489"], "email": "customer65@example.com", "idCard": "1041730785608", "status": "new", "ownerId": "U011", "ownerName": "Prasit"},
      {"id": "C032", "name": "ไทยเจริญ กรุ๊ป 32", "date": "24 Jan 2026", "createdAt": "2026-01-24T01:13:14.038628Z", "phoneNumbers": ["0867995809"], "email": "customer32@example.com", "idCard": "4305463289967", "status": "active", "ownerId": "U006", "ownerName": "Preecha"},
      {"id": "C014", "name": "SME Solutions เซอร์วิส 14", "date": "23 Jan 2026", "createdAt": "2026-01-23T05:13:14.038455Z", "phoneNumbers": ["0812967085"], "email": "customer14@example.com", "idCard": "4212092698915", "status": "new", "ownerId": "U010", "ownerName": "Narong"},
      {"id": "C020", "name": "ห้างหุ้นส่วน GHI เซอร์วิส 20", "date": "22 Jan 2026", "createdAt": "2026-01-22T17:13:14.038511Z", "phoneNumbers": ["0892375879"], "email": "customer20@example.com", "idCard": "9847240442793", "status": "pending", "ownerId": "U009", "ownerName": "Chaiwat"},
      {"id": "C023", "name": "SME Solutions จำกัด 23", "date": "22 Jan 2026", "createdAt": "2026-01-22T06:13:14.038538Z", "phoneNumbers": ["0890619404"], "email": "customer23@example.com", "idCard": "1231686628826", "status": "pending", "ownerId": "U008", "ownerName": "Kittisak"},
      {"id": "C007", "name": "บริษัท DEF เซอร์วิส 7", "date": "22 Jan 2026", "createdAt": "2026-01-22T01:13:14.038384Z", "phoneNumbers": ["0850655291"], "email": "customer7@example.com", "idCard": "3646900588388", "status": "new", "ownerId": "U008", "ownerName": "Kittisak"},
      {"id": "C059", "name": "SME Solutions กรุ๊ป 59", "date": "22 Jan 2026", "createdAt": "2026-01-22T00:13:14.038885Z", "phoneNumbers": ["0815648655"], "email": "customer59@example.com", "idCard": "9724599095532", "status": "new", "ownerId": "U002", "ownerName": "Sompong"},
      {"id": "C024", "name": "มั่นคงพานิช กรุ๊ป 24", "date": "20 Jan 2026", "createdAt": "2026-01-20T00:13:14.038551Z", "phoneNumbers": ["0821002228"], "email": "customer24@example.com", "idCard": "8373612789246", "status": "new", "ownerId": "U004", "ownerName": "Anan"},
      {"id": "C042", "name": "ไทยเจริญ เซอร์วิส 42", "date": "19 Jan 2026", "createdAt": "2026-01-19T14:13:14.038720Z", "phoneNumbers": ["0886001016"], "email": "customer42@example.com", "idCard": "6507179709868", "status": "active", "ownerId": "U008", "ownerName": "Kittisak"},
      {"id": "C047", "name": "SME Solutions กรุ๊ป 47", "date": "19 Jan 2026", "createdAt": "2026-01-19T11:13:14.038770Z", "phoneNumbers": ["0873672800"], "email": "customer47@example.com", "idCard": "2416078516887", "status": "active", "ownerId": "U003", "ownerName": "Wichai"},
      {"id": "C054", "name": "บริษัท ABC เซอร์วิส 54", "date": "19 Jan 2026", "createdAt": "2026-01-19T02:13:14.038836Z", "phoneNumbers": ["0811389627"], "email": "customer54@example.com", "idCard": "1137491290135", "status": "active", "ownerId": "U004", "ownerName": "Anan"},
      {"id": "C052", "name": "โชคดี คอร์ปอเรชั่น 52", "date": "19 Jan 2026", "createdAt": "2026-01-19T01:13:14.038817Z", "phoneNumbers": ["0873524583"], "email": "customer52@example.com", "idCard": "7445693032039", "status": "new", "ownerId": "U002", "ownerName": "Sompong"},
      {"id": "C058", "name": "ร้านค้า XYZ จำกัด 58", "date": "18 Jan 2026", "createdAt": "2026-01-18T21:13:14.038872Z", "phoneNumbers": ["0882992475"], "email": "customer58@example.com", "idCard": "8548118840091", "status": "new", "ownerId": "U002", "ownerName": "Sompong"},
      {"id": "C031", "name": "มั่นคงพานิช กรุ๊ป 31", "date": "18 Jan 2026", "createdAt": "2026-01-18T18:13:14.038618Z", "phoneNumbers": ["0816117757"], "email": "customer31@example.com", "idCard": "3180286305677", "status": "new", "ownerId": "U002", "ownerName": "Sompong"},
      {"id": "C043", "name": "โชคดี จำกัด 43", "date": "18 Jan 2026", "createdAt": "2026-01-18T06:13:14.038733Z", "phoneNumbers": ["0859511049"], "email": "customer43@example.com", "idCard": "6679749915206", "status": "pending", "ownerId": "U010", "ownerName": "Narong"},
      {"id": "C008", "name": "แสงทอง คอร์ปอเรชั่น 8", "date": "17 Jan 2026", "createdAt": "2026-01-17T17:13:14.038397Z", "phoneNumbers": ["0819199656"], "email": "customer8@example.com", "idCard": "2867652981305", "status": "new", "ownerId": "U009", "ownerName": "Chaiwat"},
      {"id": "C026", "name": "แสงทอง พานิช 26", "date": "17 Jan 2026", "createdAt": "2026-01-17T15:13:14.038573Z", "phoneNumbers": ["0832266560"], "email": "customer26@example.com", "idCard": "3950284079301", "status": "active", "ownerId": "U004", "ownerName": "Anan"},
      {"id": "C033", "name": "โชคดี พานิช 33", "date": "16 Jan 2026", "createdAt": "2026-01-16T23:13:14.038637Z", "phoneNumbers": ["0889183155"], "email": "customer33@example.com", "idCard": "4979312428741", "status": "active", "ownerId": "U007", "ownerName": "Suwit"},
      {"id": "C021", "name": "ไทยเจริญ คอร์ปอเรชั่น 21", "date": "16 Jan 2026", "createdAt": "2026-01-16T23:13:14.038519Z", "phoneNumbers": ["0898299009"], "email": "customer21@example.com", "idCard": "8037958707182", "status": "pending", "ownerId": "U006", "ownerName": "Preecha"},
      {"id": "C040", "name": "บริษัท ABC คอร์ปอเรชั่น 40", "date": "16 Jan 2026", "createdAt": "2026-01-16T19:13:14.038702Z", "phoneNumbers": ["0874197654"], "email": "customer40@example.com", "idCard": "1013002101765", "status": "pending", "ownerId": "U006", "ownerName": "Preecha"},
      {"id": "C075", "name": "ไทยเจริญ กรุ๊ป 75", "date": "16 Jan 2026", "createdAt": "2026-01-16T12:13:14.039035Z", "phoneNumbers": ["0863129160"], "email": "customer75@example.com", "idCard": "3107404778426", "status": "active", "ownerId": "U009", "ownerName": "Chaiwat"},
      {"id": "C080", "name": "ไทยเจริญ คอร์ปอเรชั่น 80", "date": "16 Jan 2026", "createdAt": "2026-01-16T07:13:14.039082Z", "phoneNumbers": ["0813175477"], "email": "customer80@example.com", "idCard": "9385683649366", "status": "pending", "ownerId": "U005", "ownerName": "Somsak"},
      {"id": "C064", "name": "ร้านค้า XYZ จำกัด 64", "date": "15 Jan 2026", "createdAt": "2026-01-15T15:13:14.038933Z", "phoneNumbers": ["0864108180"], "email": "customer64@example.com", "idCard": "6005348749976", "status": "new", "ownerId": "U009", "ownerName": "Chaiwat"},
      {"id": "C028", "name": "ไทยเจริญ กรุ๊ป 28", "date": "15 Jan 2026", "createdAt": "2026-01-15T13:13:14.038592Z", "phoneNumbers": ["0869511414"], "email": "customer28@example.com", "idCard": "9180236751990", "status": "pending", "ownerId": "U008", "ownerName": "Kittisak"},
      {"id": "C019", "name": "แสงทอง กรุ๊ป 19", "date": "15 Jan 2026", "createdAt": "2026-01-15T13:13:14.038501Z", "phoneNumbers": ["0852223904"], "email": "customer19@example.com", "idCard": "9457706087247", "status": "active", "ownerId": "U010", "ownerName": "Narong"},
      {"id": "C018", "name": "บริษัท DEF คอร์ปอเรชั่น 18", "date": "15 Jan 2026", "createdAt": "2026-01-15T12:13:14.038493Z", "phoneNumbers": ["0844585498"], "email": "customer18@example.com", "idCard": "6806998831898", "status": "pending", "ownerId": "U010", "ownerName": "Narong"},
      {"id": "C003", "name": "ร้านค้า XYZ จำกัด 3", "date": "15 Jan 2026", "createdAt": "2026-01-15T00:13:14.038340Z", "phoneNumbers": ["0812453752"], "email": "customer3@example.com", "idCard": "4330263347204", "status": "pending", "ownerId": "U003", "ownerName": "Wichai"},
      {"id": "C050", "name": "ห้างหุ้นส่วน GHI จำกัด 50", "date": "14 Jan 2026", "createdAt": "2026-01-14T20:13:14.038797Z", "phoneNumbers": ["0893712642"], "email": "customer50@example.com", "idCard": "4156638890565", "status": "pending", "ownerId": "U005", "ownerName": "Somsak"},
      {"id": "C027", "name": "แสงทอง คอร์ปอเรชั่น 27", "date": "14 Jan 2026", "createdAt": "2026-01-14T14:13:14.038583Z", "phoneNumbers": ["0833087496"], "email": "customer27@example.com", "idCard": "2845237663908", "status": "new", "ownerId": "U007", "ownerName": "Suwit"},
      {"id": "C067", "name": "บริษัท ABC จำกัด 67", "date": "14 Jan 2026", "createdAt": "2026-01-14T13:13:14.038962Z", "phoneNumbers": ["0897926012"], "email": "customer67@example.com", "idCard": "5946656446742", "status": "pending", "ownerId": "U010", "ownerName": "Narong"},
      {"id": "C006", "name": "ห้างหุ้นส่วน GHI จำกัด 6", "date": "14 Jan 2026", "createdAt": "2026-01-14T13:13:14.038374Z", "phoneNumbers": ["0888881698"], "email": "customer6@example.com", "idCard": "4803649579816", "status": "pending", "ownerId": "U005", "ownerName": "Somsak"},
      {"id": "C063", "name": "โชคดี พานิช 63", "date": "13 Jan 2026", "createdAt": "2026-01-13T16:13:14.038922Z", "phoneNumbers": ["0881946432"], "email": "customer63@example.com", "idCard": "1677509755420", "status": "new", "ownerId": "U004", "ownerName": "Anan"},
      {"id": "C069", "name": "ห้างหุ้นส่วน GHI เซอร์วิส 69", "date": "12 Jan 2026", "createdAt": "2026-01-12T19:13:14.038979Z", "phoneNumbers": ["0859463377"], "email": "customer69@example.com", "idCard": "1172202233142", "status": "pending", "ownerId": "U005", "ownerName": "Somsak"},
      {"id": "C073", "name": "โชคดี คอร์ปอเรชั่น 73", "date": "12 Jan 2026", "createdAt": "2026-01-12T10:13:14.039016Z", "phoneNumbers": ["0811056317"], "email": "customer73@example.com", "idCard": "3185337913990", "status": "pending", "ownerId": "U008", "ownerName": "Kittisak"},
      {"id": "C038", "name": "บริษัท ABC กรุ๊ป 38", "date": "12 Jan 2026", "createdAt": "2026-01-12T00:13:14.038685Z", "phoneNumbers": ["0883854783"], "email": "customer38@example.com", "idCard": "2725490575501", "status": "pending", "ownerId": "U011", "ownerName": "Prasit"},
      {"id": "C035", "name": "แสงทอง จำกัด 35", "date": "11 Jan 2026", "createdAt": "2026-01-11T20:13:14.038658Z", "phoneNumbers": ["0854382474"], "email": "customer35@example.com", "idCard": "3517681666028", "status": "new", "ownerId": "U003", "ownerName": "Wichai"},
      {"id": "C016", "name": "บริษัท ABC พานิช 16", "date": "11 Jan 2026", "createdAt": "2026-01-11T13:13:14.038473Z", "phoneNumbers": ["0873837958"], "email": "customer16@example.com", "idCard": "2761713303435", "status": "pending", "ownerId": "U009", "ownerName": "Chaiwat"},
      {"id": "C061", "name": "รุ่งเรือง คอร์ปอเรชั่น 61", "date": "11 Jan 2026", "createdAt": "2026-01-11T06:13:14.038903Z", "phoneNumbers": ["0834011657"], "email": "customer61@example.com", "idCard": "1794093671429", "status": "active", "ownerId": "U010", "ownerName": "Narong"},
      {"id": "C048", "name": "บริษัท ABC คอร์ปอเรชั่น 48", "date": "10 Jan 2026", "createdAt": "2026-01-10T12:13:14.038779Z", "phoneNumbers": ["0820625132"], "email": "customer48@example.com", "idCard": "6324932041036", "status": "pending", "ownerId": "U005", "ownerName": "Somsak"},
      {"id": "C025", "name": "SME Solutions คอร์ปอเรชั่น 25", "date": "10 Jan 2026", "createdAt": "2026-01-10T01:13:14.038561Z", "phoneNumbers": ["0882794727"], "email": "customer25@example.com", "idCard": "3780118429815", "status": "active", "ownerId": "U006", "ownerName": "Preecha"},
      {"id": "C036", "name": "ร้านค้า XYZ กรุ๊ป 36", "date": "09 Jan 2026", "createdAt": "2026-01-09T21:13:14.038667Z", "phoneNumbers": ["0860392369"], "email": "customer36@example.com", "idCard": "4657243371237", "status": "active", "ownerId": "U003", "ownerName": "Wichai"},
      {"id": "C066", "name": "รุ่งเรือง พานิช 66", "date": "09 Jan 2026", "createdAt": "2026-01-09T13:13:14.038951Z", "phoneNumbers": ["0811968921"], "email": "customer66@example.com", "idCard": "7844377626993", "status": "new", "ownerId": "U009", "ownerName": "Chaiwat"},
      {"id": "C010", "name": "ร้านค้า XYZ คอร์ปอเรชั่น 10", "date": "09 Jan 2026", "createdAt": "2026-01-09T13:13:14.038415Z", "phoneNumbers": ["0861297740"], "email": "customer10@example.com", "idCard": "3837735629590", "status": "active", "ownerId": "U008", "ownerName": "Kittisak"},
      {"id": "C029", "name": "บริษัท ABC เซอร์วิส 29", "date": "09 Jan 2026", "createdAt": "2026-01-09T02:13:14.038600Z", "phoneNumbers": ["0866539101"], "email": "customer29@example.com", "idCard": "8937007139784", "status": "pending", "ownerId": "U002", "ownerName": "Sompong"},
      {"id": "C005", "name": "SME Solutions พานิช 5", "date": "08 Jan 2026", "createdAt": "2026-01-08T23:13:14.038365Z", "phoneNumbers": ["0844133566"], "email": "customer5@example.com", "idCard": "9237684736016", "status": "new", "ownerId": "U003", "ownerName": "Wichai"},
      {"id": "C060", "name": "ไทยเจริญ จำกัด 60", "date": "08 Jan 2026", "createdAt": "2026-01-08T22:13:14.038894Z", "phoneNumbers": ["0852943704"], "email": "customer60@example.com", "idCard": "1301436600939", "status": "new", "ownerId": "U009", "ownerName": "Chaiwat"},
      {"id": "C046", "name": "มั่นคงพานิช คอร์ปอเรชั่น 46", "date": "08 Jan 2026", "createdAt": "2026-01-08T17:13:14.038762Z", "phoneNumbers": ["0873101136"], "email": "customer46@example.com", "idCard": "3662546096960", "status": "new", "ownerId": "U006", "ownerName": "Preecha"},
    ];
  });

  // Sync customers to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

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

  const handleLogin = (email: string, password: string) => {
    const user = mockUsers.find((u) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast.success('เข้าสู่ระบบสำเร็จ', {
        description: `ยินดีต้อนรับ ${user.name}`,
      });
    } else {
      toast.error('เข้าสู่ระบบล้มเหลว', {
        description: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      });
    }
  };

  const handleCheckDuplicate = (idCard: string, phoneNumbers: string[]) => {
    // Check if ID card exists
    const idCardExists = customers.find((c: Customer) => c.idCard === idCard);
    
    // Check if any phone number exists
    const phoneExists = customers.find((c: Customer) => 
      c.phoneNumbers.some((p: string) => phoneNumbers.includes(p))
    );

    if (idCardExists) {
      return { 
        isDuplicate: true, 
        duplicateField: 'idCard',
        duplicateValue: idCard
      };
    } else if (phoneExists) {
      const duplicatePhone = phoneExists.phoneNumbers.find((p: string) => phoneNumbers.includes(p));
      return { 
        isDuplicate: true, 
        duplicateField: 'phone',
        duplicateValue: duplicatePhone
      };
    }

    return { isDuplicate: false, duplicateField: null };
  };

  const handleAddCustomer = (data: CustomerInfoData) => {
    if (!currentUser) return;

    const newCustomer: Customer = {
      id: `C${(customers.length + 1).toString().padStart(3, '0')}`,
      name: data.name,
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString(), // Ensure createdAt is added
      phoneNumbers: data.phoneNumbers,
      idCard: data.idCard,
      taxId: data.taxId,
      status: data.status,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
    };
    setCustomers([newCustomer, ...customers]);
    toast.success('เพิ่มลูกค้าสำเร็จ', {
      description: `เพิ่มลูกค้า ${data.name} เรียบร้อยแล้ว`,
    });
    setCurrentView('my-customers');
  };

  const handleBulkAddCustomers = (newCustomersData: any[]) => {
    if (!currentUser) return;

    const newCustomers: Customer[] = newCustomersData.map((data, index) => ({
      id: `C${(customers.length + index + 1).toString().padStart(3, '0')}`,
      name: data.name,
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      phoneNumbers: data.phoneNumbers,
      idCard: data.idCard,
      taxId: data.taxId,
      status: data.status,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
    }));

    setCustomers([...newCustomers, ...customers]);
    toast.success('นำเข้าลูกค้าสำเร็จ', {
      description: `นำเข้าลูกค้า ${newCustomers.length} รายการ เรียบร้อยแล้ว`,
    });
    setCurrentView('my-customers');
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleSaveCustomer = (updatedCustomer: Customer) => {
    setCustomers(customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    toast.success('อัปเดตข้อมูลสำเร็จ', {
      description: `แก้ไขข้อมูลลูกค้า ${updatedCustomer.name} เรียบร้อยแล้ว`,
    });
  };

  const handleBulkAddUsers = (newUsers: any[]) => {
    const usersWithIds: UserData[] = newUsers.map((u, index) => ({
      ...u,
      id: `U${(systemUsers.length + index + 1).toString().padStart(3, '0')}`,
      status: 'active',
      createdDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
    }));
    setSystemUsers([...systemUsers, ...usersWithIds]);
  };

  const handleExport = (data: Customer[]) => {
    const dataToExport = data.map(c => ({
      'ชื่อลูกค้า': c.name,
      'เบอร์โทรศัพท์': c.phoneNumbers.join(', '),
      'เลขบัตรประชาชน': c.idCard || '-',
      'สถานะ': c.status,
      'ผู้ดูแล': c.ownerName,
      'วันที่บันทึก': c.date
    }));
    exportToExcel(dataToExport, currentView === 'my-customers' ? 'my_customers' : 'all_customers');
    toast.success('ส่งออกข้อมูลสำเร็จ');
  };

  const handleAddUser = (email: string, password: string, name: string, role: 'admin' | 'sales') => {
    const newUser: UserData = {
      id: `U${(systemUsers.length + 1).toString().padStart(3, '0')}`,
      email,
      name,
      role,
      status: 'active',
      createdDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    setSystemUsers([...systemUsers, newUser]);
    toast.success('เพิ่มผู้ใช้งานสำเร็จ', {
      description: `สร้างผู้ใช้งาน ${name} เรียบร้อยแล้ว`,
    });
  };

  const handleUpdateUser = (userId: string, updates: Partial<UserData>) => {
    setSystemUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    toast.success('อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
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

  const filteredCustomers = customers.filter((customer) => {
    if (!currentUser) return false;

    // Basic permission check: in "My Customers" view, only show own customers
    if (currentView === 'my-customers' && customer.ownerId !== currentUser.id) {
      return false;
    }
    
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumbers.some((p: string) => p.includes(searchTerm)) ||
      customer.idCard?.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    const matchesSalesPerson = selectedSalesPerson === 'all' || customer.ownerId === selectedSalesPerson;

    const matchesDate =
      (!dateRange.start || (customer.createdAt && new Date(customer.createdAt).getTime() >= new Date(dateRange.start).setHours(0,0,0,0))) &&
      (!dateRange.end || (customer.createdAt && new Date(customer.createdAt).getTime() <= new Date(dateRange.end).setHours(23,59,59,999)));

    return matchesSearch && matchesStatus && matchesDate && matchesSalesPerson;
  }).map(c => ({
    ...c,
    ownerName: systemUsers.find(u => u.id === c.ownerId)?.name || 'Unknown'
  }));

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
              <DashboardStats
                totalCustomers={totalCustomers}
                salesBreakdown={salesBreakdown}
              />
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
              <FilterBar
                onSearch={setSearchTerm}
                onStatusChange={setSelectedStatus}
                onDateChange={(start: string, end: string) => setDateRange({ start, end })}
                onSalesPersonChange={currentUser.role === 'admin' ? setSelectedSalesPerson : undefined}
                onExport={() => handleExport(filteredCustomers)}
                salesPersons={currentUser.role === 'admin' ? systemUsers.filter(u => u.role === 'sales').map(u => ({ id: u.id, name: u.name })) : undefined}
              />
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-600">แสดง {filteredCustomers.length} รายการ</p>
              </div>
              <CustomerTable customers={filteredCustomers} onEdit={handleEditCustomer} currentUserRole={currentUser.role} />
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
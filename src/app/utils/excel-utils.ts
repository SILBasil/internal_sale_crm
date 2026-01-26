import * as XLSX from 'xlsx';

export interface ExcelCustomerData {
  'ชื่อลูกค้า/ชื่อร้าน': string;
  'เลขบัตรประชาชน'?: string;
  'เบอร์โทรศัพท์': string;
  'เลขผู้เสียภาษี'?: string;
  'สถานะ': string;
  'วันที่บันทึก'?: string;
  [key: string]: string | undefined;
}

export interface ExcelUserData {
  'ชื่อ-นามสกุล': string;
  'อีเมล': string;
  'บทบาท'?: string;
  [key: string]: string | undefined;
}

export const EXCEL_HEADERS = ['ชื่อลูกค้า/ชื่อร้าน', 'เลขบัตรประชาชน', 'เบอร์โทรศัพท์', 'เลขผู้เสียภาษี', 'สถานะ', 'วันที่บันทึก'];
export const USER_EXCEL_HEADERS = ['ชื่อ-นามสกุล', 'อีเมล', 'บทบาท'];

export const generateTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  
  // Example data
  const exampleData = [
    ['บริษัท ตัวอย่าง จำกัด', '1234567890123', '0812345678, 0891234567', '0123456789012', 'active'],
  ];
  XLSX.utils.sheet_add_aoa(ws, exampleData, { origin: -1 });

  XLSX.writeFile(wb, 'customer_template.xlsx');
};

export const parseExcelFile = async (file: File): Promise<ExcelCustomerData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as ExcelCustomerData[];
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const generateUserTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([USER_EXCEL_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  
  const exampleData = [
    ['สมชาย ใจดี', 'somchai@company.com', 'sales'],
    ['วิภาวรรณ สวยงาม', 'wipawan@company.com', 'admin'],
  ];
  XLSX.utils.sheet_add_aoa(ws, exampleData, { origin: -1 });

  XLSX.writeFile(wb, 'user_template.xlsx');
};

export const parseUserExcelFile = async (file: File): Promise<ExcelUserData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as ExcelUserData[];
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const validateExcelRow = (row: ExcelCustomerData) => {
  const errors: string[] = [];
  
  if (!row['ชื่อลูกค้า/ชื่อร้าน']) {
    errors.push('ขาดชื่อลูกค้า/ชื่อร้าน');
  }
  
  if (row['เลขบัตรประชาชน'] && String(row['เลขบัตรประชาชน']).replace(/\D/g, '').length !== 13) {
    errors.push('เลขบัตรประชาชนต้องมี 13 หลัก');
  }
  
  if (!row['เบอร์โทรศัพท์']) {
    errors.push('ขาดเบอร์โทรศัพท์');
  }

  const validStatuses = ['new', 'active', 'pending'];
  if (row['สถานะ'] && !validStatuses.includes(row['สถานะ'].toLowerCase())) {
    errors.push('สถานะไม่ถูกต้อง (ต้องเป็น new, active, หรือ pending)');
  }

  return errors;
};

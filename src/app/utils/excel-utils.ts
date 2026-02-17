import * as XLSX from "xlsx";

export interface ExcelCustomerData {
  "ชื่อลูกค้า/ชื่อร้าน": string;
  ชื่อลูกค้า?: string; // Alias
  เลขบัตรประชาชน?: string;
  เบอร์โทรศัพท์: string;
  "เลขผู้เสียภาษี/เลขทะเบียนพาณิชย์"?: string;
  เลขผู้เสียภาษี?: string; // KEEP old key for backward compat or if mapping fails
  สถานะ: string;
  อีเมลผู้ดูแล?: string; // Optional for Admin usage
  [key: string]: any;
}

export interface ExcelUserData {
  "ชื่อ-นามสกุล": string;
  อีเมล: string;
  รหัสผ่าน: string;
  บทบาท?: string;
  [key: string]: string | undefined;
}

export const EXCEL_HEADERS = [
  "ชื่อลูกค้า/ชื่อร้าน",
  "เลขบัตรประชาชน",
  "เบอร์โทรศัพท์",
  "เลขผู้เสียภาษี/เลขทะเบียนพาณิชย์",
  "สถานะ",
  "อีเมลผู้ดูแล",
];
export const USER_EXCEL_HEADERS = [
  "ชื่อ-นามสกุล",
  "อีเมล",
  "รหัสผ่าน",
  "บทบาท",
  "อีเมลผู้ดูแล",
];

export const generateTemplate = (
  owners?: { name: string; email: string }[],
) => {
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");

  // Example data
  const exampleData = [
    [
      "บริษัท ตัวอย่าง จำกัด",
      "1234567890123",
      "0812345678, 021234567",
      "0123456789012",
      "active",
      "sales@company.com",
    ],
  ];
  XLSX.utils.sheet_add_aoa(ws, exampleData, { origin: -1 });

  // Add Salespersons Reference Sheet (for Admin)
  if (owners && owners.length > 0) {
    const referenceHeaders = [
      "ชื่อผู้ดูแล (Copy ช่องนี้ไป)",
      "อีเมล (Copy ช่องนี้ไปใช้ใน col F)",
    ];
    const referenceData = owners.map((o) => [o.name, o.email]);

    const wsRef = XLSX.utils.aoa_to_sheet([referenceHeaders, ...referenceData]);
    XLSX.utils.book_append_sheet(wb, wsRef, "รายชื่อผู้ดูแล (Reference)");
  }

  XLSX.writeFile(wb, "customer_template.xlsx");
};

export const parseExcelFile = async (
  file: File,
): Promise<ExcelCustomerData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
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
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const generateUserTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([USER_EXCEL_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Users");

  const exampleData = [
    ["สมชาย ใจดี", "somchai@company.com", "password123", "sales"],
    ["วิภาวรรณ สวยงาม", "wipawan@company.com", "admin123", "admin"],
  ];
  XLSX.utils.sheet_add_aoa(ws, exampleData, { origin: -1 });

  XLSX.writeFile(wb, "user_template.xlsx");
};

export const validateUserExcelHeaders = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Get headers from the first row
        const headers = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        })[0] as string[];

        // Minimal check: Must contain required columns
        const required = USER_EXCEL_HEADERS;
        const missing = required.filter((h) => !headers.includes(h));

        resolve(missing.length === 0);
      } catch (error) {
        console.error("Header validation error", error);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsBinaryString(file);
  });
};

export const parseUserExcelFile = async (
  file: File,
): Promise<ExcelUserData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
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

  // Check both 'ชื่อลูกค้า/ชื่อร้าน' and 'ชื่อลูกค้า'
  if (!row["ชื่อลูกค้า/ชื่อร้าน"] && !row["ชื่อลูกค้า"]) {
    errors.push("ขาดชื่อลูกค้า/ชื่อร้าน");
  }

  if (
    row["เลขบัตรประชาชน"] &&
    String(row["เลขบัตรประชาชน"]).replace(/\D/g, "").length !== 13
  ) {
    errors.push("เลขบัตรประชาชนต้องมี 13 หลัก");
  }

  if (!row["เบอร์โทรศัพท์"]) {
    errors.push("ขาดเบอร์โทรศัพท์");
  } else {
    // Validate phone number format (basic check for length)
    // Allow multiple comma-separated
    const phones = String(row["เบอร์โทรศัพท์"])
      .split(",")
      .map((p) => p.trim());
    const invalidPhone = phones.find(
      (p) => !/^0[2-9][0-9]{7,8}$/.test(p.replace(/-/g, "")),
    );
    if (invalidPhone) {
      errors.push(
        `เบอร์โทรศัพท์ไม่ถูกต้อง (${invalidPhone}) ต้องมี 9-10 หลักและขึ้นต้นด้วย 0`,
      );
    }
  }

  const validStatuses = ["new", "active", "pending"];
  if (row["สถานะ"] && !validStatuses.includes(row["สถานะ"].toLowerCase())) {
    errors.push("สถานะไม่ถูกต้อง (ต้องเป็น new, active, หรือ pending)");
  }

  return errors;
};

export const generateErrorReport = (
  invalidRows: any[],
  owners?: { name: string; email: string }[],
) => {
  const ws = XLSX.utils.json_to_sheet(
    invalidRows.map((row) => {
      // Construct a row with original data + error column
      const errorRow: any = { ...row };

      // Remove internal processing fields
      delete errorRow.errors;
      delete errorRow.isDuplicate;
      delete errorRow.duplicateField;
      delete errorRow.targetOwnerId;
      delete errorRow.targetOwnerName;

      // Add Error Reason
      const errorReasons = [
        ...(row.errors || []),
        row.isDuplicate ? `ข้อมูลซ้ำ (${row.duplicateField})` : null,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        ...errorRow,
        สาเหตุข้อผิดพลาด: errorReasons,
      };
    }),
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Errors");

  // Add Salespersons Reference Sheet (for Admin - same as template)
  if (owners && owners.length > 0) {
    const referenceHeaders = [
      "ชื่อผู้ดูแล (Copy ช่องนี้ไป)",
      "อีเมล (Copy ช่องนี้ไปใช้ใน col F)",
    ];
    const referenceData = owners.map((o) => [o.name, o.email]);

    const wsRef = XLSX.utils.aoa_to_sheet([referenceHeaders, ...referenceData]);
    XLSX.utils.book_append_sheet(wb, wsRef, "รายชื่อผู้ดูแล (Reference)");
  }

  XLSX.writeFile(wb, "import_errors.xlsx");
};

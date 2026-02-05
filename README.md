# Internal Sales CRM

ระบบ CRM สำหรับบริหารจัดการข้อมูลลูกค้าภายในองค์กร พัฒนาด้วย **React + Vite** และใช้ **Firebase** เป็น Backend

## 🛠 Tech Stack

- **Frontend:** React (TypeScript), Vite, Tailwind CSS
- **UI Components:** Shadcn UI, Radix UI, Lucide React
- **Backend / Database:** Firebase Firestore
- **Authentication:** Custom Firestore Auth (ปัจจุบันเก็บรหัสผ่านใน DB - _แนะนำให้เปลี่ยนเป็น Firebase Auth ในอนาคต_)
- **Hosting:** Firebase Hosting

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### 1. Clone Project

```bash
git clone <repository-url>
cd "Internal Sales CRM"
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Firebase

โปรเจคนี้เชื่อมต่อกับ Firebase Project: `catalogue21-92e8b`

หากต้องการเปลี่ยน Project หรือตั้งค่าใหม่:

1. สร้างไฟล์ `.env` ที่ root folder (ถ้าจำเป็น)
2. แก้ไขค่า Config ใน `src/app/lib/firebase.ts`

### 4. รันโปรเจค (Development)

```bash
npm run dev
```

เข้าใช้งานได้ที่: `http://localhost:5173`

---

## 📂 โครงสร้างโปรเจค (Project Structure)

```
src/
├── app/
│   ├── components/         # UI Components ทั้งหมด
│   │   ├── ui/             # Shadcn Basic Components (Button, Input, etc.)
│   │   ├── customer-*.tsx  # Components เกี่ยวกับลูกค้า (Table, Form, Modal)
│   │   ├── user-*.tsx      # Components จัดการผู้ใช้งาน
│   │   └── ...
│   ├── services/           # ไฟล์ติดต่อกับ Firebase
│   │   ├── customer-service.ts  # จัดการข้อมูลลูกค้า (Add, Get, Update)
│   │   └── user-service.ts      # จัดการ User & Login
│   ├── lib/
│   │   ├── firebase.ts     # Config Firebase เริ่มต้น
│   │   └── utils.ts        # Utility functions (cn class merger)
│   ├── utils/              # Helper functions อื่นๆ (Excel export/import)
│   └── App.tsx             # Main Component & Routing Logic (จัดการหน้าจอต่างๆ)
└── ...
```

---

## ✨ ฟีเจอร์หลัก (Key Features)

### 1. Dashboard (ภาพรวม)

- แสดงจำนวนลูกค้าทั้งหมด
- กราฟ/สรุปยอดลูกค้าแยกตาม Sale (เฉพาะ Admin)
- ตารางลูกค้าล่าสุด (เรียงตามวันที่สร้างล่าสุด)

### 2. จัดการลูกค้า (Customer Management)

- **เพิ่มลูกค้า:** รองรับการเพิ่มทีละคน และ **Import Excel**
- **ตรวจสอบข้อมูลซ้ำ (Duplicate Check):** แจ้งเตือนทันทีถ้าเบอร์โทร, เลขบัตร, หรือเลขผู้เสียภาษีซ้ำ (ทั้งตอนกรอกและ Import)
- **ค้นหา & กรอง:** ค้นหาได้หลายฟิลด์, กรองตามสถานะ, วันที่, และ Sale ผู้ดูแล
- **Export:** ส่งออกข้อมูลเป็น Excel ได้

### 3. จัดการผู้ใช้งาน (User Management) - _Admin Only_

- เพิ่ม/ลบ/แก้ไข User (Sales/Admin)
- กำหนด Role (Admin ดูได้ทั้งหมด, Sales ดูได้เฉพาะลูกค้าตัวเอง)
- Reset Password / แก้ไขข้อมูลส่วนตัว

---

## 🌐 การ Deploy (Firebase Hosting)

โปรเจคนี้ตั้งค่า Multi-site Hosting ไว้ที่ Site ID: `sale-crm`

### วิธีอัปเดตเว็บ

รันคำสั่งเดียว (รวม Build + Deploy):

```bash
npm run deploy
```

หรือทำทีละขั้นตอน:

```bash
npm run build
npx -p firebase-tools firebase deploy --only hosting
```

Web URL: `https://sale-crm.web.app`

---

## ⚠️ หมายเหตุสำคัญ (Notes for Developers)

1. **Firestore Indexes:** หากมีการเพิ่มเงื่อนไขการค้นหาที่ซับซ้อน (เช่น เรียงวันที่ + กรองสถานะ) ต้องสร้าง Index ใน Firebase Console ตามลิงก์ที่ Error ใน Console แจ้ง
2. **Security:** ปัจจุบันระบบ Login ใช้การเช็คข้อมูลจาก Collection `users` โดยตรง ไม่ได้ใช้ Firebase Auth มาตรฐาน หากต้องการความปลอดภัยสูงขึ้นและฟีเจอร์ "ลืมรหัสผ่าน" ควร Migrate ไปใช้ Firebase Authentication
3. **User Import:** ไฟล์ Excel สำหรับ Import User ต้องมี Password (ขั้นต่ำ 6 ตัวอักษร)

---

**Developed by:** [Your Name/Team]
**Last Updated:** 05 Feb 2026

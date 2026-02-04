import { db } from "@/app/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";

const MOCK_USERS = [
  {
    email: "admin@company.com",
    password: "admin123",
    name: "Somchai (Admin)",
    role: "admin",
  },
  {
    email: "sales1@company.com",
    password: "sales123",
    name: "Sompong",
    role: "sales",
  },
  {
    email: "sales2@company.com",
    password: "sales223",
    name: "Wichai",
    role: "sales",
  },
  {
    email: "sales3@company.com",
    password: "sales323",
    name: "Anan",
    role: "sales",
  },
  {
    email: "sales4@company.com",
    password: "sales423",
    name: "Somsak",
    role: "sales",
  },
  {
    email: "sales5@company.com",
    password: "sales523",
    name: "Preecha",
    role: "sales",
  },
  {
    email: "sales6@company.com",
    password: "sales623",
    name: "Suwit",
    role: "sales",
  },
  {
    email: "sales7@company.com",
    password: "sales723",
    name: "Kittisak",
    role: "sales",
  },
  {
    email: "sales8@company.com",
    password: "sales823",
    name: "Chaiwat",
    role: "sales",
  },
  {
    email: "sales9@company.com",
    password: "sales923",
    name: "Narong",
    role: "sales",
  },
  {
    email: "sales10@company.com",
    password: "sales1023",
    name: "Prasit",
    role: "sales",
  },
];

export const startUserMigration = async () => {
  try {
    // Check if users already exist
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    if (!snapshot.empty) {
      console.log("Users collection already populated. Skipping migration.");
      return;
    }

    console.log("Starting user migration...");
    const promises = MOCK_USERS.map(async (user) => {
      await addDoc(usersRef, {
        ...user,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await Promise.all(promises);
    console.log(`Successfully migrated ${MOCK_USERS.length} users.`);
    // You might want to show a toast here in the UI if calling from a component
  } catch (error) {
    console.error("Error during user migration:", error);
  }
};

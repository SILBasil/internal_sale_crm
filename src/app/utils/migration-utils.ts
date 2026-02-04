import { db } from "@/app/lib/firebase";
import {
  collection,
  writeBatch,
  doc,
  Timestamp,
  getDocs,
  query,
  limit,
} from "firebase/firestore";
import mockData from "../../../mock_data.json";

export const migrateDataToFirestore = async () => {
  console.log("Starting migration...");

  try {
    // 1. Migrate Users
    const userBatch = writeBatch(db);
    mockData.users.forEach((user) => {
      const userRef = doc(db, "users", user.id);
      userBatch.set(userRef, {
        ...user,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
    await userBatch.commit();
    console.log("Users migrated successfully");

    // 2. Migrate Customers (in chunks of 500)
    const customers = mockData.customers;
    for (let i = 0; i < customers.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = customers.slice(i, i + 500);

      chunk.forEach((customer) => {
        const customerRef = doc(db, "customers", customer.id);
        batch.set(customerRef, {
          ...customer,
          name_lowercase: customer.name.toLowerCase(),
          createdAt: Timestamp.fromDate(new Date(customer.createdAt)),
          updatedAt: Timestamp.now(),
        });
      });

      await batch.commit();
      console.log(`Migrated customers chunk ${i / 500 + 1}`);
    }

    return { success: true, message: "Migration completed successfully" };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

export const checkMigrationStatus = async () => {
  const q = query(collection(db, "customers"), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

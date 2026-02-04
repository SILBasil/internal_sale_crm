import { db } from "@/app/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  documentId,
  getCountFromServer,
  Query,
} from "firebase/firestore";
import { Customer } from "@/app/components/customer-table";

export interface CustomerQueryOptions {
  searchTerm?: string;
  ownerId?: string;
  status?: string;
  pageSize?: number;
  lastVisible?: DocumentSnapshot;
  offset?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: "recent" | "name";
}

// Helper to generate searchable keywords
const generateSearchKeywords = (customer: Partial<Customer>): string[] => {
  const keywords = new Set<string>();

  // Name keywords (all substrings/ngrams)
  if (customer.name) {
    const name = customer.name.toLowerCase();

    // Generate all substrings (NGrams)
    // Example: "SME" -> "s", "sm", "sme", "m", "me", "e"
    for (let i = 0; i < name.length; i++) {
      for (let j = i + 1; j <= name.length; j++) {
        keywords.add(name.substring(i, j));
      }
    }
  }

  // Phone numbers (exact and prefixes)
  if (customer.phoneNumbers) {
    customer.phoneNumbers.forEach((phone) => {
      const cleanPhone = phone.replace(/\D/g, "");
      for (let i = 3; i <= cleanPhone.length; i++) {
        keywords.add(cleanPhone.substring(0, i));
      }
    });
  }

  // ID Card (exact)
  if (customer.idCard) {
    const cleanId = customer.idCard.replace(/\D/g, "");
    keywords.add(cleanId);
    // Add partials for ID card if needed, but usually exact match is enough.
    // Adding last 4 digits for quick search could be useful
    if (cleanId.length >= 4) {
      keywords.add(cleanId.slice(-4));
    }
  }

  return Array.from(keywords);
};

import { userService } from "./user-service";

export const customerService = {
  // Add a new customer
  async addCustomer(customer: Omit<Customer, "id">) {
    try {
      const keywords = generateSearchKeywords(customer);
      const docRef = await addDoc(collection(db, "customers"), {
        ...customer,
        name_lowercase: customer.name.toLowerCase(),
        search_keywords: keywords,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Increment user's customer count
      if (customer.ownerId) {
        await userService.incrementUserCustomerCount(customer.ownerId, 1);
      }

      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e;
    }
  },

  // Get customers with filtering and pagination

  // Internal helper to build query
  _buildQuery(options: CustomerQueryOptions) {
    const { searchTerm, ownerId, status, startDate, endDate } = options;
    let q = query(collection(db, "customers"));

    if (ownerId) {
      q = query(q, where("ownerId", "==", ownerId));
    }

    if (status && status !== "all") {
      q = query(q, where("status", "==", status));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      q = query(q, where("search_keywords", "array-contains", term));
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      q = query(
        q,
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<=", Timestamp.fromDate(end)),
      );
    }

    return q;
  },

  // Get total count of matching customers
  async getCustomerCount(options: CustomerQueryOptions) {
    try {
      const q = this._buildQuery(options);
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (e) {
      console.error("Error getting count:", e);
      return 0;
    }
  },

  // Get ALL matching customers for export
  async getAllMatchingCustomers(options: CustomerQueryOptions) {
    try {
      let q = this._buildQuery(options);

      // Apply sorting same as getCustomers
      if (options.startDate && options.endDate) {
        q = query(q, orderBy("createdAt", "desc"));
      } else {
        q = query(q, orderBy("name_lowercase"));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
    } catch (e) {
      console.error("Error fetching all customers:", e);
      throw e;
    }
  },

  // Get customers with filtering and pagination
  async getCustomers(options: CustomerQueryOptions = {}) {
    const { pageSize = 20, lastVisible, startDate, endDate } = options;

    try {
      let q = this._buildQuery(options);

      // Ordering and Pagination
      // Ordering
      if ((startDate && endDate) || options.sortBy === "recent") {
        q = query(q, orderBy("createdAt", "desc"));
      } else {
        q = query(q, orderBy("name_lowercase"));
      }

      if (lastVisible) {
        q = query(q, startAfter(lastVisible), limit(pageSize));
      } else if (options.offset) {
        // Client-side offset simulation
        q = query(q, limit(options.offset + pageSize));
      } else {
        q = query(q, limit(pageSize));
      }

      // Execute Query
      const snapshot = await getDocs(q);

      let docs = snapshot.docs;
      // If we used offset logic, slice the results to get only the last 'pageSize' items
      if (!lastVisible && options.offset) {
        // If we fetched 700 items for offset 600, we want items 600-699 (index 600 to end).
        // docs length should be around offset + pageSize.
        // We slice from options.offset.
        // However, if total docs < offset, we get empty.
        if (docs.length > options.offset) {
          docs = docs.slice(options.offset);
        } else {
          docs = [];
        }
      }

      return {
        customers: docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Customer[],
        lastVisible: docs.length > 0 ? docs[docs.length - 1] : undefined,
      };
    } catch (e: any) {
      if (e.code === "failed-precondition" && e.message.includes("index")) {
        console.error(
          "CRITICAL: Missing Firestore Index! Please check the Firebase Console to create the required composite index.",
        );
      }
      console.error("Error fetching documents: ", e);
      throw e;
    }
  },

  // Update a customer
  async updateCustomer(id: string, updates: Partial<Customer>) {
    try {
      const customerRef = doc(db, "customers", id);
      const finalUpdates = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      if (updates.name || updates.phoneNumbers || updates.idCard) {
        // If any searchable field changes, regenerate keywords
        // We need the existing data to merge, but here we might only have partial updates.
        // For correctness, we should ideally fetch the doc first or require all searchable fields in update.
        // For now, let's assume valid updates or just update what we can.
        // A better approach for partial updates is a cloud function, but client-side:
        const currentDoc = await getDocs(
          query(collection(db, "customers"), where(documentId(), "==", id)),
        );
        if (!currentDoc.empty) {
          const currentData = currentDoc.docs[0].data() as Customer;
          const mergedData = { ...currentData, ...updates };
          (finalUpdates as any).search_keywords =
            generateSearchKeywords(mergedData);
        }

        if (updates.name) {
          (finalUpdates as any).name_lowercase = updates.name.toLowerCase();
        }
      }

      await updateDoc(customerRef, finalUpdates);
    } catch (e) {
      console.error("Error updating document: ", e);
      throw e;
    }
  },

  // Migration V2: Update all customers with search_keywords
  async migrateSearchKeywords() {
    try {
      const snapshot = await getDocs(collection(db, "customers"));
      const batch = writeBatch(db);
      let count = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as Customer;
        const keywords = generateSearchKeywords(data);
        const ref = doc.ref;
        batch.update(ref, { search_keywords: keywords });
        count++;
      });

      if (count > 0) {
        await batch.commit();
      }
      return count;
    } catch (e) {
      console.error("Error migrating keywords: ", e);
      throw e;
    }
  },

  // Bulk add customers (for Excel import)
  async bulkAddCustomers(customers: Omit<Customer, "id">[]) {
    try {
      const batch = writeBatch(db);
      const ownerCounts: Record<string, number> = {};

      customers.forEach((customer) => {
        const docRef = doc(collection(db, "customers"));
        const keywords = generateSearchKeywords(customer);

        batch.set(docRef, {
          ...customer,
          name_lowercase: customer.name.toLowerCase(),
          search_keywords: keywords,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Track counts per owner
        if (customer.ownerId) {
          ownerCounts[customer.ownerId] =
            (ownerCounts[customer.ownerId] || 0) + 1;
        }
      });

      await batch.commit();

      // Update user counts
      await Promise.all(
        Object.entries(ownerCounts).map(([ownerId, count]) =>
          userService.incrementUserCustomerCount(ownerId, count),
        ),
      );
    } catch (e) {
      console.error("Error committing batch: ", e);
      throw e;
    }
  },

  // Check for duplicates
  async checkDuplicate(idCard: string, phoneNumbers: string[], taxId?: string) {
    try {
      // Check ID Card
      if (idCard) {
        const idQuery = query(
          collection(db, "customers"),
          where("idCard", "==", idCard),
        );
        const idSnapshot = await getCountFromServer(idQuery);
        if (idSnapshot.data().count > 0) {
          return { isDuplicate: true, duplicateField: "idCard" };
        }
      }

      // Check Tax ID
      if (taxId) {
        const taxQuery = query(
          collection(db, "customers"),
          where("taxId", "==", taxId),
        );
        const taxSnapshot = await getCountFromServer(taxQuery);
        if (taxSnapshot.data().count > 0) {
          return { isDuplicate: true, duplicateField: "taxId" };
        }
      }

      // Check Phone Numbers
      if (phoneNumbers && phoneNumbers.length > 0) {
        // Limit checks to first 10 numbers to respect Firestore limits
        const checkPhones = phoneNumbers.slice(0, 10);
        const phoneQuery = query(
          collection(db, "customers"),
          where("phoneNumbers", "array-contains-any", checkPhones),
        );
        const phoneSnapshot = await getCountFromServer(phoneQuery);
        if (phoneSnapshot.data().count > 0) {
          return { isDuplicate: true, duplicateField: "phone" };
        }
      }

      return { isDuplicate: false, duplicateField: null };
    } catch (e) {
      console.error("Error checking duplicate:", e);
      return { isDuplicate: false, duplicateField: null };
    }
  },

  // Get dashboard statistics
  async getDashboardStats(salesUsers: { id: string; name: string }[]) {
    try {
      // 1. Get Total Customers
      const totalQuery = query(collection(db, "customers"));
      const totalSnapshot = await getCountFromServer(totalQuery);
      const totalCount = totalSnapshot.data().count;

      // 2. Get Count per Salesperson
      const salesStatsPromise = salesUsers.map(async (user) => {
        const userQuery = query(
          collection(db, "customers"),
          where("ownerId", "==", user.id),
        );
        const snapshot = await getCountFromServer(userQuery);
        return {
          name: user.name,
          count: snapshot.data().count,
        };
      });

      const salesStats = await Promise.all(salesStatsPromise);

      return {
        totalCustomers: totalCount,
        salesStats,
      };
    } catch (e) {
      console.error("Error fetching dashboard stats:", e);
      return {
        totalCustomers: 0,
        salesStats: [],
      };
    }
  },
};

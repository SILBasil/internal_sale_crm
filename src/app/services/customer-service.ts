import { db } from "@/app/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
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
import { userService } from "./user-service";

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

  // Name keywords (Prefixes only to avoid array explosion)
  if (customer.name) {
    const name = customer.name.toLowerCase();
    const words = name.split(/\s+/);

    words.forEach((word) => {
      for (let i = 1; i <= word.length; i++) {
        keywords.add(word.substring(0, i));
      }
    });

    // Also partial match for the whole name if it has spaces
    if (words.length > 1) {
      for (let i = 1; i <= name.length; i++) {
        keywords.add(name.substring(0, i));
      }
    }
  }

  // ID Card & Tax IDs (Prefixes are usually enough for search)
  [customer.idCard, ...(customer.taxIds || [])].forEach((id) => {
    if (id) {
      const cleanId = id.replace(/\D/g, "");
      for (let i = 1; i <= cleanId.length; i++) {
        keywords.add(cleanId.substring(0, i));
      }
    }
  });

  // Phone numbers (Prefixes for quick search)
  if (customer.phoneNumbers) {
    customer.phoneNumbers.forEach((phone) => {
      const cleanPhone = phone.replace(/\D/g, "");
      for (let i = 2; i <= cleanPhone.length; i++) {
        keywords.add(cleanPhone.substring(0, i));
      }
    });
  }

  return Array.from(keywords);
};

// Helper to clean object of undefined values to prevent Firestore errors
const cleanObject = (obj: any): any => {
  const result: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const customerService = {
  // Add a new customer
  async addCustomer(customer: Omit<Customer, "id">) {
    try {
      const cleanPhones = Array.from(
        new Set(
          customer.phoneNumbers
            .map((p) => p.replace(/\D/g, ""))
            .filter((p) => p.length > 0),
        ),
      );

      const cleanTaxIds = customer.taxIds
        ? Array.from(
            new Set(
              customer.taxIds
                .map((t) => t.replace(/\D/g, ""))
                .filter((t) => t.length > 0),
            ),
          )
        : [];

      const keywords = generateSearchKeywords({
        ...customer,
        phoneNumbers: cleanPhones,
        taxIds: cleanTaxIds,
      });

      const docRef = await addDoc(
        collection(db, "customers"),
        cleanObject({
          ...customer,
          phoneNumbers: cleanPhones,
          taxIds: cleanTaxIds,
          name_lowercase: customer.name.toLowerCase(),
          phoneNumbers_clean: cleanPhones,
          search_keywords: keywords,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }),
      );

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
        ...(doc.data() as any),
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
          ...(doc.data() as any),
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

      // Handle owner transfer for counts
      if (updates.ownerId) {
        const snap = await getDocs(
          query(collection(db, "customers"), where(documentId(), "==", id)),
        );
        if (!snap.empty) {
          const oldData = snap.docs[0].data() as Customer;
          const oldOwnerId = oldData.ownerId;
          const newOwnerId = updates.ownerId;

          if (oldOwnerId !== newOwnerId) {
            // Decrement old owner
            if (oldOwnerId) {
              await userService.incrementUserCustomerCount(oldOwnerId, -1);
            }
            // Increment new owner
            await userService.incrementUserCustomerCount(newOwnerId, 1);
          }
        }
      }

      const finalUpdates: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      if (updates.phoneNumbers) {
        finalUpdates.phoneNumbers = Array.from(
          new Set(
            updates.phoneNumbers
              .map((p) => p.replace(/\D/g, ""))
              .filter((p) => p.length > 0),
          ),
        );
        finalUpdates.phoneNumbers_clean = finalUpdates.phoneNumbers;
      }

      if (updates.taxIds) {
        finalUpdates.taxIds = Array.from(
          new Set(
            updates.taxIds
              .map((t) => t.replace(/\D/g, ""))
              .filter((t) => t.length > 0),
          ),
        );
      }

      if (
        updates.name ||
        updates.phoneNumbers ||
        updates.idCard ||
        updates.taxIds ||
        updates.ownerId
      ) {
        if (updates.name) {
          finalUpdates.name_lowercase = updates.name.toLowerCase();
        }
        const currentDoc = await getDocs(
          query(collection(db, "customers"), where(documentId(), "==", id)),
        );
        if (!currentDoc.empty) {
          const currentData = currentDoc.docs[0].data() as Customer;
          const mergedData = { ...currentData, ...finalUpdates }; // Use finalUpdates here
          finalUpdates.search_keywords = generateSearchKeywords(mergedData);
        }
      }

      await updateDoc(customerRef, cleanObject(finalUpdates));
    } catch (e) {
      console.error("Error updating document: ", e);
      throw e;
    }
  },

  // Delete a customer
  async deleteCustomer(id: string, ownerId?: string) {
    try {
      await deleteDoc(doc(db, "customers", id));

      // Decrement salesperson count
      if (ownerId) {
        await userService.incrementUserCustomerCount(ownerId, -1);
      }
    } catch (e) {
      console.error("Error deleting customer:", e);
      throw e;
    }
  },

  // Bulk add customers (for Excel import)
  async bulkAddCustomers(
    customers: (Omit<Customer, "id"> & { id?: string })[],
    onProgress?: (processed: number, total: number) => void,
  ) {
    const BATCH_SIZE = 100; // Reduced from 500 to stay under 10MB limit
    const totalItems = customers.length;

    try {
      for (let i = 0; i < customers.length; i += BATCH_SIZE) {
        const chunk = customers.slice(i, i + BATCH_SIZE);

        const batch = writeBatch(db);
        const ownerCounts: Record<string, number> = {};

        chunk.forEach((customer) => {
          // If customer has an ID, use it (Upsert/Update logic)
          // Otherwise, create a new document
          const { id, ...dataToSave } = customer;
          const docRef = id
            ? doc(db, "customers", id)
            : doc(collection(db, "customers"));

          const cleanPhones = Array.from(
            new Set(
              customer.phoneNumbers
                .map((p) => p.replace(/\D/g, ""))
                .filter((p) => p.length > 0),
            ),
          );

          const cleanTaxIds = Array.from(
            new Set(
              (customer.taxIds || [])
                .map((t) => t.replace(/\D/g, ""))
                .filter((t) => t.length > 0),
            ),
          );

          const keywords = generateSearchKeywords({
            ...customer,
            phoneNumbers: cleanPhones,
            taxIds: cleanTaxIds,
          });

          const customerData = {
            ...dataToSave,
            phoneNumbers: cleanPhones,
            taxIds: cleanTaxIds,
            name_lowercase: customer.name.toLowerCase(),
            phoneNumbers_clean: cleanPhones,
            search_keywords: keywords,
            updatedAt: Timestamp.now(),
          };

          batch.set(
            docRef,
            cleanObject({
              ...customerData,
              // Only set createdAt if it doesn't have an ID (New document)
              ...(!id ? { createdAt: Timestamp.now() } : {}),
            }),
            { merge: true },
          );

          // Track counts per owner
          if (dataToSave.ownerId) {
            ownerCounts[dataToSave.ownerId] =
              (ownerCounts[dataToSave.ownerId] || 0) + 1;
          }
        });

        await batch.commit();

        // Update user counts for this chunk
        await Promise.all(
          Object.entries(ownerCounts).map(([ownerId, count]) =>
            userService.incrementUserCustomerCount(ownerId, count),
          ),
        );

        // Report progress after each batch commit
        if (onProgress) {
          onProgress(Math.min(i + BATCH_SIZE, totalItems), totalItems);
        }
      }
    } catch (e) {
      console.error("Error committing bulk batches: ", e);
      throw e;
    }
  },

  // Check for duplicates
  async checkDuplicate(
    idCard: string,
    phoneNumbers: string[],
    taxIds?: string[],
    excludeCustomerId?: string,
    ownerId?: string,
  ) {
    try {
      const findDuplicate = async (q: Query) => {
        const snapshot = await getDocs(query(q, limit(5)));
        if (snapshot.empty) return null;
        // If no excludeId, first match is a duplicate
        if (!excludeCustomerId) return snapshot.docs[0];
        // If excludeId exists, find first doc with different ID
        return (
          snapshot.docs.find((doc) => doc.id !== excludeCustomerId) || null
        );
      };

      // Check ID Card - ALLOW DUPLICATES as per requirement
      // "เลขบัตรประชาชนซ้ำได้เพราะจะมีกรณีที่ลูกค้ามีบริษัทหลายที่ได้"
      // We do NOT return duplicate error for ID Card anymore.

      // Check Tax IDs - GLOBAL UNIQUE (Updated as per user request to detect duplicates with others)
      if (taxIds && taxIds.length > 0) {
        for (const taxId of taxIds) {
          if (!taxId.trim()) continue; // Skip empty values

          const taxQuery = query(
            collection(db, "customers"),
            where("taxIds", "array-contains", taxId.trim()),
          );
          const dupDoc = await findDuplicate(taxQuery);
          if (dupDoc) {
            const data = dupDoc.data() as any;
            const isSelf = ownerId && data.ownerId === ownerId;

            return {
              isDuplicate: true,
              duplicateField: "taxId",
              message: isSelf
                ? `เลขผู้เสียภาษี "${taxId}" มีอยู่ในระบบแล้ว (ซ้ำในรายชื่อลูกค้าของคุณ)`
                : `เลขผู้เสียภาษี "${taxId}" มีอยู่ในระบบแล้ว (ซ้ำกับของคนอื่น)`,
              existingCustomer: {
                id: dupDoc.id,
                ownerId: data.ownerId,
                ownerName: data.ownerName,
                name: data.name,
              },
            };
          }
        }
      }

      // Check Phone Numbers - GLOBAL UNIQUE
      if (phoneNumbers && phoneNumbers.length > 0) {
        // Clean phone numbers before checking
        const cleanPhones = phoneNumbers
          .map((p) => p.replace(/\D/g, ""))
          .filter((p) => p.length >= 9 && p.length <= 10) // Min 9, Max 10
          .slice(0, 10);

        if (cleanPhones.length > 0) {
          const phoneQuery = query(
            collection(db, "customers"),
            where("phoneNumbers_clean", "array-contains-any", cleanPhones),
          );
          const dupDoc = await findDuplicate(phoneQuery);
          if (dupDoc) {
            const data = dupDoc.data() as any;
            return {
              isDuplicate: true,
              duplicateField: "phone",
              message: "เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว (ห้ามซ้ำกับคนอื่น)",
              existingCustomer: {
                id: dupDoc.id,
                ownerId: data.ownerId,
                ownerName: data.ownerName,
                name: data.name,
              },
            };
          }
        }
      }

      return { isDuplicate: false, duplicateField: null };
    } catch (e) {
      console.error("Error checking duplicate:", e);
      return { isDuplicate: false, duplicateField: null };
    }
  },

  // Get owner info by ID Card
  async getOwnerByIdCard(idCard: string) {
    try {
      if (!idCard || idCard.length !== 13) return null;

      const snapshot = await getDocs(
        query(
          collection(db, "customers"),
          where("idCard", "==", idCard),
          limit(1),
        ),
      );

      if (snapshot.empty) return null;

      const customer = snapshot.docs[0].data() as any;
      // Return owner information and customer names
      return {
        ownerId: customer.ownerId,
        ownerName: customer.ownerName || "ไม่ระบุชื่อเจ้าของ",
        foundCustomers: [
          {
            name: customer.name,
            ownerId: customer.ownerId,
          },
        ],
      };
    } catch (e) {
      console.error("Error getting owner by ID card:", e);
      return null;
    }
  },

  // Get dashboard statistics - Source of Truth version
  async getDashboardStats(
    salesUsers: { id: string; name: string }[],
    ownerId?: string,
  ) {
    try {
      // 1. Get Total Customers (Filtered if ownerId is provided)
      const totalQuery = ownerId
        ? query(collection(db, "customers"), where("ownerId", "==", ownerId))
        : query(collection(db, "customers"));
      const totalSnapshot = await getCountFromServer(totalQuery);
      const totalCount = totalSnapshot.data().count;

      // 2. Get Count per Salesperson (Real-time from customers collection)
      // Only do breakdown if no specific ownerId is provided (Admin view)
      let salesStats: { name: string; count: number }[] = [];

      if (!ownerId) {
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
        salesStats = await Promise.all(salesStatsPromise);
      }

      // 3. Identify Unassigned / Admin-only customers (Only for Admin)
      if (!ownerId) {
        const assignedCount = salesStats.reduce((sum, s) => sum + s.count, 0);
        const unassignedCount = totalCount - assignedCount;

        if (unassignedCount !== 0) {
          salesStats.push({
            name: "ไม่มีเซลล์",
            count: unassignedCount,
          });
        }
      }

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

  // Comprehensive Data Cleanup
  async cleanupData() {
    try {
      const snapshot = await getDocs(collection(db, "customers"));
      const batch = writeBatch(db);
      let count = 0; // Tracks updates from 'needsUpdate'
      let fixedCount = 0; // Tracks specific fixes like ownerName for null ownerId

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Customer;
        const updates: any = {};
        let needsUpdate = false;

        // 1. Trim Owner ID
        if (data.ownerId && data.ownerId !== data.ownerId.trim()) {
          updates.ownerId = data.ownerId.trim();
          needsUpdate = true;
        }

        // Case 2: ownerId is null but ownerName is STILL PRESENT
        if (!data.ownerId && data.ownerName) {
          updates.ownerName = null;
          needsUpdate = true;
          fixedCount++;
        }

        // Case 3: Both are present, verify ownerName matches current user name
        // (This part is not in the provided diff, keeping original logic if any)

        // 2. Normalize Phones
        let currentCleanPhones = data.phoneNumbers_clean || [];
        if (data.phoneNumbers) {
          const newCleanPhones = data.phoneNumbers
            .map((p) => p.replace(/\D/g, ""))
            .filter((p) => p.length > 0);

          if (
            JSON.stringify(newCleanPhones) !==
            JSON.stringify(data.phoneNumbers_clean)
          ) {
            updates.phoneNumbers_clean = newCleanPhones;
            currentCleanPhones = newCleanPhones;
            needsUpdate = true;
          }
        }

        // 3. Refresh Search Keywords
        const mergedData = { ...data, ...updates };
        const searchKeywords = generateSearchKeywords(mergedData);
        if (
          JSON.stringify(searchKeywords) !==
          JSON.stringify(data.search_keywords)
        ) {
          updates.search_keywords = searchKeywords;
          needsUpdate = true;
        }

        if (needsUpdate) {
          batch.update(docSnap.ref, updates);
          count++;
        }
      }

      if (count > 0 || fixedCount > 0) {
        await batch.commit();
      }
      return { customerCount: snapshot.size, fixedCount: count + fixedCount };
    } catch (e) {
      console.error("Error cleaning up data: ", e);
      throw e;
    }
  },

  // Set all customers of a user to have no owner (null)
  async releaseCustomersByUser(userId: string) {
    try {
      const q = query(
        collection(db, "customers"),
        where("ownerId", "==", userId),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return 0;

      const batch = writeBatch(db);
      let count = 0;

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          ownerId: null,
          ownerName: null,
        });
        count++;
      });

      await batch.commit();
      return count;
    } catch (e) {
      console.error("Error releasing customers:", e);
      throw e;
    }
  },

  // Get all customers with null owner
  async getUnassignedCustomers(
    options?: Omit<CustomerQueryOptions, "ownerId">,
  ) {
    try {
      const {
        searchTerm,
        status,
        pageSize = 50,
        lastVisible,
        startDate,
        endDate,
      } = options || {};

      let q = query(collection(db, "customers"), where("ownerId", "==", null));

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

      q = query(q, orderBy("createdAt", "desc"));

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);
      const customers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];

      return {
        customers,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
      };
    } catch (e) {
      console.error("Error fetching unassigned customers:", e);
      throw e;
    }
  },

  // Update customer owner
  async updateCustomerOwner(customerId: string, newOwnerId: string | null) {
    try {
      const customerRef = doc(db, "customers", customerId);
      await updateDoc(customerRef, {
        ownerId: newOwnerId,
        updatedAt: Timestamp.now(),
      });
    } catch (e) {
      console.error("Error updating customer owner:", e);
      throw e;
    }
  },

  // Bulk update customer owners (for import)
  async bulkUpdateCustomerOwners(
    updates: { customerId: string; newOwnerId: string }[],
  ) {
    try {
      const batch = writeBatch(db);
      let count = 0;

      for (const update of updates) {
        const customerRef = doc(db, "customers", update.customerId);
        batch.update(customerRef, {
          ownerId: update.newOwnerId,
          updatedAt: Timestamp.now(),
        });
        count++;
      }

      await batch.commit();
      return count;
    } catch (e) {
      console.error("Error bulk updating customer owners:", e);
      throw e;
    }
  },
};

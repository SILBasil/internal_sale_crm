import { db } from "@/app/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  query,
  where,
  increment,
  writeBatch,
  getCountFromServer,
} from "firebase/firestore";
import { UserData } from "@/app/components/user-management";

export const userService = {
  // Add a new user
  async addUser(user: Omit<UserData, "id">) {
    try {
      const docRef = await addDoc(collection(db, "users"), {
        ...user,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (e) {
      console.error("Error adding user: ", e);
      throw e;
    }
  },

  // Bulk add users
  async bulkAddUsers(users: Omit<UserData, "id">[]) {
    try {
      const promises = users.map((user) =>
        addDoc(collection(db, "users"), {
          ...user,
          createdAt: Timestamp.now(),
        }),
      );
      await Promise.all(promises);
    } catch (e) {
      console.error("Error bulk adding users: ", e);
      throw e;
    }
  },

  // Get all users
  async getUsers() {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];
    } catch (e) {
      console.error("Error fetching users: ", e);
      throw e;
    }
  },

  // Update user status/info
  async updateUser(id: string, updates: Partial<UserData>) {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (e) {
      console.error("Error updating user: ", e);
      throw e;
    }
  },

  // Verify login credentials
  async verifyLogin(email: string, password: string) {
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("password", "==", password),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as UserData;
    } catch (e) {
      console.error("Login verification failed:", e);
      return null;
    }
  },

  // Increment/Decrement user customer count
  async incrementUserCustomerCount(userId: string, amount: number) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        customerCount: increment(amount),
      });
    } catch (e) {
      console.error("Error incrementing customer count:", e);
    }
  },

  // Sync all user counts (Migration script)
  async syncAllUserCounts() {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as UserData,
      );

      const batch = writeBatch(db);

      for (const user of users) {
        // Count customers for this user
        const q = query(
          collection(db, "customers"),
          where("ownerId", "==", user.id),
        );
        const snapshot = await getCountFromServer(q);
        const count = snapshot.data().count;

        const userRef = doc(db, "users", user.id);
        batch.update(userRef, { customerCount: count });
      }

      await batch.commit();
      console.log("Synced all user counts");
      return users.length;
    } catch (e) {
      console.error("Error syncing counts:", e);
      throw e;
    }
  },
};

import { UserData } from '@/app/components/user-management';
// import { db } from '@/app/lib/firebase';
// import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

/**
 * User Service for Firebase Firestore
 * All logic is currently commented out to maintain local state functionality.
 */

export const userService = {
  // Add a new user
  async addUser(user: Omit<UserData, 'id'>) {
    /*
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        ...user,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (e) {
      console.error("Error adding user: ", e);
      throw e;
    }
    */
    console.log("Firebase inactive: Mock add user", user);
    return null;
  },

  // Get all users
  async getUsers() {
    /*
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
    } catch (e) {
      console.error("Error fetching users: ", e);
      throw e;
    }
    */
    return [];
  },

  // Update user status/info
  async updateUser(id: string, updates: Partial<UserData>) {
    /*
    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, updates);
    } catch (e) {
      console.error("Error updating user: ", e);
      throw e;
    }
    */
    console.log("Firebase inactive: Mock update user", id, updates);
  }
};

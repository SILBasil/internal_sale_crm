import { Customer } from '@/app/components/customer-table';
// import { db } from '@/app/lib/firebase';
// import { collection, addDoc, getDocs, updateDoc, doc, writeBatch, query, where } from 'firebase/firestore';

/**
 * Customer Service for Firebase Firestore
 * All logic is currently commented out to maintain local state functionality.
 */

export const customerService = {
  // Add a new customer
  async addCustomer(customer: Omit<Customer, 'id'>) {
    /*
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customer,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e;
    }
    */
    console.log("Firebase inactive: Mock add customer", customer);
    return null;
  },

  // Get all customers
  async getCustomers() {
    /*
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
    } catch (e) {
      console.error("Error fetching documents: ", e);
      throw e;
    }
    */
    return [];
  },

  // Update a customer
  async updateCustomer(id: string, updates: Partial<Customer>) {
    /*
    try {
      const customerRef = doc(db, 'customers', id);
      await updateDoc(customerRef, updates);
    } catch (e) {
      console.error("Error updating document: ", e);
      throw e;
    }
    */
    console.log("Firebase inactive: Mock update customer", id, updates);
  },

  // Bulk add customers (for Excel import)
  async bulkAddCustomers(customers: Omit<Customer, 'id'>[]) {
    /*
    try {
      const batch = writeBatch(db);
      customers.forEach((customer) => {
        const docRef = doc(collection(db, 'customers'));
        batch.set(docRef, {
          ...customer,
          createdAt: new Date()
        });
      });
      await batch.commit();
    } catch (e) {
      console.error("Error committing batch: ", e);
      throw e;
    }
    */
    console.log("Firebase inactive: Mock bulk add customers", customers.length);
  }
};

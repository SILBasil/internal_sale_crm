import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { CustomerInfoForm, CustomerInfoData } from './customer-info-form';
import { Customer } from './customer-table';

interface EditCustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  onCheckDuplicate?: (idCard: string, phoneNumbers: string[], taxIds?: string[], excludeCustomerId?: string, ownerId?: string) => Promise<{
    isDuplicate: boolean;
    duplicateField: string | null;
    duplicateValue?: string;
    message?: string;
  }>;
}

export function EditCustomerModal({ customer, isOpen, onClose, onSave, onCheckDuplicate }: EditCustomerModalProps) {
  if (!customer) return null;

  const handleSubmit = (data: CustomerInfoData) => {
    const updatedCustomer: Customer = {
      ...customer,
      name: data.name,
      idCard: data.idCard,
      phoneNumbers: data.phoneNumbers,
      taxIds: data.taxIds, // Changed from single taxId to array
      status: data.status,
    };
    onSave(updatedCustomer);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">แก้ไขข้อมูลลูกค้า</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <CustomerInfoForm
            initialData={{
              name: customer.name,
              idCard: customer.idCard || '',
              phoneNumbers: customer.phoneNumbers,
              taxIds: customer.taxIds || [], // Changed from single taxId to array
              status: customer.status,
            }}
            onSubmit={handleSubmit}
            onCancel={onClose}
            onCheckDuplicate={(idCard, phones, taxIds) =>
              onCheckDuplicate
                ? onCheckDuplicate(idCard, phones, taxIds, customer.id, customer.ownerId)
                : Promise.resolve({ isDuplicate: false, duplicateField: null })
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

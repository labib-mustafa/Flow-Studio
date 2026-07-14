import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage } from '../lib/fileStorage';

export interface InvoiceLineItem {
  id: string;
  description: string;
  subDescription?: string;
  quantity: number;
  rate: number;
}

export interface PaymentHistoryItem {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Draft' | 'Overdue';
  recipientName: string;
  recipientAvatar: string;
  recipientEmail?: string;
  date: string;
  dueDate: string;
  method: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
}

export interface SavedCardInfo {
  cardNumber: string;
  cardHolder: string;
  validThru: string;
  brand: string;
}

export interface BillingAddressInfo {
  name: string;
  addressLine1: string;
  addressLine2: string;
}

interface BillingState {
  balance: number;
  nextPaymentAmount: number;
  nextPaymentDate: string;
  savedCard: SavedCardInfo;
  billingAddress: BillingAddressInfo;
  paymentHistory: PaymentHistoryItem[];
  
  // Actions
  addInvoice: (invoice: Omit<PaymentHistoryItem, 'id'>) => void;
  updateInvoiceStatus: (id: string, status: PaymentHistoryItem['status']) => void;
  deleteInvoice: (id: string) => void;
  updateSavedCard: (card: Partial<SavedCardInfo>) => void;
  updateBillingAddress: (address: Partial<BillingAddressInfo>) => void;
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set) => ({
      balance: 0,
      nextPaymentAmount: 0,
      nextPaymentDate: '',
      savedCard: {
        cardNumber: '',
        cardHolder: '',
        validThru: '',
        brand: ''
      },
      billingAddress: {
        name: '',
        addressLine1: '',
        addressLine2: ''
      },
      paymentHistory: [],

      addInvoice: (invoice) => set((state) => ({
        paymentHistory: [
          {
            ...invoice,
            id: `inv-${Date.now()}`
          },
          ...state.paymentHistory
        ]
      })),

      updateInvoiceStatus: (id, status) => set((state) => ({
        paymentHistory: state.paymentHistory.map(item => 
          item.id === id ? { ...item, status } : item
        )
      })),

      deleteInvoice: (id) => set((state) => ({
        paymentHistory: state.paymentHistory.filter(item => item.id !== id)
      })),

      updateSavedCard: (card) => set((state) => ({
        savedCard: { ...state.savedCard, ...card }
      })),

      updateBillingAddress: (address) => set((state) => ({
        billingAddress: { ...state.billingAddress, ...address }
      }))
    }),
    {
      name: 'billing-storage-v1',
      storage: createFileStorage('billing'),
      merge: (persistedState: any, currentState) => {
        return { ...currentState, ...persistedState };
      }
    }
  )
);

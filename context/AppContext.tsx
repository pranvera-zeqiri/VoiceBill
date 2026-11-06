import { seedCustomers, seedInvoices } from '@/data/mock';
import {
    Customer,
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    Settings,
    User,
} from '@/types';
import { calcTotals, daysAgoISO, todayISO, uid } from '@/utils/format';
import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

interface NewInvoiceInput {
  customerId: string;
  title: string;
  items: InvoiceItem[];
  vatRate: number;
  status?: InvoiceStatus;
  fromVoice?: boolean;
  audioSeconds?: number;
}

interface NewCustomerInput {
  name: string;
  phone: string;
  email: string;
  address?: string;
}

interface RegisterInput {
  fullName: string;
  businessName: string;
  email: string;
}

interface CustomerStats {
  count: number;
  total: number;
  overdue: number;
  lastDate: string;
}

interface AppContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;

  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  customers: Customer[];
  invoices: Invoice[];
  getCustomer: (id: string) => Customer | undefined;
  getInvoice: (id: string) => Invoice | undefined;
  getCustomerStats: (customerId: string) => CustomerStats;
  addCustomer: (input: NewCustomerInput) => Customer;
  addInvoice: (input: NewInvoiceInput) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  setInvoiceStatus: (id: string, status: InvoiceStatus) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    autoReminders: true,
    autoVat: true,
    vatRate: 18,
  });

  /* ----- Auth (mocked — replace with Supabase later) ----- */
  const login = useCallback(async (email: string, _password: string) => {
    await wait(700);
    setUser({
      fullName: 'Arben Hoxha',
      businessName: 'Hoxha Servis',
      email,
      phone: '+383 44 000 111',
      taxId: '811234567',
    });
  }, []);

  const register = useCallback(async (input: RegisterInput, _password: string) => {
    await wait(900);
    setUser({
      fullName: input.fullName,
      businessName: input.businessName,
      email: input.email,
      phone: '',
      taxId: '',
    });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const updateUser = useCallback(
    (patch: Partial<User>) => setUser((prev) => (prev ? { ...prev, ...patch } : prev)),
    []
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch })),
    []
  );

  /* ----- Data ----- */
  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers]
  );

  const getInvoice = useCallback(
    (id: string) => invoices.find((i) => i.id === id),
    [invoices]
  );

  const getCustomerStats = useCallback(
    (customerId: string): CustomerStats => {
      const list = invoices.filter((i) => i.customerId === customerId);
      const total = list.reduce(
        (sum, i) => sum + calcTotals(i.items, i.vatRate).total,
        0
      );
      const lastDate = list.map((i) => i.date).sort().pop() ?? '';
      return {
        count: list.length,
        total: Math.round(total * 100) / 100,
        overdue: list.filter((i) => i.status === 'overdue').length,
        lastDate,
      };
    },
    [invoices]
  );

  const addCustomer = useCallback(
    (input: NewCustomerInput) => {
      const created: Customer = {
        id: `c-${uid()}`,
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address ?? '',
        since: todayISO(),
        avgPayDays: 0,
      };
      setCustomers((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const addInvoice = useCallback(
    (input: NewInvoiceInput) => {
      const nextNumber = Math.max(0, ...invoices.map((i) => Number(i.number))) + 1;
      const created: Invoice = {
        id: `inv-${uid()}`,
        number: String(nextNumber).padStart(4, '0'),
        customerId: input.customerId,
        title: input.title,
        date: todayISO(),
        dueDate: daysAgoISO(-14),
        status: input.status ?? 'draft',
        items: input.items,
        vatRate: input.vatRate,
        fromVoice: input.fromVoice,
        audioSeconds: input.audioSeconds,
      };
      setInvoices((prev) => [created, ...prev]);
      return created;
    },
    [invoices]
  );

  const updateInvoice = useCallback((id: string, patch: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const setInvoiceStatus = useCallback(
    (id: string, status: InvoiceStatus) => updateInvoice(id, { status }),
    [updateInvoice]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
      settings,
      updateSettings,
      customers,
      invoices,
      getCustomer,
      getInvoice,
      getCustomerStats,
      addCustomer,
      addInvoice,
      updateInvoice,
      setInvoiceStatus,
    }),
    [
      user, login, register, logout, updateUser, settings, updateSettings,
      customers, invoices, getCustomer, getInvoice, getCustomerStats,
      addCustomer, addInvoice, updateInvoice, setInvoiceStatus,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
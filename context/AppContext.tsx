import { supabase } from '@/lib/supabase';
import { customerService } from '@/services/costumerService';
import type { NewCustomerInput } from '@/services/costumerService';
import { invoiceService } from '@/services/invoiceService';
import {
    Customer,
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    Settings,
    User,
} from '@/types';
import { calcTotals, daysAgoISO, todayISO } from '@/utils/format';
import { AppState, Platform } from 'react-native';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
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
  authReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;

  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  customers: Customer[];
  invoices: Invoice[];
  invoicesLoading: boolean;
  invoicesError: string | null;
  refreshInvoices: () => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
  getInvoice: (id: string) => Invoice | undefined;
  getCustomerStats: (customerId: string) => CustomerStats;
  addCustomer: (input: NewCustomerInput) => Promise<Customer>;
  addInvoice: (input: NewInvoiceInput) => Promise<Invoice>;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  setInvoiceStatus: (id: string, status: InvoiceStatus) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const invoiceRequest = useRef(0);
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    autoReminders: true,
    autoVat: true,
    vatRate: 18,
  });

  const refreshInvoices = useCallback(async () => {
    const request = ++invoiceRequest.current;
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const loadedInvoices = await invoiceService.getInvoices();
      if (request === invoiceRequest.current) setInvoices(loadedInvoices);
    } catch (error) {
      if (request === invoiceRequest.current) {
        setInvoicesError(
          error instanceof Error ? error.message : 'Faturat nuk mund të ngarkoheshin.'
        );
      }
      console.error('Gabim gjatë ngarkimit të faturave nga Supabase:', error);
    } finally {
      if (request === invoiceRequest.current) setInvoicesLoading(false);
    }
  }, []);

  /* ----- Auth (Supabase Integration) ----- */
  useEffect(() => {
    let active = true;
    let customerRequest = 0;
    let authChangeTimeout: ReturnType<typeof setTimeout> | undefined;
    const loadCustomers = () => {
      if (!active) return;
      const request = ++customerRequest;
      void customerService
        .getCustomers()
        .then((loadedCustomers) => {
          if (active && request === customerRequest) setCustomers(loadedCustomers);
        })
        .catch((error: unknown) => {
          console.error('Gabim në ngarkimin e klientëve nga Supabase:', error);
        });
    };

    // INITIAL_SESSION is emitted after Supabase has restored the persisted session.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthReady(true);
      if (session?.user) {
        setUser({
          fullName: session.user.user_metadata?.full_name || 'Zejtar',
          businessName: session.user.user_metadata?.business_name || 'Servis',
          email: session.user.email || '',
          phone: '',
          taxId: '',
        });
        if (authChangeTimeout) clearTimeout(authChangeTimeout);
        authChangeTimeout = setTimeout(() => {
          if (!active) return;
          loadCustomers();
          void refreshInvoices();
        }, 0);
      } else {
        if (authChangeTimeout) clearTimeout(authChangeTimeout);
        customerRequest += 1;
        invoiceRequest.current += 1;
        setUser(null);
        setCustomers([]);
        setInvoices([]);
        setInvoicesError(null);
        setInvoicesLoading(false);
      }
    });

    const appStateSubscription =
      Platform.OS === 'web'
        ? undefined
        : AppState.addEventListener('change', (state) => {
            if (state === 'active') {
              void supabase.auth.startAutoRefresh();
            } else {
              void supabase.auth.stopAutoRefresh();
            }
          });

    if (Platform.OS !== 'web' && AppState.currentState === 'active') {
      void supabase.auth.startAutoRefresh();
    }

    return () => {
      active = false;
      customerRequest += 1;
      invoiceRequest.current += 1;
      if (authChangeTimeout) clearTimeout(authChangeTimeout);
      authListener.subscription.unsubscribe();
      appStateSubscription?.remove();
      if (Platform.OS !== 'web') void supabase.auth.stopAutoRefresh();
    };
  }, [refreshInvoices]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const register = useCallback(async (input: RegisterInput, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password,
      options: {
        data: {
          full_name: input.fullName,
          business_name: input.businessName,
        },
      },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

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
    async (input: NewCustomerInput) => {
      const created = await customerService.addCustomer(input);
      setCustomers((prev) => [created, ...prev.filter((customer) => customer.id !== created.id)]);
      return created;
    },
    []
  );

  const addInvoice = useCallback(
    async (input: NewInvoiceInput) => {
      const nextNumber = Math.max(0, ...invoices.map((i) => Number(i.number))) + 1;
      const created = await invoiceService.createInvoice({
        customerId: input.customerId,
        number: String(nextNumber).padStart(4, '0'),
        title: input.title,
        date: todayISO(),
        status: input.status ?? 'draft',
        vatRate: input.vatRate,
        dueDate: daysAgoISO(-14),
        fromVoice: input.fromVoice,
        audioSeconds: input.audioSeconds,
        items: input.items,
      });
      setInvoices((prev) => [created, ...prev.filter((invoice) => invoice.id !== created.id)]);
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
      authReady,
      login,
      register,
      logout,
      updateUser,
      settings,
      updateSettings,
      customers,
      invoices,
      invoicesLoading,
      invoicesError,
      refreshInvoices,
      getCustomer,
      getInvoice,
      getCustomerStats,
      addCustomer,
      addInvoice,
      updateInvoice,
      setInvoiceStatus,
    }),
    [
      user, authReady, login, register, logout, updateUser, settings, updateSettings,
      customers, invoices, invoicesLoading, invoicesError, refreshInvoices,
      getCustomer, getInvoice, getCustomerStats,
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
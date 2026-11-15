import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { seedNewUserData } from '../lib/seedData';
import type { UserProfile, Category, Income, Expense, Wallet, Transfer, Loan, LoanRepayment, LoanType, LoanStatus, Budget, RecurringTransaction, RecurringFrequency, SavingsGoal } from '../types';

export interface DbErrorState {
  message: string;
  code: string;
  path?: string;
}

export function useUserData(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);

  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<DbErrorState | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setCategories([]);
      setWallets([]);
      setTransfers([]);
      setIncomes([]);
      setExpenses([]);
      setLoans([]);
      setBudgets([]);
      setRecurring([]);
      setSavingsGoals([]);
      setDataLoading(false);
      setDbError(null);
      return;
    }

    setDataLoading(true);
    setDbError(null);

    let loadedProfile = false;
    let loadedCategories = false;
    let loadedWallets = false;
    let loadedIncomes = false;
    let loadedExpenses = false;
    let loadedTransfers = false;
    let loadedLoans = false;

    const checkLoadingFinished = () => {
      if (
        loadedProfile &&
        loadedCategories &&
        loadedWallets &&
        loadedIncomes &&
        loadedExpenses &&
        loadedTransfers &&
        loadedLoans
      ) {
        setDataLoading(false);
      }
    };

    const unsubs: Unsubscribe[] = [];

    // profile listener
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              uid: user.uid,
              email: user.email || '',
              fullName: data.fullName || 'User',
              photoURL: data.photoURL || '',
              currency: data.currency || 'Ks',
              monthlyIncomeGoal:
                data.monthlyIncomeGoal !== undefined && data.monthlyIncomeGoal !== null
                  ? Number(data.monthlyIncomeGoal)
                  : null,
            });
          } else {
            // seed profile if missing
            await seedNewUserData(user.uid, {
              fullName: user.displayName || 'Finance Member',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              currency: 'Ks',
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }

        if (!loadedProfile) {
          loadedProfile = true;
          checkLoadingFinished();
        }
      },
      (err) => {
        setDbError({
          message: err instanceof Error ? err.message : String(err),
          code: (err as any).code || 'unknown',
          path: `users/${user.uid}`,
        });
        setDataLoading(false);
      }
    );
    unsubs.push(unsubProfile);

    // categories listener
    const unsubCategories = onSnapshot(
      collection(db, 'users', user.uid, 'categories'),
      (snapshot) => {
        const list: Category[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || '',
            type: data.type || 'expense',
          });
        });
        setCategories(list);

        if (!loadedCategories) {
          loadedCategories = true;
          checkLoadingFinished();
        }
      },
      (err) => {
        setDbError({
          message: err instanceof Error ? err.message : String(err),
          code: (err as any).code || 'unknown',
          path: `users/${user.uid}/categories`,
        });
        setDataLoading(false);
      }
    );
    unsubs.push(unsubCategories);

    // wallets listener
    const unsubWallets = onSnapshot(
      collection(db, 'users', user.uid, 'wallets'),
      async (snapshot) => {
        const list: Wallet[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            type: (data.type as any) || 'kbz_pay',
            initialBalance: Number(data.initialBalance) || 0,
            name: typeof data.name === 'string' ? data.name.replace(/လက်ထဲရှိငွေ/g, 'ငွေသား') : data.name,
            createdAt: data.createdAt || '',
          });
        });
        setWallets(list);

        if (!loadedWallets) {
          loadedWallets = true;
          checkLoadingFinished();
        }
      },
      (err) => {
        setDbError({
          message: err instanceof Error ? err.message : String(err),
          code: (err as any).code || 'unknown',
          path: `users/${user.uid}/wallets`,
        });
        setDataLoading(false);
      }
    );
    unsubs.push(unsubWallets);

    // incomes listener
    const unsubIncomes = onSnapshot(
      collection(db, 'users', user.uid, 'incomes'),
      (snapshot) => {
        const list: Income[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            title: data.title || '',
            amount: Number(data.amount) || 0,
            category: data.category || '',
            date: data.date || '',
            walletId: data.walletId,
            note: data.note,
            createdAt: data.createdAt || '',
          });
        });
        setIncomes(list);

        if (!loadedIncomes) {
          loadedIncomes = true;
          checkLoadingFinished();
        }
      },
      (err) => {
        setDbError({
          message: err instanceof Error ? err.message : String(err),
          code: (err as any).code || 'unknown',
          path: `users/${user.uid}/incomes`,
        });
        setDataLoading(false);
      }
    );
    unsubs.push(unsubIncomes);

    // expenses listener
    const unsubExpenses = onSnapshot(
      collection(db, 'users', user.uid, 'expenses'),
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            title: data.title || '',
            amount: Number(data.amount) || 0,
            category: data.category || '',
            date: data.date || '',
            walletId: data.walletId,
            note: data.note,
            createdAt: data.createdAt || '',
          });
        });
        setExpenses(list);

        if (!loadedExpenses) {
          loadedExpenses = true;
          checkLoadingFinished();
        }
      },
      (err) => {
        setDbError({
          message: err instanceof Error ? err.message : String(err),
          code: (err as any).code || 'unknown',
          path: `users/${user.uid}/expenses`,
        });
        setDataLoading(false);
      }
    );
    unsubs.push(unsubExpenses);

    // transfers listener
    const unsubTransfers = onSnapshot(
      collection(db, 'users', user.uid, 'transfers'),
      (snapshot) => {
        const list: Transfer[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            fromWalletId: data.fromWalletId || '',
            toWalletId: data.toWalletId || '',
            amount: Number(data.amount) || 0,
            date: data.date || '',
            createdAt: data.createdAt || '',
          });
        });
        setTransfers(list);

        if (!loadedTransfers) {
          loadedTransfers = true;
          checkLoadingFinished();
        }
      },
      (err) => {
        setDbError({
          message: err instanceof Error ? err.message : String(err),
          code: (err as any).code || 'unknown',
          path: `users/${user.uid}/transfers`,
        });
        setDataLoading(false);
      }
    );
    unsubs.push(unsubTransfers);

    // loans listener
    const unsubLoans = onSnapshot(
      collection(db, 'users', user.uid, 'loans'),
      (snapshot) => {
        const list: Loan[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            personName: data.personName || '',
            type: data.type || 'lent',
            amount: Number(data.amount) || 0,
            paidAmount: Number(data.paidAmount) || 0,
            remainingAmount: Number(data.remainingAmount) || 0,
            startDate: data.startDate || '',
            dueDate: data.dueDate || undefined,
            walletId: data.walletId || '',
            status: data.status || 'pending',
            note: data.note || undefined,
            repayments: Array.isArray(data.repayments) ? data.repayments : [],
            createdAt: data.createdAt || '',
          });
        });
        setLoans(list);

        if (!loadedLoans) {
          loadedLoans = true;
          checkLoadingFinished();
        }
      },
      (err) => {
        setDbError({
          message: err instanceof Error ? err.message : String(err),
          code: (err as any).code || 'unknown',
          path: `users/${user.uid}/loans`,
        });
        setDataLoading(false);
      }
    );
    unsubs.push(unsubLoans);

    // budgets listener
    const unsubBudgets = onSnapshot(
      collection(db, 'users', user.uid, 'budgets'),
      (snapshot) => {
        const list: Budget[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            category: data.category || '',
            monthlyLimit: Number(data.monthlyLimit) || 0,
            createdAt: data.createdAt || '',
          });
        });
        setBudgets(list);
      },
      (err) => {
        console.warn('Budgets listener warning:', err);
        setBudgets([]);
      }
    );
    unsubs.push(unsubBudgets);

    // recurring transactions listener
    const unsubRecurring = onSnapshot(
      collection(db, 'users', user.uid, 'recurring'),
      (snapshot) => {
        const list: RecurringTransaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            type: data.type === 'income' ? 'income' : 'expense',
            title: data.title || '',
            amount: Number(data.amount) || 0,
            category: data.category || '',
            walletId: data.walletId || '',
            frequency: (data.frequency as RecurringFrequency) || 'monthly',
            nextDueDate: data.nextDueDate || '',
            isActive: data.isActive !== false,
            note: data.note || undefined,
            createdAt: data.createdAt || '',
          });
        });
        setRecurring(list);
      },
      (err) => {
        console.warn('Recurring listener warning:', err);
        setRecurring([]);
      }
    );
    unsubs.push(unsubRecurring);

    // savings goals listener
    const unsubSavingsGoals = onSnapshot(
      collection(db, 'users', user.uid, 'savingsGoals'),
      (snapshot) => {
        const list: SavingsGoal[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            title: data.title || '',
            targetAmount: Number(data.targetAmount) || 0,
            currentAmount: Number(data.currentAmount) || 0,
            targetDate: data.targetDate || undefined,
            walletId: data.walletId || undefined,
            note: data.note || undefined,
            createdAt: data.createdAt || '',
          });
        });
        setSavingsGoals(list);
      },
      (err) => {
        console.warn('SavingsGoals listener warning:', err);
        setSavingsGoals([]);
      }
    );
    unsubs.push(unsubSavingsGoals);

    // cleanup listeners
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  // crud operations
  const handleAddIncome = useCallback(
    async (data: Omit<Income, 'id' | 'createdAt'>) => {
      if (!user) return;
      const path = `users/${user.uid}/incomes`;
      try {
        await addDoc(collection(db, 'users', user.uid, 'incomes'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const handleEditIncome = useCallback(
    async (id: string, data: Omit<Income, 'id' | 'createdAt'>) => {
      if (!user) return;
      const path = `users/${user.uid}/incomes/${id}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'incomes', id), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const handleDeleteIncome = useCallback(
    async (id: string) => {
      if (!user) return;
      const path = `users/${user.uid}/incomes/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'incomes', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const handleAddExpense = useCallback(
    async (data: Omit<Expense, 'id' | 'createdAt'>) => {
      if (!user) return;
      const path = `users/${user.uid}/expenses`;
      try {
        await addDoc(collection(db, 'users', user.uid, 'expenses'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const handleEditExpense = useCallback(
    async (id: string, data: Omit<Expense, 'id' | 'createdAt'>) => {
      if (!user) return;
      const path = `users/${user.uid}/expenses/${id}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'expenses', id), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const handleDeleteExpense = useCallback(
    async (id: string) => {
      if (!user) return;
      const path = `users/${user.uid}/expenses/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const handleAddCategory = useCallback(
    async (name: string, type: 'income' | 'expense') => {
      if (!user) return;
      const catId = name.toLowerCase().trim().replace(/\s+/g, '-');
      const path = `users/${user.uid}/categories/${catId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'categories', catId), {
          name: name.trim(),
          type,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const handleRenameCategory = useCallback(
    async (id: string, name: string) => {
      if (!user) return;
      const path = `users/${user.uid}/categories/${id}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'categories', id), {
          name: name.trim(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      if (!user) return;
      const path = `users/${user.uid}/categories/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'categories', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const handleAddWallet = useCallback(
    async (data: Omit<Wallet, 'id' | 'createdAt'>) => {
      if (!user) return;
      const path = `users/${user.uid}/wallets`;
      try {
        await addDoc(collection(db, 'users', user.uid, 'wallets'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const handleEditWallet = useCallback(
    async (id: string, data: Partial<Wallet>) => {
      if (!user) return;
      const path = `users/${user.uid}/wallets/${id}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'wallets', id), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const handleDeleteWallet = useCallback(
    async (id: string) => {
      if (!user) return;
      const path = `users/${user.uid}/wallets/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'wallets', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const handleAddTransfer = useCallback(
    async (data: Omit<Transfer, 'id' | 'createdAt'>) => {
      if (!user) return;
      const path = `users/${user.uid}/transfers`;
      try {
        await addDoc(collection(db, 'users', user.uid, 'transfers'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
        throw err;
      }
    },
    [user]
  );

  const handleDeleteTransfer = useCallback(
    async (id: string) => {
      if (!user) return;
      const path = `users/${user.uid}/transfers/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'transfers', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      const path = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, 'users', user.uid), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const handleAddLoan = useCallback(
    async (data: Omit<Loan, 'id' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status' | 'repayments'>) => {
      if (!user) return;
      const path = `users/${user.uid}/loans`;
      try {
        const payload: Record<string, any> = {
          personName: data.personName.trim(),
          type: data.type,
          amount: data.amount,
          paidAmount: 0,
          remainingAmount: data.amount,
          startDate: data.startDate,
          walletId: data.walletId,
          status: 'pending',
          repayments: [],
          createdAt: new Date().toISOString(),
        };
        if (data.dueDate && data.dueDate.trim()) {
          payload.dueDate = data.dueDate.trim();
        }
        if (data.note && data.note.trim()) {
          payload.note = data.note.trim();
        }
        await addDoc(collection(db, 'users', user.uid, 'loans'), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
        throw err;
      }
    },
    [user]
  );

  const handleEditLoan = useCallback(
    async (id: string, data: { personName?: string; type?: LoanType; amount?: number; startDate?: string; dueDate?: string; walletId?: string; note?: string }) => {
      if (!user) return;
      const path = `users/${user.uid}/loans/${id}`;
      try {
        const existing = loans.find((l) => l.id === id);
        if (!existing) return;

        const updatedAmount = data.amount !== undefined ? data.amount : existing.amount;
        const currentPaid = existing.paidAmount;
        const newRemaining = Math.max(0, updatedAmount - currentPaid);
        let newStatus: LoanStatus = 'pending';
        if (newRemaining === 0 && updatedAmount > 0) {
          newStatus = 'completed';
        } else if (currentPaid > 0) {
          newStatus = 'partial';
        }

        const payload: Record<string, any> = {
          personName: data.personName !== undefined ? data.personName.trim() : existing.personName,
          type: data.type || existing.type,
          amount: updatedAmount,
          paidAmount: existing.paidAmount,
          remainingAmount: newRemaining,
          startDate: data.startDate || existing.startDate,
          walletId: data.walletId || existing.walletId,
          status: newStatus,
          repayments: existing.repayments || [],
        };
        const dueDate = data.dueDate !== undefined ? data.dueDate : existing.dueDate;
        if (dueDate && dueDate.trim()) {
          payload.dueDate = dueDate.trim();
        }
        const note = data.note !== undefined ? data.note : existing.note;
        if (note && note.trim()) {
          payload.note = note.trim();
        }

        await updateDoc(doc(db, 'users', user.uid, 'loans', id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
        throw err;
      }
    },
    [user, loans]
  );

  const handleDeleteLoan = useCallback(
    async (id: string) => {
      if (!user) return;
      const path = `users/${user.uid}/loans/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'loans', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
        throw err;
      }
    },
    [user]
  );

  const handleAddLoanRepayment = useCallback(
    async (loanId: string, repaymentData: Omit<LoanRepayment, 'id' | 'createdAt'>) => {
      if (!user) return;
      const path = `users/${user.uid}/loans/${loanId}`;
      try {
        const loan = loans.find((l) => l.id === loanId);
        if (!loan) throw new Error('Loan not found');

        const newRepayment: LoanRepayment = {
          id: Math.random().toString(36).substring(2, 11),
          amount: repaymentData.amount,
          date: repaymentData.date,
          walletId: repaymentData.walletId || loan.walletId,
          createdAt: new Date().toISOString(),
        };
        if (repaymentData.note && repaymentData.note.trim()) {
          newRepayment.note = repaymentData.note.trim();
        }

        const updatedRepayments = [...(loan.repayments || []), newRepayment];
        const newPaidAmount = updatedRepayments.reduce((sum, r) => sum + r.amount, 0);
        const newRemaining = Math.max(0, loan.amount - newPaidAmount);
        const newStatus: LoanStatus = newRemaining === 0 ? 'completed' : 'partial';

        await updateDoc(doc(db, 'users', user.uid, 'loans', loanId), {
          repayments: updatedRepayments,
          paidAmount: newPaidAmount,
          remainingAmount: newRemaining,
          status: newStatus,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
        throw err;
      }
    },
    [user, loans]
  );

  const handleDeleteLoanRepayment = useCallback(
    async (loanId: string, repaymentId: string) => {
      if (!user) return;
      const path = `users/${user.uid}/loans/${loanId}`;
      try {
        const loan = loans.find((l) => l.id === loanId);
        if (!loan) throw new Error('Loan not found');

        const updatedRepayments = (loan.repayments || []).filter((r) => r.id !== repaymentId);
        const newPaidAmount = updatedRepayments.reduce((sum, r) => sum + r.amount, 0);
        const newRemaining = Math.max(0, loan.amount - newPaidAmount);
        let newStatus: LoanStatus = 'pending';
        if (newRemaining === 0 && loan.amount > 0) {
          newStatus = 'completed';
        } else if (newPaidAmount > 0) {
          newStatus = 'partial';
        }

        await updateDoc(doc(db, 'users', user.uid, 'loans', loanId), {
          repayments: updatedRepayments,
          paidAmount: newPaidAmount,
          remainingAmount: newRemaining,
          status: newStatus,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
        throw err;
      }
    },
    [user, loans]
  );

  // --- Budgets CRUD ---
  const handleAddBudget = useCallback(
    async (data: { category: string; monthlyLimit: number }) => {
      if (!user) return;
      const path = `users/${user.uid}/budgets`;
      try {
        await addDoc(collection(db, 'users', user.uid, 'budgets'), {
          category: data.category.trim(),
          monthlyLimit: data.monthlyLimit,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
        throw err;
      }
    },
    [user]
  );

  const handleEditBudget = useCallback(
    async (id: string, data: { category?: string; monthlyLimit?: number }) => {
      if (!user) return;
      const path = `users/${user.uid}/budgets/${id}`;
      try {
        const payload: Record<string, any> = {};
        if (data.category !== undefined) payload.category = data.category.trim();
        if (data.monthlyLimit !== undefined) payload.monthlyLimit = data.monthlyLimit;
        await updateDoc(doc(db, 'users', user.uid, 'budgets', id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
        throw err;
      }
    },
    [user]
  );

  const handleDeleteBudget = useCallback(
    async (id: string) => {
      if (!user) return;
      const path = `users/${user.uid}/budgets/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'budgets', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
        throw err;
      }
    },
    [user]
  );

  // --- Recurring Transactions CRUD ---
  const handleAddRecurring = useCallback(
    async (data: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
      if (!user) return;
      const path = `users/${user.uid}/recurring`;
      try {
        const payload: Record<string, any> = {
          type: data.type,
          title: data.title.trim(),
          amount: data.amount,
          category: data.category.trim(),
          walletId: data.walletId,
          frequency: data.frequency,
          nextDueDate: data.nextDueDate,
          isActive: data.isActive,
          createdAt: new Date().toISOString(),
        };
        if (data.note && data.note.trim()) {
          payload.note = data.note.trim();
        }
        await addDoc(collection(db, 'users', user.uid, 'recurring'), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
        throw err;
      }
    },
    [user]
  );

  const handleEditRecurring = useCallback(
    async (id: string, data: Partial<Omit<RecurringTransaction, 'id' | 'createdAt'>>) => {
      if (!user) return;
      const path = `users/${user.uid}/recurring/${id}`;
      try {
        const payload: Record<string, any> = { ...data };
        if (payload.title !== undefined) payload.title = String(payload.title).trim();
        if (payload.category !== undefined) payload.category = String(payload.category).trim();
        if (payload.note !== undefined) payload.note = String(payload.note).trim();
        await updateDoc(doc(db, 'users', user.uid, 'recurring', id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
        throw err;
      }
    },
    [user]
  );

  const handleDeleteRecurring = useCallback(
    async (id: string) => {
      if (!user) return;
      const path = `users/${user.uid}/recurring/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'recurring', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
        throw err;
      }
    },
    [user]
  );

  const handleRecordRecurringNow = useCallback(
    async (item: RecurringTransaction) => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const txPayload = {
        title: item.title,
        amount: item.amount,
        category: item.category,
        date: today,
        walletId: item.walletId,
        note: item.note || undefined,
      };
      if (item.type === 'income') {
        await addDoc(collection(db, 'users', user.uid, 'incomes'), {
          ...txPayload,
          createdAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, 'users', user.uid, 'expenses'), {
          ...txPayload,
          createdAt: new Date().toISOString(),
        });
      }

      // Advance nextDueDate based on frequency
      const base = new Date((item.nextDueDate || today) + 'T00:00:00');
      if (item.frequency === 'weekly') {
        base.setDate(base.getDate() + 7);
      } else if (item.frequency === 'yearly') {
        base.setFullYear(base.getFullYear() + 1);
      } else {
        base.setMonth(base.getMonth() + 1);
      }
      const nextDate = base.toISOString().split('T')[0];
      await updateDoc(doc(db, 'users', user.uid, 'recurring', item.id), {
        nextDueDate: nextDate,
      });
    },
    [user]
  );

  // --- Savings Goals CRUD ---
  const handleAddSavingsGoal = useCallback(
    async (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
      if (!user) return;
      const path = `users/${user.uid}/savingsGoals`;
      try {
        const payload: Record<string, any> = {
          title: data.title.trim(),
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount || 0,
          createdAt: new Date().toISOString(),
        };
        if (data.targetDate && data.targetDate.trim()) payload.targetDate = data.targetDate.trim();
        if (data.walletId && data.walletId.trim()) payload.walletId = data.walletId.trim();
        if (data.note && data.note.trim()) payload.note = data.note.trim();
        await addDoc(collection(db, 'users', user.uid, 'savingsGoals'), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
        throw err;
      }
    },
    [user]
  );

  const handleEditSavingsGoal = useCallback(
    async (id: string, data: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => {
      if (!user) return;
      const path = `users/${user.uid}/savingsGoals/${id}`;
      try {
        const payload: Record<string, any> = { ...data };
        if (payload.title !== undefined) payload.title = String(payload.title).trim();
        if (payload.note !== undefined) payload.note = String(payload.note).trim();
        await updateDoc(doc(db, 'users', user.uid, 'savingsGoals', id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
        throw err;
      }
    },
    [user]
  );

  const handleDeleteSavingsGoal = useCallback(
    async (id: string) => {
      if (!user) return;
      const path = `users/${user.uid}/savingsGoals/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'savingsGoals', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
        throw err;
      }
    },
    [user]
  );

  const handleAddSavingsContribution = useCallback(
    async (id: string, addAmount: number) => {
      if (!user) return;
      const goal = savingsGoals.find((g) => g.id === id);
      if (!goal) return;
      const path = `users/${user.uid}/savingsGoals/${id}`;
      try {
        const nextAmount = Math.max(0, goal.currentAmount + addAmount);
        await updateDoc(doc(db, 'users', user.uid, 'savingsGoals', id), {
          currentAmount: nextAmount,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
        throw err;
      }
    },
    [user, savingsGoals]
  );

  return {
    profile,
    categories,
    wallets,
    transfers,
    incomes,
    expenses,
    loans,
    budgets,
    recurring,
    savingsGoals,
    dataLoading,
    dbError,
    handleAddIncome,
    handleEditIncome,
    handleDeleteIncome,
    handleAddExpense,
    handleEditExpense,
    handleDeleteExpense,
    handleAddCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleAddWallet,
    handleEditWallet,
    handleDeleteWallet,
    handleAddTransfer,
    handleDeleteTransfer,
    handleUpdateProfile,
    handleAddLoan,
    handleEditLoan,
    handleDeleteLoan,
    handleAddLoanRepayment,
    handleDeleteLoanRepayment,
    handleAddBudget,
    handleEditBudget,
    handleDeleteBudget,
    handleAddRecurring,
    handleEditRecurring,
    handleDeleteRecurring,
    handleRecordRecurringNow,
    handleAddSavingsGoal,
    handleEditSavingsGoal,
    handleDeleteSavingsGoal,
    handleAddSavingsContribution,
  };
}

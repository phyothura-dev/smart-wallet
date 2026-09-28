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
import type { UserProfile, Category, Income, Expense, Wallet, Transfer } from '../types';

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

    const checkLoadingFinished = () => {
      if (
        loadedProfile &&
        loadedCategories &&
        loadedWallets &&
        loadedIncomes &&
        loadedExpenses &&
        loadedTransfers
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
            name: data.name,
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

  return {
    profile,
    categories,
    wallets,
    transfers,
    incomes,
    expenses,
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
  };
}

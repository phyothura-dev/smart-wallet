import React from 'react';
import { Expense, Category, UserProfile, Wallet } from '../types';
import TransactionRecordManager from './TransactionRecordManager';

interface ExpenseManagerProps {
  expenses: Expense[];
  categories: Category[];
  wallets?: Wallet[];
  profile?: UserProfile | null;
  onAddExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onEditExpense: (id: string, data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function ExpenseManager({
  expenses,
  categories,
  wallets = [],
  profile,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onShowToast,
}: ExpenseManagerProps) {
  return (
    <TransactionRecordManager
      type="expense"
      items={expenses}
      categories={categories}
      wallets={wallets}
      profile={profile}
      onAddItem={onAddExpense}
      onEditItem={onEditExpense}
      onDeleteItem={onDeleteExpense}
      onShowToast={onShowToast}
    />
  );
}

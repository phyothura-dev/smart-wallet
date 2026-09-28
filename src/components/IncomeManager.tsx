import React from 'react';
import { Income, Category, UserProfile, Wallet } from '../types';
import TransactionRecordManager from './TransactionRecordManager';

interface IncomeManagerProps {
  incomes: Income[];
  categories: Category[];
  wallets?: Wallet[];
  profile?: UserProfile | null;
  onAddIncome: (data: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  onEditIncome: (id: string, data: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function IncomeManager({
  incomes,
  categories,
  wallets = [],
  profile,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
  onShowToast,
}: IncomeManagerProps) {
  return (
    <TransactionRecordManager
      type="income"
      items={incomes}
      categories={categories}
      wallets={wallets}
      profile={profile}
      onAddItem={onAddIncome}
      onEditItem={onEditIncome}
      onDeleteItem={onDeleteIncome}
      onShowToast={onShowToast}
    />
  );
}

import { Transaction, Wallet, getWalletLabel } from '../types';

// export transactions to excel-compatible csv
export function exportTransactionsToCSV(
  transactions: Transaction[],
  wallets: Wallet[],
  currencySymbol = 'Ks'
) {
  if (transactions.length === 0) return;

  const getWalletName = (wId?: string) => {
    if (!wId) {
      const def = wallets[0];
      return def ? getWalletLabel(def.type, def.name) : 'ပင်မ ပိုက်ဆံအိတ်';
    }
    const found = wallets.find((w) => w.id === wId);
    return found ? getWalletLabel(found.type, found.name) : 'အမည်မသိ';
  };

  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headers = [
    'စဉ်',
    'ရက်စွဲ',
    'အမျိုးအစား',
    'ခေါင်းစဉ်',
    'ခေါင်းစဉ်အုပ်စု',
    'ပိုက်ဆံအိတ် / အကောင့်',
    `ဝင်ငွေ (${currencySymbol.trim()})`,
    `ထွက်ငွေ (${currencySymbol.trim()})`,
    `အသားတင်ငွေ (${currencySymbol.trim()})`,
  ];

  let totalIncome = 0;
  let totalExpense = 0;

  const rows = transactions.map((tx, idx) => {
    const isIncome = tx.type === 'income';
    const incomeAmount = isIncome ? tx.amount : 0;
    const expenseAmount = !isIncome ? tx.amount : 0;
    const netAmount = isIncome ? tx.amount : -tx.amount;

    totalIncome += incomeAmount;
    totalExpense += expenseAmount;

    return [
      escapeCSV(idx + 1),
      escapeCSV(tx.date),
      escapeCSV(isIncome ? 'ဝင်ငွေ' : 'ထွက်ငွေ'),
      escapeCSV(tx.title),
      escapeCSV(tx.category),
      escapeCSV(getWalletName(tx.walletId)),
      escapeCSV(incomeAmount > 0 ? incomeAmount : ''),
      escapeCSV(expenseAmount > 0 ? expenseAmount : ''),
      escapeCSV(netAmount),
    ].join(',');
  });

  // summary rows
  const emptyRow = ['""', '""', '""', '""', '""', '""', '""', '""', '""'].join(',');
  const summaryIncomeRow = [
    '""',
    '""',
    escapeCSV('စုစုပေါင်း ဝင်ငွေ'),
    '""',
    '""',
    '""',
    escapeCSV(totalIncome),
    '""',
    '""',
  ].join(',');
  const summaryExpenseRow = [
    '""',
    '""',
    escapeCSV('စုစုပေါင်း ထွက်ငွေ'),
    '""',
    '""',
    '""',
    '""',
    escapeCSV(totalExpense),
    '""',
  ].join(',');
  const summaryNetRow = [
    '""',
    '""',
    escapeCSV('အသားတင် လက်ကျန်ငွေ'),
    '""',
    '""',
    '""',
    '""',
    '""',
    escapeCSV(totalIncome - totalExpense),
  ].join(',');

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows,
    emptyRow,
    summaryIncomeRow,
    summaryExpenseRow,
    summaryNetRow,
  ].join('\r\n');

  // utf-8 bom for excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const now = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SmartWallet_Transactions_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

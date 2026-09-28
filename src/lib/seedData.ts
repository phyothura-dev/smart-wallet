import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export const DEFAULT_CATEGORIES = [
  { name: 'လစာ', type: 'income' as const },
  { name: 'အလွတ်တန်းလုပ်ငန်း', type: 'income' as const },
  { name: 'အပိုဆုကြေး', type: 'income' as const },
  { name: 'စားသောက်စရိတ်', type: 'expense' as const },
  { name: 'လမ်းစရိတ်', type: 'expense' as const },
  { name: 'စျေးဝယ်ခြင်း', type: 'expense' as const },
  { name: 'မီတာနှင့် ဘေလ်များ', type: 'expense' as const },
  { name: 'အပန်းဖြေစရိတ်', type: 'expense' as const },
];

export const DEFAULT_WALLETS = [
  { type: 'cash' as const, initialBalance: 0 },
  { type: 'kbz_pay' as const, initialBalance: 0 },
  { type: 'wave_pay' as const, initialBalance: 0 },
  { type: 'aya_pay' as const, initialBalance: 0 },
  { type: 'cb_pay' as const, initialBalance: 0 },
  { type: 'uab_pay' as const, initialBalance: 0 },
  { type: 'kbz_bank' as const, initialBalance: 0 },
  { type: 'yoma_bank' as const, initialBalance: 0 },
];

// seed initial user data
export async function seedNewUserData(
  userId: string,
  profileData?: {
    fullName?: string;
    email?: string;
    photoURL?: string;
    currency?: string;
  }
) {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // setup profile
  const userRef = doc(db, 'users', userId);
  const fullName = profileData?.fullName || 'Finance Member';
  const email = profileData?.email || '';
  const photoURL =
    profileData?.photoURL ||
    `https://api.dicebear.com/10.x/micah/svg?seed=${encodeURIComponent(email || fullName || 'User')}`;
  const currency = profileData?.currency || 'Ks';

  batch.set(
    userRef,
    {
      fullName,
      photoURL,
      currency,
      monthlyIncomeGoal: null,
      email,
    },
    { merge: true }
  );

  // default categories
  for (const cat of DEFAULT_CATEGORIES) {
    const catId = cat.name.toLowerCase().replace(/\s+/g, '-');
    const catRef = doc(db, 'users', userId, 'categories', catId);
    batch.set(catRef, {
      name: cat.name,
      type: cat.type,
    });
  }

  // default wallets
  for (const w of DEFAULT_WALLETS) {
    const walletRef = doc(db, 'users', userId, 'wallets', w.type);
    batch.set(walletRef, {
      type: w.type,
      initialBalance: w.initialBalance,
      createdAt: now,
    });
  }

  // commit batch
  await batch.commit();
}

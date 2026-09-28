import React, { useState, useEffect } from 'react';
import { User, Award, Check, RefreshCw, Dices } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileManagerProps {
  profile: UserProfile | null;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

// normalize avatar to micah
const normalizeToMicah = (url?: string, name?: string): string => {
  if (!url) {
    return `https://api.dicebear.com/10.x/micah/svg?seed=${encodeURIComponent(name || 'Felix')}`;
  }
  if (url.includes('api.dicebear.com') && (url.includes('adventurer') || url.includes('initials') || url.includes('7.x'))) {
    const match = url.match(/seed=([^&]+)/);
    const seed = match ? match[1] : encodeURIComponent(name || 'Felix');
    return `https://api.dicebear.com/10.x/micah/svg?seed=${seed}`;
  }
  return url;
};

export default function ProfileManager({
  profile,
  onUpdateProfile,
  onShowToast,
}: ProfileManagerProps) {
  // form state
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [photoURL, setPhotoURL] = useState(() =>
    normalizeToMicah(profile?.photoURL, profile?.fullName)
  );
  const [currency, setCurrency] = useState('Ks');
  const [monthlyGoal, setMonthlyGoal] = useState(
    profile?.monthlyIncomeGoal !== undefined && profile?.monthlyIncomeGoal !== null
      ? profile.monthlyIncomeGoal.toString()
      : ''
  );
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhotoURL(normalizeToMicah(profile.photoURL, profile.fullName));
      setCurrency(profile.currency || 'Ks');
      setMonthlyGoal(
        profile.monthlyIncomeGoal !== undefined && profile.monthlyIncomeGoal !== null
          ? profile.monthlyIncomeGoal.toString()
          : ''
      );
    }
  }, [profile]);

  // avatar presets
  const avatarPresets = [
    'https://api.dicebear.com/10.x/micah/svg?seed=Felix',
    'https://api.dicebear.com/10.x/micah/svg?seed=Aneka',
    'https://api.dicebear.com/10.x/micah/svg?seed=Jack',
    'https://api.dicebear.com/10.x/micah/svg?seed=Luna',
    'https://api.dicebear.com/10.x/micah/svg?seed=Aria',
    'https://api.dicebear.com/10.x/micah/svg?seed=Cody',
    'https://api.dicebear.com/10.x/micah/svg?seed=Mimi',
    'https://api.dicebear.com/10.x/micah/svg?seed=' + encodeURIComponent(fullName.trim() || 'User'),
  ];

  const handleRandomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    setPhotoURL(`https://api.dicebear.com/10.x/micah/svg?seed=${randomSeed}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      onShowToast('အမည်ထည့်သွင်းရန် လိုအပ်ပါသည်။', 'error');
      return;
    }

    let parsedGoal: number | null = null;
    if (monthlyGoal.trim() !== '') {
      parsedGoal = parseFloat(monthlyGoal);
      if (isNaN(parsedGoal) || parsedGoal < 0) {
        onShowToast('လစဉ်ဝင်ငွေ ရည်မှန်းချက်သည် အပေါင်းကိန်း ဖြစ်ရပါမည်။', 'error');
        return;
      }
      parsedGoal = parsedGoal > 0 ? parsedGoal : null;
    }

    setIsSaving(true);
    try {
      await onUpdateProfile({
        fullName: fullName.trim(),
        photoURL,
        currency,
        monthlyIncomeGoal: parsedGoal,
      });
      onShowToast('ပရိုဖိုင် အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။', 'success');
    } catch {
      onShowToast('ပရိုဖိုင် ပြင်ဆင်ခြင်း မအောင်မြင်ပါ။', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* profile form */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* avatar picker */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
              ပရိုဖိုင်ပုံ ရွေးချယ်ပါ
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative group">
                <img
                  id="profile-preview-avatar"
                  src={photoURL || `https://api.dicebear.com/10.x/micah/svg?seed=${encodeURIComponent(fullName || 'User')}`}
                  referrerPolicy="no-referrer"
                  alt="Current profile"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-blue-100 bg-slate-50 object-cover flex-shrink-0 shadow-xs"
                />
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                  {avatarPresets.map((preset, idx) => {
                    const isSelected = photoURL === preset;
                    return (
                      <button
                        id={`btn-preset-avatar-${idx}`}
                        key={preset}
                        type="button"
                        onClick={() => setPhotoURL(preset)}
                        className={`relative rounded-full overflow-hidden border-2 w-10 h-10 hover:opacity-90 transition-all cursor-pointer bg-slate-50 ${
                          isSelected ? 'border-[#2563EB] scale-105 shadow-xs ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'
                        }`}
                        title="Micah ပုံစံ ရွေးချယ်ရန်"
                      >
                        <img src={preset} alt="preset" referrerPolicy="no-referrer" className="object-cover w-full h-full" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#2563EB]/25 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white font-bold" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  <button
                    id="btn-random-micah-avatar"
                    type="button"
                    onClick={handleRandomizeAvatar}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/60 hover:bg-blue-50 text-blue-600 text-xs font-medium transition-colors cursor-pointer"
                    title="DiceBear Micah ကျပန်းပုံစံ အသစ်ထုတ်ရန်"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>ကျပန်းပုံစံ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* form details */}
          <div className="space-y-4">
            {/* full name */}
            <div>
              <label htmlFor="p-fullName" className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                အမည် အပြည့်အစုံ
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 sm:top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="p-fullName"
                  type="text"
                  required
                  placeholder="ဦးမောင်မောင်"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              {/* monthly income goal */}
              <div>
                <label htmlFor="p-monthlyGoal" className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  လစဉ် အသားတင်ဝင်ငွေ ရည်မှန်းချက် (Ks)
                </label>
                <div className="relative">
                  <Award className="absolute left-3.5 top-3 sm:top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="p-monthlyGoal"
                    type="number"
                    placeholder="ဥပမာ - ၁,၀၀၀,၀၀၀"
                    value={monthlyGoal}
                    onChange={(e) => setMonthlyGoal(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  လစဉ် ကုန်ကျစရိတ်များ နုတ်ပြီးနောက် အသားတင် ရှာဖွေစုဆောင်းလိုသော ပစ်မှတ်ဝင်ငွေ (Net Amount = ဝင်ငွေ - ထွက်ငွေ) ကို သတ်မှတ်ပါ (ဗလာထားပါက ရည်မှန်းချက် ပယ်ဖျက်ပါမည်)။
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              id="btn-save-profile"
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#2563EB] text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer min-h-[44px]"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              သိမ်းဆည်းမည်
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

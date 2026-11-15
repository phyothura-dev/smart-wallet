import React, { useState, useEffect } from 'react';
import { User, Award, Check, RefreshCw, Dices, Sun, Moon, Monitor, Languages, Coins, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { UserProfile } from '../types';
import type { ThemeMode } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  CURRENCY_LIST,
  DEFAULT_EXCHANGE_RATES,
  mergeExchangeRates,
  normalizeCurrencyCode,
  type CurrencyCode,
} from '../utils/currency';
import type { Language } from '../i18n/translations';
import TelegramConnectCard from './TelegramConnectCard';

interface ProfileManagerProps {
  profile: UserProfile | null;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  theme?: ThemeMode;
  onChangeTheme?: (theme: ThemeMode) => void;
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
  theme = 'system',
  onChangeTheme,
}: ProfileManagerProps) {
  const { language, setLanguage, t } = useLanguage();
  const { displayCurrency, setDisplayCurrency, baseCurrencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');

  // form state
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [photoURL, setPhotoURL] = useState(() =>
    normalizeToMicah(profile?.photoURL, profile?.fullName)
  );
  const [currency, setCurrency] = useState<CurrencyCode>(() =>
    normalizeCurrencyCode(profile?.currency)
  );
  const [ratesForm, setRatesForm] = useState<Record<CurrencyCode, string>>(() => {
    const merged = mergeExchangeRates(profile?.exchangeRates);
    return {
      MMK: String(merged.MMK),
      USD: String(merged.USD),
      THB: String(merged.THB),
      SGD: String(merged.SGD),
      EUR: String(merged.EUR),
      JPY: String(merged.JPY),
    };
  });
  const [monthlyGoal, setMonthlyGoal] = useState(
    profile?.monthlyIncomeGoal !== undefined && profile?.monthlyIncomeGoal !== null
      ? profile.monthlyIncomeGoal.toString()
      : ''
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhotoURL(normalizeToMicah(profile.photoURL, profile.fullName));
      setCurrency(normalizeCurrencyCode(profile.currency));
      const merged = mergeExchangeRates(profile.exchangeRates);
      setRatesForm({
        MMK: String(merged.MMK),
        USD: String(merged.USD),
        THB: String(merged.THB),
        SGD: String(merged.SGD),
        EUR: String(merged.EUR),
        JPY: String(merged.JPY),
      });
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
      onShowToast(t.profile.nameRequired, 'error');
      return;
    }

    let parsedGoal: number | null = null;
    if (monthlyGoal.trim() !== '') {
      parsedGoal = parseFloat(monthlyGoal);
      if (isNaN(parsedGoal) || parsedGoal < 0) {
        onShowToast(t.profile.goalPositiveError, 'error');
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
      onShowToast(t.profile.updateSuccess, 'success');
    } catch {
      onShowToast(t.profile.updateError, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRates: Record<string, number> = { MMK: 1 };
    for (const c of CURRENCY_LIST) {
      if (c.code === 'MMK') continue;
      const val = parseFloat(ratesForm[c.code]);
      if (isNaN(val) || val <= 0) {
        onShowToast(t.records.invalidAmount, 'error');
        return;
      }
      parsedRates[c.code] = val;
    }

    setIsSavingCurrency(true);
    try {
      await onUpdateProfile({
        currency,
        exchangeRates: parsedRates,
      });
      setDisplayCurrency(currency);
      onShowToast(t.profile.currencySaved, 'success');
    } catch {
      onShowToast(t.profile.updateError, 'error');
    } finally {
      setIsSavingCurrency(false);
    }
  };

  const handleResetRates = () => {
    setRatesForm({
      MMK: String(DEFAULT_EXCHANGE_RATES.MMK),
      USD: String(DEFAULT_EXCHANGE_RATES.USD),
      THB: String(DEFAULT_EXCHANGE_RATES.THB),
      SGD: String(DEFAULT_EXCHANGE_RATES.SGD),
      EUR: String(DEFAULT_EXCHANGE_RATES.EUR),
      JPY: String(DEFAULT_EXCHANGE_RATES.JPY),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Settings Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <button
          id="tab-settings-profile"
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t.profile.tabProfile}</span>
        </button>
        <button
          id="tab-settings-preferences"
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'preferences'
              ? 'bg-white dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{t.profile.tabPreferences}</span>
        </button>
      </div>

      {activeTab === 'preferences' && (
        <div className="space-y-5">
          {/* Language Selector Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center flex-shrink-0">
                <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.profile.languageTitle}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {[
                { id: 'mm' as Language, label: t.profile.langMyanmar, flag: '🇲🇲' },
                { id: 'en' as Language, label: t.profile.langEnglish, flag: '🇬🇧' },
              ].map((option) => {
                const isSelected = language === option.id;
                return (
                  <button
                    key={option.id}
                    id={`btn-lang-${option.id}`}
                    type="button"
                    onClick={() => setLanguage(option.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs ring-1 ring-blue-600/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base leading-none">{option.flag}</span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Appearance Card */}
          {onChangeTheme && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">{t.profile.themeTitle}</h3>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  { id: 'light' as ThemeMode, label: t.profile.themeLight, icon: Sun },
                  { id: 'dark' as ThemeMode, label: t.profile.themeDark, icon: Moon },
                  { id: 'system' as ThemeMode, label: t.profile.themeSystem, icon: Monitor },
                ].map((option) => {
                  const IconComp = option.icon;
                  const isSelected = theme === option.id;
                  return (
                    <button
                      key={option.id}
                      id={`btn-theme-${option.id}`}
                      type="button"
                      onClick={() => onChangeTheme(option.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs ring-1 ring-blue-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Multi-Currency Card */}
          <form
            onSubmit={handleSaveCurrency}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center flex-shrink-0">
                  <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.profile.currencyTitle}</h3>
              </div>

              <button
                type="button"
                onClick={handleResetRates}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                {t.profile.resetRates}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.profile.baseCurrency}
                </label>
                <select
                  id="select-base-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {language === 'mm' ? c.nameMm : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.profile.displayCurrency}
                </label>
                <select
                  id="select-display-currency"
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {language === 'mm' ? c.nameMm : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                {t.profile.exchangeRates}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CURRENCY_LIST.filter((c) => c.code !== 'MMK').map((c) => (
                  <div key={c.code} className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-2.5 py-1.5">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-9 flex-shrink-0">{c.code}</span>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      value={ratesForm[c.code]}
                      onChange={(e) =>
                        setRatesForm((prev) => ({ ...prev, [c.code]: e.target.value }))
                      }
                      className="w-full bg-transparent text-right text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                id="btn-save-currency"
                type="submit"
                disabled={isSavingCurrency}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2563EB] text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSavingCurrency ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {t.profile.saveCurrency}
              </button>
            </div>
          </form>

          {/* Telegram Bot Connect Card */}
          <TelegramConnectCard profile={profile} onShowToast={onShowToast} />
        </div>
      )}

      {/* profile form */}
      {activeTab === 'profile' && (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* avatar picker */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              {t.profile.avatarLabel}
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative group">
                <img
                  id="profile-preview-avatar"
                  src={photoURL || `https://api.dicebear.com/10.x/micah/svg?seed=${encodeURIComponent(fullName || 'User')}`}
                  referrerPolicy="no-referrer"
                  alt="Current profile"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-blue-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 object-cover flex-shrink-0 shadow-xs"
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
                        className={`relative rounded-full overflow-hidden border-2 w-10 h-10 hover:opacity-90 transition-all cursor-pointer bg-slate-50 dark:bg-slate-800 ${
                          isSelected ? 'border-[#2563EB] scale-105 shadow-xs ring-2 ring-blue-200 dark:ring-blue-900' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors cursor-pointer"
                    title="DiceBear Micah ကျပန်းပုံစံ အသစ်ထုတ်ရန်"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>{t.profile.randomAvatar}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* form details */}
          <div className="space-y-4">
            {/* full name */}
            <div>
              <label htmlFor="p-fullName" className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                {t.profile.fullNameLabel}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 sm:top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="p-fullName"
                  type="text"
                  required
                  placeholder={t.profile.fullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
                />
              </div>
            </div>

            <div>
              {/* monthly income goal */}
              <div>
                <label htmlFor="p-monthlyGoal" className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.profile.monthlyGoalLabel}
                </label>
                <div className="relative">
                  <Award className="absolute left-3.5 top-3 sm:top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="p-monthlyGoal"
                    type="number"
                    placeholder={t.profile.monthlyGoalPlaceholder}
                    value={monthlyGoal}
                    onChange={(e) => setMonthlyGoal(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              id="btn-save-profile"
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#2563EB] text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer min-h-[44px]"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {t.profile.saveProfile}
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Send, Copy, Check, Unlink, RefreshCw, ExternalLink } from 'lucide-react';
import { auth } from '../lib/firebase';
import type { UserProfile } from '../types';

interface TelegramConnectCardProps {
  profile: UserProfile | null;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

interface LinkCodeResponse {
  code: string;
  expiresAt: number;
  botUsername: string | null;
  deepLink: string | null;
}

export default function TelegramConnectCard({
  profile,
  onShowToast,
}: TelegramConnectCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [linkData, setLinkData] = useState<LinkCodeResponse | null>(null);
  const [copiedField, setCopiedField] = useState<'code' | 'cmd' | null>(null);

  const isConnected = Boolean(profile?.telegramChatId);

  const getIdToken = async (): Promise<string> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('အကောင့်ဝင်ထားရန် လိုအပ်ပါသည်။');
    }
    return currentUser.getIdToken();
  };

  const handleGenerateCode = async () => {
    setIsLoading(true);
    try {
      const token = await getIdToken();
      const response = await fetch('/api/telegram-link', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('API endpoint မတွေ့ပါ (Vercel သို့မဟုတ် vercel dev ဖြင့် run ရန်လိုအပ်ပါသည်)။');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Link code ထုတ်ယူခြင်း မအောင်မြင်ပါ။');
      }

      setLinkData(data as LinkCodeResponse);
      onShowToast('Telegram ချိတ်ဆက်ရန် Code ထုတ်ပြီးပါပြီ (၁၀ မိနစ်အတွင်း အသုံးပြုပါ)။', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Telegram ချိတ်ဆက်မှု မအောင်မြင်ပါ။';
      onShowToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const token = await getIdToken();
      const response = await fetch('/api/telegram-link', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('ချိတ်ဆက်မှု ဖြုတ်ခြင်း မအောင်မြင်ပါ။');
      }

      setLinkData(null);
      onShowToast('Telegram ချိတ်ဆက်မှု ဖြုတ်ပြီးပါပြီ။', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ချိတ်ဆက်မှု ဖြုတ်ခြင်း မအောင်မြင်ပါ။';
      onShowToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, field: 'code' | 'cmd') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      onShowToast('Copy ကူးယူခြင်း မအောင်မြင်ပါ။', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center flex-shrink-0">
            <Send className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Telegram Bot ချိတ်ဆက်မှု
              </h3>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3 h-3" />
                  ချိတ်ဆက်ပြီး
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  မချိတ်ဆက်ရသေးပါ
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Telegram မှတဆင့် ဝင်ငွေ/အသုံးစရိတ် အမြန်မှတ်တမ်းတင်ပြီး လက်ကျန်ငွေများ စစ်ဆေးနိုင်ပါသည်
            </p>
          </div>
        </div>
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">ချိတ်ဆက်ထားသော Telegram</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {profile?.telegramUsername ? `@${profile.telegramUsername}` : `Chat ID: ${profile?.telegramChatId}`}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-200">အသုံးပြုနိုင်သော Commands များ:</p>
              <p>
                <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">/expense 5000 Coffee</code>{' '}
                · <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">/income 300000 Salary</code>{' '}
                · <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">/balance</code>{' '}
                · <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">/summary</code>
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              id="btn-disconnect-telegram"
              type="button"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
              ချိတ်ဆက်မှု ဖြုတ်မည်
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {linkData ? (
            <div className="rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-sky-900 dark:text-sky-200">
                    သင့် Telegram ချိတ်ဆက်ရန် Code (၁၀ မိနစ် သက်တမ်း)
                  </p>
                  <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5">
                    Telegram Bot ထဲသို့ အောက်ပါ command ကို ပို့ပေးပါ:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold tracking-widest px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-700 text-slate-900 dark:text-slate-100">
                    {linkData.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(linkData.code, 'code')}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Code ကူးယူရန်"
                  >
                    {copiedField === 'code' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(`/link ${linkData.code}`, 'cmd')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {copiedField === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <code>/link {linkData.code}</code> ကူးယူမည်
                </button>

                {linkData.deepLink && (
                  <a
                    href={linkData.deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Telegram Bot ဖွင့်မည်
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100/70 dark:hover:bg-sky-900/40 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Code အသစ်ထုတ်မည်
                </button>
              </div>
            </div>
          ) : (
            <button
              id="btn-connect-telegram"
              type="button"
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 min-h-[42px]"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Connect Telegram
            </button>
          )}
        </div>
      )}
    </div>
  );
}

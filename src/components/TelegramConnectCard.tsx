import React, { useState } from 'react';
import { Send, Copy, Check, Unlink, RefreshCw, ExternalLink } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [linkData, setLinkData] = useState<LinkCodeResponse | null>(null);
  const [copiedField, setCopiedField] = useState<'code' | 'cmd' | null>(null);

  const isConnected = Boolean(profile?.telegramChatId);

  const getIdToken = async (): Promise<string> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error(t.telegram.loginRequired);
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
        throw new Error(t.telegram.apiNotFound);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t.telegram.codeFailed);
      }

      setLinkData(data as LinkCodeResponse);
      onShowToast(t.telegram.codeGenerated, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : t.telegram.codeFailed;
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
        throw new Error(t.telegram.disconnectFailed);
      }

      setLinkData(null);
      onShowToast(t.telegram.disconnectSuccess, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : t.telegram.disconnectFailed;
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
      onShowToast(t.telegram.copyFailed, 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Icon + Title + Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {t.telegram.title}
            </h3>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3 h-3" />
                {profile?.telegramUsername ? `@${profile.telegramUsername}` : t.telegram.connectedBadge}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {t.telegram.notConnectedBadge}
              </span>
            )}
          </div>
        </div>

        {/* Right: Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          {isConnected ? (
            <button
              id="btn-disconnect-telegram"
              type="button"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
              {t.telegram.disconnectBtn}
            </button>
          ) : linkData ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-mono text-sm font-bold tracking-widest text-slate-900 dark:text-slate-100">
                  {linkData.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(linkData.code, 'code')}
                  className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  title={t.telegram.copyCode}
                >
                  {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {linkData.deepLink && (
                <a
                  href={linkData.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t.telegram.connectBtn}
                </a>
              )}

              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60"
                title={t.telegram.newCode}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </>
          ) : (
            <button
              id="btn-connect-telegram"
              type="button"
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {t.telegram.connectBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

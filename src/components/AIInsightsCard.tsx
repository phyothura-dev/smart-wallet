import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Lightbulb } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';

interface AIInsight {
  month: string;
  language: 'mm' | 'en';
  healthScore: number;
  summary: string;
  warnings: string[];
  tips: string[];
  generatedAt: string;
}

interface AIInsightsCardProps {
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function AIInsightsCard({ onShowToast }: AIInsightsCardProps) {
  const { language, t } = useLanguage();
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCachedInsight = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/ai-insights?lang=${language}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) return;
      const data = await res.json();
      if (data.insight) {
        setInsight(data.insight as AIInsight);
      } else {
        setInsight(null);
      }
    } catch {
      // ignore initial cache fetch errors (e.g., local Vite without Vercel API)
    }
  }, [language]);

  useEffect(() => {
    loadCachedInsight();
  }, [loadCachedInsight]);

  const handleGenerate = async (forceRefresh = false) => {
    const user = auth.currentUser;
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language, forceRefresh }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('API endpoint not available (use Vercel or vercel dev).');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.common.error);
      }

      setInsight(data.insight as AIInsight);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.common.error;
      onShowToast?.(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const scoreColor =
    !insight
      ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
      : insight.healthScore >= 75
      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
      : insight.healthScore >= 50
      ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
      : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';

  return (
    <div
      id="card-ai-insights"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-900/60 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {t.dashboard.aiInsightsTitle}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.dashboard.aiInsightsSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {insight && (
            <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${scoreColor}`}>
              {t.dashboard.aiHealthScore}: {insight.healthScore}/100
            </span>
          )}
          <button
            id="btn-generate-ai-insights"
            type="button"
            onClick={() => handleGenerate(Boolean(insight))}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {insight ? t.dashboard.aiRefresh : t.dashboard.aiGenerate}
          </button>
        </div>
      </div>

      {!insight ? (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.dashboard.aiEmptyPrompt}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800">
            {insight.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insight.warnings.length > 0 && (
              <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/50 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t.dashboard.aiWarnings}
                </div>
                <ul className="space-y-1.5 text-xs text-amber-900/90 dark:text-amber-200/90 list-disc pl-4">
                  {insight.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {insight.tips.length > 0 && (
              <div
                className={`rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-900/50 p-3.5 space-y-2 ${
                  insight.warnings.length === 0 ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Lightbulb className="w-3.5 h-3.5" />
                  {t.dashboard.aiTips}
                </div>
                <ul className="space-y-1.5 text-xs text-emerald-900/90 dark:text-emerald-200/90 list-disc pl-4">
                  {insight.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

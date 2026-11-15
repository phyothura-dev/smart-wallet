import React, { useState } from 'react';
import { Trash2, Edit3, Check, X } from 'lucide-react';
import { Category, CategoryType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (name: string, type: CategoryType) => Promise<void>;
  onRenameCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function CategoryManager({
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onShowToast,
}: CategoryManagerProps) {
  const { language, t } = useLanguage();
  // tab state
  const [activeType, setActiveType] = useState<CategoryType>('income');
  
  // new category state
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // filtered categories
  const filteredCategories = categories.filter((cat) => cat.type === activeType);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      onShowToast(t.records.fillRequired, 'error');
      return;
    }

    // check duplicate name
    const duplicate = categories.some(
      (cat) => cat.type === activeType && cat.name.toLowerCase() === newCatName.trim().toLowerCase()
    );
    if (duplicate) {
      onShowToast(t.categories.duplicateError, 'error');
      return;
    }

    setIsAdding(true);
    try {
      await onAddCategory(newCatName.trim(), activeType);
      onShowToast(t.categories.addSuccess, 'success');
      setNewCatName('');
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveRename = async (id: string) => {
    if (!editingName.trim()) {
      onShowToast(t.records.fillRequired, 'error');
      return;
    }

    // check duplicate
    const duplicate = categories.some(
      (cat) => cat.id !== id && cat.type === activeType && cat.name.toLowerCase() === editingName.trim().toLowerCase()
    );
    if (duplicate) {
      onShowToast(t.categories.duplicateError, 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      await onRenameCategory(id, editingName.trim());
      onShowToast(t.categories.renameSuccess, 'success');
      setEditingId(null);
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await onDeleteCategory(id);
      onShowToast(t.categories.deleteSuccess, 'success');
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* main card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-4 sm:p-5 shadow-2xs">

        {/* toggle tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
          <button
            id="tab-income-categories"
            onClick={() => {
              setActiveType('income');
              setEditingId(null);
            }}
            className={`flex-1 sm:flex-initial pb-3 text-xs sm:text-sm font-medium border-b-2 px-3 sm:px-4 transition-all cursor-pointer text-center min-h-[40px] flex items-center justify-center ${
              activeType === 'income'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.dashboard.incomeLabel}
          </button>
          <button
            id="tab-expense-categories"
            onClick={() => {
              setActiveType('expense');
              setEditingId(null);
            }}
            className={`flex-1 sm:flex-initial pb-3 text-xs sm:text-sm font-medium border-b-2 px-3 sm:px-4 transition-all cursor-pointer text-center min-h-[40px] flex items-center justify-center ${
              activeType === 'expense'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.dashboard.expenseLabel}
          </button>
        </div>

        {/* Create Form */}
        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6 max-w-lg">
          <input
            id="category-input-name"
            type="text"
            required
            placeholder={t.categories.newCategoryPlaceholder}
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3.5 py-2.5 sm:py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors min-h-[42px] sm:min-h-0"
          />
          <button
            id="btn-add-category"
            type="submit"
            disabled={isAdding}
            className="rounded-lg bg-[#2563EB] px-4 py-2.5 sm:py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors focus:outline-none flex-shrink-0 cursor-pointer min-h-[42px] sm:min-h-0 flex items-center justify-center"
          >
            {isAdding ? t.common.saving : `+ ${t.common.add}`}
          </button>
        </form>

        {/* Categories List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            {t.nav.categories}
          </h4>
          
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              {t.categories.noCategories}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 sm:p-3.5 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
                >
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        id={`input-rename-category-${cat.id}`}
                        type="text"
                        required
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-sm sm:text-xs focus:ring-1 focus:ring-blue-500 min-h-[38px] sm:min-h-0"
                      />
                      <button
                        id={`btn-save-rename-${cat.id}`}
                        onClick={() => handleSaveRename(cat.id)}
                        disabled={isSavingEdit}
                        className="p-2 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 focus:outline-none cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-cancel-rename-${cat.id}`}
                        onClick={() => setEditingId(null)}
                        className="p-2 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate pr-2">{cat.name}</span>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          id={`btn-start-rename-${cat.id}`}
                          onClick={() => handleStartEdit(cat)}
                          title={t.common.edit}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-trigger-delete-${cat.id}`}
                          onClick={() => setDeletingId(cat.id)}
                          title={t.common.delete}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors focus:outline-none cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {deletingId && (
        <div id="delete-category-confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-fade-in" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/60 text-[#DC2626] dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-[#111827] dark:text-slate-100">{t.categories.deleteConfirm}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {language === 'mm' ? 'ဤခေါင်းစဉ်ကို ဖျက်ပစ်ပါမည်။' : 'This category will be permanently deleted.'}
              </p>
            </div>

            <div className="flex gap-3 w-full justify-center mt-2">
              <button
                id="btn-delete-category-abort"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                id="btn-delete-category-confirm"
                onClick={() => handleDeleteCategory(deletingId)}
                className="flex-1 py-2 rounded-lg bg-[#DC2626] text-sm font-medium text-white hover:bg-[#B91C1C] transition-colors cursor-pointer"
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

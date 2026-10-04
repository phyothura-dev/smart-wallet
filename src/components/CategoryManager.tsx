import React, { useState } from 'react';
import { Trash2, Edit3, Check, X } from 'lucide-react';
import { Category, CategoryType } from '../types';

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

  const getTypeName = (type: CategoryType) => {
    return type === 'income' ? 'ဝင်ငွေ' : 'ထွက်ငွေ';
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      onShowToast('ခေါင်းစဉ်အုပ်စု အမည် ထည့်သွင်းပေးပါ။', 'error');
      return;
    }

    // check duplicate name
    const duplicate = categories.some(
      (cat) => cat.type === activeType && cat.name.toLowerCase() === newCatName.trim().toLowerCase()
    );
    if (duplicate) {
      onShowToast(`"${newCatName.trim()}" အမည်ဖြင့် ${getTypeName(activeType)} ခေါင်းစဉ်အုပ်စု ရှိပြီးသားဖြစ်ပါသည်။`, 'error');
      return;
    }

    setIsAdding(true);
    try {
      await onAddCategory(newCatName.trim(), activeType);
      onShowToast(`"${newCatName.trim()}" ခေါင်းစဉ်အုပ်စု ထည့်သွင်းပြီးပါပြီ။`, 'success');
      setNewCatName('');
    } catch {
      onShowToast('ခေါင်းစဉ်အုပ်စု ထည့်သွင်းခြင်း မအောင်မြင်ပါ။', 'error');
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
      onShowToast('ခေါင်းစဉ်အုပ်စု အမည် ထည့်သွင်းပေးပါ။', 'error');
      return;
    }

    // check duplicate
    const duplicate = categories.some(
      (cat) => cat.id !== id && cat.type === activeType && cat.name.toLowerCase() === editingName.trim().toLowerCase()
    );
    if (duplicate) {
      onShowToast(`"${editingName.trim()}" အမည်ဖြင့် ${getTypeName(activeType)} ခေါင်းစဉ်အုပ်စု ရှိပြီးသားဖြစ်ပါသည်။`, 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      await onRenameCategory(id, editingName.trim());
      onShowToast('ခေါင်းစဉ်အုပ်စု အမည် ပြင်ဆင်ပြီးပါပြီ။', 'success');
      setEditingId(null);
    } catch {
      onShowToast('အမည်ပြင်ဆင်ခြင်း မအောင်မြင်ပါ။', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await onDeleteCategory(id);
      onShowToast('ခေါင်းစဉ်အုပ်စု ဖျက်ပြီးပါပြီ။', 'success');
    } catch {
      onShowToast('ခေါင်းစဉ်အုပ်စု ဖျက်ခြင်း မအောင်မြင်ပါ။', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* main card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4 sm:p-6">

        {/* toggle tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            id="tab-income-categories"
            onClick={() => {
              setActiveType('income');
              setEditingId(null);
            }}
            className={`flex-1 sm:flex-initial pb-3 text-xs sm:text-sm font-medium border-b-2 px-3 sm:px-4 transition-all cursor-pointer text-center min-h-[40px] flex items-center justify-center ${
              activeType === 'income'
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ဝင်ငွေ
          </button>
          <button
            id="tab-expense-categories"
            onClick={() => {
              setActiveType('expense');
              setEditingId(null);
            }}
            className={`flex-1 sm:flex-initial pb-3 text-xs sm:text-sm font-medium border-b-2 px-3 sm:px-4 transition-all cursor-pointer text-center min-h-[40px] flex items-center justify-center ${
              activeType === 'expense'
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ထွက်ငွေ
          </button>
        </div>

        {/* Create Form */}
        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6 max-w-lg">
          <input
            id="category-input-name"
            type="text"
            required
            placeholder="ခေါင်းစဉ်အမည်..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3.5 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white transition-colors min-h-[42px] sm:min-h-0"
          />
          <button
            id="btn-add-category"
            type="submit"
            disabled={isAdding}
            className="rounded-lg bg-[#2563EB] px-4 py-2.5 sm:py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors focus:outline-none flex-shrink-0 cursor-pointer min-h-[42px] sm:min-h-0 flex items-center justify-center"
          >
            {isAdding ? 'ထည့်နေသည်...' : '+ ထည့်မည်'}
          </button>
        </form>

        {/* Categories List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            ခေါင်းစဉ်များ
          </h4>
          
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              ခေါင်းစဉ် မရှိသေးပါ။
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 sm:p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg transition-all"
                >
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        id={`input-rename-category-${cat.id}`}
                        type="text"
                        required
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 text-sm sm:text-xs focus:ring-1 focus:ring-blue-500 min-h-[38px] sm:min-h-0"
                      />
                      <button
                        id={`btn-save-rename-${cat.id}`}
                        onClick={() => handleSaveRename(cat.id)}
                        disabled={isSavingEdit}
                        className="p-2 rounded-md text-emerald-600 hover:bg-emerald-50 focus:outline-none cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-cancel-rename-${cat.id}`}
                        onClick={() => setEditingId(null)}
                        className="p-2 rounded-md text-slate-400 hover:bg-slate-200 focus:outline-none cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-slate-800 truncate pr-2">{cat.name}</span>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          id={`btn-start-rename-${cat.id}`}
                          onClick={() => handleStartEdit(cat)}
                          title="ပြင်ဆင်မည်"
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-trigger-delete-${cat.id}`}
                          onClick={() => setDeletingId(cat.id)}
                          title="ဖျက်မည်"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none cursor-pointer"
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
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs animate-fade-in" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white rounded-xl max-w-sm w-full p-6 border border-slate-200 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-[#DC2626]">
              <Trash2 className="w-5 h-5" />
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-[#111827]">ခေါင်းစဉ် ဖျက်မည်လား?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                ဤခေါင်းစဉ်ကို ဖျက်ပစ်ပါမည်။
              </p>
            </div>

            <div className="flex gap-3 w-full justify-center mt-2">
              <button
                id="btn-delete-category-abort"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                id="btn-delete-category-confirm"
                onClick={() => handleDeleteCategory(deletingId)}
                className="flex-1 py-2 rounded-lg bg-[#DC2626] text-sm font-medium text-white hover:bg-[#B91C1C] transition-colors cursor-pointer"
              >
                ဖျက်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

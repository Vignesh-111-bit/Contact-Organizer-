import React, { useState } from 'react';
import { X, Plus, Trash2, FolderPlus } from 'lucide-react';
import { Department } from '../types/contact.js';

interface CategoryManagerModalProps {
  isOpen: boolean;
  departments: Department[];
  clientCounts: Record<string, number>;
  onClose: () => void;
  onCreateCategory: (name: string, color?: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const COLORS = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  departments,
  clientCounts,
  onClose,
  onCreateCategory,
  onDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreateCategory(newCatName.trim(), selectedColor);
      setNewCatName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Custom Categories & Departments</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organize your GEN11 client accounts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Add New Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. VIP Accounts, Strategic, Retail..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 outline-hidden"
              />
              <button
                type="submit"
                disabled={!newCatName.trim() || isSubmitting}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-1.5 pt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    selectedColor === c ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : ''
                  }`}
                />
              ))}
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Current Categories ({departments.length})
            </h3>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {departments.map((dept) => {
                const count = clientCounts[dept.name] || 0;
                return (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: dept.color || '#4f46e5' }}
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{dept.name}</span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        ({count} {count === 1 ? 'client' : 'clients'})
                      </span>
                    </div>

                    {deletingId === dept.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-md border border-rose-200 dark:border-rose-800">
                        <span className="text-[10px] font-medium text-rose-700 dark:text-rose-300 px-1">Delete?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCategory(dept.id);
                            setDeletingId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(dept.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {departments.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3 text-center">
                  No categories created yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

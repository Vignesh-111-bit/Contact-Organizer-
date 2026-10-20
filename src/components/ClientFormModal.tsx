import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { ClientContact, ClientFormData, ClientStatus, Department } from '../types/contact.js';

interface ClientFormModalProps {
  isOpen: boolean;
  client?: ClientContact | null;
  departments: Department[];
  defaultDepartment?: string;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  client,
  departments,
  defaultDepartment,
  onClose,
  onSubmit,
}) => {
  const initialDept = defaultDepartment || (departments.length > 0 ? departments[0].name : 'Enterprise');

  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    company: '',
    role: '',
    department: initialDept,
    email: '',
    phone: '',
    location: '',
    status: 'active',
    isFavorite: false,
  });

  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptText, setCustomDeptText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (client) {
      const match = departments.some((d) => d.name.toLowerCase() === client.department.toLowerCase());
      setIsCustomDept(!match);
      setCustomDeptText(match ? '' : client.department);
      setFormData({
        name: client.name,
        company: client.company || '',
        role: client.role || '',
        department: client.department,
        email: client.email,
        phone: client.phone,
        location: client.location || '',
        status: client.status,
        isFavorite: client.isFavorite,
      });
    } else {
      const fallback = defaultDepartment || (departments.length > 0 ? departments[0].name : 'Enterprise');
      setIsCustomDept(departments.length === 0);
      setCustomDeptText('');
      setFormData({
        name: '',
        company: '',
        role: '',
        department: fallback,
        email: '',
        phone: '',
        location: '',
        status: 'active',
        isFavorite: false,
      });
    }
    setError(null);
  }, [client, isOpen, departments, defaultDepartment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide the client name.');
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      setError('Please provide at least an email or phone number for the client.');
      return;
    }

    const finalDept = isCustomDept ? customDeptText.trim() || 'General' : formData.department;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        ...formData,
        department: finalDept,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company?.trim() || undefined,
        role: formData.role?.trim() || undefined,
        location: formData.location?.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {client ? 'Edit Client Contact' : 'Add Client Contact'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organize and save client information for GEN11
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Client Name & Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 outline-hidden"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Company / Org
              </label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Acme Health, Vertex Corp"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* Role & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role / Title
              </label>
              <input
                type="text"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. VP Operations, Buyer"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category / Department
              </label>
              {!isCustomDept && departments.length > 0 ? (
                <div className="flex gap-2">
                  <select
                    value={formData.department}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setIsCustomDept(true);
                      } else {
                        setFormData({ ...formData, department: e.target.value });
                      }
                    }}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 outline-hidden"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    <option value="__new__">+ New Category...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDeptText}
                    onChange={(e) => setCustomDeptText(e.target.value)}
                    placeholder="Type new category name..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 outline-hidden"
                  />
                  {departments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomDept(false)}
                      className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg whitespace-nowrap"
                    >
                      Presets
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sarah@clientcorp.com"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Location & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 outline-hidden"
              >
                <option value="active">Active Client</option>
                <option value="prospect">Lead / Prospect</option>
                <option value="onboarding">Onboarding</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Star / Priority Client */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFavorite}
                onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Mark as VIP / Priority Client (Starred)
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              {isSubmitting ? 'Saving...' : client ? 'Update Client' : 'Save Client Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

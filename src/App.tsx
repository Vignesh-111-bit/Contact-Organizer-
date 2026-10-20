import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  UserPlus,
  Building2,
  FolderPlus,
  Download,
  Star,
  Users,
  LayoutGrid,
  List,
  X,
  Phone,
  Mail,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

import { ClientContact, ClientFormData, Department } from './types/contact.js';
import { api } from './services/api.js';
import { copyToClipboard } from './utils/formatters.js';
import { useTheme } from './utils/useTheme.js';

import { ClientCard } from './components/ClientCard.js';
import { ClientDrawer } from './components/ClientDrawer.js';
import { ClientFormModal } from './components/ClientFormModal.js';
import { CategoryManagerModal } from './components/CategoryManagerModal.js';
import { ToastContainer, ToastMessage } from './components/Toast.js';

export default function App() {
  const { isDark, toggleTheme } = useTheme();

  const [clients, setClients] = useState<ClientContact[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & Panels
  const [selectedClient, setSelectedClient] = useState<ClientContact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientContact | null>(null);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Fetch data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      setError(null);
      const [clientList, deptList] = await Promise.all([
        api.getClients(),
        api.getDepartments(),
      ]);
      setClients(clientList);
      setDepartments(deptList);
    } catch (err: any) {
      if (!isSilent) setError(err.message || 'Failed to load client contacts');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  // Multi-user Real-time Live Synchronization
  useEffect(() => {
    fetchData();

    // Re-sync on window focus or visibility change so returning members always see the latest edits
    const handleSync = () => {
      fetchData(true);
    };
    window.addEventListener('focus', handleSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleSync();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Server-Sent Events (SSE) stream for live updates across all members
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/realtime');

      es.onopen = () => {
        setIsLiveConnected(true);
      };

      es.onerror = () => {
        setIsLiveConnected(false);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            setIsLiveConnected(true);
          } else if (data.type === 'client:created') {
            setClients((prev) => {
              if (prev.some((c) => c.id === data.client.id)) return prev;
              return [data.client, ...prev];
            });
          } else if (data.type === 'client:updated') {
            setClients((prev) => prev.map((c) => (c.id === data.client.id ? data.client : c)));
            setSelectedClient((curr) => (curr?.id === data.client.id ? data.client : curr));
          } else if (data.type === 'client:deleted') {
            setClients((prev) => prev.filter((c) => c.id !== data.id));
            setSelectedClient((curr) => (curr?.id === data.id ? null : curr));
          } else if (data.type === 'clients:cleared') {
            setClients([]);
            setSelectedClient(null);
          } else if (data.type === 'category:created') {
            setDepartments((prev) => {
              if (prev.some((d) => d.id === data.department.id)) return prev;
              return [...prev, data.department];
            });
          } else if (data.type === 'category:deleted') {
            setDepartments((prev) => prev.filter((d) => d.id !== data.id));
            fetchData(true);
          }
        } catch {
          // ignore keepalive comments
        }
      };
    } catch (err) {
      console.warn('Realtime connection error:', err);
    }

    return () => {
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (es) es.close();
    };
  }, [fetchData]);

  // Keep selected client updated
  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find((c) => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }
  }, [clients]);

  // Count clients per category
  const clientCounts = useMemo(() => {
    const map: Record<string, number> = {};
    clients.forEach((c) => {
      const dept = c.department || 'General';
      map[dept] = (map[dept] || 0) + 1;
    });
    return map;
  }, [clients]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (favoriteOnly) {
      result = result.filter((c) => c.isFavorite);
    }

    if (selectedDept !== 'all') {
      result = result.filter((c) => c.department.toLowerCase() === selectedDept.toLowerCase());
    }

    if (selectedStatus !== 'all') {
      result = result.filter((c) => c.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company && c.company.toLowerCase().includes(q)) ||
          (c.role && c.role.toLowerCase().includes(q)) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          c.notes.some((n) => n.text.toLowerCase().includes(q))
      );
    }

    return result;
  }, [clients, favoriteOnly, selectedDept, selectedStatus, searchQuery]);

  // Handlers
  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await api.toggleFavorite(id);
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast(updated.isFavorite ? `Starred ${updated.name}` : `Unstarred ${updated.name}`, 'info');
    } catch {
      showToast('Could not update favorite', 'error');
    }
  };

  const handleCopy = async (text: string, label: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await copyToClipboard(text);
    if (ok) showToast(`Copied ${label} to clipboard`, 'success');
  };

  const handleCreateClient = async (data: ClientFormData) => {
    const created = await api.createClient(data);
    setClients((prev) => [created, ...prev]);
    const depts = await api.getDepartments();
    setDepartments(depts);
    showToast(`Added client ${created.name}`, 'success');
  };

  const handleUpdateClient = async (data: ClientFormData) => {
    if (!editingClient) return;
    const updated = await api.updateClient(editingClient.id, data);
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedClient?.id === updated.id) setSelectedClient(updated);
    const depts = await api.getDepartments();
    setDepartments(depts);
    showToast(`Updated ${updated.name}`, 'success');
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const target = clients.find((c) => c.id === id);
      await api.deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      if (selectedClient?.id === id) setSelectedClient(null);
      showToast(`Deleted ${target?.name || 'client'}`, 'info');
    } catch {
      showToast('Failed to delete client', 'error');
    }
  };

  const handleAddNote = async (id: string, text: string) => {
    const updated = await api.addNote(id, text);
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
    setSelectedClient(updated);
    showToast('Note added', 'success');
  };

  const handleDeleteNote = async (id: string, noteId: string) => {
    const updated = await api.deleteNote(id, noteId);
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
    setSelectedClient(updated);
    showToast('Note deleted', 'info');
  };

  const handleCreateCategory = async (name: string, color?: string) => {
    const created = await api.createDepartment(name, color);
    setDepartments((prev) => [...prev, created]);
    showToast(`Created category "${created.name}"`, 'success');
  };

  const handleDeleteCategory = async (id: string) => {
    const target = departments.find((d) => d.id === id);
    await api.deleteDepartment(id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    const refreshed = await api.getClients();
    setClients(refreshed);
    showToast(`Deleted category "${target?.name || ''}"`, 'info');
  };

  const handleExportCsv = () => {
    const url = api.getExportUrl();
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'gen11-clients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported clients to CSV', 'success');
  };

  const activeCount = clients.filter((c) => c.status === 'active').length;
  const favoriteCount = clients.filter((c) => c.isFavorite).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Header with gen11 Logo & Dark Mode Toggle */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand with User-Provided GEN11 Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-700/80 shadow-xs shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/image_43b13472.png"
                alt="GEN11 Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
                GEN11
              </span>
              <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider hidden md:inline">
                Client Contacts
              </span>
              {isLiveConnected && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                  title="Real-time multi-user synchronization active: edits are instantly visible across all members"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Sync</span>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons + Dark mode toggle */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCatManagerOpen(true)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FolderPlus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Categories</span>
            </button>

            {clients.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                title="Download clients as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingClient(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Simple Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Clients</span>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {clients.length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Active Accounts</span>
            <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {activeCount}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Priority (VIP)</span>
            <div className="mt-1 text-2xl font-bold text-amber-500 dark:text-amber-400 font-mono tabular-nums">
              {favoriteCount}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Custom Categories</span>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {departments.length}
            </div>
          </div>
        </div>

        {/* Search & Simple Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients by name, company, email, phone, location..."
                className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* VIP / Priority Filter */}
              <button
                type="button"
                onClick={() => setFavoriteOnly((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  favoriteOnly
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800/80 text-amber-700 dark:text-amber-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>VIP Only</span>
              </button>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-hidden focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="prospect">Leads / Prospects</option>
                <option value="onboarding">Onboarding</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Grid vs Table view toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Grid Cards"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Customizable Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 pb-1">
            <button
              type="button"
              onClick={() => setSelectedDept('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                selectedDept === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Clients ({clients.length})
            </button>
            {departments.map((dept) => {
              const count = clientCounts[dept.name] || 0;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDept(dept.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    selectedDept.toLowerCase() === dept.name.toLowerCase()
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: dept.color || '#4f46e5' }}
                  />
                  <span>{dept.name}</span>
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      selectedDept.toLowerCase() === dept.name.toLowerCase()
                        ? 'text-indigo-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsCatManagerOpen(true)}
              className="px-2.5 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              + Customize Categories
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">{filteredClients.length}</strong> of{' '}
            <span className="font-mono tabular-nums">{clients.length}</span> clients
            {favoriteOnly && ' (VIP Only)'}
            {selectedDept !== 'all' && ` · ${selectedDept}`}
          </div>
          {(searchQuery || selectedDept !== 'all' || selectedStatus !== 'all' || favoriteOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('all');
                setSelectedStatus('all');
                setFavoriteOnly(false);
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs animate-pulse space-y-3">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchData()}
              className="px-3 py-1 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredClients.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto shadow-xs">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {searchQuery || selectedDept !== 'all' || selectedStatus !== 'all' || favoriteOnly
                ? 'No matching clients found'
                : 'No client contacts yet in GEN11'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {searchQuery || selectedDept !== 'all' || selectedStatus !== 'all' || favoriteOnly
                ? 'Try adjusting your search criteria or clearing active filters.'
                : 'Start organizing your company’s client relationships. Click below to add your first client contact.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchQuery || selectedDept !== 'all' || selectedStatus !== 'all' || favoriteOnly ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDept('all');
                    setSelectedStatus('all');
                    setFavoriteOnly(false);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              ) : null}
              <button
                onClick={() => {
                  setEditingClient(null);
                  setIsFormOpen(true);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add First Client</span>
              </button>
            </div>
          </div>
        )}

        {/* Clients Grid View */}
        {!isLoading && !error && filteredClients.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onSelect={(c) => setSelectedClient(c)}
                onToggleFavorite={handleToggleFavorite}
                onCopy={handleCopy}
              />
            ))}
          </div>
        )}

        {/* Clients Table View */}
        {!isLoading && !error && filteredClients.length > 0 && viewMode === 'table' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-10 text-center">★</th>
                    <th className="py-3 px-4">Client Name & Org</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(client.id, e)}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-amber-500"
                        >
                          <Star className={`w-3.5 h-3.5 ${client.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {client.name}
                        </div>
                        {client.company && (
                          <div className="text-slate-500 dark:text-slate-400 text-[11px]">{client.company}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {client.department}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {client.email && <div className="text-slate-600 dark:text-slate-400 truncate max-w-[180px]">{client.email}</div>}
                          {client.phone && <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{client.phone}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {client.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center gap-0.5">
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Client Detail Drawer */}
      <ClientDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEdit={(client) => {
          setSelectedClient(null);
          setEditingClient(client);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteClient}
        onToggleFavorite={handleToggleFavorite}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onCopy={handleCopy}
      />

      {/* Add / Edit Client Modal */}
      <ClientFormModal
        isOpen={isFormOpen}
        client={editingClient}
        departments={departments}
        onClose={() => {
          setIsFormOpen(false);
          setEditingClient(null);
        }}
        onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
      />

      {/* Customizable Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCatManagerOpen}
        departments={departments}
        clientCounts={clientCounts}
        onClose={() => setIsCatManagerOpen(false)}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

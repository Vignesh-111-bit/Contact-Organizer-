import { ClientContact, ClientFormData, Department } from '../types/contact.js';

export const api = {
  async getClients(params?: { search?: string; department?: string; status?: string; favorite?: boolean }): Promise<ClientContact[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.department && params.department !== 'all') query.set('department', params.department);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.favorite) query.set('favorite', 'true');

    const res = await fetch(`/api/clients?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch clients');
    const json = await res.json();
    return json.data || [];
  },

  async createClient(data: ClientFormData): Promise<ClientContact> {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add client');
    }
    const json = await res.json();
    return json.data;
  },

  async updateClient(id: string, data: Partial<ClientFormData>): Promise<ClientContact> {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update client');
    }
    const json = await res.json();
    return json.data;
  },

  async deleteClient(id: string): Promise<void> {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete client');
  },

  async toggleFavorite(id: string): Promise<ClientContact> {
    const res = await fetch(`/api/clients/${id}/favorite`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to update client star');
    const json = await res.json();
    return json.data;
  },

  async addNote(id: string, text: string): Promise<ClientContact> {
    const res = await fetch(`/api/clients/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to add note');
    const json = await res.json();
    return json.data;
  },

  async deleteNote(id: string, noteId: string): Promise<ClientContact> {
    const res = await fetch(`/api/clients/${id}/notes/${noteId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete note');
    const json = await res.json();
    return json.data;
  },

  async getDepartments(): Promise<Department[]> {
    const res = await fetch('/api/departments');
    if (!res.ok) throw new Error('Failed to load categories');
    const json = await res.json();
    return json.data || [];
  },

  async createDepartment(name: string, color?: string): Promise<Department> {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error('Failed to create category');
    const json = await res.json();
    return json.data;
  },

  async deleteDepartment(id: string): Promise<void> {
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete category');
  },

  async clearAllClients(): Promise<void> {
    const res = await fetch('/api/clients/clear', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear contacts');
  },

  getExportUrl(): string {
    return '/api/clients/export';
  }
};

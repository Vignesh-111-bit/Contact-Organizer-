import fs from 'node:fs';
import path from 'node:path';
import { ClientContact, ClientFormData, ClientNote, Department } from '../src/types/contact.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const DEPTS_FILE = path.join(DATA_DIR, 'departments.json');

const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Enterprise', color: '#4f46e5' },
  { id: 'dept-2', name: 'Key Accounts', color: '#0284c7' },
  { id: 'dept-3', name: 'Leads & Prospects', color: '#059669' },
  { id: 'dept-4', name: 'Partners', color: '#d97706' },
];

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveClients(clients: ClientContact[]) {
  ensureDir();
  const tmp = `${CLIENTS_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(clients, null, 2), 'utf-8');
  fs.renameSync(tmp, CLIENTS_FILE);
}

function saveDepartments(depts: Department[]) {
  ensureDir();
  const tmp = `${DEPTS_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(depts, null, 2), 'utf-8');
  fs.renameSync(tmp, DEPTS_FILE);
}

export function readClients(): ClientContact[] {
  ensureDir();
  if (!fs.existsSync(CLIENTS_FILE)) {
    saveClients([]);
    return [];
  }
  try {
    const raw = fs.readFileSync(CLIENTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function readDepartments(): Department[] {
  ensureDir();
  if (!fs.existsSync(DEPTS_FILE)) {
    saveDepartments(INITIAL_DEPARTMENTS);
    return INITIAL_DEPARTMENTS;
  }
  try {
    const raw = fs.readFileSync(DEPTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEPARTMENTS;
  } catch {
    return INITIAL_DEPARTMENTS;
  }
}

export function createDepartment(name: string, color?: string): Department {
  const depts = readDepartments();
  const trimmed = name.trim();
  const existing = depts.find((d) => d.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const newDept: Department = {
    id: `dept-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: trimmed,
    color: color || '#4f46e5',
  };
  depts.push(newDept);
  saveDepartments(depts);
  return newDept;
}

export function deleteDepartment(id: string): boolean {
  const depts = readDepartments();
  const target = depts.find((d) => d.id === id);
  if (!target) return false;

  const filtered = depts.filter((d) => d.id !== id);
  saveDepartments(filtered);

  // Sync clients in that department to first available department or 'General'
  const fallbackDept = filtered.length > 0 ? filtered[0].name : 'General';
  const clients = readClients();
  let updatedAny = false;
  for (const c of clients) {
    if (c.department.toLowerCase() === target.name.toLowerCase()) {
      c.department = fallbackDept;
      updatedAny = true;
    }
  }
  if (updatedAny) {
    saveClients(clients);
  }
  return true;
}

const COLORS = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];

export function getClients(query?: {
  search?: string;
  department?: string;
  status?: string;
  favoriteOnly?: boolean;
}): ClientContact[] {
  let list = readClients();

  if (query?.search && query.search.trim()) {
    const q = query.search.trim().toLowerCase();
    list = list.filter((c) =>
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

  if (query?.department && query.department !== 'all') {
    list = list.filter((c) => c.department.toLowerCase() === query.department!.toLowerCase());
  }

  if (query?.status && query.status !== 'all') {
    list = list.filter((c) => c.status === query.status);
  }

  if (query?.favoriteOnly) {
    list = list.filter((c) => c.isFavorite);
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export function createClient(data: ClientFormData): ClientContact {
  const list = readClients();
  const now = new Date().toISOString();
  const deptName = data.department.trim() || 'General';

  // Ensure department is registered
  createDepartment(deptName);

  const client: ClientContact = {
    id: `cli-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: data.name.trim(),
    company: data.company?.trim() || undefined,
    role: data.role?.trim() || undefined,
    department: deptName,
    email: data.email.trim(),
    phone: data.phone.trim(),
    location: data.location?.trim() || undefined,
    status: data.status || 'active',
    isFavorite: Boolean(data.isFavorite),
    notes: [],
    avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    createdAt: now,
    updatedAt: now,
  };

  list.unshift(client);
  saveClients(list);
  return client;
}

export function updateClient(id: string, data: Partial<ClientFormData>): ClientContact | null {
  const list = readClients();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  if (data.department && data.department.trim()) {
    createDepartment(data.department.trim());
  }

  const existing = list[index];
  const updated: ClientContact = {
    ...existing,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    company: data.company !== undefined ? data.company.trim() || undefined : existing.company,
    role: data.role !== undefined ? data.role.trim() || undefined : existing.role,
    department: data.department !== undefined ? data.department.trim() : existing.department,
    email: data.email !== undefined ? data.email.trim() : existing.email,
    phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
    location: data.location !== undefined ? data.location.trim() || undefined : existing.location,
    status: data.status !== undefined ? data.status : existing.status,
    isFavorite: data.isFavorite !== undefined ? Boolean(data.isFavorite) : existing.isFavorite,
    updatedAt: new Date().toISOString(),
  };

  list[index] = updated;
  saveClients(list);
  return updated;
}

export function deleteClient(id: string): boolean {
  const list = readClients();
  const filtered = list.filter((c) => c.id !== id);
  if (filtered.length === list.length) return false;
  saveClients(filtered);
  return true;
}

export function toggleFavorite(id: string): ClientContact | null {
  const list = readClients();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  list[index].isFavorite = !list[index].isFavorite;
  list[index].updatedAt = new Date().toISOString();
  saveClients(list);
  return list[index];
}

export function addNote(id: string, text: string): ClientContact | null {
  const list = readClients();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const newNote: ClientNote = {
    id: `note-${Date.now()}`,
    text: text.trim(),
    createdAt: now,
  };

  list[index].notes.unshift(newNote);
  list[index].updatedAt = now;
  saveClients(list);
  return list[index];
}

export function deleteNote(id: string, noteId: string): ClientContact | null {
  const list = readClients();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  list[index].notes = list[index].notes.filter((n) => n.id !== noteId);
  list[index].updatedAt = new Date().toISOString();
  saveClients(list);
  return list[index];
}

export function exportCsv(): string {
  const list = readClients();
  const headers = ['Client Name', 'Company', 'Role', 'Department/Category', 'Email', 'Phone', 'Location', 'Status', 'Priority (VIP)'];
  const rows = list.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${(c.company || '').replace(/"/g, '""')}"`,
    `"${(c.role || '').replace(/"/g, '""')}"`,
    `"${c.department.replace(/"/g, '""')}"`,
    `"${c.email.replace(/"/g, '""')}"`,
    `"${c.phone.replace(/"/g, '""')}"`,
    `"${(c.location || '').replace(/"/g, '""')}"`,
    `"${c.status}"`,
    `"${c.isFavorite ? 'Yes' : 'No'}"`
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function clearClients(): void {
  saveClients([]);
}

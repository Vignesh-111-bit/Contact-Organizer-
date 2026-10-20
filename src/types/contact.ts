export type ClientStatus = 'active' | 'prospect' | 'onboarding' | 'inactive';

export interface ClientNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface ClientContact {
  id: string;
  name: string;
  company?: string;
  role?: string;
  department: string; // Customizable category/account group
  email: string;
  phone: string;
  location?: string;
  status: ClientStatus;
  isFavorite: boolean;
  notes: ClientNote[];
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  name: string;
  company?: string;
  role?: string;
  department: string;
  email: string;
  phone: string;
  location?: string;
  status: ClientStatus;
  isFavorite?: boolean;
}

export interface Department {
  id: string;
  name: string;
  color?: string;
}

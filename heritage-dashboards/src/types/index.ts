export type UserRole = 'admin' | 'store_owner' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Store {
  id: string;
  name: string;
  owner: string;
  email: string;
  state: string;
  status: 'pending' | 'approved' | 'rejected';
  products: number;
  createdAt: string;
  subscription: SubscriptionPlan;
}

export type SubscriptionPlan = 'basic' | 'standard' | 'premium';

export interface Document {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  url?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export interface DashboardMetric {
  label: string;
  value: number | string;
  change?: number;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  status: 'active' | 'inactive' | 'pending';
  storeId: string;
  storeName: string;
  createdAt: string;
}

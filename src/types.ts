export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'client' | 'admin';
  createdAt: string;
  context?: string;
  notes?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  targetAudience: string;
  demoUrl?: string;
}

export interface ProgressionUpdate {
  message: string;
  timestamp: string;
}

export interface Order {
  id: string;
  clientId: string;
  planId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  designBrief: string;
  amount: number;
  discountCode?: string;
  createdAt: string;
  siteUrl?: string;
  adminUrl?: string;
  progressionUpdates?: ProgressionUpdate[];
}

export interface Demo {
  id: string;
  title: string;
  url: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface DiscountCode {
  code: string;
  percentage: number;
  active: boolean;
  expiresAt: string;
}

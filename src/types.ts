export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'client' | 'admin';
  createdAt: string;
  context?: string;
  notes?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export interface UserStat {
  id: string;
  userId: string;
  date: string;
  mitigations: number;
  uptime: number;
  requests: number;
}

export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  planName: string;
  amount: number;
  requirements: string;
  status: 'pending' | 'sent' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface EmailLog {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'received';
  type: 'inbound' | 'outbound';
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  monthlyFee: number;
  managementFee: number;
  securityFee: number;
  description: string;
  features: string[];
  targetAudience: string;
  demoUrl?: string;
}

export interface ProgressionUpdate {
  message: string;
  timestamp: string;
}

export interface ProjectRequirements {
  paymentGateway?: 'Stripe' | 'PayPal' | 'PayFast' | 'None';
  securityLevel?: 'Standard' | 'Enhanced' | 'Military-Grade';
  csrAgents?: 'None' | '1-2 Agents' | '3-5 Agents' | 'Dedicated Team';
  specifics?: string;
  platform?: 'E-commerce' | 'SaaS' | 'Blog' | 'Portfolio' | 'Custom';
}

export interface Order {
  id: string;
  clientId: string;
  planId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  designBrief: string;
  amount: number;
  monthlyFee?: number;
  discountCode?: string;
  createdAt: string;
  siteUrl?: string;
  adminUrl?: string;
  progressionUpdates?: ProgressionUpdate[];
  isCustom?: boolean;
  customRequirements?: string;
  requirements?: ProjectRequirements;
  aiVision?: string;
  budget?: number;
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

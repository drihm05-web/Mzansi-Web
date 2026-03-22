import { Plan } from './types';

export const PLANS: Plan[] = [
  {
    id: 'startup',
    name: 'Startup (Basic)',
    price: 999,
    monthlyFee: 199,
    managementFee: 99,
    securityFee: 50,
    description: 'Perfect for small local businesses and personal portfolios.',
    features: [
      '1 Page Responsive Design',
      'Basic SEO Setup',
      'DDoS Protection (L3/L4)',
      'SSL Certificate',
      'South African Server Hosting',
      '48h Initial Draft'
    ],
    targetAudience: 'Small local businesses, startups, and personal brands.',
    demoUrl: 'https://mzansi-startup-demo.run.app'
  },
  {
    id: 'business',
    name: 'Business (Professional)',
    price: 2999,
    monthlyFee: 499,
    managementFee: 249,
    securityFee: 150,
    description: 'Ideal for growing companies needing a robust online presence.',
    features: [
      'Up to 5 Pages',
      'Blog/News Integration',
      'Basic CMS (Content Management)',
      'Advanced Security (L7 Mitigation)',
      'Google Maps Integration',
      'Custom Contact Forms',
      '72h Initial Draft'
    ],
    targetAudience: 'Growing SMEs and professional service providers.',
    demoUrl: 'https://mzansi-business-demo.run.app'
  },
  {
    id: 'enterprise',
    name: 'Enterprise (Custom)',
    price: 7999,
    monthlyFee: 1499,
    managementFee: 749,
    securityFee: 450,
    description: 'Full-scale custom solutions for large organizations.',
    features: [
      'Unlimited Pages',
      'E-commerce Integration',
      'Custom API Integrations',
      'Premium DDoS Mitigation',
      'Dedicated Support',
      'Advanced Analytics Dashboard',
      'Custom Design Briefing'
    ],
    targetAudience: 'Large corporations and high-traffic e-commerce sites.',
    demoUrl: 'https://mzansi-enterprise-demo.run.app'
  }
];

export const STATS = [
  { label: 'DDoS Attacks Mitigated', value: '450k+', icon: 'Shield' },
  { label: 'Security Audits Passed', value: '100%', icon: 'ShieldCheck' },
  { label: 'Uptime Percentage', value: '99.9%', icon: 'Zap' },
  { label: 'Avg. Load Time', value: '0.8s', icon: 'Clock' }
];

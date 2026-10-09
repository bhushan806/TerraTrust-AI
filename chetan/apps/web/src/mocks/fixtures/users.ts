import { User, Institution, Branch } from '@/types/domain';

export const mockInstitution: Institution = {
  id: 'inst-9901',
  name: 'Apex Rural Credit Bank of India',
  code: 'ARCBI-MH',
  currency: 'INR',
  country: 'IN',
  status: 'ACTIVE',
};

export const mockBranches: Branch[] = [
  { id: 'br-101', institution_id: 'inst-9901', name: 'Pune Central Agricultural Branch', code: 'PUN-01', region: 'Maharashtra Western' },
  { id: 'br-102', institution_id: 'inst-9901', name: 'Nashik Agro-Lending Hub', code: 'NSK-02', region: 'Maharashtra Northern' },
  { id: 'br-103', institution_id: 'inst-9901', name: 'Solapur Drought-Risk Branch', code: 'SLP-03', region: 'Maharashtra Southern' },
  { id: 'br-104', institution_id: 'inst-9901', name: 'Chhatrapati Sambhajinagar Branch', code: 'CSN-04', region: 'Maharashtra Marathwada' },
];

export const mockUsers: User[] = [
  {
    id: 'usr-001',
    institution_id: 'inst-9901',
    external_subject: 'oidc|sub-officer-anand',
    email: 'anand.deshmukh@arcbi.bank',
    display_name: 'Anand Deshmukh',
    role: 'LOAN_OFFICER',
    status: 'ACTIVE',
    branches: ['br-101', 'br-102'],
    last_login_at: '2026-10-09T06:15:00Z',
    created_at: '2025-01-10T10:00:00Z',
  },
  {
    id: 'usr-002',
    institution_id: 'inst-9901',
    external_subject: 'oidc|sub-analyst-priya',
    email: 'priya.shinde@arcbi.bank',
    display_name: 'Dr. Priya Shinde',
    role: 'RISK_ANALYST',
    status: 'ACTIVE',
    branches: ['br-101', 'br-102', 'br-103', 'br-104'],
    last_login_at: '2026-10-09T06:45:00Z',
    created_at: '2025-01-15T11:30:00Z',
  },
  {
    id: 'usr-003',
    institution_id: 'inst-9901',
    external_subject: 'oidc|sub-admin-vikram',
    email: 'vikram.kulkarni@arcbi.bank',
    display_name: 'Vikram Kulkarni',
    role: 'INSTITUTION_ADMIN',
    status: 'ACTIVE',
    branches: ['br-101', 'br-102', 'br-103', 'br-104'],
    last_login_at: '2026-10-08T18:20:00Z',
    created_at: '2024-11-01T09:00:00Z',
  },
  {
    id: 'usr-004',
    institution_id: 'inst-9901',
    external_subject: 'oidc|sub-operator-sunil',
    email: 'sunil.patil@arcbi.bank',
    display_name: 'Sunil Patil',
    role: 'PLATFORM_OPERATOR',
    status: 'ACTIVE',
    branches: ['br-101'],
    last_login_at: '2026-10-09T05:00:00Z',
    created_at: '2024-12-05T08:00:00Z',
  },
];

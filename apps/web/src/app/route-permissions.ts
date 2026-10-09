import { AppFeature } from '@/lib/auth/permissions';

export interface RoutePermissionConfig {
  path: string;
  feature?: AppFeature;
  title: string;
}

export const ROUTE_PERMISSIONS: RoutePermissionConfig[] = [
  { path: '/', feature: 'VIEW_DASHBOARD', title: 'Portfolio Dashboard' },
  { path: '/borrowers', feature: 'VIEW_BORROWERS', title: 'Borrowers' },
  { path: '/borrowers/:id', feature: 'VIEW_BORROWERS', title: 'Borrower Profile' },
  { path: '/borrowers/:id/timeline', feature: 'VIEW_RISK_TIMELINE', title: 'Assessment Timeline' },
  { path: '/farms/:id', feature: 'VIEW_FARMS', title: 'Farm Profile' },
  { path: '/crop-cycles/:id', feature: 'VIEW_FARMS', title: 'Crop Cycle Overview' },
  { path: '/crop-cycles/:id/climate', feature: 'VIEW_CLIMATE_INTELLIGENCE', title: 'Climate Intelligence' },
  { path: '/crop-cycles/:id/yield', feature: 'VIEW_YIELD_PREDICTION', title: 'Yield Prediction' },
  { path: '/crop-cycles/:id/income', feature: 'VIEW_INCOME_ANALYSIS', title: 'Farm Income Analysis' },
  { path: '/loan-applications/new', feature: 'CREATE_LOAN_APPLICATION', title: 'New Loan Application' },
  { path: '/loan-applications/:id', feature: 'VIEW_LOAN_APPLICATIONS', title: 'Loan Application Detail' },
  { path: '/assessments/new', feature: 'CREATE_ASSESSMENT', title: 'New Risk Assessment' },
  { path: '/assessments/:id', feature: 'VIEW_ASSESSMENT_DETAIL', title: 'Credit Assessment Detail' },
  { path: '/assessments/:id/explanations', feature: 'VIEW_RISK_EXPLANATIONS', title: 'Risk Drivers & Explanations' },
  { path: '/assessments/:id/scenarios', feature: 'RUN_SCENARIOS', title: 'Scenario Simulator' },
  { path: '/assessments/:id/report', feature: 'DOWNLOAD_REPORTS', title: 'Assessment Report' },
  { path: '/admin/users', feature: 'MANAGE_USERS', title: 'User Administration' },
  { path: '/admin/data-sources', feature: 'VIEW_DATA_SOURCE_HEALTH', title: 'Data Source Health' },
];

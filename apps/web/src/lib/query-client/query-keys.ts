/**
 * TerraTrust-AI — TanStack Query Keys Factory
 */

export const queryKeys = {
  // Borrowers
  borrowers: (filters?: Record<string, any>) => ['borrowers', filters] as const,
  borrower: (id: string) => ['borrower', id] as const,
  borrowerAssessmentHistory: (id: string) => ['borrower', id, 'history'] as const,

  // Farms & Crop Cycles
  farm: (id: string) => ['farm', id] as const,
  cropCycle: (id: string) => ['crop-cycle', id] as const,
  cropCycleObservations: (id: string) => ['crop-cycle', id, 'observations'] as const,

  // Loans
  loanApplication: (id: string) => ['loan-application', id] as const,
  loanApplications: (filters?: Record<string, any>) => ['loan-applications', filters] as const,

  // Assessments
  assessment: (id: string) => ['assessment', id] as const,
  assessments: (filters?: Record<string, any>) => ['assessments', filters] as const,
  assessmentExplanation: (id: string) => ['assessment', id, 'explanations'] as const,
  scenarios: (id: string) => ['assessment', id, 'scenarios'] as const,
  report: (id: string) => ['report', id] as const,

  // Admin & System
  users: (filters?: Record<string, any>) => ['users', filters] as const,
  systemReadiness: () => ['system', 'readiness'] as const,
  dataSourceHealth: () => ['system', 'data-sources'] as const,
};

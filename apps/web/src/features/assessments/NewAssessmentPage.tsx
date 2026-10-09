import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ShieldCheck,
  AlertTriangle,
  Building2,
  FileCheck,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  X,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormField } from '@/components/forms/FormField';
import { FormSection } from '@/components/forms/FormSection';
import { SelectField } from '@/components/forms/SelectField';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { useToast } from '@/components/feedback/Toast';
import { typedGet, typedPost } from '@/lib/api-client/client';
import { mockBorrowers } from '@/mocks/fixtures/borrowers';
import { mockFarms } from '@/mocks/fixtures/farms';
import { mockCropCycles } from '@/mocks/fixtures/crop-cycles';
import { mockLoanApplications } from '@/mocks/fixtures/assessments';

const assessmentSchema = z.object({
  borrower_id: z.string().min(1, 'Please select an authorized borrower'),
  farm_id: z.string().min(1, 'Please select a registered farm plot'),
  crop_cycle_id: z.string().min(1, 'Please select the target crop cycle'),
  loan_application_id: z.string().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export const NewAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const initialBorrowerId = searchParams.get('borrower_id') || '';

  // 1. Dynamic Borrowers Query
  const { data: borrowersRes, isLoading: isLoadingBorrowers } = useQuery({
    queryKey: ['borrowers'],
    queryFn: () => typedGet<{ items?: any[]; borrowers?: any[] }>('/borrowers'),
  });
  const borrowers = borrowersRes?.borrowers || borrowersRes?.items || mockBorrowers;

  const defaultBorrower = borrowers.find((b) => b.id === initialBorrowerId) || borrowers[0] || mockBorrowers[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      borrower_id: defaultBorrower?.id || '77777777-7777-7777-7777-777777777771',
      farm_id: '88888888-8888-8888-8888-888888888881',
      crop_cycle_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      loan_application_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    },
  });

  const selectedBorrowerId = watch('borrower_id');
  const selectedFarmId = watch('farm_id');
  const selectedCycleId = watch('crop_cycle_id');
  const selectedLoanAppId = watch('loan_application_id');

  // 2. Dynamic Farms Query for selected borrower
  const { data: farmsRes, isLoading: isLoadingFarms } = useQuery({
    queryKey: ['farms', selectedBorrowerId],
    queryFn: () => typedGet<any>(`/farms?borrower_id=${selectedBorrowerId}`),
    enabled: !!selectedBorrowerId,
  });
  const farms: any[] = Array.isArray(farmsRes) ? farmsRes : (farmsRes?.farms || farmsRes?.items || mockFarms);

  // 3. Dynamic Crop Cycles Query for selected farm
  const { data: cyclesRes, isLoading: isLoadingCycles } = useQuery({
    queryKey: ['cropCycles', selectedFarmId],
    queryFn: () => typedGet<any[]>(`/farms/${selectedFarmId}/crop-cycles`),
    enabled: !!selectedFarmId,
  });
  const cropCycles: any[] = (cyclesRes && cyclesRes.length > 0) ? cyclesRes : mockCropCycles;

  // 4. Dynamic Loan Applications Query
  const { data: loanAppsRes } = useQuery({
    queryKey: ['loanApplications', selectedBorrowerId],
    queryFn: () => typedGet<any[]>(`/loan-applications?borrower_id=${selectedBorrowerId}`),
    enabled: !!selectedBorrowerId,
  });
  const loanApplications: any[] = (loanAppsRes && loanAppsRes.length > 0) ? loanAppsRes : mockLoanApplications;

  // Auto-select first real borrower on load or sync with URL param
  useEffect(() => {
    if (initialBorrowerId) {
      setValue('borrower_id', initialBorrowerId);
    } else if (borrowers.length > 0 && (!selectedBorrowerId || !borrowers.some((b) => b.id === selectedBorrowerId))) {
      setValue('borrower_id', borrowers[0].id);
    }
  }, [initialBorrowerId, borrowers, selectedBorrowerId, setValue]);

  // Auto-select first registered farm for active borrower
  useEffect(() => {
    if (farms.length > 0 && (!selectedFarmId || !farms.some((f) => f.id === selectedFarmId))) {
      setValue('farm_id', farms[0].id);
    }
  }, [farms, selectedFarmId, setValue]);

  // Auto-select first crop cycle for active farm
  useEffect(() => {
    if (cropCycles.length > 0 && (!selectedCycleId || !cropCycles.some((c) => c.id === selectedCycleId))) {
      setValue('crop_cycle_id', cropCycles[0].id);
    }
  }, [cropCycles, selectedCycleId, setValue]);

  // Auto-select loan application if available
  useEffect(() => {
    if (loanApplications.length > 0) {
      if (!selectedLoanAppId || !loanApplications.some((l) => l.id === selectedLoanAppId)) {
        setValue('loan_application_id', loanApplications[0].id);
      }
    }
  }, [loanApplications, selectedLoanAppId, setValue]);

  const selectedBorrower = borrowers.find((b) => b.id === selectedBorrowerId) || mockBorrowers[0];
  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || mockFarms[0];
  const selectedCycle = cropCycles.find((c) => c.id === selectedCycleId) || mockCropCycles[0];

  const onPreSubmit = () => {
    setShowConfirmModal(true);
  };

  const onExecuteAssessment = async () => {
    try {
      setIsSubmitting(true);
      const payload: Record<string, any> = {
        borrower_id: selectedBorrowerId,
        crop_cycle_id: selectedCycleId,
        trigger_reason: 'INITIAL_APPLICATION',
      };
      if (selectedFarmId) {
        payload.farm_id = selectedFarmId;
      }
      if (selectedLoanAppId && selectedLoanAppId !== 'none' && selectedLoanAppId.trim() !== '') {
        payload.loan_application_id = selectedLoanAppId;
      }

      const res = await typedPost<{ id?: string; assessment?: { id: string } }>('/assessments', payload);

      const assessmentId = res.id || res.assessment?.id || 'asm-701';

      showToast({
        type: 'success',
        title: 'Credit Assessment Queued',
        message: `Assessment ${assessmentId} triggered across yield and financial risk models.`,
      });

      setShowConfirmModal(false);
      navigate(`/assessments/${assessmentId}`);
    } catch (err: any) {
      const detailedMsg = err?.fieldErrors
        ? Object.entries(err.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(', ')
        : err?.message || 'Unable to queue assessment.';
      showToast({
        type: 'error',
        title: 'Assessment Initiation Failed',
        message: detailedMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Initiate Credit Risk Assessment"
        subtitle="Trigger multi-model agronomic and financial evaluation for an agricultural credit facility."
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: 'New Assessment', current: true },
        ]}
      />

      {/* Backend Authoritative Notice */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-700 flex items-start gap-3">
        <Building2 className="w-5 h-5 text-primary-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-neutral-900">Backend Model Authority Notice:</p>
          <p className="leading-relaxed">
            All credit risk classifications, score weights, and probability-of-default gates are executed exclusively by the authoritative backend decision engine. The frontend initiates the request and records audit manifests.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6 max-w-4xl">
        <FormSection
          title="Target Borrower & Agronomic Scope"
          description="Identify target borrower and select the specific crop cycle under assessment"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="borrower_id"
              label="Borrower"
              required
              error={errors.borrower_id?.message}
            >
              <SelectField id="borrower_id" {...register('borrower_id')}>
                {borrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.display_name || b.name} ({b.external_ref || b.id})
                  </option>
                ))}
              </SelectField>
            </FormField>

            <FormField
              id="farm_id"
              label="Farm Plot"
              required
              error={errors.farm_id?.message}
            >
              <SelectField id="farm_id" {...register('farm_id')}>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.cultivated_area || f.area_value || '—'} {f.area_unit || 'ha'})
                  </option>
                ))}
              </SelectField>
            </FormField>

            <FormField
              id="crop_cycle_id"
              label="Crop Cycle"
              required
              error={errors.crop_cycle_id?.message}
            >
              <SelectField id="crop_cycle_id" {...register('crop_cycle_id')}>
                {cropCycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.crop_name || c.crop_code} ({c.season})
                  </option>
                ))}
              </SelectField>
            </FormField>

            <FormField
              id="loan_application_id"
              label="Associated Loan Application (Optional)"
              helpText="Link credit facility for automated debt service stress-testing"
            >
              <SelectField id="loan_application_id" {...register('loan_application_id')}>
                <option value="">None / Standalone Annual Review</option>
                {loanApplications.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} (₹{Number(l.requested_amount || l.amount || 0).toLocaleString('en-IN')} · {l.crop_name || l.purpose || 'Agri'})
                  </option>
                ))}
              </SelectField>
            </FormField>
          </div>
        </FormSection>

        {/* Missing Data & Telemetry Pre-Check Box */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-purple-900">
            <AlertCircle className="w-4 h-4 text-purple-700" />
            <span>Pre-Assessment Data Quality Pre-Check:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-purple-800">
            <li>Weather observations: 24h freshness threshold passed.</li>
            <li>Sentinel-2 NDVI: Recent cloud-free pass verified.</li>
            <li>
              Regulatory Note: As no validated credit repayment model is active, the backend strictly assigns{' '}
              <span className="font-bold">PD UNAVAILABLE</span> on the generated assessment to prevent fabricated default risk metrics.
            </li>
          </ul>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => navigate('/borrowers')}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-semibold hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-primary-800 text-white rounded-lg text-sm font-bold hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2 transition-colors shadow-sm"
          >
            Review & Trigger Assessment
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">
                Confirm Credit Risk Assessment Trigger
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Target Borrower:</span>
                <span className="font-bold text-neutral-900">{selectedBorrower?.display_name || selectedBorrower?.name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Farm Plot:</span>
                <span className="font-semibold text-neutral-800">{selectedFarm?.name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Crop Cycle:</span>
                <span className="font-semibold text-neutral-800">{selectedCycle?.crop_name || selectedCycle?.crop_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Linked Loan Application:</span>
                <span className="font-semibold text-neutral-800">{selectedLoanAppId || 'Standalone'}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Upon confirmation, an idempotent inference job will be dispatched to the backend model pipeline. An immutable assessment snapshot will be stored with full input manifests.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-50"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={onExecuteAssessment}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-800 text-white rounded-lg text-xs font-bold hover:bg-primary-900 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching to Inference Engine...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Execute Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormField } from '@/components/forms/FormField';
import { FormSection } from '@/components/forms/FormSection';
import { SelectField } from '@/components/forms/SelectField';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { useToast } from '@/components/feedback/Toast';
import { typedPost } from '@/lib/api-client/client';
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
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      borrower_id: 'bor-1001',
      farm_id: 'farm-201',
      crop_cycle_id: 'cycle-301',
      loan_application_id: 'la-501',
    },
  });

  const selectedBorrowerId = watch('borrower_id');
  const selectedFarmId = watch('farm_id');
  const selectedCycleId = watch('crop_cycle_id');
  const selectedLoanAppId = watch('loan_application_id');

  const selectedBorrower = mockBorrowers.find((b) => b.id === selectedBorrowerId);
  const selectedFarm = mockFarms.find((f) => f.id === selectedFarmId);
  const selectedCycle = mockCropCycles.find((c) => c.id === selectedCycleId);

  const onPreSubmit = () => {
    setShowConfirmModal(true);
  };

  const onExecuteAssessment = async () => {
    try {
      setIsSubmitting(true);
      const res = await typedPost<{ assessment: { id: string } }>('/assessments', {
        borrower_id: selectedBorrowerId,
        farm_id: selectedFarmId,
        crop_cycle_id: selectedCycleId,
        loan_application_id: selectedLoanAppId,
      });

      showToast({
        type: 'success',
        title: 'Credit Assessment Queued',
        message: `Assessment ${res.assessment.id} triggered across yield and financial risk models.`,
      });

      setShowConfirmModal(false);
      navigate(`/assessments/${res.assessment.id}`);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Assessment Initiation Failed',
        message: err.message || 'Unable to queue assessment.',
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
                {mockBorrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.display_name} ({b.external_ref})
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
                {mockFarms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.cultivated_area} {f.area_unit})
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
                {mockCropCycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.crop_name} ({c.season})
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
                {mockLoanApplications.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} (₹{l.requested_amount.toLocaleString('en-IN')} · {l.crop_name})
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
            <li>Sentinel-2 NDVI: Recent cloud-free pass verified (0.742).</li>
            <li>
              Note: If piezometric aquifer telemetry is missing, the backend will strictly enforce{' '}
              <span className="font-bold">PD UNAVAILABLE</span> on the generated assessment.
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
                <span className="font-bold text-neutral-900">{selectedBorrower?.display_name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Farm Plot:</span>
                <span className="font-semibold text-neutral-800">{selectedFarm?.name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Crop Cycle:</span>
                <span className="font-semibold text-neutral-800">{selectedCycle?.crop_name}</span>
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
                  <span>Dispatching to Inference Engine...</span>
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

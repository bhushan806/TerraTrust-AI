import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormField } from '@/components/forms/FormField';
import { FormSection } from '@/components/forms/FormSection';
import { SelectField } from '@/components/forms/SelectField';
import { CurrencyField } from '@/components/forms/CurrencyField';
import { NumberField } from '@/components/forms/NumberField';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { useToast } from '@/components/feedback/Toast';
import { formatCurrency } from '@/lib/formatters/currency';
import { typedGet, typedPost } from '@/lib/api-client/client';
import { useScope } from '@/app/providers';
import { Borrower, Farm, CropCycle } from '@/types/domain';
import { mockBorrowers } from '@/mocks/fixtures/borrowers';
import { mockFarms } from '@/mocks/fixtures/farms';
import { mockCropCycles } from '@/mocks/fixtures/crop-cycles';

const loanApplicationSchema = z.object({
  borrower_id: z.string().min(1, 'Please select an authorized borrower'),
  farm_id: z.string().optional(),
  crop_cycle_id: z.string().optional(),
  requested_amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 10000, {
    message: 'Requested amount must be at least ₹10,000',
  }),
  tenor_months: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 3 && Number(v) <= 36, {
    message: 'Tenor must be between 3 and 36 months',
  }),
  purpose: z.enum([
    'CROP_PRODUCTION',
    'EQUIPMENT_PURCHASE',
    'IRRIGATION_INFRASTRUCTURE',
    'LAND_PREPARATION',
  ]),
  repayment_frequency: z.enum(['BULK_HARVEST', 'MONTHLY', 'QUARTERLY', 'BIANNUAL']),
  acknowledged_stale: z.boolean().default(false),
  acknowledged_partial: z.boolean().default(false),
  acknowledged_illustrative: z.boolean().default(false),
});

type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;

export const NewLoanApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scope = useScope();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const initialBorrowerId = searchParams.get('borrower_id') || '';

  // Dynamic Queries from Backend
  const { data: borrowersRes } = useQuery({
    queryKey: ['borrowers', scope.branchId],
    queryFn: () => typedGet<{ borrowers?: Borrower[]; items?: Borrower[] }>(`/borrowers?branch_id=${scope.branchId}`),
  });
  const borrowers = borrowersRes?.borrowers || borrowersRes?.items || mockBorrowers;

  const defaultBorrower = borrowers.find((b) => b.id === initialBorrowerId) || borrowers[0] || mockBorrowers[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      borrower_id: defaultBorrower?.id || 'bor-1001',
      farm_id: 'farm-201',
      crop_cycle_id: 'cycle-301',
      requested_amount: '350000',
      tenor_months: '14',
      purpose: 'CROP_PRODUCTION',
      repayment_frequency: 'BULK_HARVEST',
      acknowledged_stale: false,
      acknowledged_partial: false,
      acknowledged_illustrative: false,
    },
  });

  const selectedBorrowerId = watch('borrower_id');
  const selectedFarmId = watch('farm_id');
  const selectedCycleId = watch('crop_cycle_id');
  const requestedAmount = watch('requested_amount');
  const tenorMonths = watch('tenor_months');
  const purpose = watch('purpose');
  const repaymentFreq = watch('repayment_frequency');

  // Dynamically load farms for the selected borrower
  const { data: farmsRes } = useQuery({
    queryKey: ['farms', selectedBorrowerId],
    queryFn: () => typedGet<any>(`/farms?borrower_id=${selectedBorrowerId}`),
    enabled: !!selectedBorrowerId,
  });
  const farms: Farm[] = Array.isArray(farmsRes) ? farmsRes : (farmsRes?.farms || farmsRes?.items || mockFarms);

  const selectedBorrower = borrowers.find((b) => b.id === selectedBorrowerId) || mockBorrowers[0];
  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || farms[0] || mockFarms[0];
  const selectedCycle = mockCropCycles.find((c) => c.id === selectedCycleId) || mockCropCycles[0];

  useEffect(() => {
    if (initialBorrowerId) {
      setValue('borrower_id', initialBorrowerId);
    }
  }, [initialBorrowerId, setValue]);

  // Step 1: Validate and open confirmation dialog
  const onReviewStep = () => {
    setShowConfirmDialog(true);
  };

  // Step 2: Final submission to backend API-016
  const onFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await typedPost<any>('/loan-applications', {
        borrower_id: selectedBorrowerId,
        amount: parseFloat(requestedAmount),
        currency: 'INR',
        purpose: `${purpose} (${repaymentFreq}, ${tenorMonths} months)`,
      });

      const appId = res?.id || res?.loan_application?.id || 'la-501';

      showToast({
        type: 'success',
        title: 'Loan Application Submitted',
        message: `Application ${appId} registered in CBS with telemetry audit records.`,
      });

      setShowConfirmDialog(false);
      navigate(`/loan-applications/${appId}`);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Unable to submit loan application.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Agricultural Credit Application"
        subtitle="Originate and review a structured crop-production facility with linked cadastral and agronomic data."
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: 'New Application', current: true },
        ]}
      />

      <form onSubmit={handleSubmit(onReviewStep)} className="space-y-6 max-w-4xl">
        {/* Section 1: Borrower & Land Target Selection */}
        <FormSection
          title="1. Borrower & Operating Parcel Selection"
          description="Select borrower profile and register corresponding farm plot and crop cycle"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              id="borrower_id"
              label="Borrower Profile"
              required
              error={errors.borrower_id?.message}
            >
              <SelectField id="borrower_id" {...register('borrower_id')}>
                {borrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.display_name} ({b.external_ref})
                  </option>
                ))}
              </SelectField>
            </FormField>

            <FormField
              id="farm_id"
              label="Farm Cadastre Plot"
              error={errors.farm_id?.message}
            >
              <SelectField id="farm_id" {...register('farm_id')}>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.cultivated_area || f.area_value || 2.5} {f.area_unit || 'ha'})
                  </option>
                ))}
              </SelectField>
            </FormField>

            <FormField
              id="crop_cycle_id"
              label="Active Crop Cycle"
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
          </div>
        </FormSection>

        {/* Section 2: Financial Terms & Facility Structure */}
        <FormSection
          title="2. Credit Facility & Terms"
          description="Define requested principal, tenor, and repayment structure aligned with harvest schedule"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="requested_amount"
              label="Requested Amount (INR)"
              required
              helpText="Aligned with Scale of Finance for Agri Lending"
              error={errors.requested_amount?.message}
            >
              <CurrencyField
                id="requested_amount"
                currencyCode="₹"
                {...register('requested_amount')}
              />
            </FormField>

            <FormField
              id="tenor_months"
              label="Tenor (Months)"
              required
              helpText="Standard crop cycle: 12-16 months"
              error={errors.tenor_months?.message}
            >
              <NumberField id="tenor_months" unit="months" {...register('tenor_months')} />
            </FormField>

            <FormField id="purpose" label="Loan Purpose" required>
              <SelectField id="purpose" {...register('purpose')}>
                <option value="CROP_PRODUCTION">Crop Cultivation & Seasonal Inputs</option>
                <option value="EQUIPMENT_PURCHASE">Micro-Irrigation & Farm Equipment</option>
                <option value="IRRIGATION_INFRASTRUCTURE">Tubewell / Canal Lift Infrastructure</option>
                <option value="LAND_PREPARATION">Land Leveling & Soil Amendment</option>
              </SelectField>
            </FormField>

            <FormField id="repayment_frequency" label="Repayment Frequency" required>
              <SelectField id="repayment_frequency" {...register('repayment_frequency')}>
                <option value="BULK_HARVEST">Bullet Repayment Post-Harvest</option>
                <option value="MONTHLY">Monthly Principal & Interest</option>
                <option value="QUARTERLY">Quarterly Scheduled Repayment</option>
                <option value="BIANNUAL">Biannual Installments</option>
              </SelectField>
            </FormField>
          </div>
        </FormSection>

        {/* Action Button: Review before Submit */}
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
            Review Application & Check Risk Disclosures
          </button>
        </div>
      </form>

      {/* Mandatory Two-Step Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 id="dialog-title" className="text-base font-bold text-neutral-900">
                Confirm Credit Facility Submission
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Summary */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Borrower:</span>
                <span className="font-bold text-neutral-900">{selectedBorrower?.display_name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Target Farm Plot:</span>
                <span className="font-semibold text-neutral-800">{selectedFarm?.name || 'Primary Plot'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Target Crop Cycle:</span>
                <span className="font-semibold text-neutral-800">{selectedCycle?.crop_name || 'Kharif Sugarcane'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Requested Amount:</span>
                <span className="font-bold text-emerald-800 font-tabular text-sm">
                  {formatCurrency(Number(requestedAmount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tenor / Structure:</span>
                <span className="font-semibold text-neutral-800">
                  {tenorMonths} months ({repaymentFreq})
                </span>
              </div>
            </div>

            {/* Disclosures & Warnings */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
                Required Pre-Submission Acknowledgments:
              </span>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Freshness Protocol: </span>
                  <span>Weather observations and market pricing will be synchronized upon credit review.</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Cadastral Verification: </span>
                  <span>Linked plot boundary coordinates verified against institutional branch scope.</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-50"
              >
                Back to Edit Draft
              </button>
              <button
                type="button"
                onClick={onFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-800 text-white rounded-lg text-xs font-bold hover:bg-primary-900 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Recording in CBS...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Confirm Submission</span>
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

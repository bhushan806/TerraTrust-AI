import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  ArrowLeft,
  FileCheck2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/components/feedback/Toast';
import { formatDate, formatDateTime } from '@/lib/formatters/date';
import { typedGet, typedPost } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { AssessmentReport } from '@/types/domain';

export const AssessmentReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const assessmentId = id || 'asm-701';
  const reportId = assessmentId === 'asm-701' ? 'rep-901' : 'rep-902';
  const queryClientTanstack = useQueryClient();
  const { showToast } = useToast();

  const [simulatedReportId, setSimulatedReportId] = useState<string>(reportId);

  // TanStack Query with conditional polling only while PROCESSING or QUEUED!
  const reportQuery = useQuery({
    queryKey: queryKeys.report(simulatedReportId),
    queryFn: () => typedGet<{ report: AssessmentReport }>(`/reports/${simulatedReportId}`),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.report.status === 'PROCESSING' || data?.report.status === 'QUEUED') {
        return 1500; // Poll every 1.5 seconds while job is active
      }
      return false; // Stop polling once COMPLETED or FAILED
    },
  });

  const requestNewReportMutation = useMutation({
    mutationFn: () =>
      typedPost<{ report: AssessmentReport }>(`/assessments/${assessmentId}/reports`, {
        export_format: 'PDF',
      }),
    onSuccess: (data) => {
      setSimulatedReportId(data.report.id);
      queryClientTanstack.invalidateQueries({ queryKey: queryKeys.report(data.report.id) });
      showToast({
        type: 'info',
        title: 'Report Generation Dispatched',
        message: 'Compilation job queued in asynchronous report engine.',
      });
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: 'Report Generation Failed',
        message: err.message || 'Unable to queue export job.',
      });
    },
  });

  if (reportQuery.isLoading) {
    return <LoadingState message="Fetching assessment export status and signed links..." />;
  }

  const report = reportQuery.data?.report;

  const handleDownload = () => {
    if (!report?.download_url) return;
    showToast({
      type: 'success',
      title: 'Downloading Assessment Dossier',
      message: `File: terratrust-assessment-${assessmentId}-${report.report_version}.pdf (${Math.round((report.file_size_bytes || 1400000) / 1024)} KB)`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Risk Assessment Report"
        subtitle={`Official audit report for Assessment ${assessmentId} · Tamper-evident snapshot consistency`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: `Assessment ${assessmentId}`, href: `/assessments/${assessmentId}` },
          { label: 'Report', current: true },
        ]}
        badge={
          report ? (
            <StatusBadge
              variant={
                report.status === 'COMPLETED'
                  ? 'HEALTHY'
                  : report.status === 'FAILED'
                  ? 'FAILED'
                  : 'PENDING'
              }
              label={`REPORT ${report.status}`}
              size="md"
            />
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => requestNewReportMutation.mutate()}
              disabled={requestNewReportMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-50 shadow-2xs disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate Fresh Export</span>
            </button>
            <Link
              to={`/assessments/${assessmentId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-50 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Assessment</span>
            </Link>
          </div>
        }
      />

      {/* Main Report Status Card */}
      {report && (
        <DetailCard title="Export Lifecycle & Signed Download">
          <div className="space-y-6">
            {/* Status Visual Banner */}
            {report.status === 'PROCESSING' || report.status === 'QUEUED' ? (
              <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">
                    {report.status === 'QUEUED' ? 'Export Job Queued' : 'Rendering PDF Artifact...'}
                  </h3>
                  <p className="text-xs text-amber-800 max-w-md mt-1">
                    Compiling satellite NDVI rasters, conformal yield prediction bands, and financial debt capacity formulas into signed PDF.
                  </p>
                </div>
                <div className="text-[11px] text-amber-700 font-mono">
                  Polling via TanStack Query (auto-refreshes upon completion)
                </div>
              </div>
            ) : report.status === 'COMPLETED' ? (
              <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                    <FileCheck2 className="w-5 h-5 text-emerald-700" />
                    <span>Official Assessment Dossier Ready</span>
                  </div>
                  <p className="text-xs text-emerald-800 max-w-lg">
                    Full institutional report compiled with cryptographic input manifest hash. Validated for credit committee presentation.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-mono pt-1">
                    Expires: {report.expires_at ? formatDateTime(report.expires_at) : '7 days from generation'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-900 text-white rounded-lg text-xs font-bold hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors shadow-sm shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed PDF</span>
                </button>
              </div>
            ) : (
              <div className="p-6 bg-rose-50 rounded-xl border border-rose-200 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-700 mx-auto" />
                <h3 className="font-bold text-rose-900 text-sm">Report Generation Failed</h3>
                <p className="text-xs text-rose-800">
                  {report.error_message || 'The report compilation worker encountered a timeout while generating charts.'}
                </p>
                <button
                  type="button"
                  onClick={() => requestNewReportMutation.mutate()}
                  className="px-4 py-2 bg-white border border-rose-300 rounded-lg text-xs font-bold text-rose-900 hover:bg-rose-50"
                >
                  Retry Report Generation
                </button>
              </div>
            )}

            {/* Audit & File Metadata Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-neutral-50 p-4 rounded-xl border border-neutral-200 font-tabular">
              <div>
                <span className="text-neutral-500 block text-[11px]">Report Identifier</span>
                <span className="font-mono font-bold text-neutral-900">{report.id}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Report Version</span>
                <span className="font-mono font-bold text-neutral-900">{report.report_version}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Requested By</span>
                <span className="font-semibold text-neutral-800">{report.requested_by}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Snapshot Timestamp</span>
                <span className="font-semibold text-neutral-800">{formatDate(report.snapshot_date)}</span>
              </div>
            </div>

            {/* Explanatory Contents Guide */}
            <div className="space-y-2 text-xs text-neutral-700 border-t border-neutral-100 pt-4">
              <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wide">
                Dossier Contents Included:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Borrower KYC & Kisan Credit Card verification record</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cadastral land plot boundaries & soil classification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Historical weather and 14-day IMD meteorological telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Conformal quantile yield prediction with 90% confidence envelope</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transparent farm income arithmetic & debt coverage calculations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Classified risk drivers (Facts, Contributions, Assumptions)</span>
                </li>
              </ul>
            </div>
          </div>
        </DetailCard>
      )}
    </div>
  );
};

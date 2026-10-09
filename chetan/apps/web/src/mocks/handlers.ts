import { http, HttpResponse, delay } from 'msw';
import { mockInstitution, mockBranches, mockUsers } from './fixtures/users';
import { mockBorrowers } from './fixtures/borrowers';
import { mockFarms } from './fixtures/farms';
import { mockCropCycles } from './fixtures/crop-cycles';
import {
  mockWeatherObservations,
  mockSatelliteObservations,
  mockSoilMoistureObservations,
  mockMarketPrices,
} from './fixtures/observations';
import { mockYieldPredictions } from './fixtures/yield';
import { mockIncomeEstimates } from './fixtures/income';
import {
  mockLoanApplications,
  mockAssessments,
  mockRiskExplanations,
} from './fixtures/assessments';
import { mockScenarios } from './fixtures/scenarios';
import {
  mockReports,
  mockTimelineSnapshots,
  mockDataSourcesHealth,
} from './fixtures/reports';

const BASE_URL = '/api/v1';

export const handlers = [
  // API-001: GET /auth/me
  http.get(`${BASE_URL}/auth/me`, async () => {
    await delay(100);
    const demoRole = sessionStorage.getItem('terratrust_demo_role') || 'LOAN_OFFICER';
    const user = mockUsers.find((u) => u.role === demoRole) || mockUsers[0];
    return HttpResponse.json({ user });
  }),

  // API-002: GET /institutions/current
  http.get(`${BASE_URL}/institutions/current`, async () => {
    await delay(50);
    return HttpResponse.json({ institution: mockInstitution });
  }),

  // API-003: GET /branches
  http.get(`${BASE_URL}/branches`, async () => {
    await delay(50);
    return HttpResponse.json({ branches: mockBranches });
  }),

  // API-004: GET /users
  http.get(`${BASE_URL}/users`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    let filtered = [...mockUsers];
    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    return HttpResponse.json({ users: filtered, total: filtered.length });
  }),

  // API-005: POST /users/invitations
  http.post(`${BASE_URL}/users/invitations`, async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as any;
    if (!body?.email || !body?.role) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and role are required for invitation.',
            request_id: 'req-inv-err',
            details: [{ field: 'email', message: 'Email cannot be blank' }],
          },
        },
        { status: 422 }
      );
    }
    return HttpResponse.json({
      invitation_id: `inv-${Date.now()}`,
      email: body.email,
      role: body.role,
      status: 'INVITED',
    });
  }),

  // API-006: PATCH /users/:user_id/roles
  http.patch(`${BASE_URL}/users/:user_id/roles`, async ({ params, request }) => {
    await delay(200);
    const body = (await request.json()) as any;
    const user = mockUsers.find((u) => u.id === params.user_id);
    if (!user) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found.', request_id: 'req-u-nf' } },
        { status: 404 }
      );
    }
    user.role = body.role;
    return HttpResponse.json({ user, updated: true });
  }),

  // API-007: GET /borrowers
  http.get(`${BASE_URL}/borrowers`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const riskStatus = url.searchParams.get('risk_status');
    const branchId = url.searchParams.get('branch_id');
    const primaryCrop = url.searchParams.get('primary_crop');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('page_size') || '10', 10);

    let items = [...mockBorrowers];

    if (search) {
      items = items.filter(
        (b) =>
          b.display_name.toLowerCase().includes(search) ||
          b.external_ref.toLowerCase().includes(search) ||
          b.phone.includes(search)
      );
    }

    if (riskStatus && riskStatus !== 'ALL') {
      items = items.filter((b) => b.risk_status === riskStatus);
    }

    if (branchId && branchId !== 'ALL') {
      items = items.filter((b) => b.branch_id === branchId);
    }

    if (primaryCrop && primaryCrop !== 'ALL') {
      items = items.filter((b) => b.primary_crop.toLowerCase() === primaryCrop.toLowerCase());
    }

    const total = items.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = items.slice(startIndex, startIndex + pageSize);

    return HttpResponse.json({
      borrowers: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }),

  // API-008: POST /borrowers
  http.post(`${BASE_URL}/borrowers`, async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as any;
    const newBorrower = {
      id: `bor-${Date.now()}`,
      institution_id: 'inst-9901',
      branch_id: body.branch_id || 'br-101',
      branch_name: 'Pune Central Agricultural Branch',
      external_ref: `KCC-MH-NEW-${Math.floor(10000 + Math.random() * 90000)}`,
      display_name: body.display_name,
      legal_name: body.legal_name || body.display_name,
      phone: body.phone,
      primary_crop: body.primary_crop || 'Soybean',
      region: 'Western Maharashtra',
      risk_status: 'UNASSESSED',
      assessment_status: 'NOT_STARTED',
      last_assessed_at: null,
      updated_at: new Date().toISOString(),
      total_farms: 0,
      total_area_ha: 0,
    };
    mockBorrowers.unshift(newBorrower as any);
    return HttpResponse.json({ borrower: newBorrower }, { status: 201 });
  }),

  // API-009: GET /borrowers/:borrower_id
  http.get(`${BASE_URL}/borrowers/:borrower_id`, async ({ params }) => {
    await delay(100);
    const borrower = mockBorrowers.find((b) => b.id === params.borrower_id);
    if (!borrower) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Borrower record not found.', request_id: 'req-bor-nf' } },
        { status: 404 }
      );
    }
    const borrowerFarms = mockFarms.filter((f) => f.borrower_id === borrower.id);
    const borrowerLoans = mockLoanApplications.filter((l) => l.borrower_id === borrower.id);
    const borrowerCropCycles = mockCropCycles.filter((c) => c.borrower_id === borrower.id);

    return HttpResponse.json({
      borrower,
      farms: borrowerFarms,
      loans: borrowerLoans,
      crop_cycles: borrowerCropCycles,
    });
  }),

  // API-010: PATCH /borrowers/:borrower_id
  http.patch(`${BASE_URL}/borrowers/:borrower_id`, async ({ params, request }) => {
    await delay(150);
    const borrower = mockBorrowers.find((b) => b.id === params.borrower_id);
    if (!borrower) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Borrower not found.', request_id: 'req-patch-nf' } },
        { status: 404 }
      );
    }
    const updates = (await request.json()) as any;
    Object.assign(borrower, updates, { updated_at: new Date().toISOString() });
    return HttpResponse.json({ borrower });
  }),

  // API-011: GET /farms
  http.get(`${BASE_URL}/farms`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const borrowerId = url.searchParams.get('borrower_id');
    let farms = [...mockFarms];
    if (borrowerId) {
      farms = farms.filter((f) => f.borrower_id === borrowerId);
    }
    return HttpResponse.json({ farms, total: farms.length });
  }),

  // API-012: POST /farms
  http.post(`${BASE_URL}/farms`, async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as any;
    const newFarm = {
      id: `farm-${Date.now()}`,
      institution_id: 'inst-9901',
      borrower_id: body.borrower_id,
      borrower_name: body.borrower_name || 'Borrower',
      name: body.name,
      location_name: body.location_name || 'District Plot',
      total_area: parseFloat(body.total_area),
      cultivated_area: parseFloat(body.cultivated_area || body.total_area),
      area_unit: body.area_unit || 'ha',
      soil_type: body.soil_type || 'Loamy Clay',
      irrigation_type: body.irrigation_type || 'RAINFED',
      coordinates_redacted: true,
      state: 'Maharashtra',
      district: 'Pune',
      data_source: 'Survey Entry',
      updated_at: new Date().toISOString(),
      freshness_status: 'FRESH',
    };
    mockFarms.push(newFarm as any);
    return HttpResponse.json({ farm: newFarm }, { status: 201 });
  }),

  // API-013: GET /farms/:farm_id
  http.get(`${BASE_URL}/farms/:farm_id`, async ({ params }) => {
    await delay(100);
    const farm = mockFarms.find((f) => f.id === params.farm_id);
    if (!farm) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Farm record not found.', request_id: 'req-farm-nf' } },
        { status: 404 }
      );
    }
    const cycles = mockCropCycles.filter((c) => c.farm_id === farm.id);
    return HttpResponse.json({ farm, crop_cycles: cycles });
  }),

  // API-014: POST /farms/:farm_id/crop-cycles
  http.post(`${BASE_URL}/farms/:farm_id/crop-cycles`, async ({ params, request }) => {
    await delay(200);
    const farm = mockFarms.find((f) => f.id === params.farm_id);
    const body = (await request.json()) as any;
    const newCycle = {
      id: `cycle-${Date.now()}`,
      farm_id: params.farm_id,
      farm_name: farm?.name || 'Farm',
      borrower_id: farm?.borrower_id || 'bor-1001',
      borrower_name: farm?.borrower_name || 'Borrower',
      crop_code: body.crop_code || 'SOY-335',
      crop_name: body.crop_name || 'Soybean',
      season: body.season || 'KHARIF',
      sowing_date: body.sowing_date || '2026-06-15',
      expected_harvest_date: body.expected_harvest_date || '2026-10-15',
      area_value: parseFloat(body.area_value || '2.0'),
      area_unit: body.area_unit || 'ha',
      irrigation_type: body.irrigation_type || 'RAINFED',
      status: 'ACTIVE',
      quality_status: 'VALID',
      updated_at: new Date().toISOString(),
    };
    mockCropCycles.push(newCycle as any);
    return HttpResponse.json({ crop_cycle: newCycle }, { status: 201 });
  }),

  // API-015: GET /crop-cycles/:cycle_id
  http.get(`${BASE_URL}/crop-cycles/:cycle_id`, async ({ params }) => {
    await delay(100);
    const cycle = mockCropCycles.find((c) => c.id === params.cycle_id);
    if (!cycle) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Crop cycle not found.', request_id: 'req-cycle-nf' } },
        { status: 404 }
      );
    }
    const farm = mockFarms.find((f) => f.id === cycle.farm_id);
    const borrower = mockBorrowers.find((b) => b.id === cycle.borrower_id);
    const yieldPred = mockYieldPredictions[cycle.id];
    const incomeEst = mockIncomeEstimates[cycle.id];

    return HttpResponse.json({
      crop_cycle: cycle,
      farm,
      borrower,
      yield_prediction: yieldPred || null,
      income_estimate: incomeEst || null,
    });
  }),

  // API-016: POST /loan-applications
  http.post(`${BASE_URL}/loan-applications`, async ({ request }) => {
    await delay(250);
    const body = (await request.json()) as any;
    if (!body?.requested_amount || !body?.borrower_id || !body?.farm_id) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Borrower, farm, and requested amount are required.',
            request_id: 'req-loan-val',
            details: [{ field: 'requested_amount', message: 'Amount must be greater than 0' }],
          },
        },
        { status: 422 }
      );
    }

    const borrower = mockBorrowers.find((b) => b.id === body.borrower_id);
    const farm = mockFarms.find((f) => f.id === body.farm_id);
    const cycle = mockCropCycles.find((c) => c.id === body.crop_cycle_id);

    const newApp = {
      id: `la-${Date.now()}`,
      borrower_id: body.borrower_id,
      borrower_name: borrower?.display_name || 'Borrower',
      farm_id: body.farm_id,
      farm_name: farm?.name || 'Farm',
      crop_cycle_id: body.crop_cycle_id || 'cycle-301',
      crop_name: cycle?.crop_name || 'Crop',
      branch_id: borrower?.branch_id || 'br-101',
      requested_amount: parseFloat(body.requested_amount),
      currency: 'INR',
      tenor_months: parseInt(body.tenor_months || '12', 10),
      purpose: body.purpose || 'CROP_PRODUCTION',
      repayment_frequency: body.repayment_frequency || 'BULK_HARVEST',
      interest_rate_pct: 7.0,
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assumptions_acknowledged: {
        stale_data_warning: Boolean(body.acknowledged_stale),
        partial_data_warning: Boolean(body.acknowledged_partial),
        illustrative_warning: Boolean(body.acknowledged_illustrative),
      },
      audit_info: {
        created_by: 'usr-001',
        request_id: `req-${Date.now()}`,
      },
    };
    mockLoanApplications.push(newApp as any);
    return HttpResponse.json({ loan_application: newApp }, { status: 201 });
  }),

  // API-017: GET /loan-applications/:application_id
  http.get(`${BASE_URL}/loan-applications/:application_id`, async ({ params }) => {
    await delay(100);
    const app = mockLoanApplications.find((a) => a.id === params.application_id);
    if (!app) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Loan application not found.', request_id: 'req-la-nf' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ loan_application: app });
  }),

  // API-020: GET /crop-cycles/:cycle_id/observations
  http.get(`${BASE_URL}/crop-cycles/:cycle_id/observations`, async ({ params }) => {
    await delay(150);
    return HttpResponse.json({
      cycle_id: params.cycle_id,
      weather: mockWeatherObservations,
      satellite: mockSatelliteObservations,
      soil_moisture: mockSoilMoistureObservations,
      data_sources: {
        weather_source: 'India Meteorological Department (IMD)',
        satellite_source: 'Copernicus Sentinel-2 L2A',
        soil_source: 'NASA SMAP 9km Radiometer',
      },
    });
  }),

  // API-023: GET /market-prices
  http.get(`${BASE_URL}/market-prices`, async () => {
    await delay(100);
    return HttpResponse.json({
      prices: mockMarketPrices,
      source: 'AGMARKNET / e-NAM',
      retrieved_at: new Date().toISOString(),
    });
  }),

  // API-024: POST /yield-predictions
  http.post(`${BASE_URL}/yield-predictions`, async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as any;
    const cycleId = body.crop_cycle_id || 'cycle-301';
    const existing = mockYieldPredictions[cycleId] || mockYieldPredictions['cycle-301'];
    return HttpResponse.json({ yield_prediction: existing });
  }),

  // API-025: POST /income-estimates
  http.post(`${BASE_URL}/income-estimates`, async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as any;
    const cycleId = body.crop_cycle_id || 'cycle-301';
    const existing = mockIncomeEstimates[cycleId] || mockIncomeEstimates['cycle-301'];
    return HttpResponse.json({ income_estimate: existing });
  }),

  // API-026: POST /assessments
  http.post(`${BASE_URL}/assessments`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as any;
    const borrower = mockBorrowers.find((b) => b.id === body.borrower_id);
    const newAssessment = {
      id: `asm-${Date.now()}`,
      borrower_id: body.borrower_id || 'bor-1001',
      borrower_name: borrower?.display_name || 'Borrower',
      farm_id: body.farm_id || 'farm-201',
      crop_cycle_id: body.crop_cycle_id || 'cycle-301',
      loan_application_id: body.loan_application_id,
      status: 'COMPLETED',
      risk_classification: 'MODERATE',
      score: 72,
      probability_of_default: null, // Gate closed until validation passes
      pd_gate_status: 'CLOSED_EVIDENCE_INCOMPLETE',
      pd_unavailable_reason: 'A probability-of-default value is not available for this assessment because the required backend gate is closed or required evidence is incomplete.',
      assessment_date: new Date().toISOString(),
      model_version: 'v2.4.1-prod',
      evidence_quality: 'MODERATE',
      trigger: 'MANUAL',
      completed_at: new Date().toISOString(),
      input_manifest_id: `man-${Date.now()}`,
      assumptions: {},
      risk_factors: [
        { code: 'RF-EVAL-01', name: 'Fresh Assessment Generated', severity: 'LOW', description: 'Evaluated under live agronomic rules.' }
      ],
      audit_info: {
        created_by: 'usr-001',
        request_id: `req-new-asm-${Date.now()}`,
        institution_id: 'inst-9901',
      },
    };
    mockAssessments[newAssessment.id] = newAssessment as any;
    return HttpResponse.json({ assessment: newAssessment }, { status: 201 });
  }),

  // API-027: GET /assessments/:assessment_id
  http.get(`${BASE_URL}/assessments/:assessment_id`, async ({ params }) => {
    await delay(120);
    const assessment = mockAssessments[params.assessment_id as string];
    if (!assessment) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Assessment record not found.', request_id: 'req-asm-nf' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ assessment });
  }),

  // API-028: POST /assessments/:assessment_id/scenarios
  http.post(`${BASE_URL}/assessments/:assessment_id/scenarios`, async ({ params, request }) => {
    await delay(300);
    const body = (await request.json()) as any;
    const assessmentId = params.assessment_id as string;
    const assessment = mockAssessments[assessmentId];

    const baselineYield = 104.5;
    const yieldChange = parseFloat(body.assumptions?.yield_change_pct || 0);
    const priceChange = parseFloat(body.assumptions?.price_change_pct || 0);
    const costChange = parseFloat(body.assumptions?.cost_change_pct || 0);

    const projectedYield = baselineYield * (1 + yieldChange / 100);
    const baseRev = 869680;
    const projRev = baseRev * (1 + yieldChange / 100) * (1 + priceChange / 100);
    const baseCost = 312500;
    const projCost = baseCost * (1 + costChange / 100);
    const projNet = projRev - projCost - 45000;
    const projIads = projNet - 180000;
    const projRatio = projIads / 180000;

    const newScenario = {
      id: `scen-${Date.now()}`,
      assessment_id: assessmentId,
      name: body.name || 'Ad-Hoc Stress Scenario',
      description: body.description || 'Parametric stress simulation',
      created_at: new Date().toISOString(),
      created_by: 'Dr. Priya Shinde (Risk Analyst)',
      evidence_status: 'ILLUSTRATIVE_ASSUMPTION',
      assumptions: {
        yield_change_pct: yieldChange,
        price_change_pct: priceChange,
        cost_change_pct: costChange,
        rainfall_factor_pct: parseFloat(body.assumptions?.rainfall_factor_pct || 0),
        tenor_extension_months: parseInt(body.assumptions?.tenor_extension_months || 0, 10),
      },
      baseline: {
        yield_val: baselineYield,
        gross_revenue: baseRev,
        net_income: 512180,
        iads: 332180,
        repayment_ratio: 1.85,
        risk_classification: assessment?.risk_classification || 'LOW',
      },
      projected: {
        yield_val: parseFloat(projectedYield.toFixed(2)),
        gross_revenue: Math.round(projRev),
        net_income: Math.round(projNet),
        iads: Math.round(projIads),
        repayment_ratio: parseFloat(projRatio.toFixed(2)),
        risk_classification: projRatio < 1.0 ? 'HIGH' : projRatio < 1.4 ? 'MODERATE' : 'LOW',
        delta_net_income: Math.round(projNet - 512180),
        delta_iads: Math.round(projIads - 332180),
      },
    };

    if (!mockScenarios[assessmentId]) mockScenarios[assessmentId] = [];
    mockScenarios[assessmentId].unshift(newScenario as any);

    return HttpResponse.json({ scenario: newScenario }, { status: 201 });
  }),

  // API-029: GET /assessments/:assessment_id/scenarios
  http.get(`${BASE_URL}/assessments/:assessment_id/scenarios`, async ({ params }) => {
    await delay(100);
    const scenarios = mockScenarios[params.assessment_id as string] || [];
    return HttpResponse.json({ scenarios, total: scenarios.length });
  }),

  // API-030: GET /assessments/:assessment_id/explanations
  http.get(`${BASE_URL}/assessments/:assessment_id/explanations`, async ({ params }) => {
    await delay(120);
    const explanations = mockRiskExplanations[params.assessment_id as string] || mockRiskExplanations['asm-701'];
    return HttpResponse.json({ explanations });
  }),

  // API-031: GET /borrowers/:borrower_id/assessment-history
  http.get(`${BASE_URL}/borrowers/:borrower_id/assessment-history`, async ({ params }) => {
    await delay(150);
    const snapshots = mockTimelineSnapshots[params.borrower_id as string] || mockTimelineSnapshots['bor-1001'] || [];
    return HttpResponse.json({ borrower_id: params.borrower_id, snapshots });
  }),

  // API-032: POST /assessments/:assessment_id/reports
  http.post(`${BASE_URL}/assessments/:assessment_id/reports`, async ({ params }) => {
    await delay(200);
    const newReport = {
      id: `rep-${Date.now()}`,
      assessment_id: params.assessment_id,
      report_version: 'v1.2.0',
      status: 'PROCESSING',
      requested_by: 'Authorized Analyst',
      requested_at: new Date().toISOString(),
      snapshot_date: new Date().toISOString(),
      model_version: 'v2.4.1-prod',
    };
    mockReports[newReport.id] = newReport as any;

    // Simulate completion after 3 seconds for TanStack Query polling demonstration
    setTimeout(() => {
      mockReports[newReport.id] = {
        ...newReport,
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        download_url: `/api/v1/reports/${newReport.id}/download`,
        file_size_bytes: 1542000,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      } as any;
    }, 3000);

    return HttpResponse.json({ report: newReport }, { status: 202 });
  }),

  // API-033: GET /reports/:report_id
  http.get(`${BASE_URL}/reports/:report_id`, async ({ params }) => {
    await delay(100);
    const report = mockReports[params.report_id as string];
    if (!report) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Report record not found.', request_id: 'req-rep-nf' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ report });
  }),

  // API-034: GET /health/ready
  http.get(`${BASE_URL}/health/ready`, async () => {
    await delay(50);
    return HttpResponse.json({
      status: 'READY',
      version: '1.0.0-fin03',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'HEALTHY',
        redis_cache: 'HEALTHY',
        model_runner: 'HEALTHY',
        data_providers: 'DEGRADED', // Illustrates SMAP degraded telemetry
      },
    });
  }),

  // Additional Data Source Registry Handler for Admin UI
  http.get(`${BASE_URL}/data-sources`, async () => {
    await delay(120);
    return HttpResponse.json({ data_sources: mockDataSourcesHealth });
  }),
];

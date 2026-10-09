/**
 * TerraTrust-AI — Agricultural & Satellite Imagery Assets
 */

export const IMAGERY_ASSETS = {
  satelliteParcel:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  lushCropsAerial:
    'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1200&q=80',
  soilMoistureSensor:
    'https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=1200&q=80',
  sugarcaneCrop:
    'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80',
  waterIrrigation:
    'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=1200&q=80',
};

export interface FarmDocumentItem {
  id: string;
  title: string;
  category:
    | 'CROP_PHOTO'
    | 'LAND_TITLE'
    | 'SOIL_REPORT'
    | 'SATELLITE_SURVEY'
    | 'WATER_TEST'
    | 'DRONE_SURVEY'
    | 'WATER_RECEIPT';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED';
  previewUrl: string;
  verifiedBy?: string;
  notes?: string;
}

export const INITIAL_FARM_DOCUMENTS: FarmDocumentItem[] = [
  {
    id: 'doc-001',
    title: '7/12 Land Title Extract (Patil Estate)',
    category: 'LAND_TITLE',
    fileName: 'patil_7_12_land_extract.pdf',
    fileSize: '2.4 MB',
    uploadedAt: '2026-09-15T10:30:00Z',
    status: 'VERIFIED',
    previewUrl: IMAGERY_ASSETS.satelliteParcel,
    verifiedBy: 'Revenue Authority / Mahabhumi Registry Match',
    notes: 'Survey No. 42/1A, Solapur South Taluka. Encumbrance clear.',
  },
  {
    id: 'doc-002',
    title: 'Pre-Sowing Soil Nutrient & pH Lab Report',
    category: 'SOIL_REPORT',
    fileName: 'solapur_agri_lab_soil_oct2026.pdf',
    fileSize: '1.8 MB',
    uploadedAt: '2026-09-28T14:15:00Z',
    status: 'VERIFIED',
    previewUrl: IMAGERY_ASSETS.soilMoistureSensor,
    verifiedBy: 'ICAR-KVK Solapur Certified Lab',
    notes: 'N: 42 kg/ha, P: 31 kg/ha, K: 36 kg/ha, pH: 7.2. Organic carbon 0.65%.',
  },
  {
    id: 'doc-003',
    title: 'Sentinel-2 Parcel Boundary & NDVI GeoTIFF',
    category: 'SATELLITE_SURVEY',
    fileName: 'sentinel2_parcel_ndvi_2026_q3.tif',
    fileSize: '8.5 MB',
    uploadedAt: '2026-10-02T08:00:00Z',
    status: 'VERIFIED',
    previewUrl: IMAGERY_ASSETS.lushCropsAerial,
    verifiedBy: 'ISRO VEDAS / Copernicus Service Pipeline',
    notes: 'Mean NDVI: 0.72. Cloud cover < 2%. Vigorous vegetative stage.',
  },
  {
    id: 'doc-004',
    title: 'Field Inspection Photo — Early Tillering',
    category: 'CROP_PHOTO',
    fileName: 'field_geo_photo_plot1_south.jpg',
    fileSize: '3.1 MB',
    uploadedAt: '2026-10-05T11:45:00Z',
    status: 'VERIFIED',
    previewUrl: IMAGERY_ASSETS.sugarcaneCrop,
    verifiedBy: 'Anand Kulkarni (Loan Officer, BR-SOL-01)',
    notes: 'Geotagged 17.6599° N, 75.9064° E. Healthy canopy formation.',
  },
];

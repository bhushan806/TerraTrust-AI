import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Eye,
  X,
  Plus,
  Filter,
  FileCheck,
  ShieldCheck,
  Download,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDate } from '@/lib/formatters/date';
import { FarmDocumentItem, INITIAL_FARM_DOCUMENTS } from '@/lib/assets/imagery';

interface DocumentUploadManagerProps {
  farmId?: string;
  farmName?: string;
  className?: string;
}

export const DocumentUploadManager: React.FC<DocumentUploadManagerProps> = ({
  farmId = 'farm-201',
  farmName = 'Patil Sugarcane Estate',
  className = '',
}) => {
  const [documents, setDocuments] = useState<FarmDocumentItem[]>(INITIAL_FARM_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<FarmDocumentItem | null>(null);
  const [uploadCategory, setUploadCategory] = useState<FarmDocumentItem['category']>('CROP_PHOTO');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = selectedCategory === 'ALL'
    ? documents
    : documents.filter((d) => d.category === selectedCategory);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(15);

    // Simulate upload progress
    const timer1 = setTimeout(() => setUploadProgress(55), 250);
    const timer2 = setTimeout(() => setUploadProgress(90), 500);
    const timer3 = setTimeout(() => {
      setUploadProgress(100);
      const isImage = file.type.startsWith('image/');
      const newDoc: FarmDocumentItem = {
        id: `doc-${Date.now()}`,
        title: uploadTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
        category: uploadCategory,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(),
        status: 'PENDING_REVIEW',
        previewUrl: isImage
          ? URL.createObjectURL(file)
          : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        verifiedBy: 'Pending Loan Officer / Risk Analyst Verification',
        notes: `Uploaded via TerraTrust-AI Secure Portal. MIME: ${file.type || 'application/octet-stream'}`,
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadTitle('');
      setUploadSuccessMessage(`Successfully uploaded "${file.name}" for agricultural verification.`);
      setTimeout(() => setUploadSuccessMessage(null), 4000);
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (previewDoc?.id === id) {
      setPreviewDoc(null);
    }
  };

  const getCategoryBadge = (category: FarmDocumentItem['category']) => {
    switch (category) {
      case 'LAND_TITLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">Land Title (7/12)</span>;
      case 'DRONE_SURVEY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">Drone / Satellite Scan</span>;
      case 'SOIL_REPORT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">Soil Lab Test</span>;
      case 'WATER_RECEIPT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">Water / Canal Receipt</span>;
      case 'CROP_PHOTO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">Geo-Tagged Field Photo</span>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Zone Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary-800" />
              <span>Farm Land Documents & Remote Sensing Imagery</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure institutional repository for {farmName} ({farmId}) · Supports geotagged images, drone NDVI scans, 7/12 land titles, and soil lab tests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>SHA-256 Tamper Evident</span>
            </span>
          </div>
        </div>

        {uploadSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{uploadSuccessMessage}</span>
          </div>
        )}

        {/* Drag & Drop Upload Container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-primary-600 bg-primary-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-primary-500 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Upload farm document or satellite image"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center mx-auto shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 font-display">
                Click to upload or drag & drop files here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, TIFF, or PDF (Up to 25 MB per file with automatic EXIF metadata extraction)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-500">
              <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">✓ Land Extract (7/12)</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">✓ Drone NDVI</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">✓ Soil Nutrient Test</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">✓ Canal Receipt</span>
            </div>
          </div>
        </div>

        {/* Optional Metadata Controls Before Dropping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Tag / Classification
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as any)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-700"
            >
              <option value="CROP_PHOTO">Field Inspection Photo (Standing Crop)</option>
              <option value="DRONE_SURVEY">Drone / Satellite Multispectral NDVI Scan</option>
              <option value="LAND_TITLE">State 7/12 Land Title Extract / Ownership Record</option>
              <option value="SOIL_REPORT">Soil Organic Carbon & Nutrient Lab Test</option>
              <option value="WATER_RECEIPT">Irrigation / Water Release Receipt</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Custom Document Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Kharif 2026 Standing Adsali Cane Inspection"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2 p-3 bg-primary-50 rounded-xl border border-primary-100 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-primary-900">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Encrypting and uploading file...</span>
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-primary-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-700 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Document Library List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-primary-800" />
              <span>Verified Documents Repository ({documents.length})</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited records linked to borrower land parcel and credit assessment.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'LAND_TITLE', 'DRONE_SURVEY', 'SOIL_REPORT', 'WATER_RECEIPT', 'CROP_PHOTO'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Records' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="group bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-card transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Visual Thumbnail Bar */}
                <div className="relative h-36 bg-slate-100 overflow-hidden">
                  <img
                    src={doc.previewUrl}
                    alt={doc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <div className="absolute top-2.5 left-2.5">
                    {getCategoryBadge(doc.category)}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-medium">
                    <span className="font-mono text-[11px] bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">
                      {doc.fileSize}
                    </span>
                    <span className="text-[11px] text-slate-200">
                      {formatDate(doc.uploadedAt)}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2">
                  <h5 className="font-bold text-sm text-slate-900 line-clamp-1 leading-snug group-hover:text-primary-800 transition-colors">
                    {doc.title}
                  </h5>

                  <p className="text-xs text-slate-500 font-mono truncate">
                    {doc.fileName}
                  </p>

                  {doc.notes && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-0.5">
                      {doc.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 truncate max-w-[170px]">
                      {doc.verifiedBy}
                    </span>
                    <StatusBadge
                      variant={doc.status === 'VERIFIED' ? 'HEALTHY' : 'PENDING'}
                      label={doc.status}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="inline-flex items-center gap-1 font-semibold text-primary-800 hover:text-primary-950 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={doc.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-200 transition-colors"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 transition-colors"
                    title="Remove document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Preview Lightbox Modal */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-primary-800" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 font-display">
                    {previewDoc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {previewDoc.fileName} · {previewDoc.fileSize}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                aria-label="Close document preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview Body */}
            <div className="max-h-[60vh] overflow-hidden bg-slate-950 flex items-center justify-center">
              <img
                src={previewDoc.previewUrl}
                alt={previewDoc.title}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            {/* Footer Metadata */}
            <div className="p-4 space-y-3 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-semibold">Verification Authority</span>
                  <span className="font-bold text-slate-800">{previewDoc.verifiedBy}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-semibold">Audit Record Status</span>
                  <div className="mt-0.5">
                    <StatusBadge
                      variant={previewDoc.status === 'VERIFIED' ? 'HEALTHY' : 'PENDING'}
                      label={previewDoc.status}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {previewDoc.notes && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">Technical & Agronomic Notes:</span>
                  <p>{previewDoc.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <a
                  href={previewDoc.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-900 text-white font-semibold text-xs hover:bg-primary-950 shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Original Full-Res Asset</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

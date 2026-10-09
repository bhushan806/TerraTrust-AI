import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Table, Eye } from 'lucide-react';
import { FreshnessIndicator } from '@/components/data-display/FreshnessIndicator';

export interface DataSeries {
  key: string;
  name: string;
  stroke: string;
  strokeDasharray?: string;
  unit: string;
}

interface AccessibleLineChartProps {
  title: string;
  data: Record<string, any>[];
  xKey: string;
  xLabel: string;
  yLabel: string;
  series: DataSeries[];
  sourceName?: string;
  lastUpdated?: string;
  dateRange?: string;
  summaryText: string;
  missingDataExplanation?: string;
  className?: string;
}

export const AccessibleLineChart: React.FC<AccessibleLineChartProps> = ({
  title,
  data,
  xKey,
  xLabel,
  yLabel,
  series,
  sourceName = 'Observation telemetry',
  lastUpdated,
  dateRange,
  summaryText,
  missingDataExplanation,
  className = '',
}) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-4 ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
            {dateRange && <span>Range: {dateRange}</span>}
            {sourceName && <span>Source: {sourceName}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <FreshnessIndicator timestamp={lastUpdated} sourceName={sourceName} />
          )}
          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors"
            aria-pressed={showTable}
            aria-label={showTable ? 'Switch to visual chart' : 'Switch to accessible data table'}
          >
            {showTable ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show Chart</span>
              </>
            ) : (
              <>
                <Table className="w-3.5 h-3.5" />
                <span>Accessible Table</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Screen Reader Summary */}
      <p className="sr-only">{summaryText}</p>

      {/* Missing Data Disclosure */}
      {missingDataExplanation && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2.5">
          <span className="font-semibold">Observation Gap: </span>
          {missingDataExplanation}
        </div>
      )}

      {/* Chart vs Table View */}
      {showTable ? (
        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase">
              <tr>
                <th scope="col" className="px-3 py-2">{xLabel}</th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="px-3 py-2 text-right">
                    {s.name} ({s.unit})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 font-medium text-neutral-800">{row[xKey]}</td>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-2 text-right font-tabular text-neutral-700">
                      {row[s.key] !== null && row[s.key] !== undefined ? `${row[s.key]} ${s.unit}` : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#475467' }}
                label={{ value: xLabel, position: 'insideBottom', offset: -12, fontSize: 11, fill: '#475467' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#475467' }}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#475467' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-neutral-900 text-white text-xs p-2.5 rounded-lg shadow-lg space-y-1">
                        <p className="font-semibold border-b border-neutral-700 pb-1">{label}</p>
                        {payload.map((item: any, idx) => (
                          <div key={idx} className="flex justify-between gap-4">
                            <span style={{ color: item.color }}>{item.name}:</span>
                            <span className="font-bold font-tabular">
                              {item.value} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="plainline" />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  unit={s.unit}
                  stroke={s.stroke}
                  strokeWidth={2.5}
                  strokeDasharray={s.strokeDasharray}
                  dot={{ r: 3, fill: s.stroke }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

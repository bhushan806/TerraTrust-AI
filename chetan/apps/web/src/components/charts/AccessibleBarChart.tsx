import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Table, Eye } from 'lucide-react';

interface AccessibleBarChartProps {
  title: string;
  data: Record<string, any>[];
  xKey: string;
  xLabel: string;
  yLabel: string;
  bars: Array<{ key: string; name: string; fill: string; unit?: string }>;
  summaryText: string;
  className?: string;
}

export const AccessibleBarChart: React.FC<AccessibleBarChartProps> = ({
  title,
  data,
  xKey,
  xLabel,
  yLabel,
  bars,
  summaryText,
  className = '',
}) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <h3 className="text-base font-bold text-neutral-900">{title}</h3>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-700"
          aria-pressed={showTable}
        >
          {showTable ? <Eye className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
          <span>{showTable ? 'Show Chart' : 'Accessible Table'}</span>
        </button>
      </div>

      <p className="sr-only">{summaryText}</p>

      {showTable ? (
        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 uppercase font-semibold text-neutral-600">
              <tr>
                <th scope="col" className="px-3 py-2">{xLabel}</th>
                {bars.map((b) => (
                  <th key={b.key} scope="col" className="px-3 py-2 text-right">
                    {b.name} {b.unit ? `(${b.unit})` : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 font-medium text-neutral-800">{row[xKey]}</td>
                  {bars.map((b) => (
                    <td key={b.key} className="px-3 py-2 text-right font-tabular text-neutral-700">
                      {row[b.key]} {b.unit || ''}
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
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#475467' }} />
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
                            <span className="font-bold font-tabular">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} />
              {bars.map((b) => (
                <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

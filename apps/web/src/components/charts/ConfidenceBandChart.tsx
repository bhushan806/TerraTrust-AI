import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ConfidenceBandChartProps {
  data: Array<{
    period: string;
    expected: number;
    lower: number;
    upper: number;
  }>;
  unit: string;
  className?: string;
}

export const ConfidenceBandChart: React.FC<ConfidenceBandChartProps> = ({
  data,
  unit,
  className = '',
}) => {
  return (
    <div className={`h-64 sm:h-72 w-full pt-2 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#475467' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#475467' }}
            label={{ value: unit, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#475467' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-neutral-900 text-white text-xs p-2.5 rounded-lg shadow-lg space-y-1">
                    <p className="font-semibold border-b border-neutral-700 pb-1">{label}</p>
                    <div className="flex justify-between gap-4">
                      <span className="text-emerald-400">Estimated Yield:</span>
                      <span className="font-bold font-tabular">{item.expected} {unit}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-neutral-300">
                      <span>90% Uncertainty Band:</span>
                      <span className="font-tabular">{item.lower} – {item.upper} {unit}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="#D1FAE5"
            fillOpacity={0.6}
            name="Uncertainty Range"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#FFFFFF"
            fillOpacity={1}
          />
          <Line
            type="monotone"
            dataKey="expected"
            stroke="#1F6B4F"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#1F6B4F' }}
            name="Estimated Yield"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

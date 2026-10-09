import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface TrendChartProps {
  data: Array<{ value: number }>;
  isPositive?: boolean;
  className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  isPositive = true,
  className = 'w-24 h-8',
}) => {
  const color = isPositive ? '#16A34A' : '#DC2626';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.8}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import type { VolumeDataPoint } from '../../services/workoutService';

interface ExerciseVolumeChartProps {
  data: VolumeDataPoint[];
}

export default function ExerciseVolumeChart({ data }: ExerciseVolumeChartProps) {
  if (data.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-text-secondary text-sm">
        Complete more sessions to see your trend
      </div>
    );
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#a3a3a3', fontSize: 12 }}
            axisLine={{ stroke: '#333333' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#a3a3a3', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            trigger="click"
            contentStyle={{
              backgroundColor: '#242424',
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#f5f5f5',
            }}
            labelFormatter={(_label, payload) => {
              if (payload && payload.length > 0) {
                const point = payload[0].payload as VolumeDataPoint;
                return point.fullDate;
              }
              return _label;
            }}
          />
          <Line
            type="monotone"
            dataKey="volume"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6, fill: '#f97316' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

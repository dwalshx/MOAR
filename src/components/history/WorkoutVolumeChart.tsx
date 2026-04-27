import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import type { VolumeDataPoint } from '../../services/workoutService';

interface WorkoutVolumeChartProps {
  data: VolumeDataPoint[];
  metric?: 'volume' | 'intensity';
}

export default function WorkoutVolumeChart({ data, metric = 'volume' }: WorkoutVolumeChartProps) {
  // Filter out points where the metric isn't available (intensity can be null)
  const chartData = metric === 'intensity'
    ? data.filter(d => d.intensity !== null)
    : data;

  if (chartData.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-text-secondary text-sm">
        {metric === 'intensity'
          ? 'Need more workouts with timing data to chart intensity'
          : 'Complete more workouts to see your trend'}
      </div>
    );
  }

  const dataKey = metric === 'intensity' ? 'intensity' : 'volume';
  const unit = metric === 'intensity' ? 'lbs/min' : 'lbs';

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
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
            formatter={(value) => [
              `${value} ${unit}`,
              metric === 'intensity' ? 'Intensity' : 'Volume',
            ]}
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
            dataKey={dataKey}
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-accent)', r: 4 }}
            activeDot={{ r: 6, fill: 'var(--color-accent)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

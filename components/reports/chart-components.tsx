"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ChartProps {
  data: ChartData[];
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#6B7280", // Gray
];

export function BarChartComponent({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}: ChartProps) {
  const keys = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "name") : [];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {keys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineChartComponent({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}: ChartProps) {
  const keys = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "name") : [];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {keys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PieChartComponent({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AreaChartComponent({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}: ChartProps) {
  const keys = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "name") : [];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          {keys.map((key, index) => (
            <linearGradient key={key} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {keys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            fillOpacity={1}
            fill={`url(#color${index})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RadarChartComponent({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}: ChartProps) {
  const keys = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "name") : [];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis />
        <Tooltip />
        <Legend />
        {keys.map((key, index) => (
          <Radar
            key={key}
            name={key}
            dataKey={key}
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.6}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function TreemapChartComponent({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap
        data={data}
        dataKey="value"
        ratio={4 / 3}
        stroke="#fff"
        fill="#8884d8"
        content={({ x, y, width, height, index, payload }) => {
          return (
            <g>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                  fill: colors[index % colors.length],
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
              <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                fill="#fff"
                fontSize={14}
                fontWeight="bold"
              >
                {payload.name}
              </text>
              <text
                x={x + width / 2}
                y={y + height / 2 + 16}
                textAnchor="middle"
                fill="#fff"
                fontSize={12}
              >
                {payload.value}
              </text>
            </g>
          );
        }}
      />
    </ResponsiveContainer>
  );
}

export function FunnelChartComponent({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <FunnelChart>
        <Tooltip />
        <Funnel
          dataKey="value"
          data={data}
          isAnimationActive
        >
          <LabelList
            position="right"
            fill="#000"
            stroke="none"
            dataKey="name"
          />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

export function ComposedChartComponent({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}: ChartProps) {
  const keys = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "name") : [];
  const barKeys = keys.slice(0, Math.floor(keys.length / 2));
  const lineKeys = keys.slice(Math.floor(keys.length / 2));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        {barKeys.map((key, index) => (
          <Bar
            key={key}
            yAxisId="left"
            dataKey={key}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
        {lineKeys.map((key, index) => (
          <Line
            key={key}
            yAxisId="right"
            type="monotone"
            dataKey={key}
            stroke={colors[(barKeys.length + index) % colors.length]}
            strokeWidth={2}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ScatterChartComponent({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
}: ChartProps) {
  const keys = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "name" && k !== "x" && k !== "y" && k !== "z") : [];
  const hasZ = data.some((d) => "z" in d);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" name="X" type="number" />
        <YAxis dataKey="y" name="Y" type="number" />
        {hasZ && <ZAxis dataKey="z" range={[50, 400]} name="Z" />}
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Legend />
        {keys.length > 0 ? (
          keys.map((key, index) => (
            <Scatter
              key={key}
              name={key}
              data={data}
              fill={colors[index % colors.length]}
            />
          ))
        ) : (
          <Scatter name="Data" data={data} fill={colors[0]} />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}


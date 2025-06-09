import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface BarChartProps {
  data: {
    name: string
    total: number
  }[]
}

export function BarChartComponent({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₱${value.toLocaleString()}`}
        />
        <Bar
          dataKey="total"
          fill="#3498db"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

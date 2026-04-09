import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/index';

interface DeliveryTrendData {
  date: string;
  count: number;
}

interface DeliveryTrendChartProps {
  data: DeliveryTrendData[];
}

export function DeliveryTrendChart({ data }: DeliveryTrendChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.date, 'short'),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Trends</CardTitle>
        <CardDescription>Daily delivery volume over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="date" 
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--popover-foreground))',
              }}
            />
            <Legend 
              wrapperStyle={{
                color: 'hsl(var(--foreground))',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
              activeDot={{ r: 6 }}
              name="Deliveries"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface RevenueData {
  period: string;
  revenue: number;
  expenses?: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Revenue and expenses by period</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="period" 
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend 
              wrapperStyle={{
                color: 'hsl(var(--foreground))',
              }}
            />
            <Bar 
              dataKey="revenue" 
              fill="hsl(var(--chart-1))" 
              radius={[4, 4, 0, 0]}
              name="Revenue"
            />
            {data.some(item => item.expenses !== undefined) && (
              <Bar 
                dataKey="expenses" 
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]}
                name="Expenses"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface StatusDistributionData {
  status: string;
  count: number;
  color?: string;
}

interface StatusDistributionChartProps {
  data: StatusDistributionData[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: ((item.count / total) * 100).toFixed(1),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>Breakdown of deliveries by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, percentage }) => `${status}: ${percentage}%`}
              outerRadius={100}
              fill="hsl(var(--chart-1))"
              dataKey="count"
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} (${props.payload.percentage}%)`,
                props.payload.status,
              ]}
            />
            <Legend 
              wrapperStyle={{
                color: 'hsl(var(--foreground))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

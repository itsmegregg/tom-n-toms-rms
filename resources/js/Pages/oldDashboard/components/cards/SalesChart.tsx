"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import dayjs from "dayjs";
import html2canvas from 'html2canvas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Button } from "@/Components/ui/button";
import { Download, TrendingUp } from "lucide-react";

interface SaleData {
  date_formatted: string;
  total_sales: number;
}

interface SalesChartProps {
  monthlySales: {
    status: string;
    data: SaleData[];
  };
}

export function SalesChart({ monthlySales }: SalesChartProps) {
  const salesData = monthlySales?.data || [];

  // Calculate trend percentage
  const calculateTrend = () => {
    if (salesData.length < 2) return 0;
    const lastDay = salesData[salesData.length - 1].total_sales;
    const previousDay = salesData[salesData.length - 2].total_sales;
    if (previousDay === 0) return 0;
    return ((lastDay - previousDay) / previousDay) * 100;
  };

  const trendPercentage = calculateTrend();

  const downloadSVG = () => {
    const svg = document.querySelector(".recharts-wrapper svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-chart-${dayjs().format('YYYY-MM-DD')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadImage = async (type: 'png' | 'jpeg') => {
    const chartElement = document.querySelector('.recharts-wrapper');
    if (!chartElement) return;

    try {
      const canvas = await html2canvas(chartElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `sales-chart-${dayjs().format('YYYY-MM-DD')}.${type}`;
      link.href = canvas.toDataURL(`image/${type}`, 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const downloadCSV = () => {
    const csvContent = [
      ["Date", "Total Sales"],
      ...salesData.map(item => [
        item.date_formatted,
        item.total_sales.toFixed(2)
      ])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-chart-${dayjs().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const xlsContent = [
      ["Date", "Total Sales"],
      ...salesData.map(item => [
        item.date_formatted,
        item.total_sales.toFixed(2)
      ])
    ]
      .map(row => row.join("\t"))
      .join("\n");

    const blob = new Blob([xlsContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-chart-${dayjs().format('YYYY-MM-DD')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">Daily Sales Overview</CardTitle>
          <CardDescription>
            {salesData.length > 0 ? 
              `${salesData[0].date_formatted} - ${salesData[salesData.length - 1].date_formatted}` :
              'No data available'
            }
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto h-8" disabled={!salesData.length}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => downloadImage('png')}>
              Download PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadImage('jpeg')}>
              Download JPG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadSVG}>
              Download SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadCSV}>
              Download CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadExcel}>
              Download Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData} margin={{ top: 0, right: 15, left: 15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="date_formatted"
                stroke="#888888"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
              />
              <Bar
                dataKey="total_sales"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.date_formatted}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Sales
                          </span>
                          <span className="font-bold">
                            ₱{payload[0].value?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {trendPercentage !== 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
            <TrendingUp className={`h-4 w-4 ${trendPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span>
              Trending {trendPercentage >= 0 ? 'up' : 'down'} by {Math.abs(trendPercentage).toFixed(1)}% this period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

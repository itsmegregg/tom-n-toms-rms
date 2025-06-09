"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
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
import { Download } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/Components/ui/chart";

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

const chartConfig = {
  total_sales: {
    label: "Total Sales",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function SalesChart({ monthlySales }: SalesChartProps) {
  const salesData = monthlySales?.data || [];

  const downloadSVG = () => {
    const svg = document.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-chart.svg";
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
      link.download = `sales-chart.${type}`;
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
        dayjs(item.date_formatted).format("MMM DD, YYYY"),
        item.total_sales
      ])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-chart.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const xlsContent = [
      ["Date", "Total Sales"],
      ...salesData.map(item => [
        dayjs(item.date_formatted).format("MMM DD, YYYY"),
        item.total_sales
      ])
    ]
      .map(row => row.join("\t"))
      .join("\n");

    const blob = new Blob([xlsContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-chart.xls";
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
          <CardDescription>{dayjs().format("MMMM YYYY")}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto h-8">
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
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="w-full h-[450px]">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={salesData}>
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                className="stroke-border"
              />
              <XAxis
                dataKey="date_formatted"
                tickFormatter={(value) => dayjs(value).format("MMM DD")}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
                className="text-sm text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                className="text-sm text-muted-foreground"
              />
              <Bar
                dataKey="total_sales"
                fill={`hsl(${getComputedStyle(document.documentElement).getPropertyValue('--chart-1')})`}
                radius={[8, 8, 8, 8]}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel/>}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

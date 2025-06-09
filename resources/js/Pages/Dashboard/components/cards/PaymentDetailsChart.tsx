"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/Components/ui/card";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Label, Sector } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';
import { TrendingUp, TrendingDown, Download } from "lucide-react";
import html2canvas from 'html2canvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Button } from "@/Components/ui/button";

interface PaymentData {
  description: string;
  amount: string;
}

interface Props {
  selectedBranch?: string;
  selectedConcept?: string;
  currentMonth?: Date;
}

// Flat UI Colors palette
const FLAT_COLORS = [
  '#2ecc71', // Emerald
  '#e74c3c', // Alizarin
  '#3498db', // Peter River
  '#f1c40f', // Sun Flower
  '#9b59b6', // Amethyst
  '#e67e22', // Carrot
  '#1abc9c', // Turquoise
  '#34495e', // Wet Asphalt
  '#d35400', // Pumpkin
  '#27ae60', // Nephritis
];

// Function to shuffle and get colors
const getDistinctColors = (count: number) => {
  const shuffled = [...FLAT_COLORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// You can adjust these values to change the size of the doughnut
const INNER_RADIUS = 45;  // Makes the hole bigger/smaller
const OUTER_RADIUS = 135;  // Makes the overall chart bigger/smaller

export default function PaymentDetailsChart({ selectedBranch = 'all', selectedConcept = 'all', currentMonth = new Date() }: Props) {
  const [data, setData] = React.useState<PaymentData[]>([]);
  const [colors, setColors] = React.useState<string[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  React.useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        console.log('Params:', {
          month: dayjs(currentMonth).format('YYYY-MM'),
          branch_id: selectedBranch === 'all' ? 'ALL' : selectedBranch,
          concept_id: selectedConcept === 'all' ? 'ALL' : selectedConcept
        });
        const response = await axios.get('/api/v1/dashboard/payment-chart', {
          params: {
            month: dayjs(currentMonth).format('YYYY-MM'),
            branch_id: selectedBranch === 'all' ? 'ALL' : selectedBranch,
            concept_id: selectedConcept === 'all' ? 'ALL' : selectedConcept
          }
        });

        const transformedData = response.data.map((item: PaymentData) => ({
          description: item.description,
          amount: parseFloat(item.amount.replace(/,/g, '')),
        }));

        // Get distinct colors for the data points
        const newColors = getDistinctColors(transformedData.length);
        setColors(newColors);

        setData(transformedData);
      } catch (error) {
        console.error('Error fetching payment data:', error);
        setData([]);
      }
    };

    fetchPaymentData();
  }, [currentMonth, selectedBranch, selectedConcept]);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {data.description}
            </span>
            <span className="text-lg font-bold">
              ₱{parseFloat(data.amount.toString()).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.4; // Increase this value to push labels further out
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const textAnchor = cos >= 0 ? 'start' : 'end';
    const amount = parseFloat(payload.amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Create line from pie to label
    const innerX = cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN);
    const innerY = cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        {/* Connector line */}
        <path
          d={`M ${cx + outerRadius * Math.cos(-midAngle * RADIAN)},${
            cy + outerRadius * Math.sin(-midAngle * RADIAN)
          } L ${innerX},${innerY} L ${x},${y}`}
          stroke="#888888"
          fill="none"
          strokeWidth={1}
        />
        {/* Background for better readability */}
        <rect
          x={x + (cos >= 0 ? 5 : -5)}
          y={y - 20}
          width={180}
          height={40}
          fill="rgba(255, 255, 255, 0.9)"
          rx={4}
        />
        {/* Text elements */}
        <text
          x={x + (cos >= 0 ? 10 : -10)}
          y={y - 5}
          textAnchor={textAnchor}
          fill="#333333"
          fontSize="12"
          fontWeight="500"
        >
          {payload.description}
        </text>
        <text
          x={x + (cos >= 0 ? 10 : -10)}
          y={y + 15}
          textAnchor={textAnchor}
          fill="#666666"
          fontSize="12"
        >
          ₱{amount}
        </text>
      </g>
    );
  };

  const downloadSVG = () => {
    const svg = document.querySelector(".payment-chart svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "payment-methods-chart.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadImage = async (type: 'png' | 'jpeg') => {
    const chartElement = document.querySelector('.payment-chart');
    if (!chartElement) return;

    try {
      const canvas = await html2canvas(chartElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `payment-methods-chart.${type}`;
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
      ["Payment Method", "Amount"],
      ...data.map(item => [
        item.description,
        item.amount.toString()
      ])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payment-methods-data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const xlsContent = [
      ["Payment Method", "Amount"],
      ...data.map(item => [
        item.description,
        item.amount.toString()
      ])
    ]
      .map(row => row.join("\t"))
      .join("\n");

    const blob = new Blob([xlsContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payment-methods-data.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="flex flex-col h-[550px] mb-5">
      <CardHeader className="pb-2">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Payment Methods</CardTitle>
            <CardDescription>{dayjs(currentMonth).format('MMMM YYYY')}</CardDescription>
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
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="payment-chart h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="description"
                cx="50%"
                cy="50%"
                innerRadius={INNER_RADIUS}
                outerRadius={OUTER_RADIUS}
                paddingAngle={2}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ zIndex: 100 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
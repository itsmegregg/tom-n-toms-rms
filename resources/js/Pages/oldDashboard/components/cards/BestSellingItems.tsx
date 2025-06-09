import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface BestSellingItem {
  name: string;
  quantity: number;
  revenue: number;
  trend: 'up' | 'down' | 'neutral';
  percentageChange: number;
}

interface BestSellingItemsProps {
  items: BestSellingItem[];
  formatCurrency: (amount: number) => string;
}

export function BestSellingItems({ items, formatCurrency }: BestSellingItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Selling Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium">Item Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Quantity Sold</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Revenue</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={index}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="p-4 align-middle">{item.name}</td>
                  <td className="p-4 align-middle">{item.quantity}</td>
                  <td className="p-4 align-middle">{formatCurrency(item.revenue)}</td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <span className={item.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}>
                        {item.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </span>
                      <span className={item.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}>
                        {item.percentageChange}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

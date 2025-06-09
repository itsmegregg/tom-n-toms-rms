import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";

interface TotalSalesProps {
    selectedBranch: string;
    selectedConcept: string;
    currentMonth: Date;
}

interface TotalSalesData {
    status: string;
    data: {
        average_sales: number;
        total_sales: number;
        total_days: number;
    };
}

export default function TotalSales({ selectedBranch, selectedConcept, currentMonth }: TotalSalesProps) {
    const [totalSalesData, setTotalSalesData] = useState<TotalSalesData | null>(null);

    useEffect(() => {
        const fetchTotalSales = async () => {
            try {
                const response = await axios.get('/api/v1/dashboard/average-sales-per-day', {
                    params: {
                        month: dayjs(currentMonth).format('YYYY-MM'),
                        branch_id: selectedBranch === 'all' ? 'ALL' : selectedBranch,
                        concept_id: selectedConcept === 'all' ? 'ALL' : selectedConcept
                    }
                });
                setTotalSalesData(response.data);
            } catch (error) {
                console.error('Error fetching total sales:', error);
                setTotalSalesData(null);
            }
        };

        fetchTotalSales();
    }, [currentMonth, selectedBranch, selectedConcept]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Total Sales
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>   
            <CardContent>
                <div className="text-2xl font-bold">
                    {totalSalesData?.data ? formatCurrency(totalSalesData.data.total_sales) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                    {totalSalesData?.data 
                        ? `${dayjs(currentMonth).format('MMMM YYYY')}` 
                        : 'No data available'}
                </p>
            </CardContent>
        </Card> 
    );
}

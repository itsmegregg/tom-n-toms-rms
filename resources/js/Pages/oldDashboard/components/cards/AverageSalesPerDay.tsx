import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";

interface AverageSalesPerDayProps {
    selectedBranch: string;
    selectedConcept: string;
    currentMonth: Date;
}

interface AverageSalesData {
    status: string;
    data: {
        average_sales: number;
        total_sales: number;
        total_days: number;
    };
}

export default function AverageSalesPerDay({ selectedBranch, selectedConcept, currentMonth }: AverageSalesPerDayProps) {
    const [averageSalesData, setAverageSalesData] = useState<AverageSalesData | null>(null);

    useEffect(() => {
        const fetchAverageSales = async () => {
            try {
                const response = await axios.get('/api/v1/dashboard/average-sales-per-day', {
                    params: {
                        month: dayjs(currentMonth).format('YYYY-MM'),
                        branch_id: selectedBranch === 'all' ? 'ALL' : selectedBranch,
                        concept_id: selectedConcept === 'all' ? 'ALL' : selectedConcept
                    }
                });
                setAverageSalesData(response.data);
            } catch (error) {
                console.error('Error fetching average sales:', error);
                setAverageSalesData(null);
            }
        };

        fetchAverageSales();
    }, [currentMonth, selectedBranch, selectedConcept]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    return (
        <Card className="w-full ">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Average Sales per Day
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>   
            <CardContent>
                <div className="text-2xl font-bold">
                    {averageSalesData?.data ? formatCurrency(averageSalesData.data.average_sales) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                    {averageSalesData?.data 
                        ? `Based on ${averageSalesData.data.total_days} days` 
                        : 'No data available'}
                </p>
            </CardContent>
        </Card> 
    );
}
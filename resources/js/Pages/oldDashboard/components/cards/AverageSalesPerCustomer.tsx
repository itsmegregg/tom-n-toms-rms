import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { DollarSign } from "lucide-react";

interface Props {
    selectedBranch: string;
    selectedConcept: string;
    currentMonth: Date;
}

export default function AverageSalesPerCustomer({ selectedBranch, selectedConcept, currentMonth }: Props) {
    const [averageSales, setAverageSales] = useState<number>(0);
    const [totalSales, setTotalSales] = useState<number>(0);
    const [totalGuests, setTotalGuests] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Format the date to YYYY-MM format
                const formattedMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
                
                console.log('Fetching with params:', {
                    month: formattedMonth,
                    branch_id: selectedBranch,
                    concept_id: selectedConcept
                });

                const response = await axios.get(`/api/v1/dashboard/average-sales-per-customer`, {
                    params: {
                        month: formattedMonth,
                        branch_id: selectedBranch.toUpperCase(),
                        concept_id: selectedConcept.toUpperCase()
                    }
                });

                console.log('API Response:', response.data);

                if (response.data) {
                    const avgSales = Number(response.data.data.average_sales_per_customer) || 0;
                    setAverageSales(avgSales);
                    setTotalSales(Number(response.data.data.total_sales) || 0);
                    setTotalGuests(Number(response.data.data.total_guests) || 0);
                }
            } catch (error) {
                console.error('Error fetching average sales per customer:', error);
                setAverageSales(0);
                setTotalSales(0);
                setTotalGuests(0);
            } finally {
                setLoading(false);
            }
        };

        if (currentMonth) {
            fetchData();
        }
    }, [currentMonth, selectedBranch, selectedConcept]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Average Sales Per Customer
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="text-2xl font-bold">
                            {formatCurrency(averageSales)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total Sales: {formatCurrency(totalSales)} / Total Guests: {totalGuests.toLocaleString()}
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

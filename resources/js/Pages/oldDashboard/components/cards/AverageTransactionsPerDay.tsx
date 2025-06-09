import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";

interface AverageTransactionsProps {
    selectedBranch: string;
    selectedConcept: string;
    currentMonth: Date;
}

interface TransactionsData {
    status: string;
    data: {
        average_transaction_per_day: number;
        total_transactions: number;
        total_days: number;
    };
}

export default function AverageTransactionsPerDay({ selectedBranch, selectedConcept, currentMonth }: AverageTransactionsProps) {
    const [transactionsData, setTransactionsData] = useState<TransactionsData | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axios.get('/api/v1/dashboard/average-tx-per-day', {
                    params: {
                        month: dayjs(currentMonth).format('YYYY-MM'),
                        branch_id: selectedBranch === 'all' ? 'ALL' : selectedBranch,
                        concept_id: selectedConcept === 'all' ? 'ALL' : selectedConcept
                    }
                });
                setTransactionsData(response.data);
            } catch (error) {
                console.error('Error fetching average transactions:', error);
                setTransactionsData(null);
            }
        };

        fetchTransactions();
    }, [currentMonth, selectedBranch, selectedConcept]);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Average Transactions per Day
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>   
            <CardContent>
                <div className="text-2xl font-bold">
                    {transactionsData?.data?.average_transaction_per_day 
                        ? Math.round(transactionsData.data.average_transaction_per_day).toLocaleString()
                        : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                    {transactionsData?.data 
                        ? `Based on ${transactionsData.data.total_transactions?.toLocaleString() || '0'} transactions over ${transactionsData.data.total_days || '0'} days` 
                        : 'No data available'}
                </p>
            </CardContent>
        </Card> 
    );
}

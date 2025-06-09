import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button } from "@/Components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/Components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { Calendar } from "@/Components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { subDays } from 'date-fns';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody,
  TableCell 
} from "@/Components/ui/table";
import { useTheme } from "next-themes";
import { useToast } from "@/Components/ui/use-toast";
import { Alert, AlertDescription } from "@/Components/ui/alert";

interface Concept {
  concept_id: number;
  concept_name: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
}

interface DailySalesData {
  hourly_id: number;
  branch_id: number;
  concept_id: number;
  date: string;
  hour: number;
  total_trans: number;
  total_void: number;
  total_sales: string;
  total_discount: string;
  reg: string;
  branch_name: string;
  concept_name: string;
}

interface ProcessedDailySalesData {
  date: string;
  branch_id: number;
  branch_name: string;
  concept_id: number;
  concept_name: string;
  total_trans: number;
  total_void: number;
  total_sales: number;
  total_discount: number;
  reg: string;
}

interface ApiResponse {
  status: string;
  data: DailySalesData[];
}

export default function DailySales({ auth }: PageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [discountData, setDiscountData] = useState<ProcessedDailySalesData[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConcepts();
  }, []);

  useEffect(() => {
    if (selectedConcept) {
      fetchBranches();
    }
  }, [selectedConcept]);

  const fetchConcepts = async () => {
    try {
      const response = await axios.get('/api/v1/concepts');
      setConcepts(response.data.data || []); 
    } catch (error) {
      console.error('Error fetching concepts:', error);
      setConcepts([]); 
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get('/api/v1/branches', {
        params: {
          concept_id: selectedConcept !== "ALL" ? selectedConcept : undefined
        }
      });
      setBranches(response.data.data || []); 
      console.log(response.data.data)
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch branches. Please try again."
      });
      setBranches([]); 
    }
  };

  const handleSearch = async () => {
    setError(null);
    setLoading(true);

    if (!dateRange?.from || !dateRange?.to) {
      setError('Please select a date range');
      setLoading(false);
      return;
    }

    try {
      const params = {
        from_date: format(dateRange.from, 'yyyy-MM-dd'),
        to_date: format(dateRange.to, 'yyyy-MM-dd'),
        branch_id: selectedBranch === 'all' ? null : selectedBranch, // Fixed ternary operator
        concept_id: selectedConcept === 'all' ? null : selectedConcept, // Fixed ternary operator
      };

      console.log('Fetching with params:', params);

      const response = await axios.get('/api/v1/daily-sales', { params });
      
      if (!response.data || !Array.isArray(response.data.data)) {
        setError('Invalid response format from server');
        setDiscountData([]);
        setLoading(false);
        return;
      }

      const processedData = processData(response.data.data);
      setDiscountData(processedData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      setDiscountData([]);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: DailySalesData[]): ProcessedDailySalesData[] => {
    const groupedData = data.reduce((acc: { [key: string]: ProcessedDailySalesData }, curr) => {
      const key = `${curr.date}_${curr.branch_id}_${curr.concept_id}`;
      
      if (!acc[key]) {
        acc[key] = {
          date: curr.date,
          branch_id: curr.branch_id,
          branch_name: curr.branch_name,
          concept_id: curr.concept_id,
          concept_name: curr.concept_name,
          total_trans: 0,
          total_void: 0,
          total_sales: 0,
          total_discount: 0,
          reg: curr.reg,
        };
      }

      acc[key].total_trans += Number(curr.total_trans) || 0;
      acc[key].total_void += Number(curr.total_void) || 0;
      acc[key].total_sales += Number(curr.total_sales) || 0;
      acc[key].total_discount += Number(curr.total_discount) || 0;

      return acc;
    }, {});

    return Object.values(groupedData);
  };

  const formatNumber = (num: number | string | null | undefined) => {
    if (num === null || num === undefined) return '0.00';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-PH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  const exportToExcel = () => {
    if (!discountData.length) return;

    const worksheet = XLSX.utils.json_to_sheet(
        discountData.map(item => ({
            Date: format(new Date(item.date), 'MMM dd, yyyy'),
            Branch: item.branch_name,
            Concept: item.concept_name,
            'Total Transactions': item.total_trans,
            'Total Voids': item.total_void,
            'Total Sales': formatNumber(item.total_sales),
            'Total Discount': formatNumber(item.total_discount),
            'Register': item.reg
        }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Sales');
    XLSX.writeFile(workbook, `daily_sales_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = () => {
    if (!discountData.length) return;

    const doc = new jsPDF();
    
    const tableColumn = [
        'Date', 'Branch', 'Concept', 'Trans', 'Voids', 'Sales', 'Discount', 'Reg'
    ];
    const tableRows = discountData.map(item => [
        format(new Date(item.date), 'MMM dd, yyyy'),
        item.branch_name,
        item.concept_name,
        item.total_trans.toString(),
        item.total_void.toString(),
        formatNumber(item.total_sales),
        formatNumber(item.total_discount),
        item.reg
    ]);

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { top: 20 }
    });

    doc.save(`daily_sales_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Daily Sales" />

      <div className="py-12">
        <div className="mx-auto sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-2 mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold dark:text-white">
              Daily Sales Report
            </h1>
            <div className='flex space-x-2'>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none items-center justify-center dark:text-white dark:hover:bg-gray-700"
                onClick={exportToExcel}
                disabled={loading || discountData.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export Excel</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none items-center justify-center dark:text-white dark:hover:bg-gray-700"
                onClick={exportToPDF}
                disabled={loading || discountData.length === 0}
              >
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export PDF</span>
              </Button>
            </div>
          </div>

          <Card className="dark:bg-gray-800">
            <CardHeader className="p-4">
              <CardTitle className="text-base font-medium dark:text-white">
                Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48">
                  <Select
                    value={selectedConcept}
                    onValueChange={setSelectedConcept}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-gray-700 dark:text-white">
                      <SelectValue placeholder="All Concepts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Concepts</SelectItem>
                      {concepts.map((concept) => (
                        <SelectItem
                          key={concept.concept_id}
                          value={concept.concept_id.toString()}
                        >
                          {concept.concept_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-48">
                  <Select
                    value={selectedBranch}
                    onValueChange={setSelectedBranch}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-gray-700 dark:text-white">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Branches</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem
                          key={branch.branch_id}
                          value={branch.branch_id.toString()}
                        >
                          {branch.branch_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-72">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "MMM dd")} -{" "}
                              {format(dateRange.to, "MMM dd, yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "MMM dd, yyyy")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0" 
                      align="start"
                    >
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button
                  className="w-full md:w-24"
                  onClick={handleSearch}
                  disabled={loading || !dateRange?.from || !dateRange?.to}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-md border dark:border-gray-700 mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Concept</TableHead>
                        <TableHead className="text-right">Trans</TableHead>
                        <TableHead className="text-right">Voids</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead>Register</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discountData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center h-24">
                            {error ? (
                              <div className="text-red-500">{error}</div>
                            ) : loading ? (
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            ) : (
                              'No records found'
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        discountData.map((row, index) => (
                          <TableRow key={`${row.date}_${row.branch_id}_${row.concept_id}_${index}`}>
                            <TableCell>{format(new Date(row.date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{row.branch_name}</TableCell>
                            <TableCell>{row.concept_name}</TableCell>
                            <TableCell className="text-right">{row.total_trans}</TableCell>
                            <TableCell className="text-right">{row.total_void}</TableCell>
                            <TableCell className="text-right">{formatNumber(row.total_sales)}</TableCell>
                            <TableCell className="text-right">{formatNumber(row.total_discount)}</TableCell>
                            <TableCell>{row.reg}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

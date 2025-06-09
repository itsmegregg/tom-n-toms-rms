import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { format, subDays } from 'date-fns';
import { 
  CalendarIcon, 
  Loader2,
  Search,
  FileSpreadsheet,
  FileText,
  Building2,
  Store,
  CreditCard
} from "lucide-react";
import axios from 'axios';
import { useEffect, useState } from 'react';
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Alert, AlertDescription } from "@/Components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface PaymentData {
  date: string;
  branch: string;
  description: string;
  amount: string;
  concept: string;
}

interface Concept {
  concept_id: number;
  concept_name: string;
  concept_description: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
  concept_id: number;
}

export default function Payment({ auth }: PageProps) {
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  useEffect(() => {
    // Fetch concepts when component mounts
    const fetchConcepts = async () => {
      try {
        const response = await axios.get('/api/v1/concepts');
        setConcepts(response.data.data);
      } catch (error) {
        console.error('Error fetching concepts:', error);
      }
    };

    fetchConcepts();
  }, []);

  useEffect(() => {
    // Fetch branches when selected concept changes
    const fetchBranches = async () => {
      if (!selectedConcept) {
        setBranches([]);
        return;
      }

      try {
        const response = await axios.get(`/api/v1/branches`, {
          params: { concept_id: selectedConcept }
        });
        setBranches(response.data.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchBranches();
  }, [selectedConcept]);

  const fetchPaymentData = async () => {
    if (!date?.from || !date?.to) return;

    try {
      setLoading(true);
      setError(null);

      const params: any = { 
        from_date: format(date.from, 'yyyy-MM-dd'),
        to_date: format(date.to, 'yyyy-MM-dd')
      };

      if (selectedBranch && selectedBranch !== 'all') {
        params.branch_id = selectedBranch;
      }

      if (selectedConcept && selectedConcept !== 'all') {
        params.concept_id = selectedConcept;
      }

      const response = await axios.get('/api/v1/payment', { params });

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Failed to fetch data');
      }

      setPaymentData(response.data.data);
    } catch (error: any) {
      setError(error.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(paymentData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Data');
    XLSX.writeFile(workbook, 'payment_report.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add Report Title
    doc.setFontSize(16);
    doc.text('Payment Report', doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    // Add Report Parameters
    doc.setFontSize(10);
    const selectedConceptName = selectedConcept === 'all' 
      ? 'All Concepts'
      : concepts.find(c => c.concept_id.toString() === selectedConcept)?.concept_name || 'N/A';
    
    const selectedBranchName = selectedBranch === 'all'
      ? 'All Branches'
      : branches.find(b => b.branch_id.toString() === selectedBranch)?.branch_name || 'N/A';

    const dateRange = date?.from && date?.to
      ? `${format(date.from, 'MMM dd, yyyy')} - ${format(date.to, 'MMM dd, yyyy')}`
      : 'N/A';

    const params = [
      `Date Range: ${dateRange}`,
      `Concept: ${selectedConceptName}`,
      `Branch: ${selectedBranchName}`
    ];

    params.forEach((text, index) => {
      doc.text(text, 14, 25 + (index * 6));
    });

    // Add table with data
    (doc as any).autoTable({
      head: [['Date', 'Concept', 'Branch', 'Description', 'Amount']],
      body: paymentData.map(row => [
        row.date,
        row.concept,
        row.branch,
        row.description,
        row.amount
      ]),
      startY: 45 // Start table after the header
    });
    
    doc.save('payment_report.pdf');
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Payment Report" />

      <div className="py-12">
        <div className="mx-auto sm:px-6 lg:px-8">
          <div className="flex justify-between space-x-2 mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Payment Report</h1>
            </div>
            <div className='flex flex-col md:flex-row gap-2'>
              <Button
                variant="outline"
                className="flex items-center"
                onClick={exportToExcel}
                disabled={loading || paymentData.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                className="flex items-center"
                onClick={exportToPDF}
                disabled={loading || paymentData.length === 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-48">
                    <label className="block text-sm font-medium mb-1">
                      Concept
                    </label>
                    <Select
                      value={selectedConcept || ''}
                      onValueChange={setSelectedConcept}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select concept" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Concepts</SelectItem>
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

                  <div className="w-48">
                    <label className="block text-sm font-medium mb-1">
                      Branch
                    </label>
                    <Select
                      value={selectedBranch || ''}
                      onValueChange={setSelectedBranch}
                      disabled={!selectedConcept}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
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

                  <div className="w-72">
                    <label className="block text-sm font-medium mb-1">
                      Date Range
                    </label>
                    <div className={cn("grid gap-2")}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                              date.to ? (
                                <>
                                  {format(date.from, "LLL dd, y")} -{" "}
                                  {format(date.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(date.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button
                      className="w-full md:w-auto"
                      onClick={fetchPaymentData}
                      disabled={loading || !date?.from || !date?.to}
                    >
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Search
                    </Button>
                  </div>
                </div>
                <br/>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Concept</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No results found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paymentData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.concept}</TableCell>
                            <TableCell>{row.branch}</TableCell>
                            <TableCell>{row.description}</TableCell>
                            <TableCell className="text-right">{row.amount}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

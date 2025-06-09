import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { format } from 'date-fns';
import { FileSpreadsheet, FileText, Loader2, CalendarIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import { Alert, AlertDescription } from "@/Components/ui/alert";
import { useToast } from "@/Components/ui/use-toast";
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Calendar } from "@/Components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from 'react-day-picker';

interface DiscountData {
  transaction_date: string;
  concept_name: string;
  branch_name: string;
  senior_disc: number;
  pwd_disc: number;
  other_disc: number;
  open_disc: number;
  employee_disc: number;
  vip_disc: number;
  promo: number;
  free: number;
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

export default function Discount({ auth }: PageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountData, setDiscountData] = useState<DiscountData[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(discountData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Discount Report");
    XLSX.writeFile(workbook, "discount_report.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add Report Title
    doc.setFontSize(16);
    doc.text('Discount Report', doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
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
      head: [['Date', 'Senior', 'PWD', 'Other', 'Open', 'Employee', 'VIP', 'Promo', 'Free']],
      body: discountData.map(row => [
        format(new Date(row.transaction_date), 'yyyy-MM-dd'),
        Number(row.senior_disc).toFixed(2),
        Number(row.pwd_disc).toFixed(2),
        Number(row.other_disc).toFixed(2),
        Number(row.open_disc).toFixed(2),
        Number(row.employee_disc).toFixed(2),
        Number(row.vip_disc).toFixed(2),
        Number(row.promo).toFixed(2),
        Number(row.free).toFixed(2)
      ]),
      startY: 45 // Start table after the header
    });
    
    doc.save('discount_report.pdf');
  };

  const handleSearch = async () => {
    if (!date?.from || !date?.to) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a date range",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/v1/item-sales/discount-report', {
        params: {
          concept_id: selectedConcept !== "all" ? selectedConcept : undefined,
          branch_id: selectedBranch !== "all" ? selectedBranch : undefined,
          start_date: format(date.from, 'yyyy-MM-dd'),
          end_date: format(date.to, 'yyyy-MM-dd'),
        }
      });

      setDiscountData(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch discount data. Please try again.');
      console.error('Error fetching discount data:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch discount data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
  };

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
          concept_id: selectedConcept !== "all" ? selectedConcept : undefined
        }
      });
      setBranches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Discount Report" />

      <div className="py-12">
        <div className="mx-auto sm:px-6 lg:px-8">
          <div className="flex justify-between space-x-2 mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Discount Report</h1>
            </div>
            <div className='flex flex-col md:flex-row gap-2'>
              <Button
                variant="outline"
                className="flex items-center"
                onClick={exportToExcel}
                disabled={loading || discountData.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                className="flex items-center"
                onClick={exportToPDF}
                disabled={loading || discountData.length === 0}
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
                      value={selectedConcept}
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
                      value={selectedBranch}
                      onValueChange={setSelectedBranch}
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
                            onSelect={handleDateSelect}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button
                      className="w-full md:w-auto"
                      onClick={handleSearch}
                      disabled={loading}
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
                        <TableHead>Transaction Date</TableHead>
                        <TableHead className="text-right">Senior Disc</TableHead>
                        <TableHead className="text-right">PWD Disc</TableHead>
                        <TableHead className="text-right">Other Disc</TableHead>
                        <TableHead className="text-right">Open Disc</TableHead>
                        <TableHead className="text-right">Employee Disc</TableHead>
                        <TableHead className="text-right">VIP Disc</TableHead>
                        <TableHead className="text-right">Promo</TableHead>
                        <TableHead className="text-right">Free</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discountData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center">
                            No records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        discountData.map((row, index) => {
                          const total = Number(row.senior_disc) + 
                                      Number(row.pwd_disc) + 
                                      Number(row.other_disc) + 
                                      Number(row.open_disc) + 
                                      Number(row.employee_disc) + 
                                      Number(row.vip_disc) + 
                                      Number(row.promo) + 
                                      Number(row.free);
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{format(new Date(row.transaction_date), 'yyyy-MM-dd')}</TableCell>
                              <TableCell className="text-right">{Number(row.senior_disc).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{Number(row.pwd_disc).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{Number(row.other_disc).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{Number(row.open_disc).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{Number(row.employee_disc).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{Number(row.vip_disc).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{Number(row.promo).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{Number(row.free).toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium">{total.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                      {discountData.length > 0 && (
                        <TableRow className="font-medium">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">
                            {discountData.reduce((sum, row) => sum + Number(row.senior_disc), 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {discountData.reduce((sum, row) => sum + Number(row.pwd_disc), 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {discountData.reduce((sum, row) => sum + Number(row.other_disc), 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {discountData.reduce((sum, row) => sum + Number(row.open_disc), 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {discountData.reduce((sum, row) => sum + Number(row.employee_disc), 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {discountData.reduce((sum, row) => sum + Number(row.vip_disc), 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {discountData.reduce((sum, row) => sum + Number(row.promo), 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {discountData.reduce((sum, row) => sum + Number(row.free), 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {discountData.reduce((sum, row) => 
                              sum + Number(row.senior_disc) + 
                                    Number(row.pwd_disc) + 
                                    Number(row.other_disc) + 
                                    Number(row.open_disc) + 
                                    Number(row.employee_disc) + 
                                    Number(row.vip_disc) + 
                                    Number(row.promo) + 
                                    Number(row.free), 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
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

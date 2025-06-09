import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { cn } from '@/lib/utils';
import { PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { CalendarIcon, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Calendar } from '@/Components/ui/calendar';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { DateRange } from "react-day-picker";
import { format, subDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Concept {
  concept_id: number;
  concept_name: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
  concept_id: number;
}

interface BIRDetailedReport {
  id: number;
  branch_id: number;
  concept_id: number;
  date: string;
  si_number: number;
  vat_exempt: number;
  vat_zero_rate: number;
  vatable_amount: number;
  vat_12: number;
  less_vat: number;
  gross_amount: number;
  discount_type: string;
  discount_amount: number;
  service_charge: number;
  takeout_charge: number;
  delivery_charge: number;
  total_charge: number;
  net_total: number;
  cash: number;
  other_payment: number;
  tx_number: number;
  branch_name: string;
  concept_name: string;
}

interface PaginationState {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}

interface BirData {
  branch_name: string;
  concept_name: string;
  date: string;
  si_number: string;
  vat_exempt: number;
  vat_zero_rate: number;
  vatable_amount: number;
  vat_12: number;
  less_vat: number;
  gross_amount: number;
  discount_type: string;
  discount_amount: number;
  service_charge: number;
  takeout_charge: number;
  delivery_charge: number;
  total_charge: number;
  net_total: number;
  cash: number;
  other_payment: number;
  tx_number: string;
}

export default function BIRDetailed({ auth }: PageProps) {

  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>('ALL');
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [birData, setBirData] = useState<BirData[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1
  });

  const fetchBranches = async () => {
    try {
        const response = await axios.get('/api/v1/branches');
        const branchesData = response.data.data || [];
        setBranches(branchesData);
        setFilteredBranches(branchesData);
    } catch (error) {
        console.error('Error fetching branches:', error);
        setBranches([]);
        setFilteredBranches([]);
    }
};

const fetchConcepts = async () => {
    try {
        const response = await axios.get('/api/v1/concepts');
        setConcepts(response.data.data || []);
    } catch (error) {
        console.error('Error fetching concepts:', error);
        setConcepts([]);
    }
};

useEffect(() => {
    fetchConcepts();
    fetchBranches();
}, []);

useEffect(() => {
    if (selectedConcept === "all") {
        setFilteredBranches(branches);
    } else {
        const selectedConceptData = concepts.find(c => c.concept_name === selectedConcept);
        if (selectedConceptData) {
            const filtered = branches.filter(branch => branch.concept_id === selectedConceptData.concept_id);
            setFilteredBranches(filtered);
        }
    }
    setSelectedBranch("all");
}, [selectedConcept, branches, concepts]);

const handleSearch = async () => {
    try {
      setLoading(true);

      if (!date?.from || !date?.to) {
        throw new Error('Please select a date range');
      }

      const response = await axios.get('/api/v1/bir-detailed', {
        params: {
          branch_id: selectedBranch,
          concept_id: selectedConcept,
          from_date: format(date.from, 'yyyy-MM-dd'),
          to_date: format(date.to, 'yyyy-MM-dd'),
          page: pagination.currentPage,
          per_page: pagination.perPage
        },
      });
      
      if (response.data.status === 'success') {
        setBirData(response.data.data);
        setPagination({
          currentPage: response.data.pagination.current_page,
          perPage: response.data.pagination.per_page,
          total: response.data.pagination.total,
          lastPage: response.data.pagination.last_page
        });
      } else {
        throw new Error('Failed to fetch data');
      }
      
      setLoading(false);  
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error fetching data:', errorMessage);
      setBirData([]);
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      if (!date?.from || !date?.to) {
        throw new Error('Please select a date range');
      }

      setLoading(true);

      // Get all data without pagination
      const response = await axios.get('/api/v1/bir-detailed', {
        params: {
          branch_id: selectedBranch,
          concept_id: selectedConcept,
          from_date: format(date.from, 'yyyy-MM-dd'),
          to_date: format(date.to, 'yyyy-MM-dd'),
          per_page: 1000000 // Get all records
        },
      });

      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error('Failed to fetch data');
      }

      const data = response.data.data as BirData[];

      // Prepare data for Excel
      const excelData = data.map(item => ({
        'Branch': item.branch_name,
        'Concept': item.concept_name,
        'Date': format(new Date(item.date), 'MMM dd, yyyy'),
        'SI Number': item.si_number,
        'VAT Exempt': Number(item.vat_exempt).toFixed(2),
        'VAT Zero Rate': Number(item.vat_zero_rate).toFixed(2),
        'Vatable Amount': Number(item.vatable_amount).toFixed(2),
        'VAT 12%': Number(item.vat_12).toFixed(2),
        'Less VAT': Number(item.less_vat).toFixed(2),
        'Gross Amount': Number(item.gross_amount).toFixed(2),
        'Discount Type': item.discount_type,
        'Discount Amount': Number(item.discount_amount).toFixed(2),
        'Service Charge': Number(item.service_charge).toFixed(2),
        'Takeout Charge': Number(item.takeout_charge).toFixed(2),
        'Delivery Charge': Number(item.delivery_charge).toFixed(2),
        'Total Charge': Number(item.total_charge).toFixed(2),
        'Net Total': Number(item.net_total).toFixed(2),
        'Cash': Number(item.cash).toFixed(2),
        'Other Payment': Number(item.other_payment).toFixed(2),
        'TX Number': item.tx_number
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BIR Detailed Report');

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Branch
        { wch: 15 }, // Concept
        { wch: 12 }, // Date
        { wch: 10 }, // SI Number
        { wch: 12 }, // VAT Exempt
        { wch: 12 }, // VAT Zero Rate
        { wch: 12 }, // Vatable Amount
        { wch: 10 }, // VAT 12%
        { wch: 10 }, // Less VAT
        { wch: 12 }, // Gross Amount
        { wch: 15 }, // Discount Type
        { wch: 12 }, // Discount Amount
        { wch: 12 }, // Service Charge
        { wch: 12 }, // Takeout Charge
        { wch: 12 }, // Delivery Charge
        { wch: 12 }, // Total Charge
        { wch: 12 }, // Net Total
        { wch: 12 }, // Cash
        { wch: 12 }, // Other Payment
        { wch: 10 }  // TX Number
      ];
      ws['!cols'] = colWidths;

      // Generate filename with date range
      const filename = `bir_detailed_report_${format(date.from, 'MMM-dd-yyyy')}_to_${format(date.to, 'MMM-dd-yyyy')}.xlsx`;

      // Save the file
      XLSX.writeFile(wb, filename);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error exporting Excel:', errorMessage);
    }
  };

  const handleExportPdf = async () => {
    try {
      if (!date?.from || !date?.to) {
        throw new Error('Please select a date range');
      }

      setLoading(true);

      // Get all data without pagination
      const response = await axios.get('/api/v1/bir-detailed', {
        params: {
          branch_id: selectedBranch,
          concept_id: selectedConcept,
          from_date: format(date.from, 'yyyy-MM-dd'),
          to_date: format(date.to, 'yyyy-MM-dd'),
          per_page: 1000000 // Get all records
        },
      });

      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error('Failed to fetch data');
      }

      const data = response.data.data as BirData[];

      // Create PDF document
      const doc = new jsPDF('l', 'mm', 'a4') as any; // Landscape orientation
      
      // Add title and date range
      doc.setFontSize(16);
      doc.text('BIR Detailed Report', 15, 15);
      doc.setFontSize(10);
      doc.text(`Date Range: ${format(date.from, 'MMM dd, yyyy')} - ${format(date.to, 'MMM dd, yyyy')}`, 15, 22);

      // Define the columns
      const columns = [
        { header: 'Branch', dataKey: 'branch_name' },
        { header: 'Concept', dataKey: 'concept_name' },
        { header: 'Date', dataKey: 'date' },
        { header: 'SI #', dataKey: 'si_number' },
        { header: 'VAT Exempt', dataKey: 'vat_exempt' },
        { header: 'VAT Zero Rate', dataKey: 'vat_zero_rate' },
        { header: 'Vatable Amount', dataKey: 'vatable_amount' },
        { header: 'VAT 12%', dataKey: 'vat_12' },
        { header: 'Less VAT', dataKey: 'less_vat' },
        { header: 'Gross Amount', dataKey: 'gross_amount' },
        { header: 'Discount Type', dataKey: 'discount_type' },
        { header: 'Discount Amount', dataKey: 'discount_amount' },
        { header: 'Service Charge', dataKey: 'service_charge' },
        { header: 'Takeout Charge', dataKey: 'takeout_charge' },
        { header: 'Delivery Charge', dataKey: 'delivery_charge' },
        { header: 'Total Charge', dataKey: 'total_charge' },
        { header: 'Net Total', dataKey: 'net_total' },
        { header: 'Cash', dataKey: 'cash' },
        { header: 'Other Payment', dataKey: 'other_payment' },
        { header: 'TX #', dataKey: 'tx_number' }
      ];

      // Prepare the data
      const tableData = data.map((item: BirData) => ({
        ...item,
        date: format(new Date(item.date), 'MMM dd, yyyy'),
        vat_exempt: Number(item.vat_exempt).toFixed(2),
        vat_zero_rate: Number(item.vat_zero_rate).toFixed(2),
        vatable_amount: Number(item.vatable_amount).toFixed(2),
        vat_12: Number(item.vat_12).toFixed(2),
        less_vat: Number(item.less_vat).toFixed(2),
        gross_amount: Number(item.gross_amount).toFixed(2),
        discount_amount: Number(item.discount_amount).toFixed(2),
        service_charge: Number(item.service_charge).toFixed(2),
        takeout_charge: Number(item.takeout_charge).toFixed(2),
        delivery_charge: Number(item.delivery_charge).toFixed(2),
        total_charge: Number(item.total_charge).toFixed(2),
        net_total: Number(item.net_total).toFixed(2),
        cash: Number(item.cash).toFixed(2),
        other_payment: Number(item.other_payment).toFixed(2)
      }));

      // Add the table
      doc.autoTable({
        startY: 30,
        head: [columns.map(col => col.header)],
        body: tableData.map(item => columns.map(col => item[col.dataKey as keyof typeof item])),
        theme: 'grid',
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: 255,
          fontSize: 8,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Branch
          1: { cellWidth: 25 }, // Concept
          2: { cellWidth: 20 }, // Date
          3: { cellWidth: 15 }, // SI #
          4: { cellWidth: 20, halign: 'right' }, // VAT Exempt
          5: { cellWidth: 20, halign: 'right' }, // VAT Zero Rate
          6: { cellWidth: 20, halign: 'right' }, // Vatable Amount
          7: { cellWidth: 15, halign: 'right' }, // VAT 12%
          8: { cellWidth: 15, halign: 'right' }, // Less VAT
          9: { cellWidth: 20, halign: 'right' }, // Gross Amount
          10: { cellWidth: 20 }, // Discount Type
          11: { cellWidth: 20, halign: 'right' }, // Discount Amount
          12: { cellWidth: 20, halign: 'right' }, // Service Charge
          13: { cellWidth: 20, halign: 'right' }, // Takeout Charge
          14: { cellWidth: 20, halign: 'right' }, // Delivery Charge
          15: { cellWidth: 20, halign: 'right' }, // Total Charge
          16: { cellWidth: 20, halign: 'right' }, // Net Total
          17: { cellWidth: 20, halign: 'right' }, // Cash
          18: { cellWidth: 20, halign: 'right' }, // Other Payment
          19: { cellWidth: 15 } // TX #
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 2,
          valign: 'middle'
        },
        margin: { top: 30, right: 15, bottom: 15, left: 15 }
      });

      // Generate filename with date range
      const filename = `bir_detailed_report_${format(date.from, 'MMM-dd-yyyy')}_to_${format(date.to, 'MMM-dd-yyyy')}.pdf`;

      // Save the PDF
      doc.save(filename);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error exporting PDF:', errorMessage);
    }
  };

  useEffect(() => {
    if (birData.length > 0) { 
      handleSearch();
    }
  }, [pagination.currentPage]);

  return (
    <AuthenticatedLayout
      user={auth.user}
    >
      <Head title="BIR Detailed Report" />

      <div className='py-12'>
        <div className='mx-auto sm:px-6 lg:px-8'>
          <div className='flex justify-between space-x-2 mb-4'>
            <div>
              <h1 className='text-2xl font-semibold text-gray-900 dark:text-gray-200'>BIR Detailed Report</h1>
            </div>
            <div className='flex flex-col md:flex-row gap-2'>
              <Button
                variant="outline"
                className='flex items-center'
                                    onClick={handleExportExcel}
                                    disabled={loading}
                                >
                                    <FileSpreadsheet className='mr-2 h-4 w-4' />
                                    Export Excel
                                </Button>
                                <Button
                                    variant="outline"
                                    className='flex items-center'
                                    onClick={handleExportPdf}
                                >
                                    <FileText className='mr-2 h-4 w-4' />
                                    Export PDF
                                </Button>
                            </div>

                            
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle className='text-sm font-medium'>
                                    Search Filters
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className='space-y-4'>
                                        <div className='flex flex-col md:flex-row gap-4'>
                                            <div className='w-48'>
                                                <label className='block text-sm font-medium text-gray-700'>Concept</label>
                                                <Select
                                                    value={selectedConcept}
                                                    onValueChange={setSelectedConcept}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Select a concept' />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value='ALL'>All Concepts</SelectItem>
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
                                            <div className='w-48'>
                                                <label className='block text-sm font-medium text-gray-700'>Branch</label>
                                                <Select
                                                value={selectedBranch}
                                                onValueChange={setSelectedBranch}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder='Select a branch' />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value='all'>All Branches</SelectItem>
                                                    {filteredBranches.map((branch) => (
                                                        <SelectItem
                                                            key={branch.branch_id}
                                                            value={branch.branch_name}
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
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    className="w-full md:w-auto"
                                                    onClick={handleSearch}
                                                    disabled={loading || !selectedBranch || !date?.from || !date?.to}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Please wait
                                                        </>
                                                    ) : (
                                                        <>
                                                            Search
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full md:w-auto"
                                                    onClick={() => {
                                                        setSelectedBranch('all');
                                                        setSelectedConcept('all');
                                                        setDate({
                                                            from: subDays(new Date(), 7),
                                                            to: new Date(),
                                                        });
                                                        setBirData([]);
                                                        setPagination({
                                                            currentPage: 1,
                                                            perPage: 10,
                                                            total: 0,
                                                            lastPage: 1
                                                        });
                                                    }}
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                        </div>
                                                
                                        </div>
                                        <br/>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Branch</TableHead>
                                                    <TableHead>Concept</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>SI Number</TableHead>
                                                    <TableHead>VAT Exempt</TableHead>
                                                    <TableHead>VAT Zero Rate</TableHead>
                                                    <TableHead>Vatable Amount</TableHead>
                                                    <TableHead>VAT 12%</TableHead>
                                                    <TableHead>Less VAT</TableHead>
                                                    <TableHead>Gross Amount</TableHead>
                                                    <TableHead>Discount Type</TableHead>
                                                    <TableHead>Discount Amount</TableHead>
                                                    <TableHead>Service Charge</TableHead>
                                                    <TableHead>Takeout Charge</TableHead>
                                                    <TableHead>Delivery Charge</TableHead>
                                                    <TableHead>Total Charge</TableHead>
                                                    <TableHead>Net Total</TableHead>
                                                    <TableHead>Cash</TableHead>
                                                    <TableHead>Other Payment</TableHead>
                                                    <TableHead>TX Number</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {birData.map((item, index) => (
                                                    <TableRow key={index} className="bg-white border-b">
                                                        <TableCell>{item.branch_name}</TableCell>
                                                        <TableCell>{item.concept_name}</TableCell>
                                                        <TableCell>{format(new Date(item.date), 'yyyy-MM-dd')}</TableCell>
                                                        <TableCell>{`${item.si_number}`}</TableCell>
                                                        <TableCell>{`${Number(item.vat_exempt).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.vat_zero_rate).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.vatable_amount).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.vat_12).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.less_vat).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.gross_amount).toFixed(2)}`}</TableCell>
                                                        <TableCell>{item.discount_type}</TableCell>
                                                        <TableCell>{`${Number(item.discount_amount).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.service_charge).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.takeout_charge).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.delivery_charge).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.total_charge).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.net_total).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.cash).toFixed(2)}`}</TableCell>
                                                        <TableCell>{`${Number(item.other_payment).toFixed(2)}`}</TableCell>
                                                        <TableCell>{item.tx_number}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="flex items-center justify-between mt-4 gap-4">
                                            <div className="text-sm text-gray-600">
                                                Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of {pagination.total} entries
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setPagination(prev => ({
                                                        ...prev,
                                                        currentPage: prev.currentPage - 1
                                                    }))}
                                                    disabled={pagination.currentPage === 1 || loading}
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setPagination(prev => ({
                                                        ...prev,
                                                        currentPage: prev.currentPage + 1
                                                    }))}
                                                    disabled={pagination.currentPage === pagination.lastPage || loading}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Data Table */}
                      
                      </div>
                    </div>
    </AuthenticatedLayout>
  );
}

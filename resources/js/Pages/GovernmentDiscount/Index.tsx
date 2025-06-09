import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { FileSpreadsheet, FileDown, Download, Loader2, Calendar1Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { ReactNode, Key, useEffect, useState } from 'react';
import axios from 'axios';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/Components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Concept {
    branch_name: ReactNode;
    branch_id: Key | null | undefined;
    concept_id: number;
    concept_name: string;
}

interface Branch {
    branch_id: number;
    branch_name: string;
    concept_id: number;
}

interface GovDiscountData {
    branch_name: string;
    concept_name: string;
    date: string;
    terminal: string;
    id_no: string;
    id_type: string;
    name: string;
    ref_number: string;
    
    gross_amount: string;
    discount_amount: string;
}

interface PaginatedResponse {
    current_page: number;
    data: GovDiscountData[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export default function Index({ auth }: PageProps) {
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedConcept, setSelectedConcept] = useState<string>("all");
    const [selectedBranch, setSelectedBranch] = useState<string>("all");
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });
    const [loading, setLoading] = useState(false);
    const [discountData, setDiscountData] = useState<GovDiscountData[]>([]);
    const [pagination, setPagination] = useState<Omit<PaginatedResponse, 'data'> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [exportLoading, setExportLoading] = useState<'excel' | 'pdf' | null>(null);

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

    const fetchDiscountData = async (page: number = 1) => {
        if (!date?.from || !date?.to) return;

        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get('/api/v1/government-discounts', {
                params: {
                    concept_id: selectedConcept !== "all" ? selectedConcept : 'ALL',
                    branch_id: selectedBranch !== "all" ? selectedBranch : 'ALL',
                    from_date: format(date.from, 'yyyy-MM-dd'),
                    to_date: format(date.to, 'yyyy-MM-dd'),
                    page,
                    per_page: 10
                }
            });
            
            if (response.data.status === 'success') {
                setDiscountData(response.data.data.data);
                const { data, ...paginationInfo } = response.data.data;
                setPagination(paginationInfo);
                setCurrentPage(page);
            } else {
                setError('Failed to fetch data');
            }
        } catch (error: any) {
            console.error('Error fetching discount data:', error);
            setDiscountData([]);
            setPagination(null);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('An error occurred while fetching data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        if (!date?.from || !date?.to) return;
        
        setExportLoading('excel');
        try {
            const response = await axios.get('/api/v1/government-discounts', {
                params: {
                    concept_id: selectedConcept !== "all" ? selectedConcept : 'ALL',
                    branch_id: selectedBranch !== "all" ? selectedBranch : 'ALL',
                    from_date: format(date.from, 'yyyy-MM-dd'),
                    to_date: format(date.to, 'yyyy-MM-dd'),
                    per_page: 1000000 // Get all records for export
                }
            });

            if (response.data.status === 'success') {
                const data = response.data.data.data;
                
                // Prepare data for Excel
                const excelData = data.map((item: GovDiscountData) => ({
                    Branch: item.branch_name,
                    Concept: item.concept_name,
                    Date: format(new Date(item.date), 'MMM dd, yyyy'),
                    Terminal: item.terminal,
                    'ID No.': item.id_no,
                    'ID Type': item.id_type,
                    Name: item.name,
                    'Ref #': item.ref_number,
                 
                    'Gross Amount': Number(item.gross_amount).toFixed(2),
                    'Discount Amount': Number(item.discount_amount).toFixed(2)
                }));

                // Create workbook and worksheet
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(excelData);

                // Add worksheet to workbook
                XLSX.utils.book_append_sheet(wb, ws, 'Government Discounts');

                // Auto-size columns
                const colWidths = Object.keys(excelData[0] || {}).map(key => ({
                    wch: Math.max(key.length, ...excelData.map((row: Record<string, any>) => String(row[key]).length))
                }));
                ws['!cols'] = colWidths;

                // Generate Excel file
                XLSX.writeFile(wb, `government_discounts_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
            } else {
                setError('Failed to export data');
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error);
        } finally {
            setExportLoading(null);
        }
    };

    const handleExportPdf = async () => {
        if (!date?.from || !date?.to) return;
        
        setExportLoading('pdf');
        try {
            const response = await axios.get('/api/v1/government-discounts', {
                params: {
                    concept_id: selectedConcept !== "all" ? selectedConcept : 'ALL',
                    branch_id: selectedBranch !== "all" ? selectedBranch : 'ALL',
                    from_date: format(date.from, 'yyyy-MM-dd'),
                    to_date: format(date.to, 'yyyy-MM-dd'),
                    per_page: 1000000 // Get all records for export
                }
            });

            if (response.data.status === 'success') {
                const data = response.data.data.data;
                
                // Create PDF document in landscape orientation
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });

                // Add title
                doc.setFontSize(16);
                doc.text('Government Discounts Report', doc.internal.pageSize.width / 2, 15, { align: 'center' });

                // Add date range
                doc.setFontSize(12);
                doc.text(
                    `Period: ${format(date.from, 'MMM dd, yyyy')} - ${format(date.to, 'MMM dd, yyyy')}`,
                    doc.internal.pageSize.width / 2,
                    25,
                    { align: 'center' }
                );

                // Prepare data for table
                const tableData = data.map((item: GovDiscountData) => [
                    item.branch_name,
                    item.concept_name,
                    format(new Date(item.date), 'MMM dd, yyyy'),
                    item.terminal,
                    item.id_no,
                    item.id_type,
                    item.name,
                    item.ref_number,
                
                    Number(item.gross_amount).toFixed(2),
                    Number(item.discount_amount).toFixed(2)
                ]);

                // Calculate totals
                const grossTotal = data.reduce((sum: number, item: GovDiscountData) => sum + Number(item.gross_amount), 0);
                const discountTotal = data.reduce((sum: number, item: GovDiscountData) => sum + Number(item.discount_amount), 0);

                // Add totals row
                tableData.push([
                    '', '', '', '', '', '', '', '', 'Total:',
                    grossTotal.toFixed(2),
                    discountTotal.toFixed(2)
                ]);

                // Add table with adjusted styling for landscape
                autoTable(doc, {
                    head: [[
                        'Branch', 'Concept', 'Date', 'Terminal', 'ID No.',
                        'ID Type', 'Name', 'Ref #', 'Gross Amount',
                        'Discount Amount'
                    ]],
                    body: tableData,
                    startY: 35,
                    styles: { 
                        fontSize: 9,
                        cellPadding: 2
                    },
                    headStyles: { 
                        fillColor: [226, 232, 240],
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'left'
                    },
                    columnStyles: {
                        0: { cellWidth: 35 }, // Branch
                        1: { cellWidth: 35 }, // Concept
                        2: { cellWidth: 25 }, // Date
                        3: { cellWidth: 20 }, // Terminal
                        4: { cellWidth: 25 }, // ID No
                        5: { cellWidth: 20 }, // ID Type
                        6: { cellWidth: 35 }, // Name
                        7: { cellWidth: 25 }, // Ref #
                        8: { cellWidth: 20 }, // BER
                        9: { cellWidth: 25, halign: 'right' }, // Gross Amount
                        10: { cellWidth: 25, halign: 'right' } // Discount Amount
                    },
                    margin: { left: 10, right: 10 }
                });

                // Save PDF
                doc.save(`government_discounts_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`);
            } else {
                setError('Failed to export data');
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
        } finally {
            setExportLoading(null);
        }
    };

    useEffect(() => {
        fetchConcepts();
    }, []);

    useEffect(() => {
        if (selectedConcept) {
            fetchBranches();
        }
    }, [selectedConcept]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={''}
        >
            <Head title="Government Discount" />

            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between space-x-2 mb-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Government Discount Report</h1>
                        </div>
                        <div className='flex flex-col md:flex-row gap-2'>
                            <Button
                                variant="outline"
                                className="flex items-center"
                                onClick={handleExportExcel}
                                disabled={loading || exportLoading !== null || !date?.from || !date?.to}
                            >
                                {exportLoading === 'excel' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                )}
                                Export Excel
                            </Button>
                            <Button
                                variant="outline"
                                className="flex items-center"
                                onClick={handleExportPdf}
                                disabled={loading || exportLoading !== null || !date?.from || !date?.to}
                            >
                                {exportLoading === 'pdf' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <FileDown className="mr-2 h-4 w-4" />
                                )}
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
                                        <Calendar1Icon className="mr-2 h-4 w-4" />
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

                            <div className="flex items-end gap-2">
                                <Button
                                    className="w-full md:w-auto"
                                    onClick={() => fetchDiscountData()}
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
                                            <TableHead>Branch</TableHead>
                                            <TableHead>Concept</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Terminal</TableHead>
                                            <TableHead>ID No.</TableHead>
                                            <TableHead>ID Type</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Ref #</TableHead>
                                     
                                            <TableHead className="text-right">Gross Amount</TableHead>
                                            <TableHead className="text-right">Discount Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {discountData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={11} className="text-center">
                                                    {loading ? 'Loading...' : 'No results found'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            discountData.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{row.branch_name}</TableCell>
                                                    <TableCell>{row.concept_name}</TableCell>
                                                    <TableCell>{format(new Date(row.date), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell>{row.terminal}</TableCell>
                                                    <TableCell>{row.id_no}</TableCell>
                                                    <TableCell>{row.id_type}</TableCell>
                                                    <TableCell>{row.name}</TableCell>
                                                    <TableCell>{row.ref_number}</TableCell>
                                                   
                                                    <TableCell className="text-right">{row.gross_amount}</TableCell>
                                                    <TableCell className="text-right">{row.discount_amount}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {pagination && pagination.total > 0 && (
                                <div className="flex items-center justify-between px-2 py-4">
                                    <div className="text-sm text-gray-700">
                                        Showing {pagination.from} to {pagination.to} of {pagination.total} entries
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchDiscountData(currentPage - 1)}
                                            disabled={!pagination.prev_page_url || loading}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchDiscountData(currentPage + 1)}
                                            disabled={!pagination.next_page_url || loading}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
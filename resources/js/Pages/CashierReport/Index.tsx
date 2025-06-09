import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { CalendarIcon, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateRange } from "react-day-picker";
import { format, subDays } from 'date-fns';
import { Calendar } from '@/Components/ui/calendar';
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

interface CashierReport {
    cashier_id: number;
    branch_id: number;
    concept_id: number;
    cashier: string;
    gross_sales: string;
    net_sales: string;
    cash: string;
    card: string;
    less_vat: string;
    discount: string;
    delivery_charge: string;
    service_charge: string;
    void_amount: string;
    void_count: number;
    tx_count: number;
    date: string;
    branch_name: string;
    concept_name: string;
}

interface PaginationState {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
}

const formatNumber = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '0.00';
    return Number(value).toFixed(2);
};

const calculateTotals = (data: CashierReport[]) => {
    return data.reduce((acc, item) => ({
        gross_sales: acc.gross_sales + Number(item.gross_sales),
        net_sales: acc.net_sales + Number(item.net_sales),
        cash: acc.cash + Number(item.cash),
        card: acc.card + Number(item.card),
        less_vat: acc.less_vat + Number(item.less_vat),
        discount: acc.discount + Number(item.discount),
        delivery_charge: acc.delivery_charge + Number(item.delivery_charge),
        service_charge: acc.service_charge + Number(item.service_charge),
        void_amount: acc.void_amount + Number(item.void_amount),
        void_count: acc.void_count + item.void_count,
        tx_count: acc.tx_count + item.tx_count
    }), {
        gross_sales: 0,
        net_sales: 0,
        cash: 0,
        card: 0,
        less_vat: 0,
        discount: 0,
        delivery_charge: 0,
        service_charge: 0,
        void_amount: 0,
        void_count: 0,
        tx_count: 0
    });
};

export default function Index({ auth }: any) {
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [selectedConcept, setSelectedConcept] = useState<string>("all");
    const [selectedBranch, setSelectedBranch] = useState<string>("all");
    const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<CashierReport[]>([]);
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

    const handleSearch = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!date?.from || !date?.to) {
                throw new Error('Please select a date range');
            }

            const response = await axios.get('/api/v1/cashier-report', {
                params: {
                    branch_id: selectedBranch,
                    concept_id: selectedConcept,
                    from_date: format(date.from, 'yyyy-MM-dd'),
                    to_date: format(date.to, 'yyyy-MM-dd'),
                    page: pagination.currentPage,
                    per_page: pagination.perPage
                }
            });

            if (response.data.status === 'success') {
                setReportData(response.data.data.data);
                setPagination({
                    currentPage: response.data.data.current_page,
                    perPage: response.data.data.per_page,
                    total: response.data.data.total,
                    lastPage: response.data.data.last_page
                });

                console.log(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to fetch data');
            }
        } catch (error: any) {
            console.error('Error fetching report:', error);
            setError(error.message || 'An error occurred while fetching the report');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            if (!date?.from || !date?.to) {
                throw new Error('Please select a date range');
            }

            setLoading(true);

            const response = await axios.get('/api/v1/cashier-report', {
                params: {
                    branch_id: selectedBranch,
                    concept_id: selectedConcept,
                    from_date: format(date.from, 'yyyy-MM-dd'),
                    to_date: format(date.to, 'yyyy-MM-dd'),
                    per_page: 1000000
                }
            });

            if (response.data.status !== 'success') {
                throw new Error('Failed to fetch data');
            }

            const data = response.data.data.data || [];
            const totals = calculateTotals(data);

            const excelData = data.map((item: CashierReport) => ({
                'Branch': item.branch_name,
                'Concept': item.concept_name,
                'Cashier': item.cashier,
                'Date': format(new Date(item.date), 'MMM dd, yyyy'),
                'Gross Sales': formatNumber(item.gross_sales),
                'Net Sales': formatNumber(item.net_sales),
                'Cash': formatNumber(item.cash),
                'Card': formatNumber(item.card),
                'Less VAT': formatNumber(item.less_vat),
                'Discount': formatNumber(item.discount),
                'Delivery Charge': formatNumber(item.delivery_charge),
                'Service Charge': formatNumber(item.service_charge),
                'Void Amount': formatNumber(item.void_amount),
                'Void Count': item.void_count,
                'Tx Count': item.tx_count
            }));

            // Add totals row
            excelData.push({
                'Branch': 'TOTAL',
                'Concept': '',
                'Cashier': '',
                'Date': '',
                'Gross Sales': formatNumber(totals.gross_sales),
                'Net Sales': formatNumber(totals.net_sales),
                'Cash': formatNumber(totals.cash),
                'Card': formatNumber(totals.card),
                'Less VAT': formatNumber(totals.less_vat),
                'Discount': formatNumber(totals.discount),
                'Delivery Charge': formatNumber(totals.delivery_charge),
                'Service Charge': formatNumber(totals.service_charge),
                'Void Amount': formatNumber(totals.void_amount),
                'Void Count': totals.void_count,
                'Tx Count': totals.tx_count
            });

            const ws = XLSX.utils.json_to_sheet(excelData);

            // Style the totals row
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            const lastRow = range.e.r;
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: lastRow, c: col });
                if (!ws[cellRef]) ws[cellRef] = {};
                ws[cellRef].s = { font: { bold: true } };
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Cashier Report');

            const filename = `cashier_report_${format(date.from, 'MMM-dd-yyyy')}_to_${format(date.to, 'MMM-dd-yyyy')}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (error: any) {
            console.error('Error exporting Excel:', error.message);
            setError(error.message || 'Failed to export Excel file');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPdf = async () => {
        try {
            if (!date?.from || !date?.to) {
                throw new Error('Please select a date range');
            }

            setLoading(true);

            const response = await axios.get('/api/v1/cashier-report', {
                params: {
                    branch_id: selectedBranch,
                    concept_id: selectedConcept,
                    from_date: format(date.from, 'yyyy-MM-dd'),
                    to_date: format(date.to, 'yyyy-MM-dd'),
                    per_page: 1000000
                }
            });

            if (response.data.status !== 'success') {
                throw new Error('Failed to fetch data');
            }

            const data = response.data.data.data || [];
            const totals = calculateTotals(data);

            const doc = new jsPDF('l', 'mm', 'a4') as any;
            
            // A4 landscape dimensions in mm
            const pageWidth = 297;
            const pageHeight = 210;
            const margin = 10;
            const usableWidth = pageWidth - (2 * margin);

            doc.setFontSize(14);
            doc.text('Cashier Report', margin, 20);
            doc.setFontSize(10);
            doc.text(`Date Range: ${format(date.from, 'MMM dd, yyyy')} - ${format(date.to, 'MMM dd, yyyy')}`, margin, 27);

            const tableData = [
                ...data.map((item: CashierReport) => [
                    item.branch_name,
                    item.concept_name,
                    item.cashier,
                    format(new Date(item.date), 'MMM dd, yyyy'),
                    formatNumber(item.gross_sales),
                    formatNumber(item.net_sales),
                    formatNumber(item.cash),
                    formatNumber(item.card),
                    formatNumber(item.less_vat),
                    formatNumber(item.discount),
                    formatNumber(item.delivery_charge),
                    formatNumber(item.service_charge),
                    formatNumber(item.void_amount),
                    item.void_count.toString(),
                    item.tx_count.toString()
                ]),
                [
                    'TOTAL', '', '', '',
                    formatNumber(totals.gross_sales),
                    formatNumber(totals.net_sales),
                    formatNumber(totals.cash),
                    formatNumber(totals.card),
                    formatNumber(totals.less_vat),
                    formatNumber(totals.discount),
                    formatNumber(totals.delivery_charge),
                    formatNumber(totals.service_charge),
                    formatNumber(totals.void_amount),
                    totals.void_count.toString(),
                    totals.tx_count.toString()
                ]
            ];

            doc.autoTable({
                startY: 35,
                head: [['Branch', 'Concept', 'Cashier', 'Date', 'Gross Sales', 'Net Sales', 'Cash', 'Card', 'Less VAT', 'Discount', 'Delivery', 'Service', 'Void Amt', 'Void', 'Tx']],
                body: tableData,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 1,
                },
                headStyles: {
                    fillColor: [66, 66, 66],
                    textColor: 255,
                    fontSize: 8,
                    cellPadding: 1,
                },
                columnStyles: {
                    0: { cellWidth: 30 }, // Branch
                    1: { cellWidth: 20 }, // Concept
                    2: { cellWidth: 20 }, // Cashier
                    3: { cellWidth: 20 }, // Date
                    4: { cellWidth: 20, halign: 'right' }, // Gross Sales
                    5: { cellWidth: 20, halign: 'right' }, // Net Sales
                    6: { cellWidth: 20, halign: 'right' }, // Cash
                    7: { cellWidth: 20, halign: 'right' }, // Card
                    8: { cellWidth: 18, halign: 'right' }, // Less VAT
                    9: { cellWidth: 18, halign: 'right' }, // Discount
                    10: { cellWidth: 18, halign: 'right' }, // Delivery
                    11: { cellWidth: 18, halign: 'right' }, // Service
                    12: { cellWidth: 18, halign: 'right' }, // Void Amount
                    13: { cellWidth: 12, halign: 'right' }, // Void Count
                    14: { cellWidth: 12, halign: 'right' } // Tx Count
                },
                margin: { left: margin, right: margin, top: margin },
                didParseCell: function(data: { row: { index: number }; cell: { styles: { fontStyle: string } } }) {
                    if (data.row.index === tableData.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });

            const filename = `cashier_report_${format(date.from, 'MMM-dd-yyyy')}_to_${format(date.to, 'MMM-dd-yyyy')}.pdf`;
            doc.save(filename);
        } catch (error: any) {
            console.error('Error exporting PDF:', error.message);
            setError(error.message || 'Failed to export PDF file');
        } finally {
            setLoading(false);
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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={''}
        >
            <Head title={'Cashier Report'} />
            <div className='py-12'>
                <div className='mx-auto sm:px-6 lg:px-8'>
                    <div className='flex justify-between space-x-2 mb-4'>
                        <div>
                            <h1 className="text-2xl font-semibold">Cashier Report</h1>
                        </div>
                        <div className='flex flex-col md:flex-row gap-2'>
                            <Button
                                variant="outline"
                                className='flex items-center'
                                onClick={handleExportExcel}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className='mr-2 h-4 w-4' />}
                                Export Excel
                            </Button>
                            <Button
                                variant="outline"
                                className='flex items-center'
                                onClick={handleExportPdf}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className='mr-2 h-4 w-4' />}
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
                                                <SelectItem value='all'>All Concepts</SelectItem>
                                                {concepts.map((concept) => (
                                                    <SelectItem
                                                        key={concept.concept_id}
                                                        value={concept.concept_name}
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
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="mt-4 p-4 text-sm text-red-600 bg-red-100 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Concept</TableHead>
                                    <TableHead>Cashier</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Gross Sales</TableHead>
                                    <TableHead className="text-right">Net Sales</TableHead>
                                    <TableHead className="text-right">Cash</TableHead>
                                    <TableHead className="text-right">Card</TableHead>
                                    <TableHead className="text-right">Less VAT</TableHead>
                                    <TableHead className="text-right">Discount</TableHead>
                                    <TableHead className="text-right">Delivery Charge</TableHead>
                                    <TableHead className="text-right">Service Charge</TableHead>
                                    <TableHead className="text-right">Void Amount</TableHead>
                                    <TableHead className="text-right">Void Count</TableHead>
                                    <TableHead className="text-right">Tx Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.length > 0 ? (
                                    reportData.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.branch_name}</TableCell>
                                            <TableCell>{item.concept_name}</TableCell>
                                            <TableCell>{item.cashier}</TableCell>
                                            <TableCell>{format(new Date(item.date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.gross_sales)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.net_sales)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.cash)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.card)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.less_vat)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.discount)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.delivery_charge)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.service_charge)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.void_amount)}</TableCell>
                                            <TableCell className="text-right">{item.void_count}</TableCell>
                                            <TableCell className="text-right">{item.tx_count}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={13} className="text-center py-4">
                                            No data available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {reportData.length > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to{' '}
                                {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of{' '}
                                {pagination.total} results
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPagination(prev => ({
                                            ...prev,
                                            currentPage: prev.currentPage - 1
                                        }));
                                        handleSearch();
                                    }}
                                    disabled={pagination.currentPage === 1 || loading}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPagination(prev => ({
                                            ...prev,
                                            currentPage: prev.currentPage + 1
                                        }));
                                        handleSearch();
                                    }}
                                    disabled={pagination.currentPage === pagination.lastPage || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
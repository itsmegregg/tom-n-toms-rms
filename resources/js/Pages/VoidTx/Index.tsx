import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Calendar } from "@/Components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

interface VoidTx {
    id: number;
    concept_id: number;
    concept_name: string;
    branch_id: number;
    branch_name: string;
    date: string;
    time: string;
    tx_number: number;
    terminal: string;
    salesinvoice_number: number;
    cashier_name: string;
    amount: number;
    approved_by: string;
    remarks: string;
}

interface Concept {
    concept_id: number;
    concept_name: string;
    concept_description: string;
}

interface Branch {
    branch_id: number;
    branch_name: string;
    branch_description: string;
    branch_address: string;
    concept_id: number;
    is_active: boolean;
}

export default function Index({ auth }: PageProps) {
    const [data, setData] = useState<VoidTx[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedConcept, setSelectedConcept] = useState<number | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [date, setDate] = useState<DateRange>({
        from: new Date(),
        to: new Date(),
    });
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState<'excel' | 'pdf' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        fetchConcepts();
        fetchBranches();
    }, []);

    useEffect(() => {
        if (date.from && date.to) {
            fetchData();
        }
    }, [currentPage]);

    const fetchConcepts = async () => {
        try {
            const response = await axios.get('/api/v1/concepts');
            const conceptsData = response.data.data || response.data || [];
            setConcepts(conceptsData);
        } catch (error) {
            console.error('Error fetching concepts:', error);
            setConcepts([]);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await axios.get('/api/v1/branches');
            // Ensure we're accessing the correct part of the response
            const branchesData = response.data.data || response.data || [];
            setBranches(branchesData);
        } catch (error) {
            console.error('Error fetching branches:', error);
            // Set to an empty array to prevent map errors
            setBranches([]);
        }
    };

    const fetchData = async () => {
        if (!date.from || !date.to) return;

        setLoading(true);
        try {
            const response = await axios.get('/api/v1/void-tx/search', {
                params: {
                    concept_id: selectedConcept || '',
                    branch_id: selectedBranch || '',
                    from_date: format(date.from, 'yyyy-MM-dd'),
                    to_date: format(date.to, 'yyyy-MM-dd'),
                    page: currentPage,
                    per_page: 10
                }
            });

            const responseData = response.data.data;
            setData(responseData.data);
            setTotalPages(responseData.last_page);
            setTotalRecords(responseData.total);
            setCurrentPage(responseData.current_page);
        } catch (error) {
            console.error('Error fetching data:', error);
            setData([]);
            setTotalPages(1);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        if (!date.from || !date.to) return;
        
        setExportLoading('excel');
        try {
            const response = await axios.get('/api/v1/void-tx/search', {
                params: {
                    concept_id: selectedConcept ?? '',
                    branch_id: selectedBranch ?? '',
                    from_date: format(date.from, 'yyyy-MM-dd'),
                    to_date: format(date.to, 'yyyy-MM-dd'),
                    per_page: 1000000 // Get all records for export
                }
            });

            const data = response.data.data.data;
            
            // Prepare data for Excel
            const excelData = data.map((item: VoidTx) => ({
                Branch: item.branch_name,
                Concept: item.concept_name,
                Date: format(new Date(item.date), 'MMM dd, yyyy'),
                Time: item.time,
                'TX #': item.tx_number,
                Terminal: item.terminal,
                'SI #': item.salesinvoice_number,
                Cashier: item.cashier_name,
                Amount: Number(item.amount).toFixed(2),
                'Approved By': item.approved_by,
                Remarks: item.remarks
            }));

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Auto-size columns
            const colWidths = Object.keys(excelData[0] || {}).map(key => ({
                wch: Math.max(key.length, ...excelData.map((row: { [x: string]: any; }) => String(row[key]).length))
            }));
            ws['!cols'] = colWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Void Transactions');

            // Generate Excel file
            XLSX.writeFile(wb, `void_transactions_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
        } finally {
            setExportLoading(null);
        }
    };

    const handleExportPdf = async () => {
        if (!date.from || !date.to) return;
        
        setExportLoading('pdf');
        try {
            const response = await axios.get('/api/v1/void-tx/search', {
                params: {
                    concept_id: selectedConcept ?? '',
                    branch_id: selectedBranch ?? '',
                    from_date: format(date.from, 'yyyy-MM-dd'),
                    to_date: format(date.to, 'yyyy-MM-dd'),
                    per_page: 1000000 // Get all records for export
                }
            });

            const data = response.data.data.data;
            
            // Create PDF document in landscape
            const doc = new jsPDF('l', 'mm', 'a4');
            
            // A4 landscape dimensions in mm
            const pageWidth = 297;
            const pageHeight = 210;
            const margin = 10;
            const usableWidth = pageWidth - (2 * margin);

            // Add title
            doc.setFontSize(14);
            doc.text('Void Transactions Report', margin, 20);
            doc.setFontSize(10);
            doc.text(`Date Range: ${format(date.from, 'MMM dd, yyyy')} - ${format(date.to, 'MMM dd, yyyy')}`, margin, 27);

            // Prepare data for table
            const tableData = data.map((item: VoidTx) => [
                item.branch_name,
                item.concept_name,
                format(new Date(item.date), 'MMM dd, yyyy'),
                item.time,
                item.tx_number,
                item.terminal,
                item.salesinvoice_number,
                item.cashier_name,
                Number(item.amount).toFixed(2),
                item.approved_by,
                item.remarks
            ]);

            // Calculate total
            const total = data.reduce((sum: number, item: VoidTx) => sum + Number(item.amount), 0);

            // Add total row
            tableData.push([
                'TOTAL', '', '', '', '', '', '', '', total.toFixed(2), '', ''
            ]);

            // Add table with adjusted column widths
            autoTable(doc, {
                head: [[
                    'Branch', 'Concept', 'Date', 'Time', 'TX #',
                    'Terminal', 'SI #', 'Cashier', 'Amount',
                    'Approved By', 'Remarks'
                ]],
                body: tableData,
                startY: 35,
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
                    1: { cellWidth: 25 }, // Concept
                    2: { cellWidth: 22 }, // Date
                    3: { cellWidth: 18 }, // Time
                    4: { cellWidth: 18 }, // TX #
                    5: { cellWidth: 20 }, // Terminal
                    6: { cellWidth: 18 }, // SI #
                    7: { cellWidth: 25 }, // Cashier
                    8: { cellWidth: 20, halign: 'right' }, // Amount
                    9: { cellWidth: 25 }, // Approved By
                    10: { cellWidth: 56 } // Remarks
                },
                margin: { left: margin, right: margin, top: margin },
                didParseCell: function(data) {
                    if (data.row.index === tableData.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });

            // Save PDF
            doc.save(`void_transactions_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
        } finally {
            setExportLoading(null);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1); // Reset to first page when searching
        fetchData();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            
        >
            <Head title="Void Transactions" />

            <div className='py-12'>
                <div className='mx-auto sm:px-6 lg:px-8'>
                    <div className='flex justify-between space-x-2 mb-4'>
                        <div>
                            <h1 className="text-2xl font-semibold">Void Transactions</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="flex items-center"
                                onClick={handleExportExcel}
                                disabled={exportLoading !== null || !date?.from || !date?.to}
                            >
                                {exportLoading === 'excel' ? (
                                    <span className="animate-spin mr-2">↻</span>
                                ) : (
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                )}
                                Export Excel
                            </Button>
                            <Button
                                variant="outline"
                                className="flex items-center"
                                onClick={handleExportPdf}
                                disabled={exportLoading !== null || !date?.from || !date?.to}
                            >
                                {exportLoading === 'pdf' ? (
                                    <span className="animate-spin mr-2">↻</span>
                                ) : (
                                    <FileText className="mr-2 h-4 w-4" />
                                )}
                                Export PDF
                            </Button>
                        </div>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-4">
                                {/* Filters Section */}
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className='w-48'>
                                        <Select 
                                            value={selectedConcept ? selectedConcept.toString() : undefined} 
                                            onValueChange={(value) => setSelectedConcept(value === "all" ? null : value ? Number(value) : null)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Concept" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Concepts</SelectItem>
                                                {concepts && concepts.length > 0 ? (
                                                    concepts.map((concept) => (
                                                        <SelectItem 
                                                            key={concept.concept_id} 
                                                            value={concept.concept_id.toString()}
                                                        >
                                                            {concept.concept_name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="0" disabled>No concepts available</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className='w-48'>
                                        <Select 
                                            value={selectedBranch ? selectedBranch.toString() : undefined} 
                                            onValueChange={(value) => setSelectedBranch(value === "all" ? null : value ? Number(value) : null)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Branches</SelectItem>
                                                {branches && branches.length > 0 ? (
                                                    branches.map((branch) => (
                                                        <SelectItem 
                                                            key={branch.branch_id} 
                                                            value={branch.branch_id.toString()}
                                                        >
                                                            {branch.branch_name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="0" disabled>No branches available</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className={cn("w-[300px]")}>
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
                                                        <span>Pick a date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={date?.from}
                                                    selected={date}
                                                    onSelect={(range: DateRange | undefined) => {
                                                        if (range) {
                                                            setDate(range);
                                                        }
                                                    }}
                                                    numberOfMonths={2}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <Button
                                        className="px-8"
                                        onClick={handleSearch}
                                    >
                                        Search
                                    </Button>
                                </div>

                                {/* Content Section */}
                                {loading ? (
                                    <div className="text-center py-4">Loading...</div>
                                ) : (
                                    <div>
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Branch</TableHead>
                                                        <TableHead>Concept</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Time</TableHead>
                                                        <TableHead>TX #</TableHead>
                                                        <TableHead>Terminal</TableHead>
                                                        <TableHead>SI #</TableHead>
                                                        <TableHead>Cashier</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                        <TableHead>Approved By</TableHead>
                                                        <TableHead>Remarks</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {data.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={11} className="text-center py-4">
                                                                No records found
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        data.map((item) => (
                                                            <TableRow key={item.id}>
                                                                <TableCell>{item.branch_name}</TableCell>
                                                                <TableCell>{item.concept_name}</TableCell>
                                                                <TableCell>
                                                                    {format(new Date(item.date), 'MMM dd, yyyy')}
                                                                </TableCell>
                                                                <TableCell>{item.time}</TableCell>
                                                                <TableCell>{item.tx_number}</TableCell>
                                                                <TableCell>{item.terminal}</TableCell>
                                                                <TableCell>{item.salesinvoice_number}</TableCell>
                                                                <TableCell>{item.cashier_name}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {Number(item.amount).toFixed(2)}
                                                                </TableCell>
                                                                <TableCell>{item.approved_by}</TableCell>
                                                                <TableCell>{item.remarks}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-sm text-gray-500">
                                                Showing {data.length} of {totalRecords} entries
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    Previous
                                                </Button>
                                                <span className="text-sm text-gray-500">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    Next
                                                </Button>
                                            </div>
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
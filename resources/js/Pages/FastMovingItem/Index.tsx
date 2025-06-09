import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { format, subDays } from 'date-fns';
import axios from 'axios';
import { Calendar1Icon, FileSpreadsheetIcon, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/Components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Label } from "@/Components/ui/label";
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import * as XLSX from 'xlsx';

interface Concept{
    concept_id: number;
    concept_name: string;
}

interface Branch{
    branch_id: number;
    branch_name: string;
    concept_id: number;
}

interface FastMovingItem {
    description: string;
    total_quantity: number;
    branch_name: string;
    concept_name: string;
    date: string;
}

export default function Index({ auth }: any) {
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [selectedConcept, setSelectedConcept] = useState<string>("all");
    const [selectedBranch, setSelectedBranch] = useState<string>("all");
    const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
    const [fastMovingItems, setFastMovingItems] = useState<FastMovingItem[]>([]);
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });
    const [error, setError] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'popular' | 'worst'>('popular');

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
        setLoading(true);
        setError(null);
        try {
            const params = {
                from_date: date?.from ? format(date.from, 'yyyy-MM-dd') : undefined,
                to_date: date?.to ? format(date.to, 'yyyy-MM-dd') : undefined,
                branch_id: selectedBranch,
                concept_id: selectedConcept,
            };
            console.log(params);

            const response = await axios.get('/api/v1/item-sales/fast-moving', { params });
            if (response.data.status === 'success') {
                // Transform the data to include branch and concept names
                const transformedData = response.data.data
                    .map((item: any) => ({
                        ...item,
                        branch_name: branches.find(b => b.branch_id.toString() === selectedBranch)?.branch_name || 'All Branches',
                        concept_name: concepts.find(c => c.concept_id.toString() === selectedConcept)?.concept_name || 'All Concepts',
                        date: date?.from ? format(date.from, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                        total_quantity: Math.round(Number(item.total_quantity)) // Convert to whole number
                    }))
                    .sort((a: FastMovingItem, b: FastMovingItem) => 
                        sortOrder === 'popular' 
                            ? b.total_quantity - a.total_quantity  // Descending for popular
                            : a.total_quantity - b.total_quantity  // Ascending for worst
                    );
                setFastMovingItems(transformedData);
            } else {
                setError('Failed to fetch data');
                setFastMovingItems([]);
            }
        } catch (error) {
            console.error('Error fetching fast moving items:', error);
            setError('Failed to fetch fast moving items data');
            setFastMovingItems([]);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        // Create worksheet data
        const worksheetData = [
            // Headers
            ['Fast Moving Items Report'],
            ['Date Range:', `${format(date?.from || new Date(), 'MMM dd, yyyy')} - ${format(date?.to || new Date(), 'MMM dd, yyyy')}`],
            ['Branch:', selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.branch_id.toString() === selectedBranch)?.branch_name || ''],
            ['Concept:', selectedConcept === 'all' ? 'All Concepts' : concepts.find(c => c.concept_id.toString() === selectedConcept)?.concept_name || ''],
            ['Sort Order:', sortOrder === 'popular' ? 'Popular Items (Highest to Lowest)' : 'Worst Items (Lowest to Highest)'],
            [], // Empty row for spacing
            ['Rank', 'Date', 'Branch Name', 'Concept Name', 'Description', 'Quantity'] // Column headers
        ];

        // Add data rows
        fastMovingItems.forEach((item, index) => {
            worksheetData.push([
                (index + 1).toString(), // Convert rank to string
                format(new Date(item.date), 'yyyy-MM-dd'),
                item.branch_name,
                item.concept_name,
                item.description,
                item.total_quantity.toString() // Convert quantity to string
            ]);
        });

        // Calculate total
        const totalQuantity = fastMovingItems.reduce((sum, item) => sum + item.total_quantity, 0);

        // Add total row
        worksheetData.push(
            [], // Empty row
            ['Total', '', '', '', '', totalQuantity.toString()] // Convert total to string
        );

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths
        const colWidths = [
            { wch: 8 },  // Rank
            { wch: 12 }, // Date
            { wch: 30 }, // Branch Name
            { wch: 20 }, // Concept Name
            { wch: 40 }, // Description
            { wch: 12 }, // Quantity
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Fast Moving Items');

        // Generate Excel file
        const fileName = `FastMovingItems_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
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

    const handleDateSelect = (newDate: DateRange | undefined) => {
        setDate(newDate);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Fast Moving Items" />

            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between space-x-2 mb-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Fast Moving Item Report</h1>
                        </div>
                        <div className='flex flex-col md:flex-row gap-2'>
                            <Button
                                variant="outline"
                                className="flex items-center"
                                onClick={exportToExcel}
                                disabled={loading || fastMovingItems.length === 0}
                            >
                                <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
                                Export Excel
                            </Button>
                            <Button
                                variant="outline"
                                className="flex items-center"
                                // onClick={exportToPDF}
                                disabled={loading || fastMovingItems.length === 0}
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
                                                        onSelect={handleDateSelect}
                                                        numberOfMonths={2}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="w-48">
                                        <label className="block text-sm font-medium mb-1">
                                            Sort By
                                        </label>
                                        <RadioGroup
                                            value={sortOrder}
                                            onValueChange={(value: 'popular' | 'worst') => {
                                                setSortOrder(value);
                                                setFastMovingItems(prev => 
                                                    [...prev].sort((a, b) => 
                                                        value === 'popular'
                                                            ? b.total_quantity - a.total_quantity
                                                            : a.total_quantity - b.total_quantity
                                                    )
                                                );
                                            }}
                                            className="flex flex-col space-y-1"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="popular" id="popular" />
                                                <Label htmlFor="popular">Popular Items</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="worst" id="worst" />
                                                <Label htmlFor="worst">Worst Items</Label>
                                            </div>
                                        </RadioGroup>
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
                                                <TableHead>Date</TableHead>
                                                <TableHead>Branch Name</TableHead>
                                                <TableHead>Concept Name</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Quantity</TableHead>
                                                <TableHead className="text-right">Rank</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fastMovingItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center">
                                                        No records found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                fastMovingItems.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{format(new Date(item.date), 'yyyy-MM-dd')}</TableCell>
                                                        <TableCell>{item.branch_name}</TableCell>
                                                        <TableCell>{item.concept_name}</TableCell>
                                                        <TableCell>{item.description}</TableCell>
                                                        <TableCell className="text-right">{item.total_quantity}</TableCell>
                                                        <TableCell className="text-right font-medium">{index + 1}</TableCell>
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
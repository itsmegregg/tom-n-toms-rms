import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { CalendarIcon, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { Calendar } from '@/Components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Concept {
  concept_id: number;
  concept_name: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
}

interface Product{
  product_code: string;
  product_desc: string;
}

interface ItemSalesData {
  product_code: string;
  description: string;
  total_quantity: string;
  total_net_sales: string;
}

type SortDirection = 'asc' | 'desc';
type SortField = 'total_quantity' | 'total_net_sales' | null;

export default function perItems({ auth }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [itemSalesData, setItemSalesData] = useState<ItemSalesData[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(()=>{
    fetchConcepts();
    fetchProducts();
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




  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/v1/products');
      setProducts(response.data.data || []); 
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); 
    }
  };
  const fetchBranches = async () => {
    try {
      const response = await axios.get('/api/v1/branches');
      const branchesData = response.data.data || [];
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  const handleSearch = async () => {
    if (!date?.from || !date?.to) {
      setError('Please select a date range');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        start_date: format(date.from, 'yyyy-MM-dd'),
        end_date: format(date.to, 'yyyy-MM-dd'),
        branch_id: selectedBranch === 'all' ? 'ALL' : selectedBranch,
        concept_id: selectedConcept === 'all' ? 'ALL' : selectedConcept,
        product_code: selectedProduct === 'all' ? 'ALL' : selectedProduct
      };
      
      const response = await axios.get('/api/v1/product-mix', { params });
      
      if (response.data && Array.isArray(response.data)) {
        // Handle successful array response
        const formattedData = response.data.map((item: any) => ({
          product_code: item.product_code || '',
          description: item.description || '',
          total_quantity: (item.total_quantity || 0).toString(),
          total_net_sales: (item.total_net_sales || 0).toString()
        }));
        setItemSalesData(formattedData);
      } else if (response.data && response.data.message) {
        // Handle no data message
        setError(response.data.message);
        setItemSalesData([]);
      } else {
        // Handle unexpected response
        setError('Unexpected response format from server');
        setItemSalesData([]);
      }
    } catch (err: any) {
      console.error('Error fetching product mix data:', err);
      setError(err.response?.data?.message || 'Failed to fetch product mix data. Please try again.');
      setItemSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(parseFloat(amount));
  };

  const formatNumberWithCommas = (number: string) => {
    return parseFloat(number).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const exportToExcel = () => {
    // Create worksheet data
    const worksheetData = [
      // Headers
      ['Product Mix Report'],
      ['Date Range:', `${format(date?.from || new Date(), 'MMM dd, yyyy')} - ${format(date?.to || new Date(), 'MMM dd, yyyy')}`],
      ['Branch:', selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.branch_id.toString() === selectedBranch)?.branch_name || ''],
      ['Concept:', selectedConcept === 'all' ? 'All Concepts' : concepts.find(c => c.concept_id.toString() === selectedConcept)?.concept_name || ''],
      [], // Empty row for spacing
      ['Product Code', 'Description', 'Quantity', 'Net Sales'] // Column headers
    ];

    // Add data rows
    itemSalesData.forEach(item => {
      worksheetData.push([
        item.product_code,
        item.description,
        item.total_quantity,
        item.total_net_sales
      ]);
    });

    // Calculate totals
    const totalQuantity = itemSalesData.reduce((sum, item) => sum + parseFloat(item.total_quantity), 0);
    const totalNetSales = itemSalesData.reduce((sum, item) => sum + parseFloat(item.total_net_sales), 0);

    // Add total row
    worksheetData.push(
      [], // Empty row
      ['Total', '', totalQuantity.toLocaleString(), totalNetSales.toLocaleString()]
    );

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Product Code
      { wch: 40 }, // Description
      { wch: 10 }, // Quantity
      { wch: 15 }, // Net Sales
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Product Mix');

    // Generate Excel file
    const fileName = `ProductMix_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Product Mix Report', 14, 20);

    // Add report details
    doc.setFontSize(10);
    doc.text(`Date Range: ${format(date?.from || new Date(), 'MMM dd, yyyy')} - ${format(date?.to || new Date(), 'MMM dd, yyyy')}`, 14, 30);
    doc.text(`Branch: ${selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.branch_id.toString() === selectedBranch)?.branch_name || ''}`, 14, 35);
    doc.text(`Concept: ${selectedConcept === 'all' ? 'All Concepts' : concepts.find(c => c.concept_id.toString() === selectedConcept)?.concept_name || ''}`, 14, 40);

    // Calculate totals
    const totalQuantity = itemSalesData.reduce((sum, item) => sum + parseFloat(item.total_quantity), 0).toString();
    const totalNetSales = itemSalesData.reduce((sum, item) => sum + parseFloat(item.total_net_sales), 0).toString();

    // Prepare table data
    const tableData = itemSalesData.map(item => [
      item.product_code,
      item.description,
      item.total_quantity,
      formatNumberWithCommas(item.total_net_sales)
    ]);

    // Add total row
    tableData.push([
      'Total',
      '',
      totalQuantity,
      formatNumberWithCommas(totalNetSales)
    ]);

    // Add table
    doc.autoTable({
      head: [['Product Code', 'Description', 'Quantity', 'Net Sales']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 51, 51] },
      margin: { top: 50 }
    });

    // Save the PDF
    const fileName = `ProductMix_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
    doc.save(fileName);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    if (!sortField) return itemSalesData;

    return [...itemSalesData].sort((a, b) => {
      const aValue = parseFloat(a[sortField]);
      const bValue = parseFloat(b[sortField]);
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
    >
      <Head title="Item Sales" />

      <div className="py-12">
        <div className="mx-auto sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-2 mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold dark:text-white">
              Item Sales Report
            </h1>
            <div className='flex space-x-2'>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none items-center justify-center dark:text-white dark:hover:bg-gray-700"
                onClick={exportToExcel}
                disabled={loading || itemSalesData.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export Excel</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none items-center justify-center dark:text-white dark:hover:bg-gray-700"
                onClick={exportToPDF}
                disabled={loading || itemSalesData.length === 0}
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

                <div className="w-full md:w-48">
                  <Select
                    value={selectedBranch}
                    onValueChange={setSelectedBranch}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-gray-700 dark:text-white">
                      <SelectValue placeholder="All Branches" />
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

                <div className='w-full md:w-48'> 
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-gray-700 dark:text-white">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {products.map((product) => (
                        <SelectItem
                          key={product.product_code}
                          value={product.product_code.toString()}
                        >
                          {product.product_desc}
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
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "MMM dd")} -{" "}
                              {format(date.to, "MMM dd, yyyy")}
                            </>
                          ) : (
                            format(date.from, "MMM dd, yyyy")
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
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button
                  className="w-full md:w-24"
                  onClick={handleSearch}
                  disabled={loading || !date?.from || !date?.to}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
                
              </div>

                    <br/>
              {itemSalesData.length > 0 && (
    
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Product Code</TableHead>
                        <TableHead className="min-w-[200px]">Description</TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('total_quantity')}
                        >
                          Quantity {getSortIcon('total_quantity')}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('total_net_sales')}
                        >
                          Net Sales {getSortIcon('total_net_sales')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedData().map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.product_code}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.total_quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.total_net_sales)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

            )}
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 text-sm text-red-600 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
          {error}
        </div>
      )}

     
    </AuthenticatedLayout>
  );
}

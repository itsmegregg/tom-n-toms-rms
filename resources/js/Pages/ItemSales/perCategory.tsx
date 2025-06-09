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
import 'jspdf-autotable';

interface Concept {
  concept_id: number;
  concept_name: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
}

interface ProductData {
  Product_code: string;
  description: string;
  quantity: string;
  net_sales: string;
}

interface CategoryData {
  "Category code": string;
  "Category desc": string;
  Products: ProductData[];
}

type ItemSalesData = CategoryData[];

type SortDirection = 'asc' | 'desc';
type SortField = 'quantity' | 'net_sales' | null;

export default function perCategory({ auth }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [itemSalesData, setItemSalesData] = useState<ItemSalesData>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<any[]>([]);
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
      
      const response = await axios.get('/api/v1/product-mix-category', { params });
      
      if (response.data && Array.isArray(response.data)) {
        setItemSalesData(response.data);
      } else if (response.data && response.data.message) {
        setError(response.data.message);
        setItemSalesData([]);
      } else {
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
    const worksheetData = itemSalesData.flatMap(category => {
      const totals = calculateCategoryTotals(category);
      return [
        [`Category: ${category["Category code"]} - ${category["Category desc"]}`],
        ['Product Code', 'Description', 'Quantity', 'Net Sales'],
        ...category.Products.map(product => [
          product.Product_code,
          product.description,
          product.quantity,
          product.net_sales
        ]),
        ['Category Total', '', totals.quantity.toLocaleString(), totals.net_sales.toLocaleString()],
        [] // Empty row for spacing
      ];
    });
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Product Mix by Category');
    XLSX.writeFile(wb, `ProductMixCategory_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
  };
  
  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
  
    itemSalesData.forEach(category => {
      const totals = calculateCategoryTotals(category);
      
      // Add category title
      doc.setFontSize(14);
      doc.text(`Category: ${category["Category code"]} - ${category["Category desc"]}`, 14, yPos);
      yPos += 10;
  
      // Prepare table data
      const tableData = category.Products.map(product => [
        product.Product_code,
        product.description,
        product.quantity,
        formatNumberWithCommas(product.net_sales)
      ]);
  
      // Add total row
      tableData.push([
        'Category Total',
        '',
        totals.quantity.toLocaleString(),
        formatNumberWithCommas(totals.net_sales.toString())
      ]);
  
      // Add table
      (doc as any).autoTable({
        startY: yPos,
        head: [['Product Code', 'Description', 'Quantity', 'Net Sales']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [51, 51, 51] }
      });
  
      // Update y position for next category
      yPos = (doc as any).lastAutoTable.finalY + 10;
    });
  
    // Save PDF
    doc.save(`ProductMixCategory_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
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
      const aValue = parseFloat(a.Products[0][sortField]);
      const bValue = parseFloat(b.Products[0][sortField]);
      
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

  const calculateCategoryTotals = (category: CategoryData) => {
    return category.Products.reduce((totals, product) => ({
      quantity: totals.quantity + parseFloat(product.quantity),
      net_sales: totals.net_sales + parseFloat(product.net_sales)
    }), { quantity: 0, net_sales: 0 });
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
                          onClick={() => handleSort('quantity')}
                        >
                          Quantity {getSortIcon('quantity')}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('net_sales')}
                        >
                          Net Sales {getSortIcon('net_sales')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                   <TableBody>
                    {itemSalesData.flatMap((category, catIndex) => {
                        const totals = calculateCategoryTotals(category);
                        return (
                        <>
                            <TableRow key={`cat-${catIndex}`} className="bg-gray-100 dark:bg-gray-700">
                            <TableCell colSpan={4} className="font-bold">
                                {category["Category code"]} - {category["Category desc"]}
                            </TableCell>
                            </TableRow>
                            {category.Products.map((product, prodIndex) => (
                            <TableRow key={`prod-${catIndex}-${prodIndex}`}>
                                <TableCell className="pl-8">{product.Product_code}</TableCell>
                                <TableCell>{product.description}</TableCell>
                                <TableCell className="text-right">{product.quantity}</TableCell>
                                <TableCell className="text-right">{formatCurrency(product.net_sales)}</TableCell>
                            </TableRow>
                            ))}
                            <TableRow className="bg-gray-50 dark:bg-gray-600">
                            <TableCell colSpan={2} className="pl-8 font-medium">Category Total</TableCell>
                            <TableCell className="text-right font-medium">{totals.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(totals.net_sales.toString())}</TableCell>
                            </TableRow>
                        </>
                        );
                    })}
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

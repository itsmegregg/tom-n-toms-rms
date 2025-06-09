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

interface BirSummaryData {
  id: number;
  branch_id: number;
  concept_id: number;
  date: string;
  si_first: number;
  si_last: number;
  beg_amount: string;
  end_amount: string;
  net_amount: string;
  sc: string;
  pwd: string;
  others: string;
  returns: string;
  voids: string;
  gross_amount: string;
  vatable: string;
  vat_amount: string;
  vat_exempt: string;
  zero_rated: string;
  less_vat: string;
  ewt: string;
  service_charge: string;
  z_counter: number;
  branch_name: string;
  concept_name: string;
}

interface PaginationState {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export default function BIRSummary({ auth }: PageProps) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>('ALL');
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [birData, setBirData] = useState<BirSummaryData[]>([]);
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
    if (selectedConcept === "ALL") {
      setFilteredBranches(branches);
    } else {
      const selectedConceptData = concepts.find(c => c.concept_name === selectedConcept);
      if (selectedConceptData) {
        const filtered = branches.filter(branch => branch.concept_id === selectedConceptData.concept_id);
        setFilteredBranches(filtered);
      }
    }
    setSelectedBranch("ALL");
  }, [selectedConcept, branches, concepts]);

  const handleSearch = async () => {
    try {
      setLoading(true);

      if (!date?.from || !date?.to) {
        throw new Error('Please select a date range');
      }

      const params = {
        from_date: format(date.from, 'yyyy-MM-dd'),
        to_date: format(date.to, 'yyyy-MM-dd'),
        page: pagination.currentPage,
        per_page: pagination.perPage,
        branch_id: selectedBranch || 'ALL',
        concept_id: selectedConcept || 'ALL'
      };

      const response = await axios.get('/api/v1/bir-summary', { params });

      if (response.data.status === 'success' && response.data.data) {
        setBirData(response.data.data.data || []);
        setPagination({
          currentPage: response.data.data.current_page,
          perPage: response.data.data.per_page,
          total: response.data.data.total,
          lastPage: response.data.data.last_page
        });
      } else {
        setBirData([]);
      }
    } catch (error) {
      console.error('Error fetching BIR summary data:', error);
      setBirData([]);
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

      const params = {
        branch_id: selectedBranch || 'ALL',
        concept_id: selectedConcept || 'ALL',
        from_date: format(date.from, 'yyyy-MM-dd'),
        to_date: format(date.to, 'yyyy-MM-dd'),
        per_page: 1000000
      };

      const response = await axios.get('/api/v1/bir-summary', { params });

      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error('Failed to fetch data');
      }

      const data = response.data.data.data || [];

      const excelData = data.map((item: BirSummaryData) => ({
        'Branch': item.branch_name,
        'Concept': item.concept_name,
        'Date': format(new Date(item.date), 'MMM dd, yyyy'),
        'Z Counter': item.z_counter,
        'SI First': item.si_first,
        'SI Last': item.si_last,
        'Beginning': Number(item.beg_amount).toFixed(2),
        'Ending': Number(item.end_amount).toFixed(2),
        'Net Amount': Number(item.net_amount).toFixed(2),
        'SC': Number(item.sc).toFixed(2),
        'PWD': Number(item.pwd).toFixed(2),
        'Others': Number(item.others).toFixed(2),
        'Returns': Number(item.returns).toFixed(2),
        'Voids': Number(item.voids).toFixed(2),
        'Gross': Number(item.gross_amount).toFixed(2),
        'Vatable': Number(item.vatable).toFixed(2),
        'VAT Amount': Number(item.vat_amount).toFixed(2),
        'VAT Exempt': Number(item.vat_exempt).toFixed(2),
        'Zero Rated': Number(item.zero_rated).toFixed(2),
        'Less VAT': Number(item.less_vat).toFixed(2),
        'EWT': Number(item.ewt).toFixed(2)
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BIR Summary');

      const filename = `bir_summary_report_${format(date.from, 'MMM-dd-yyyy')}_to_${format(date.to, 'MMM-dd-yyyy')}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error: any) {
      console.error('Error exporting Excel:', error.message);
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

      const params = {
        branch_id: selectedBranch || 'ALL',
        concept_id: selectedConcept || 'ALL',
        from_date: format(date.from, 'yyyy-MM-dd'),
        to_date: format(date.to, 'yyyy-MM-dd'),
        per_page: 1000000
      };

      const response = await axios.get('/api/v1/bir-summary', { params });

      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error('Failed to fetch data');
      }

      const data = response.data.data.data || [];

      const doc = new jsPDF('l', 'mm', 'a4') as any;
      
      doc.setFontSize(16);
      doc.text('BIR Summary Report', 15, 15);
      doc.setFontSize(10);
      doc.text(`Date Range: ${format(date.from, 'MMM dd, yyyy')} - ${format(date.to, 'MMM dd, yyyy')}`, 15, 22);

      doc.autoTable({
        startY: 30,
        head: [['Branch', 'Concept', 'Date', 'Z Counter', 'SI First', 'SI Last', 'Beginning', 'Ending', 'Net Amount', 'SC', 'PWD', 'Others', 'Returns', 'Voids', 'Gross', 'Vatable', 'VAT Amount', 'VAT Exempt', 'Zero Rated', 'Less VAT', 'EWT']],
        body: data.map((item: BirSummaryData) => [
          item.branch_name,
          item.concept_name,
          format(new Date(item.date), 'MMM dd, yyyy'),
          item.z_counter,
          item.si_first,
          item.si_last,
          Number(item.beg_amount).toFixed(2),
          Number(item.end_amount).toFixed(2),
          Number(item.net_amount).toFixed(2),
          Number(item.sc).toFixed(2),
          Number(item.pwd).toFixed(2),
          Number(item.others).toFixed(2),
          Number(item.returns).toFixed(2),
          Number(item.voids).toFixed(2),
          Number(item.gross_amount).toFixed(2),
          Number(item.vatable).toFixed(2),
          Number(item.vat_amount).toFixed(2),
          Number(item.vat_exempt).toFixed(2),
          Number(item.zero_rated).toFixed(2),
          Number(item.less_vat).toFixed(2),
          Number(item.ewt).toFixed(2)
        ]),
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
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 20, halign: 'right' },
          7: { cellWidth: 20, halign: 'right' },
          8: { cellWidth: 20, halign: 'right' },
          9: { cellWidth: 20, halign: 'right' },
          10: { cellWidth: 20, halign: 'right' },
          11: { cellWidth: 20, halign: 'right' },
          12: { cellWidth: 20, halign: 'right' },
          13: { cellWidth: 20, halign: 'right' },
          14: { cellWidth: 20, halign: 'right' },
          15: { cellWidth: 20, halign: 'right' },
          16: { cellWidth: 20, halign: 'right' },
          17: { cellWidth: 20, halign: 'right' },
          18: { cellWidth: 20, halign: 'right' },
          19: { cellWidth: 20, halign: 'right' }
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 2,
          valign: 'middle'
        },
        margin: { top: 30, right: 15, bottom: 15, left: 15 }
      });

      const filename = `bir_summary_report_${format(date.from, 'MMM-dd-yyyy')}_to_${format(date.to, 'MMM-dd-yyyy')}.pdf`;
      doc.save(filename);
    } catch (error: any) {
      console.error('Error exporting PDF:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="BIR Summary Report" />

      <div className="py-12">
      <div className='mx-auto sm:px-6 lg:px-8'>
        <div className='flex justify-between space-x-2 mb-4'>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-200">
              BIR Summary Report
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExportExcel}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Export Excel
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExportPdf}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Export PDF
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
             
                  
                  <div className='w-48'>
                  <Select value={selectedConcept} onValueChange={setSelectedConcept}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Concept" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Concepts</SelectItem>
                      {Array.isArray(concepts) && concepts.map((concept) => (
                        <SelectItem key={concept.concept_id} value={concept.concept_name}>
                          {concept.concept_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
            

                <div className="w-48">
                 
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Branches</SelectItem>
                      {Array.isArray(filteredBranches) && filteredBranches.map((branch) => (
                        <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
                          {branch.branch_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-72">
                
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
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
                        onSelect={setDate}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-none self-end">
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Concept</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Z Counter</TableHead>
                  <TableHead>SI First</TableHead>
                  <TableHead>SI Last</TableHead>
                  <TableHead className="text-right">Beginning</TableHead>
                  <TableHead className="text-right">Ending</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead className="text-right">SC</TableHead>
                  <TableHead className="text-right">PWD</TableHead>
                  <TableHead className="text-right">Others</TableHead>
                  <TableHead className="text-right">Returns</TableHead>
                  <TableHead className="text-right">Voids</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Vatable</TableHead>
                  <TableHead className="text-right">VAT Amount</TableHead>
                  <TableHead className="text-right">VAT Exempt</TableHead>
                  <TableHead className="text-right">Zero Rated</TableHead>
                  <TableHead className="text-right">Less VAT</TableHead>
                  <TableHead className="text-right">EWT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(birData) && birData.length > 0 ? (
                  birData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.branch_name}</TableCell>
                      <TableCell>{item.concept_name}</TableCell>
                      <TableCell>{format(new Date(item.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{item.z_counter}</TableCell>
                      <TableCell>{item.si_first}</TableCell>
                      <TableCell>{item.si_last}</TableCell>
                      <TableCell className="text-right">{Number(item.beg_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.end_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.net_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.sc).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.pwd).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.others).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.returns).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.voids).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.gross_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.vatable).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.vat_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.vat_exempt).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.zero_rated).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.less_vat).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(item.ewt).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={20} className="text-center py-4">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { format, subDays } from 'date-fns';
import { 
  CalendarIcon, 
  Loader2,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import axios from 'axios';
import { useEffect, useState } from 'react';
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
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
import { Calendar } from "@/Components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from "@/Components/ui/alert";

interface HourlyData {
  hour_range: string;
  no_trans: number;
  no_void: number;
  sales_value: string;
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

export default function Hourly({ auth }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [error, setError] = useState<string | null>(null);

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

  const fetchHourlyData = async () => {
    if (!date?.from || !date?.to) return;

    setLoading(true);
    try {
      const response = await axios.get('/api/v1/hourly', {
        params: {
          concept_id: selectedConcept,
          branch_id: selectedBranch,
          from_date: format(date.from, 'yyyy-MM-dd'),
          to_date: format(date.to, 'yyyy-MM-dd'),
        }
      });
      setHourlyData(response.data.data || []); 
    } catch (error: any) {
      console.error('Error fetching hourly data:', error);
      setHourlyData([]);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('An error occurred while fetching data');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(hourlyData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hourly Report");
    XLSX.writeFile(wb, "hourly_report.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    (doc as any).autoTable({
      head: [['Hour Range', 'No. of Trans', 'No. of Void', 'Sales Value']],
      body: hourlyData.map(row => [
        row.hour_range,
        row.no_trans,
        row.no_void,
        row.sales_value
      ]),
    });
    doc.save('hourly_report.pdf');
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Hourly Report" />

      <div className="py-12">
        <div className="mx-auto sm:px-6 lg:px-8">
          <div className="flex justify-between space-x-2 mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Hourly Report</h1>
            </div>
            <div className='flex flex-col md:flex-row gap-2'>
              <Button
                variant="outline"
                className="flex items-center"
                onClick={exportToExcel}
                disabled={loading || hourlyData.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                className="flex items-center"
                onClick={exportToPDF}
                disabled={loading || hourlyData.length === 0}
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
                      onClick={fetchHourlyData}
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
                        <TableHead>Hour Range</TableHead>
                        <TableHead>No. of Trans</TableHead>
                        <TableHead>No. of Void</TableHead>
                        <TableHead className="text-right">Sales Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hourlyData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No results found
                          </TableCell>
                        </TableRow>
                      ) : (
                        hourlyData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.hour_range}</TableCell>
                            <TableCell>{row.no_trans}</TableCell>
                            <TableCell>{row.no_void}</TableCell>
                            <TableCell className="text-right">{row.sales_value}</TableCell>
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

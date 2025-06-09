import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { Button } from "@/Components/ui/button";
import { CalendarIcon } from "lucide-react";
import dayjs from 'dayjs';
import MonthPicker from '@/Components/ui/month-picker';
import axios from 'axios';
import AverageSalesPerDay from './components/cards/AverageSalesPerDay';
import TotalSales from './components/cards/TotalSales';
import AverageTransactionsPerDay from "./components/cards/AverageTransactionsPerDay";
import AverageSalesPerCustomer from "./components/cards/AverageSalesPerCustomer";
import PaymentDetailsChart from './components/cards/PaymentDetailsChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  auth: {
    user: any;
  };
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
  concept_id: number;
}

interface SaleData {
  total_sales: number;
  date_formatted: string;
}

interface SalesResponse {
  status: string;
  data: SaleData[];
}

export default function Dashboard({ auth }: Props) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedConcept, setSelectedConcept] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [salesData, setSalesData] = useState<SalesResponse>({
    status: '',
    data: []
  });

  // Fetch concepts and branches
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [conceptsResponse, branchesResponse] = await Promise.all([
          axios.get('/api/concepts'),
          axios.get('/api/branches')
        ]);
        setConcepts(conceptsResponse.data);
        setBranches(branchesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Filter branches when concept changes
  useEffect(() => {
    if (selectedConcept && selectedConcept !== "all") {
      const filtered = branches.filter(branch => branch.concept_id === Number(selectedConcept));
      setFilteredBranches(filtered);
      setSelectedBranch("all"); // Reset branch selection when concept changes
    } else {
      setFilteredBranches(branches);
      setSelectedBranch("all");
    }
  }, [selectedConcept, branches]);

  // Fetch total sales per day data
  useEffect(() => {
    const fetchTotalSalesPerDay = async () => {
      try {
        const response = await axios.get('/api/v1/dashboard/total-sales-per-day', {
          params: {
            month: dayjs(currentMonth).format('YYYY-MM'),
            branch_id: selectedBranch === 'all' ? 'ALL' : selectedBranch,
            concept_id: selectedConcept === 'all' ? 'ALL' : selectedConcept
          }
        });
        setSalesData(response.data);
      } catch (error) {
        console.error('Error fetching total sales per day:', error);
        setSalesData({
          status: 'error',
          data: []
        });
      }
    };

    fetchTotalSalesPerDay();
  }, [currentMonth, selectedConcept, selectedBranch]);

  const handleConceptChange = (value: string) => {
    setSelectedConcept(value);
  };

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
  };

  const formatDate = (date: Date) => {
    return dayjs(date).format('MMMM YYYY');
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Dashboard" />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-5">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedConcept} onValueChange={handleConceptChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Concept" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Concepts</SelectItem>
                {concepts.map((concept) => (
                  <SelectItem key={concept.concept_id} value={concept.concept_id.toString()}>
                    {concept.concept_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={handleBranchChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {filteredBranches.map((branch) => (
                  <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
                    {branch.branch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-[180px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dayjs(currentMonth).format('MMMM YYYY')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <MonthPicker
                  selected={currentMonth}
                  onSelect={(date) => date && setCurrentMonth(date)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-col gap-4">

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AverageSalesPerDay
                  selectedBranch={selectedBranch}
                  selectedConcept={selectedConcept}
                  currentMonth={currentMonth}
                />
                <TotalSales
                  selectedBranch={selectedBranch}
                  selectedConcept={selectedConcept}
                  currentMonth={currentMonth}
                />
                <AverageTransactionsPerDay
                  selectedBranch={selectedBranch}
                  selectedConcept={selectedConcept}
                  currentMonth={currentMonth}
                />
                <AverageSalesPerCustomer
                  selectedBranch={selectedBranch}
                  selectedConcept={selectedConcept}
                  currentMonth={currentMonth}
                />
          </div>

          <div className="w-full">
            <h2 className="text-xl font-semibold mb-4">Total Sales Per Day - {formatDate(currentMonth)}</h2>
            <div className="grid grid-cols-8 grid-rows-1 gap-4">
              <div className="col-span-5">
                <SalesChart monthlySales={salesData.data} />
              </div>
              <div className="col-span-3">
                <PaymentDetailsChart/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

interface SalesChartProps {
  monthlySales: SaleData[];
}

const SalesChart: React.FC<SalesChartProps> = ({ monthlySales }) => {
  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlySales}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date_formatted" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="total_sales" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

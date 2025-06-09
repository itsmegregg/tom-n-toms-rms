import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { Button } from "@/Components/ui/button";
import { CalendarIcon } from "lucide-react";
import dayjs from 'dayjs';
import MonthPicker from '@/Components/ui/month-picker';
import axios from 'axios';
import { SalesChart } from './components/cards/SalesChart';
import AverageSalesPerDay from './components/cards/AverageSalesPerDay';
import TotalSales from './components/cards/TotalSales';
import AverageTransactionsPerDay from "./components/cards/AverageTransactionsPerDay";
import AverageSalesPerCustomer from "./components/cards/AverageSalesPerCustomer";
import PaymentDetailsChart from './components/cards/PaymentDetailsChart';

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

export default function Dashboard({ auth }: Props) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedConcept, setSelectedConcept] = React.useState<string>("all");
  const [selectedBranch, setSelectedBranch] = React.useState<string>("all");
  const [concepts, setConcepts] = React.useState<Concept[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = React.useState<Branch[]>([]);
  const [monthlySales, setMonthlySales] = React.useState<{ status: string; data: Array<{ total_sales: number, date_formatted: string }> }>({
    status: 'success',
    data: []
  });

  // Fetch concepts and branches
  React.useEffect(() => {
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
  React.useEffect(() => {
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
  React.useEffect(() => {
    const fetchTotalSalesPerDay = async () => {
      try {
        const response = await axios.get('/api/v1/dashboard/total-sales-per-day', {
          params: {
            month: dayjs(currentMonth).format('YYYY-MM'),
            branch_id: selectedBranch === 'all' ? 'ALL' : selectedBranch,
            concept_id: selectedConcept === 'all' ? 'ALL' : selectedConcept
          }
        });
        console.log('API Response:', response.data);
        setMonthlySales({
          status: 'success',
          data: response.data.data // Access the data property from the response
        });
      } catch (error) {
        console.error('Error fetching total sales per day:', error);
        setMonthlySales({
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
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between pt-5">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:gap-4">
            <Select value={selectedConcept} onValueChange={handleConceptChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
              <SelectTrigger className="w-full sm:w-[180px]">
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
                  className="w-full sm:w-[180px] justify-start text-left font-normal"
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
              <div className="lg:col-span-5">
                <SalesChart monthlySales={monthlySales} />
              </div>
              <div className="lg:col-span-3">
                <PaymentDetailsChart
                  selectedBranch={selectedBranch}
                  selectedConcept={selectedConcept}
                  currentMonth={currentMonth}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

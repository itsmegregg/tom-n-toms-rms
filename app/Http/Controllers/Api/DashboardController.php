<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemSales;
use App\Models\Header;
use App\Models\PaymentDetails;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get total sales per day for the selected month
     */
    public function totalSalesPerDay(Request $request)
    {
        try {
            $month = $request->query('month');
            $branch = strtoupper($request->query('branch_id', 'ALL'));
            $concept = strtoupper($request->query('concept_id', 'ALL'));
            $query = ItemSales::select(
                'date',
                DB::raw('SUM(net_sales) as total_sales')
            )
            ->whereRaw('DATE_FORMAT(date, "%Y-%m") = ?', [$month]);

            if ($branch !== 'ALL') {
                $query->where('branch_id', $branch);
            }

            if ($concept !== 'ALL') {
                $query->where('concept_id', $concept);
            }

            $results = $query->groupBy('date')
                           ->orderBy('date')
                           ->get()
                           ->map(function ($item) {
                               return [
                                   'total_sales' => round($item->total_sales, 2),
                                   'date_formatted' => Carbon::parse($item->date)->format('M d')
                               ];
                           });

            return response()->json([
                'status' => 'success',
                'data' => $results
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in totalSalesPerDay:', [
                'error' => $e->getMessage(),
                'params' => compact('month', 'branch', 'concept')
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching total sales per day',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get dashboard statistics
     */
    public function getStats(Request $request)
    {
        try {
            $month = $request->query('month');
            $branch = strtoupper($request->query('branch', 'ALL'));
            $concept = strtoupper($request->query('concept', 'ALL'));

            if (empty($month)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Month parameter is required'
                ], 400);
            }

            // Base query
            $query = ItemSales::whereRaw('DATE_FORMAT(date, "%Y-%m") = ?', [$month]);

            if ($branch !== 'ALL') {
                $query->where('branch_id', $branch);
            }

            if ($concept !== 'ALL') {
                $query->where('concept_id', $concept);
            }

            // Get statistics
            $stats = $query->select([
                DB::raw('COUNT(DISTINCT date) as total_days'),
                DB::raw('SUM(net_sales) as total_sales'),
                DB::raw('SUM(net_sales) / COUNT(DISTINCT date) as average_sales_per_day'),
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(net_sales) / COUNT(*) as average_sales_per_transaction')
            ])->first();

            // Get top selling products
            $topProducts = $query->select(
                'product_code',
                'description',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(net_sales) as total_revenue')
            )
            ->groupBy('product_code', 'description')
            ->orderBy('total_quantity', 'desc')
            ->limit(5)
            ->get();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'statistics' => [
                        'total_days' => $stats->total_days,
                        'total_sales' => round($stats->total_sales, 2),
                        'average_sales_per_day' => round($stats->average_sales_per_day, 2),
                        'total_transactions' => $stats->total_transactions,
                        'average_sales_per_transaction' => round($stats->average_sales_per_transaction, 2)
                    ],
                    'top_products' => $topProducts->map(function ($product) {
                        return [
                            'product_code' => $product->product_code,
                            'name' => $product->description,
                            'quantity' => $product->total_quantity,
                            'revenue' => round($product->total_revenue, 2)
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in getStats:', [
                'error' => $e->getMessage(),
                'params' => compact('month', 'branch', 'concept')
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching dashboard statistics',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function getAverageSalesPerCustomer(Request $request)
    {
        try {
            $branch = strtoupper($request->query('branch_id', 'ALL'));
            $month = $request->query('month');
            $concept = strtoupper($request->query('concept_id', 'ALL'));

            if (empty($month)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Month parameter is required'
                ], 400);
            }
        
            // Query to calculate the total sales
            $totalSales = ItemSales::query()
                ->selectRaw('SUM(net_sales + other_charges + service_charge) as total_sales')
                ->whereRaw('date_format(date, "%Y-%m") = ?', [$month])
                ->when($concept !== 'ALL', function ($query) use ($concept) {
                    $query->where('concept_id', $concept);
                })
                ->when($branch !== 'ALL', function ($query) use ($branch) {
                    $query->where('branch_id', $branch);
                })
                ->value('total_sales') ?? 0;
        
            // Query to calculate the total number of guests
            $totalGuests = Header::query()
                ->selectRaw('SUM(no_guest) as total_guests')
                ->whereRaw('date_format(date, "%Y-%m") = ?', [$month])
                ->when($concept !== 'ALL', function ($query) use ($concept) {
                    $query->where('concept_id', $concept);
                })
                ->when($branch !== 'ALL', function ($query) use ($branch) {
                    $query->where('branch_id', $branch);
                })
                ->value('total_guests') ?? 0;
            
            // Calculate the average sales per customer
            $averageSalesPerCustomer = $totalGuests != 0 ? round($totalSales / $totalGuests, 2) : 0;
        
            return response()->json([
                'status' => 'success',
                'data' => [
                    'average_sales_per_customer' => $averageSalesPerCustomer,
                    'total_sales' => round($totalSales, 2),
                    'total_guests' => $totalGuests,
                    'period' => [
                        'month' => $month,
                        'branch' => $branch,
                        'concept' => $concept
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error calculating average sales per customer', [
                'error' => $e->getMessage(),
                'params' => compact('month', 'branch', 'concept')
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to calculate average sales',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function calculateAverageSalesPerDay(Request $request)
    {
        try {
            $month = $request->query('month');
            $concept = strtoupper($request->query('concept_id', 'ALL'));
            $branch = strtoupper($request->query('branch_id', 'ALL'));

            if (empty($month)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Month parameter is required'
                ], 400);
            }

            $query = ItemSales::query()
                ->whereRaw('DATE_FORMAT(date, "%Y-%m") = ?', [$month]);

            // Only apply filters if not 'ALL'
            if ($branch !== 'ALL' && $branch !== null) {
                $query->where('branch_id', $branch);
            }

            if ($concept !== 'ALL' && $concept !== null) {
                $query->where('concept_id', $concept);
            }

            $averageSales = $query->selectRaw('
                SUM(net_sales) as total_sales,
                COUNT(DISTINCT date) as total_days,
                (SUM(net_sales) / COUNT(DISTINCT date)) AS average_sales
            ')->first();

            // Log the query for debugging
            \Log::info('Average Sales Query', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'month' => $month,
                'branch' => $branch,
                'concept' => $concept,
                'result' => $averageSales
            ]);

            if (!$averageSales || is_null($averageSales->average_sales)) {
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'average_sales' => 0,
                        'total_sales' => 0,
                        'total_days' => 0
                    ]
                ]);
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'average_sales' => round($averageSales->average_sales, 2),
                    'total_sales' => round($averageSales->total_sales, 2),
                    'total_days' => $averageSales->total_days
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error calculating average sales', [
                'error' => $e->getMessage(),
                'params' => compact('month', 'branch', 'concept')
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error calculating average sales',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }


    public function CalculateAverageTxPerDay(Request $request)
    {
        try {
            $month = $request->query('month');
            $branch = strtoupper($request->query('branch_id', 'ALL'));
            $concept = strtoupper($request->query('concept_id', 'ALL'));
        
            if (empty($month)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Month parameter is required'
                ], 400);
            }

            $query = Header::query()
                ->selectRaw('SUM(no_transaction) as total_transactions, COUNT(DISTINCT date) as total_days, MIN(date) as min_date, MAX(date) as max_date')
                ->whereRaw('date_format(date, "%Y-%m") = ?', [$month]);

            if ($concept !== 'ALL' && $concept !== null) {
                $query->where('concept_id', $concept);
            }

            if ($branch !== 'ALL' && $branch !== null) {
                $query->where('branch_id', $branch);  
            }

            // Log the query for debugging
            \Log::info('Average TX Query', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'month' => $month,
                'branch' => $branch,
                'concept' => $concept
            ]);

            $result = $query->first();
            
            if (!$result) {
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'average_transaction_per_day' => 0,
                        'total_transactions' => 0,
                        'total_days' => 0,
                        'date_range' => [
                            'start' => null,
                            'end' => null
                        ]
                    ]
                ]);
            }

            $averageTxPerDay = $result->total_days > 0 
                ? round($result->total_transactions / $result->total_days, 2)
                : 0;

            return response()->json([
                'status' => 'success',
                'data' => [
                    'average_transaction_per_day' => $averageTxPerDay,
                    'total_transactions' => $result->total_transactions,
                    'total_days' => $result->total_days,
                    'date_range' => [
                        'start' => $result->min_date,
                        'end' => $result->max_date
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error calculating average transactions per day', [
                'error' => $e->getMessage(),
                'params' => compact('month', 'branch', 'concept')
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error calculating average transactions per day',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }


    public function PaymentDetails(Request $request)
    {
        try {
            $month = $request->input('month');
            $branch = $request->input('branch_id');
            $concept = $request->input('concept_id');

            // Debug input parameters
            \Log::info('Payment Details Parameters:', [
                'month' => $month,
                'branch' => $branch,
                'concept' => $concept
            ]);

            // Validate required parameters
            if (!$month) {
                return response()->json(['error' => 'Month parameter is required'], 400);
            }

            $query = PaymentDetails::query()
                ->selectRaw('description, SUM(amount) as total_amount')
                ->whereRaw('DATE_FORMAT(date, "%Y-%m") = ?', [$month]);

            // Add concept filter if not ALL
            if ($concept !== 'ALL') {
                $query->where('concept_id', $concept);
            }

            // Add branch filter if specified
            if ($branch !== 'ALL' && !is_null($branch)) {
                $query->where('branch_id', $branch);
            }

            // Debug the SQL query
            \Log::info('Payment Details Query:', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings()
            ]);

            $results = $query->groupBy('description')->get();

            // Debug results
            \Log::info('Payment Details Results:', [
                'count' => $results->count(),
                'data' => $results->toArray()
            ]);

            if ($results->isEmpty()) {
                return response()->json([
                    'message' => 'No payment details found for the given criteria',
                    'parameters' => [
                        'month' => $month,
                        'branch' => $branch,
                        'concept' => $concept
                    ]
                ], 404);
            }

            $data = $results->map(function ($result) {
                return [
                    'description' => $result->description,
                    'amount' => (float)$result->total_amount
                ];
            })->values()->all();

            return response()->json($data);

        } catch (\Exception $e) {
            \Log::error('Payment Details Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to fetch payment details',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function GetPaymentChart(Request $request)
    {
        $month = $request->input('month');
        $branch = $request->input('branch_id');
        $concept = $request->input('concept_id');

    
        $query = PaymentDetails::query()
            ->selectRaw('description, SUM(amount) as total_amount')
            ->whereRaw('DATE_FORMAT(date, "%Y-%m") = ?', [$month])
            ->whereNotIn('description', ['Discount', 'MEM CREDIT'])
            ->groupBy('description');
    
        if ($concept !== "ALL") {
            $query->where('concept_id', $concept);
        }
    
        if ($branch !== 'ALL' && !is_null($branch)) {
            $query->where('branch_id', $branch);
        }
    
        $results = $query->get();
    
        $data = $results->map(function($result) {
            return [
                'description' => $result->description,
                'amount' => number_format($result->total_amount, 2)
            ];
        });
    
        return response()->json($data);
    }

}

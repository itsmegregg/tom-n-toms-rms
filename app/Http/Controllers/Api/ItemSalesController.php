<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Concept;
use App\Models\ItemSales;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;


use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ItemSalesController extends Controller
{
    public function store(Request $request)
    {
        try {
            Log::info('Starting item sales processing');
            // Custom error messages
            $messages = [
                'data.required' => 'The data array is required',
                'data.array' => 'The data must be an array',
                'data.*.Branch_name.required' => 'Branch name is required for all records',
                'data.*.Branch_name.string' => 'Branch name must be a string',
                'data.*.Branch_name.max' => 'Branch name cannot exceed 100 characters',
                'data.*.Date.required' => 'Date is required for all records',
                'data.*.Date.date' => 'Invalid date format. Use YYYY-MM-DD',
                'data.*.Reg.required' => 'Register number is required for all records',
                'data.*.Reg.string' => 'Register number must be a string',
                'data.*.Reg.max' => 'Register number cannot exceed 25 characters',
                'data.*.Product Code.required' => 'Product code is required for all records',
                'data.*.Product Code.string' => 'Product code must be a string',
                'data.*.Product Code.max' => 'Product code cannot exceed 25 characters',
                'data.*.Description.max' => 'Description cannot exceed 255 characters',
                'data.*.Quantity.numeric' => 'Quantity must be a number',
                'data.*.Total Gross.numeric' => 'Total Gross must be a number',
                'data.*.Net Sales.numeric' => 'Net Sales must be a number'
            ];

            // Validation rules
            $rules = [
                'data' => 'required|array',
                'data.*.Branch_name' => 'required|string|max:100',
                'data.*.Concept_name' => 'nullable|string|max:100',
                'data.*.Date' => 'required|date',
                'data.*.Reg' => 'required|string|max:25',
                'data.*.SubCategory' => 'nullable|string|max:15',
                'data.*.Category Code' => 'nullable|string|max:15',
                'data.*.Product Code' => 'required|string|max:25',
                'data.*.Description' => 'nullable|string|max:255',
                'data.*.Quantity' => 'nullable|numeric',
                'data.*.Total Gross' => 'nullable|numeric',
                'data.*.Net Sales' => 'nullable|numeric',
                'data.*.VATable Sales' => 'nullable|numeric',
                'data.*.Vat Exempt Sales' => 'nullable|numeric',
                'data.*.Zero-Rated' => 'nullable|numeric',
                'data.*.Senior Disc' => 'nullable|numeric',
                'data.*.PWD Disc' => 'nullable|numeric',
                'data.*.Other Disc' => 'nullable|numeric',
                'data.*.Open Disc' => 'nullable|numeric',
                'data.*.Employee Disc' => 'nullable|numeric',
                'data.*.VIP Disc' => 'nullable|numeric',
                'data.*.Promo' => 'nullable|numeric',
                'data.*.Free' => 'nullable|numeric',
                'data.*.Voided' => 'nullable|numeric',
                'data.*.Combo Meal' => 'nullable|numeric',
                'data.*.Combo Qty' => 'nullable|integer',
                'data.*.Service Charge' => 'nullable|numeric',
                'data.*.Other Charges' => 'nullable|numeric',
                'data.*.Total Cost' => 'nullable|numeric',
                'data.*.Combo Main Code' => 'nullable|string|max:20',
                'data.*.Subitem Code' => 'nullable|string|max:255'
            ];

            $validator = Validator::make($request->all(), $rules, $messages);

            if ($validator->fails()) {
                Log::warning('Validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'input' => $request->all()
                ]);

                // Return detailed validation errors
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()->toArray(),
                    'first_error' => $validator->errors()->first(),
                    'received_data' => $request->all() // Include received data for debugging
                ], 422);
            }

            DB::beginTransaction();

            try {
                $results = [];
                $errors = [];
                $batchSize = 500;
                $records = collect($request->data);
                $batches = $records->chunk($batchSize);

                foreach ($batches as $batch) {
                    foreach ($batch as $index => $record) {
                        try {
                            Log::info('Processing record', ['record' => $record]);
                            
                            // Process product first
                            $product = Product::firstOrCreate(
                                ['product_code' => $record['Product Code']],
                                ['product_desc' => $record['Description'] ?? '']
                            );

                            if (!$product) {
                                throw new \Exception('Failed to process product');
                            }

                            // Process branch
                            $branch = Branch::firstOrCreate(
                                ['branch_name' => $record['Branch_name']]
                            );

                            // Process concept if provided
                            $concept = null;
                            if (!empty($record['Concept_name'])) {
                                $concept = Concept::firstOrCreate(
                                    ['concept_name' => $record['Concept_name']]
                                );
                            }

                            // Check for existing ItemSales record
                            $existingRecord = ItemSales::where([
                                'branch_id' => $branch->branch_id,
                                'date' => $record['Date'],
                                'reg' => $record['Reg'],
                                'product_code' => $record['Product Code']
                            ])->first();

                            if ($existingRecord) {
                                $itemSales = $existingRecord;
                                $action = 'updated';
                            } else {
                                $itemSales = new ItemSales();
                                $action = 'created';
                            }

                            // Map all fields
                            $itemSales->branch_id = $branch->branch_id;
                            $itemSales->concept_id = $concept ? $concept->concept_id : null;
                            $itemSales->date = $record['Date'];
                            $itemSales->reg = $record['Reg'];
                            $itemSales->sub_item_code = $record['SubCategory'] ?? null;
                            $itemSales->category_code = $record['Category Code'] ?? null;
                            $itemSales->product_code = $record['Product Code'];
                            $itemSales->description = $record['Description'] ?? null;
                            $itemSales->quantity = $record['Quantity'] ?? 0;
                            $itemSales->total_gross = $record['Total Gross'] ?? 0;
                            $itemSales->net_sales = $record['Net Sales'] ?? 0;
                            $itemSales->vatable_sales = $record['VATable Sales'] ?? 0;
                            $itemSales->vat_exempt_sales = $record['Vat Exempt Sales'] ?? 0;
                            $itemSales->zero_rated = $record['Zero-Rated'] ?? 0;
                            $itemSales->senior_disc = $record['Senior Disc'] ?? 0;
                            $itemSales->pwd_disc = $record['PWD Disc'] ?? 0;
                            $itemSales->other_disc = $record['Other Disc'] ?? 0;
                            $itemSales->open_disc = $record['Open Disc'] ?? 0;
                            $itemSales->employee_disc = $record['Employee Disc'] ?? 0;
                            $itemSales->vip_disc = $record['VIP Disc'] ?? 0;
                            $itemSales->promo = $record['Promo'] ?? 0;
                            $itemSales->free = $record['Free'] ?? 0;
                            $itemSales->voided = $record['Voided'] ?? 0;
                            $itemSales->combo_meal = $record['Combo Meal'] ?? 0;
                            $itemSales->combo_qty = $record['Combo Qty'] ?? 0;
                            $itemSales->service_charge = $record['Service Charge'] ?? 0;
                            $itemSales->other_charges = $record['Other Charges'] ?? 0;
                            $itemSales->total_cost = $record['Total Cost'] ?? 0;
                            $itemSales->combo_main_code = $record['Combo Main Code'] ?? null;
                            $itemSales->sub_item_code1 = $record['Subitem Code'] ?? null;

                            $itemSales->save();

                            $results[] = [
                                'branch' => $record['Branch_name'],
                                'concept' => $record['Concept_name'] ?? null,
                                'date' => $record['Date'],
                                'reg' => $record['Reg'],
                                'product_code' => $record['Product Code'],
                                'status' => 'success',
                                'action' => $action
                            ];

                        } catch (\Exception $e) {
                            Log::error('Error processing record:', [
                                'index' => $index,
                                'record' => $record,
                                'error' => $e->getMessage()
                            ]);

                            $errors[] = [
                                'index' => $index,
                                'branch_name' => $record['Branch_name'] ?? 'unknown',
                                'date' => $record['Date'] ?? 'unknown',
                                'reg' => $record['Reg'] ?? 'unknown',
                                'product_code' => $record['Product Code'] ?? 'unknown',
                                'error' => $e->getMessage()
                            ];
                        }
                    }
                }

                if (empty($errors)) {
                    DB::commit();
                    return response()->json([
                        'status' => 'success',
                        'message' => 'All records processed successfully',
                        'data' => $results
                    ], 201);
                } else {
                    if (!empty($results)) {
                        DB::commit();
                        return response()->json([
                            'status' => 'partial_success',
                            'message' => 'Some records were processed successfully',
                            'data' => $results,
                            'errors' => $errors
                        ], 207);
                    } else {
                        DB::rollBack();
                        return response()->json([
                            'status' => 'error',
                            'message' => 'No records were processed successfully',
                            'errors' => $errors
                        ], 422);
                    }
                }

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Fatal error processing item sales:', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to process item sales records',
                    'error' => $e->getMessage()
                ], 500);
            }


        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Fatal error processing item sales:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process item sales records',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function index(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'date',
                'branch_name' => 'string',
                'concept_name' => 'string',
                'reg' => 'string',
                'category_code' => 'string',
                'product_code' => 'string',
                'receipt_no' => 'string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = ItemSales::query()
                ->join('branches', 'item_sales.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'item_sales.concept_id', '=', 'concepts.concept_id')
                ->select(
                    'item_sales.*',
                    'branches.branch_name',
                    'concepts.concept_name'
                );

            if ($request->has('date')) {
                $query->where('date', $request->date);
            }
            if ($request->has('branch_name')) {
                $query->where('branches.branch_name', $request->branch_name);
            }
            if ($request->has('concept_name')) {
                $query->where('concepts.concept_name', $request->concept_name);
            }
            if ($request->has('reg')) {
                $query->where('reg', $request->reg);
            }
            if ($request->has('category_code')) {
                $query->where('category_code', $request->category_code);
            }
            if ($request->has('product_code')) {
                $query->where('product_code', $request->product_code);
            }
            if ($request->has('receipt_no')) {
                $query->where('receipt_no', $request->receipt_no);
            }

            $itemSales = $query->get();

            return response()->json([
                'status' => 'success',
                'data' => $itemSales
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve item sales records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function discountReport(Request $request)
    {
        try {
            $query = ItemSales::query()
                ->select(
                    DB::raw('DATE(date) as transaction_date'),
                    DB::raw('ROUND(SUM(senior_disc), 2) as senior_disc'),
                    DB::raw('ROUND(SUM(pwd_disc), 2) as pwd_disc'),
                    DB::raw('ROUND(SUM(other_disc), 2) as other_disc'),
                    DB::raw('ROUND(SUM(open_disc), 2) as open_disc'),
                    DB::raw('ROUND(SUM(employee_disc), 2) as employee_disc'),
                    DB::raw('ROUND(SUM(vip_disc), 2) as vip_disc'),
                    DB::raw('ROUND(SUM(promo), 2) as promo'),
                    DB::raw('ROUND(SUM(free), 2) as free')
                );

            // Filter by date range
            if ($request->has(['start_date', 'end_date'])) {
                $query->whereBetween('date', [$request->start_date, $request->end_date]);
            }

            // Filter by concept if provided and not 'all'
            if ($request->has('concept_id') && $request->concept_id !== 'all') {
                $query->where('concept_id', $request->concept_id);
            }

            // Filter by branch if provided and not 'all'
            if ($request->has('branch_id') && $request->branch_id !== 'all') {
                $query->where('branch_id', $request->branch_id);
            }

            $discountData = $query
                ->groupBy(DB::raw('DATE(date)'))
                ->orderBy('date', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $discountData
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in discount report: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve discount data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getFastMovingItem(Request $request){
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'date',
                'branch_id' => 'string',
                'concept_id' => 'string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = ItemSales::select('description', DB::raw('SUM(quantity) as total_quantity'))
                ->when($request->date, function($q) use ($request) {
                    return $q->whereDate('created_at', $request->date);
                });

            // If branch_id is provided and not "all", filter by it
            if ($request->has('branch_id') && $request->branch_id !== 'all') {
                $query->where('item_sales.branch_id', $request->branch_id);
            }

            // If concept_id is provided and not "all", filter by it
            if ($request->has('concept_id') && $request->concept_id !== 'all') {
                $query->where('item_sales.concept_id', $request->concept_id);
            }

            $results = $query->groupBy('description')
                ->orderBy('total_quantity', 'DESC')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function ProductMix(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $branch = $request->input('branch_id');
        $product = $request->input('product_code');
        $concept = $request->input('concept_id');
    
        // Perform the query using Eloquent
        $productMix = ItemSales::select(
            'item_sales.product_code',
            'products.product_desc',
            DB::raw('SUM(item_sales.quantity) as total_quantity'),
            DB::raw('SUM(item_sales.net_sales) as total_net_sales')
        )
        ->leftJoin(DB::raw('products'), function($join) {
            $join->on(DB::raw('BINARY item_sales.product_code'), '=', DB::raw('BINARY products.product_code'));
        })
        ->whereBetween('item_sales.date', [$startDate, $endDate]);
    
        if ($concept !== 'ALL') {
            $productMix->where('item_sales.concept_id', $concept);
        }
    
        if ($product !== 'ALL') {
            $productMix->where('item_sales.product_code', $product);
        }
    
        if ($branch !== 'ALL') {
            $productMix->where('item_sales.branch_id', $branch);
        }
    
        $productMix->groupBy('item_sales.product_code', 'products.product_desc')
                   ->orderBy('total_quantity', 'desc');
    
        $results = $productMix->get();

        if ($results->isEmpty()) {
            // Check if we have any data in the date range
            $hasData = ItemSales::whereBetween('date', [$startDate, $endDate])->exists();
            if (!$hasData) {
                return response()->json([
                    'message' => 'No data found in the selected date range',
                    'debug' => [
                        'date_range' => [$startDate, $endDate],
                        'branch' => $branch,
                        'concept' => $concept,
                        'product' => $product
                    ]
                ]);
            }
        }

        $data = [];
        foreach($results as $result) {
            $data[] = [
                'product_code' => $result->product_code,
                'description' => $result->product_desc ?? $result->description,
                'total_quantity' => (int)$result->total_quantity,
                'total_net_sales' => (float)$result->total_net_sales,
            ];
        }
        
        return response()->json($data);
    }


    public function productMixCategory(Request $request)
{
    $startDate = $request->input('start_date');
    $endDate = $request->input('end_date');
    $branch = $request->input('branch_id');
    $product = $request->input('product_code');
    $concept = $request->input('concept_id');

    $results = ItemSales::select([
            'categories.category_code',
            'categories.category_desc',
            'item_sales.product_code',
            'item_sales.description',
            DB::raw('SUM(item_sales.quantity) as quantity'),
            DB::raw('SUM(item_sales.net_sales) as net_sales')
        ])
        ->join('categories', 'item_sales.category_code', '=', 'categories.category_code')
        ->whereBetween('item_sales.date', [$startDate, $endDate])
        ->when($concept !== 'ALL', function ($query) use ($concept) {
            return $query->where('item_sales.concept_id', $concept);
        })
        ->when($product !== 'ALL', function ($query) use ($product) {
            return $query->where('item_sales.product_code', $product);
        })
        ->when($branch !== 'ALL', function ($query) use ($branch) {
            return $query->where('item_sales.branch_id', $branch);
        })
        ->groupBy([
            'categories.category_code',
            'categories.category_desc',
            'item_sales.product_code',
            'item_sales.description'
        ])
        ->get();

    $formattedResults = $results->groupBy('category_code')->map(function ($categoryItems, $categoryCode) {
        $firstItem = $categoryItems->first();
        return [
            'Category code' => $categoryCode,
            'Category desc' => $firstItem->category_desc,
            'Products' => $categoryItems->map(function ($item) {
                return [
                    'Product_code' => $item->product_code,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'net_sales' => $item->net_sales
                ];
            })->values()->toArray()
        ];
    })->values();

    return response()->json($formattedResults);
}

    // public function calculateAverageSalesPerDay(Request $request)
    // {
    //     $month = $request->query('month');
    //     $concept = $request->query('concept_id', 'ALL');
    //     $branch = $request->query('branch_id', 'ALL');

    //     try {
    //         $query = ItemSales::query()
    //             ->whereRaw('DATE_FORMAT(date, "%Y-%m") = ?', [$month]);

    //         // Only apply filters if not 'ALL'
    //         if ($branch !== 'ALL' && $branch !== null) {
    //             $query->where('branch_id', $branch);
    //         }

    //         if ($concept !== 'ALL' && $concept !== null) {
    //             $query->where('concept_id', $concept);
    //         }

    //         $averageSales = $query->selectRaw('
    //             SUM(net_sales) as total_sales,
    //             COUNT(DISTINCT date) as total_days,
    //             (SUM(net_sales) / COUNT(DISTINCT date)) AS average_sales
    //         ')->first();

    //         // Log the query for debugging
    //         \Log::info('Average Sales Query', [
    //             'sql' => $query->toSql(),
    //             'bindings' => $query->getBindings(),
    //             'month' => $month,
    //             'branch' => $branch,
    //             'concept' => $concept,
    //             'result' => $averageSales
    //         ]);

    //         if (!$averageSales || is_null($averageSales->average_sales)) {
    //             return response()->json([
    //                 'status' => 'success',
    //                 'data' => [
    //                     'average_sales' => 0,
    //                     'total_sales' => 0,
    //                     'total_days' => 0
    //                 ]
    //             ]);
    //         }

    //         return response()->json([
    //             'status' => 'success',
    //             'data' => [
    //                 'average_sales' => round($averageSales->average_sales, 2),
    //                 'total_sales' => round($averageSales->total_sales, 2),
    //                 'total_days' => $averageSales->total_days
    //             ]
    //         ]);

    //     } catch (\Exception $e) {
    //         \Log::error('Error calculating average sales', [
    //             'error' => $e->getMessage(),
    //             'parameters' => [
    //                 'month' => $month,
    //                 'branch' => $branch,
    //                 'concept' => $concept
    //             ]
    //         ]);

    //         return response()->json([
    //             'status' => 'error',
    //             'message' => 'Error calculating average sales',
    //             'debug' => $e->getMessage()
    //         ], 500);
    //     }
    // }
    
}

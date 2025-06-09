<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;
use App\Models\Concept;
use App\Models\Cashier;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class CashierController extends Controller
{
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.*.branch_name' => 'required|string',
                'data.*.date' => 'required|date',
                'data.*.concept_name' => 'nullable|string',
                'data.*.cashier' => 'required|string',
                'data.*.gross_sales' => 'nullable|numeric|min:0',
                'data.*.net_sales' => 'nullable|numeric|min:0',
                'data.*.cash' => 'nullable|numeric|min:0',
                'data.*.card' => 'nullable|numeric|min:0',
                'data.*.less_vat' => 'nullable|numeric|min:0',
                'data.*.discount' => 'nullable|numeric|min:0',
                'data.*.delivery_charge' => 'nullable|numeric|min:0',
                'data.*.service_charge' => 'nullable|numeric|min:0',
                'data.*.void_amount' => 'nullable|numeric|min:0',
                'data.*.void_count' => 'nullable|integer|min:0',
                'data.*.tx_count' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $successCount = 0;
            $errors = [];
            $recordActions = [];

            foreach ($request->data as $index => $record) {
                try {
                    // Find the branch (case-insensitive)
                    $branch = Branch::whereRaw('LOWER(branch_name) = ?', [strtolower($record['branch_name'])])->first();
                    if (!$branch) {
                        // Get all available branch names for debugging
                        $availableBranches = Branch::pluck('branch_name')->toArray();
                        $errors[] = [
                            'index' => $index,
                            'branch_name' => $record['branch_name'],
                            'error' => 'Branch not found. Available branches: ' . implode(', ', $availableBranches)
                        ];
                        continue;
                    }

                    // Find the concept (case-insensitive) if provided
                    $concept_id = null;
                    if (!empty($record['concept_name'])) {
                        $concept = Concept::whereRaw('LOWER(concept_name) = ?', [strtolower($record['concept_name'])])->first();
                        if ($concept) {
                            $concept_id = $concept->concept_id;
                        }
                    }

                    // Check if record already exists
                    $existingRecord = Cashier::where([
                        'branch_id' => $branch->branch_id,
                        'date' => $record['date'],
                        'cashier' => $record['cashier']
                    ])->first();

                    $recordData = [
                        'concept_id' => $concept_id,
                        'gross_sales' => $record['gross_sales'] ?? 0,
                        'net_sales' => $record['net_sales'] ?? 0,
                        'cash' => $record['cash'] ?? 0,
                        'card' => $record['card'] ?? 0,
                        'less_vat' => $record['less_vat'] ?? 0,
                        'discount' => $record['discount'] ?? 0,
                        'delivery_charge' => $record['delivery_charge'] ?? 0,
                        'service_charge' => $record['service_charge'] ?? 0,
                        'void_amount' => $record['void_amount'] ?? 0,
                        'void_count' => $record['void_count'] ?? 0,
                        'tx_count' => $record['tx_count'] ?? 0
                    ];

                    if ($existingRecord) {
                        // Update existing record
                        $existingRecord->update($recordData);
                        $recordActions[] = 'updated';
                    } else {
                        // Create new record
                        Cashier::create(array_merge($recordData, [
                            'branch_id' => $branch->branch_id,
                            'date' => $record['date'],
                            'cashier' => $record['cashier']
                        ]));
                        $recordActions[] = 'created';
                    }

                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'index' => $index,
                        'error' => 'Failed to process record: ' . $e->getMessage()
                    ];
                }
            }

            $status = $errors ? ($successCount > 0 ? 'partial_success' : 'error') : 'success';
            $message = $successCount . ' records processed successfully';
            if ($errors) {
                $message .= ', ' . count($errors) . ' records failed';
            }

            return response()->json([
                'status' => $status,
                'message' => $message,
                'data' => array_fill(0, $successCount, true),
                'errors' => $errors,
                'action' => $recordActions[0] ?? 'processed' // Return the action of the first record
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process records: ' . $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'branch_id' => 'required',
                'concept_id' => 'nullable',
                'from_date' => 'required|date',
                'to_date' => 'required|date'
            ]);           

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);                
            }

            $query = Cashier::query()
                ->join('branches', 'cashier.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'cashier.concept_id', '=', 'concepts.concept_id')
                ->whereBetween('date', [$request->from_date, $request->to_date])
                ->select(
                    'cashier.*',
                    'branches.branch_name',
                    'concepts.concept_name',
                    DB::raw('COALESCE(gross_sales, 0) as gross_sales'),
                    DB::raw('COALESCE(net_sales, 0) as net_sales'),
                    DB::raw('COALESCE(cash, 0) as cash'),
                    DB::raw('COALESCE(card, 0) as card'),
                    DB::raw('COALESCE(less_vat, 0) as less_vat'),
                    DB::raw('COALESCE(discount, 0) as discount'),
                    DB::raw('COALESCE(delivery_charge, 0) as delivery_charge'),
                    DB::raw('COALESCE(service_charge, 0) as service_charge'),
                    DB::raw('COALESCE(void_amount, 0) as void_amount'),
                    DB::raw('COALESCE(void_count, 0) as void_count'),
                    DB::raw('COALESCE(tx_count, 0) as tx_count')
                );

            if ($request->has('branch_id') && strtoupper($request->branch_id) !== 'ALL') {
                $query->where('cashier.branch_id', $request->branch_id);
            }            

            if ($request->has('concept_id') && strtoupper($request->concept_id) !== 'ALL') {
                $query->where('cashier.concept_id', $request->concept_id);
            }            

            $cashierData = $query->orderBy('date')
                ->orderBy('cashier')
                ->paginate(10);               

            return response()->json([
                'status' => 'success',
                'data' => [
                    'data' => $cashierData->items(),
                    'total' => $cashierData->total(),
                    'per_page' => $cashierData->perPage(),
                    'current_page' => $cashierData->currentPage(),
                    'last_page' => $cashierData->lastPage()
                ]
            ]);            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve cashier data: ' . $e->getMessage()
            ], 500);        
        }
    }
}

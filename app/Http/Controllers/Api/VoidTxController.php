<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VoidTx;
use App\Models\Branch;
use App\Models\Concept;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class VoidTxController extends Controller
{
    public function search(Request $request)
    {
        $query = VoidTx::select(
            'void_tx.*', 
            'c.concept_name', 
            'b.branch_name'
        )
        ->leftJoin('concepts as c', 'void_tx.concept_id', '=', 'c.concept_id')
        ->leftJoin('branches as b', 'void_tx.branch_id', '=', 'b.branch_id');

        // Filter by concept
        if ($request->filled('concept_id')) {
            $query->where('void_tx.concept_id', $request->concept_id);
        }

        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->where('void_tx.branch_id', $request->branch_id);
        }

        // Filter by date range
        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('void_tx.date', [
                $request->from_date, 
                $request->to_date
            ]);
        }

        // Order results
        $query->orderBy('void_tx.date', 'desc')
              ->orderBy('void_tx.time', 'desc');

        // Paginate results
        $perPage = $request->input('per_page', 10);
        $results = $query->paginate($perPage);

        return response()->json([
            'data' => $results
        ]);
    }

    public function index()
    {
        $voidTx = VoidTx::select(
            'void_tx.*', 
            'c.concept_name', 
            'b.branch_name'
        )
        ->leftJoin('concepts as c', 'void_tx.concept_id', '=', 'c.concept_id')
        ->leftJoin('branches as b', 'void_tx.branch_id', '=', 'b.branch_id')
        ->orderBy('void_tx.date', 'desc')
        ->orderBy('void_tx.time', 'desc')
        ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $voidTx
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.*.branch_name' => 'required|string',
                'data.*.date' => 'required|date',
                'data.*.time' => 'required|date_format:H:i:s',
                'data.*.concept_name' => 'nullable|string',
                'data.*.tx_number' => 'nullable|string',
                'data.*.terminal' => 'nullable|string',
                'data.*.salesinvoice_number' => 'nullable|string',
                'data.*.cashier_name' => 'nullable|string',
                'data.*.amount' => 'nullable|numeric|min:0',
                'data.*.approved_by' => 'nullable|string',
                'data.*.remarks' => 'nullable|string'
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
            $processedRecords = [];

            foreach ($request->data as $index => $record) {
                try {
                    // Find the branch (case-insensitive)
                    $branch = Branch::whereRaw('LOWER(branch_name) = ?', [strtolower($record['branch_name'])])->first();
                    
                    if (!$branch) {
                        $errors[] = [
                            'index' => $index,
                            'error' => 'Branch not found: ' . $record['branch_name']
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
                    $existingRecord = VoidTx::where([
                        'branch_id' => $branch->branch_id,  
                        'date' => $record['date'],
                        'time' => $record['time']
                    ]);

                    if (!empty($record['tx_number'])) {
                        $existingRecord->where('tx_number', $record['tx_number']);
                    }

                    $existingRecord = $existingRecord->first();

                    if ($existingRecord) {
                        // Update existing record
                        $existingRecord->update([
                            'concept_id' => $concept_id,
                            'tx_number' => $record['tx_number'] ?? null,
                      
                            'salesinvoice_number' => $record['salesinvoice_number'] ?? null,
                            'cashier_name' => $record['cashier_name'] ?? null,
                            'amount' => $record['amount'] ?? null,
                            'approved_by' => $record['approved_by'] ?? null,
                            'remarks' => $record['remarks'] ?? null
                        ]);
                        $processedRecords[] = [
                            'status' => 'success',
                            'action' => 'updated'
                        ];
                    } else {
                        // Create new record
                        VoidTx::create([
                            'branch_id' => $branch->branch_id,  
                            'concept_id' => $concept_id,
                            'date' => $record['date'],
                            'time' => $record['time'],
                            'tx_number' => $record['tx_number'] ?? null,
                        
                            'salesinvoice_number' => $record['salesinvoice_number'] ?? null,
                            'cashier_name' => $record['cashier_name'] ?? null,
                            'amount' => $record['amount'] ?? null,
                            'approved_by' => $record['approved_by'] ?? null,
                            'remarks' => $record['remarks'] ?? null
                        ]);
                        $processedRecords[] = [
                            'status' => 'success',
                            'action' => 'created'
                        ];
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
                'data' => $processedRecords,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process records: ' . $e->getMessage()
            ], 500);
        }
    }
}

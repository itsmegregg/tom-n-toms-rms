<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BirSummary;
use App\Models\Branch;
use App\Models\Concept;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BirSummaryController extends Controller
{
    public function index(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'branch_id' => 'required|string',
                'concept_id' => 'nullable|string',	
                'from_date' => 'required|date',
                'to_date' => 'required|date',
                'per_page' => 'nullable|integer|min:1',
                'page' => 'nullable|integer|min:1',
                'column' => 'nullable|string',
                'direction' => 'nullable|in:asc,desc'
            ]);
            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = BirSummary::query()
                ->join('branches', 'bir_summary.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'branches.concept_id', '=', 'concepts.concept_id')
                ->whereBetween('bir_summary.date', [$request->from_date, $request->to_date]);

            // Define allowed columns for sorting
            $allowedColumns = [
                'date' => 'bir_summary.date',
                'branch_name' => 'branches.branch_name',
                'concept_name' => 'concepts.concept_name',
                'z_counter' => 'bir_summary.z_counter',
                'gross_amount' => 'bir_summary.gross_amount',
                'net_amount' => 'bir_summary.net_amount',
                'vatable' => 'bir_summary.vatable',
                'vat_amount' => 'bir_summary.vat_amount',
                'vat_exempt' => 'bir_summary.vat_exempt'
            ];

            // Apply sorting
            $column = $request->input('column', 'date');
            $direction = $request->input('direction', 'desc');
            
            if (isset($allowedColumns[$column])) {
                $query->orderBy($allowedColumns[$column], $direction);
            } else {
                $query->orderBy('bir_summary.date', 'desc');
            }

            // Add secondary sorting
            if ($column !== 'branch_name') {
                $query->orderBy('branches.branch_name', 'asc');
            }
            if ($column !== 'concept_name') {
                $query->orderBy('concepts.concept_name', 'asc');
            }

            // Apply filters
            if ($request->filled('branch_id') && $request->branch_id !== 'ALL') {
                $query->where('bir_summary.branch_id', $request->branch_id);
            }            

            if ($request->filled('concept_id') && $request->concept_id !== 'ALL') {
                $query->where('concepts.concept_id', $request->concept_id);
            }

            // Select fields
            $query->select(
                'bir_summary.*',
                'branches.branch_name',
                'concepts.concept_name'
            );

            $perPage = $request->input('per_page', 10);
            $birSummaries = $query->paginate($perPage);            

            return response()->json([
                'status' => 'success',
                'data' => $birSummaries
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve records: ' . $e->getMessage()
            ], 500);
        }   
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.*.branch_name' => 'required|string',
                'data.*.concept_name' => 'nullable|string',
                'data.*.date' => 'required|date',
                'data.*.si_first' => 'nullable|integer',
                'data.*.si_last' => 'nullable|integer',
                'data.*.beg_amount' => 'nullable|numeric',
                'data.*.end_amount' => 'nullable|numeric',
                'data.*.net_amount' => 'nullable|numeric',
                'data.*.sc' => 'nullable|numeric',
                'data.*.pwd' => 'nullable|numeric',
                'data.*.others' => 'nullable|numeric',
                'data.*.returns' => 'nullable|numeric',
                'data.*.voids' => 'nullable|numeric',
                'data.*.gross_amount' => 'nullable|numeric',
                'data.*.vatable' => 'nullable|numeric',
                'data.*.vat_amount' => 'nullable|numeric',
                'data.*.vat_exempt' => 'nullable|numeric',
                'data.*.zero_rated' => 'nullable|numeric',
                'data.*.less_vat' => 'nullable|numeric',
                'data.*.ewt' => 'nullable|numeric',
                'data.*.service_charge' => 'nullable|numeric',
                'data.*.z_counter' => 'nullable|integer'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $successCount = 0;
            $errors = [];
            $lastAction = null;

            foreach ($request->data as $index => $record) {
                try {
                    // Find the branch (case-insensitive)
                    $branch = Branch::whereRaw('LOWER(branch_name) = ?', [strtolower($record['branch_name'])])->first();
                    if (!$branch) {
                        $errors[] = [
                            'index' => $index,
                            'branch_name' => $record['branch_name'],
                            'error' => 'Branch not found'
                        ];
                        continue;
                    }

                    // Find the concept (case-insensitive)
                    $concept = null;
                    if (!empty($record['concept_name'])) {
                        $concept = Concept::whereRaw('LOWER(concept_name) = ?', [strtolower($record['concept_name'])])->first();
                        if (!$concept) {
                            $errors[] = [
                                'index' => $index,
                                'concept_name' => $record['concept_name'],
                                'error' => 'Concept not found'
                            ];
                            continue;
                        }
                    }

                    // Prepare record data
                    $recordData = [
                        'branch_id' => $branch->branch_id,
                        'concept_id' => $concept ? $concept->concept_id : null,
                        'date' => $record['date'],
                        'si_first' => $record['si_first'] ?? null,
                        'si_last' => $record['si_last'] ?? null,
                        'beg_amount' => $record['beg_amount'] ?? 0,
                        'end_amount' => $record['end_amount'] ?? 0,
                        'net_amount' => $record['net_amount'] ?? 0,
                        'sc' => $record['sc'] ?? 0,
                        'pwd' => $record['pwd'] ?? 0,
                        'others' => $record['others'] ?? 0,
                        'returns' => $record['returns'] ?? 0,
                        'voids' => $record['voids'] ?? 0,
                        'gross_amount' => $record['gross_amount'] ?? 0,
                        'vatable' => $record['vatable'] ?? 0,
                        'vat_amount' => $record['vat_amount'] ?? 0,
                        'vat_exempt' => $record['vat_exempt'] ?? 0,
                        'zero_rated' => $record['zero_rated'] ?? 0,
                        'less_vat' => $record['less_vat'] ?? 0,
                        'ewt' => $record['ewt'] ?? 0,
                        'service_charge' => $record['service_charge'] ?? 0,
                        'z_counter' => $record['z_counter'] ?? null
                    ];

                    // Check if record exists
                    $existingRecord = BirSummary::where([
                        'branch_id' => $branch->branch_id,
                        'date' => $record['date'],
                        'z_counter' => $record['z_counter']
                    ])->first();

                    if ($existingRecord) {
                        // Update existing record
                        $existingRecord->update($recordData);
                        $lastAction = 'updated';
                    } else {
                        // Create new record
                        BirSummary::create($recordData);
                        $lastAction = 'created';
                    }

                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'index' => $index,
                        'error' => 'Failed to process record: ' . $e->getMessage()
                    ];
                }
            }

            DB::commit();

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
                'action' => $lastAction ?? 'processed'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process records: ' . $e->getMessage()
            ], 500);
        }
    }
}

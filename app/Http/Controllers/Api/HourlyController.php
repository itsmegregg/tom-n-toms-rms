<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Concept;
use App\Models\Hourly;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class HourlyController extends Controller
{
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.*.branch_name' => 'required|string',
                'data.*.concept_name' => 'nullable|string',
                'data.*.reg' => 'nullable|string',
                'data.*.date' => 'required|date',
                'data.*.hour' => 'nullable|integer|between:0,23',
                'data.*.total_trans' => 'nullable|integer|min:0',
                'data.*.total_void' => 'nullable|integer|min:0',
                'data.*.total_sales' => 'nullable|numeric|min:0',
                'data.*.total_discount' => 'nullable|numeric|min:0'
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
            $action = null;
            $processed = [];

            foreach ($request->data as $index => $record) {
                try {
                    // Find branch
                    $branch = Branch::whereRaw('LOWER(branch_name) = ?', [strtolower($record['branch_name'])])
                        ->first();
                    
                    if (!$branch) {
                        $errors[] = [
                            'index' => $index,
                            'branch_name' => $record['branch_name'],
                            'error' => 'Branch not found'
                        ];
                        continue;
                    }

                    // Find concept if provided
                    $concept = null;
                    if (!empty($record['concept_name'])) {
                        $concept = Concept::whereRaw('LOWER(concept_name) = ?', [strtolower($record['concept_name'])])
                            ->first();
                        
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
                        'reg' => $record['reg'] ?? null,
                        'date' => $record['date'],
                        'hour' => isset($record['hour']) ? (int)$record['hour'] : null,
                        'total_trans' => isset($record['total_trans']) ? (int)$record['total_trans'] : 0,
                        'total_void' => isset($record['total_void']) ? (int)$record['total_void'] : 0,
                        'total_sales' => isset($record['total_sales']) ? (float)$record['total_sales'] : 0,
                        'total_discount' => isset($record['total_discount']) ? (float)$record['total_discount'] : 0
                    ];

                    // Find existing record
                    $existingRecord = Hourly::where([
                        'branch_id' => $branch->branch_id,
                        'concept_id' => $concept ? $concept->concept_id : null,
                        'date' => $record['date'],
                        'hour' => isset($record['hour']) ? (int)$record['hour'] : null,
                        'reg' => $record['reg'] ?? null
                    ])->first();

                    if ($existingRecord) {
                        // Update existing record
                        $existingRecord->update($recordData);
                        $action = 'updated';
                        Log::info("Updated hourly record ID: {$existingRecord->hourly_id}", $recordData);
                    } else {
                        // Create new record
                        $newRecord = Hourly::create($recordData);
                        $action = 'created';
                        Log::info("Created new hourly record ID: {$newRecord->hourly_id}", $recordData);
                    }

                    $successCount++;
                    $processed[] = $recordData;

                } catch (\Exception $e) {
                    Log::error("Error processing hourly record: " . $e->getMessage(), [
                        'record' => $record,
                        'trace' => $e->getTraceAsString()
                    ]);

                    $errors[] = [
                        'index' => $index,
                        'error' => 'Failed to process record: ' . $e->getMessage()
                    ];
                }
            }

            if ($successCount > 0) {
                DB::commit();
                $status = count($errors) > 0 ? 'partial_success' : 'success';
                $message = $successCount . ' records processed successfully';
                if (count($errors) > 0) {
                    $message .= ', ' . count($errors) . ' records failed';
                }
            } else {
                DB::rollBack();
                $status = 'error';
                $message = 'No records were processed successfully';
            }

            return response()->json([
                'status' => $status,
                'message' => $message,
                'action' => $action,
                'processed' => $processed,
                'success_count' => $successCount,
                'error_count' => count($errors),
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Fatal error in hourly processing: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

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
                'branch_id' => 'required|string',
                'concept_id' => 'nullable|string',
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

            $query = DB::table('hourly')
                ->join('branches', 'hourly.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'hourly.concept_id', '=', 'concepts.concept_id')
                ->whereBetween('date', [$request->from_date, $request->to_date]);

            if ($request->branch_id !== 'all') {
                $query->where('hourly.branch_id', $request->branch_id);
            }

            if ($request->has('concept_id') && $request->concept_id !== 'all') {
                $query->where('hourly.concept_id', $request->concept_id);
            }

            $query->select(
                DB::raw('CASE 
                    WHEN hour < 12 THEN CONCAT(hour, ":00AM - ", hour + 1, ":00 AM")
                    WHEN hour = 12 THEN CONCAT("12:00PM - 1:00 PM")
                    WHEN hour > 12 THEN CONCAT(hour - 12, ":00PM - ", hour - 11, ":00 PM")
                END as hour_range'),
                DB::raw('COALESCE(SUM(total_trans), 0) as no_trans'),
                DB::raw('COALESCE(SUM(total_void), 0) as no_void'),
                DB::raw('FORMAT(COALESCE(SUM(total_sales), 0), 2) as sales_value'),
                DB::raw('FORMAT(COALESCE(SUM(total_discount), 0), 2) as discount_amount')
            )
            ->groupBy('hour')
            ->orderBy('hour');

            $hourlyRecords = $query->get();

            return response()->json([
                'status' => 'success',
                'data' => $hourlyRecords
            ]);

        } catch (\Exception $e) {
            Log::error('Error in hourly sales report:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve hourly records',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function getHourlyData(Request $request)
    {
        try {
            $query = Hourly::query()
                ->join('branches', 'hourly.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'hourly.concept_id', '=', 'concepts.concept_id')
                ->select(
                    'hourly.*',
                    'branches.branch_name',
                    'concepts.concept_name'
                );

            if ($request->has('date')) {
                $query->where('date', $request->date);
            }
            if ($request->has('concept_id')) {
                $query->where('concepts.concept_id', $request->concept_id);
            }

            $hourlyData = $query->orderBy('date')
                ->orderBy('hour')
                ->get();

            return response()->json([
                'data' => $hourlyData
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving hourly data', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to retrieve hourly data'
            ], 500);
        }
    }

    public function getConcepts()
    {
        try {
            $concepts = Concept::select('concept_id', 'concept_name')
                ->orderBy('concept_name')
                ->get();

            return response()->json([
                'data' => $concepts
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving concepts', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to retrieve concepts'
            ], 500);
        }
    }
}

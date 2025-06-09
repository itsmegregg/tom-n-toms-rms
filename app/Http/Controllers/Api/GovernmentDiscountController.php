<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GovernmentDiscount;
use App\Models\Branch;
use App\Models\Concept;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class GovernmentDiscountController extends Controller
{
    private function buildBaseQuery()
    {
        return GovernmentDiscount::query()
            ->join('branches', 'government_discounts.branch_id', '=', 'branches.branch_id')
            ->join('concepts', 'branches.concept_id', '=', 'concepts.concept_id')
            ->orderBy('government_discounts.date', 'desc')
            ->orderBy('government_discounts.ref_number');
    }

    private function getFilteredQuery(Request $request)
    {
        $query = GovernmentDiscount::query()
            ->select([
                'government_discounts.*',
                'branches.branch_name',
                'concepts.concept_name'
            ])
            ->join('branches', 'government_discounts.branch_id', '=', 'branches.branch_id')
            ->join('concepts', 'government_discounts.concept_id', '=', 'concepts.concept_id');

        // Apply filters
        if ($request->concept_id && $request->concept_id !== 'all') {
            $query->where('government_discounts.concept_id', $request->concept_id);
        }

        if ($request->branch_id && $request->branch_id !== 'all') {
            $query->where('government_discounts.branch_id', $request->branch_id);
        }

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('government_discounts.date', [
                $request->from_date,
                $request->to_date
            ]);
        }

        return $query;
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.*.branch_name' => 'required|string',
                'data.*.concept_name' => 'nullable|string',
                'data.*.date' => 'required|date',
                'data.*.terminal' => 'nullable|string',
                'data.*.id_no' => 'nullable|string',
                'data.*.id_type' => 'nullable|string',
                'data.*.name' => 'nullable|string',
                'data.*.ref_number' => 'nullable|string',
                'data.*.gross_amount' => 'nullable|numeric|min:0',
                'data.*.discount_amount' => 'nullable|numeric|min:0'
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
                        'terminal' => $record['terminal'] ?? null,
                        'id_no' => $record['id_no'] ?? null,
                        'id_type' => $record['id_type'] ?? null,
                        'name' => $record['name'] ?? null,
                        'ref_number' => $record['ref_number'] ?? null,
                        'gross_amount' => $record['gross_amount'] ?? 0,
                        'discount_amount' => $record['discount_amount'] ?? 0
                    ];

                    // Check if record exists
                    $existingRecord = GovernmentDiscount::where([
                        'branch_id' => $branch->branch_id,
                        'concept_id' => $concept ? $concept->concept_id : null,
                        'date' => $record['date'],
                        'ref_number' => $record['ref_number']
                    ])->first();

                    if ($existingRecord) {
                        // Update existing record
                        $existingRecord->update($recordData);
                        $lastAction = 'updated';
                    } else {
                        // Create new record
                        GovernmentDiscount::create($recordData);
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

    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'concept_id' => 'required',
            'branch_id' => 'required',
            'per_page' => 'integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $query = $this->buildBaseQuery()
                ->whereBetween('date', [$request->from_date, $request->to_date]);

            if ($request->concept_id !== 'ALL') {
                $query->where('concepts.concept_id', $request->concept_id);
            }
            
            if ($request->branch_id !== 'ALL') {
                $query->where('government_discounts.branch_id', $request->branch_id);
            }

            $perPage = $request->input('per_page', 10);
            $data = $query->select(
                'branches.branch_name',
                'concepts.concept_name',
                'government_discounts.*'
            )->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch government discount data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

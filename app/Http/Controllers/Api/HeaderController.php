<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Concept;
use App\Models\Header;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class HeaderController extends Controller
{
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.*.branch_name' => 'required|string',
                'data.*.concept_name' => 'nullable|string',
                'data.*.date' => 'required|date',
                'data.*.reg' => 'nullable|string|max:25',
                'data.*.or_from' => 'nullable|string|max:30',
                'data.*.or_to' => 'nullable|string|max:30',
                'data.*.beg_balance' => 'nullable|numeric|min:0',
                'data.*.end_balance' => 'nullable|numeric|min:0',
                'data.*.no_transaction' => 'nullable|integer|min:0',
                'data.*.no_guest' => 'nullable|integer|min:0',
                'data.*.reg_guest' => 'nullable|integer|min:0',
                'data.*.ftime_guest' => 'nullable|integer|min:0',
                'data.*.no_void' => 'nullable|integer|min:0',
                'data.*.no_disc' => 'nullable|integer|min:0',
                'data.*.other_disc' => 'nullable|numeric|min:0',
                'data.*.senior_disc' => 'nullable|numeric|min:0',
                'data.*.pwd_disc' => 'nullable|numeric|min:0',
                'data.*.open_disc' => 'nullable|numeric|min:0',
                'data.*.vip_disc' => 'nullable|numeric|min:0',
                'data.*.employee_disc' => 'nullable|numeric|min:0',
                'data.*.promo_disc' => 'nullable|numeric|min:0',
                'data.*.free_disc' => 'nullable|numeric|min:0',
                'data.*.no_cancel' => 'nullable|integer|min:0',
                'data.*.room_charge' => 'nullable|numeric|min:0',
                'data.*.z_count' => 'nullable|string'
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
                        'reg' => $record['reg'] ?? null,
                        'or_from' => $record['or_from'] ?? null,
                        'or_to' => $record['or_to'] ?? null,
                        'beg_balance' => $record['beg_balance'] ?? null,
                        'end_balance' => $record['end_balance'] ?? null,
                        'no_transaction' => $record['no_transaction'] ?? null,
                        'no_guest' => $record['no_guest'] ?? null,
                        'reg_guest' => $record['reg_guest'] ?? null,
                        'ftime_guest' => $record['ftime_guest'] ?? null,
                        'no_void' => $record['no_void'] ?? null,
                        'no_disc' => $record['no_disc'] ?? null,
                        'other_disc' => $record['other_disc'] ?? null,
                        'senior_disc' => $record['senior_disc'] ?? null,
                        'pwd_disc' => $record['pwd_disc'] ?? null,
                        'open_disc' => $record['open_disc'] ?? null,
                        'vip_disc' => $record['vip_disc'] ?? null,
                        'employee_disc' => $record['employee_disc'] ?? null,
                        'promo_disc' => $record['promo_disc'] ?? null,
                        'free_disc' => $record['free_disc'] ?? null,
                        'no_cancel' => $record['no_cancel'] ?? null,
                        'room_charge' => $record['room_charge'] ?? null,
                        'z_count' => $record['z_count'] ?? null
                    ];

                    // Check if record exists
                    $existingRecord = Header::where([
                        'branch_id' => $branch->branch_id,
                        'concept_id' => $concept ? $concept->concept_id : null,
                        'date' => $record['date'],
                        'reg' => $record['reg']
                    ])->first();

                    if ($existingRecord) {
                        // Update existing record
                        $existingRecord->update($recordData);
                        $lastAction = 'updated';
                    } else {
                        // Create new record
                        Header::create($recordData);
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
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'date',
                'branch_name' => 'string',
                'concept_name' => 'string',
                'reg' => 'string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = Header::query()
                ->join('branches', 'header.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'header.concept_id', '=', 'concepts.concept_id')
                ->select(
                    'header.*',
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

            $headerRecords = $query->get();

            return response()->json([
                'status' => 'success',
                'data' => $headerRecords
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve header records',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
